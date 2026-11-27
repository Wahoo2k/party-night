// Stripe tells us when a Party Night payment succeeds, a subscription changes or ends, or a charge is refunded.
// The signature on every message is checked against the endpoint's signing secret before anything is recorded.
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2 });
const SECRET = Deno.env.get("PARTY_STRIPE_WEBHOOK_SECRET") || "";
const ITEMS = ["party", "family", "show", "secret", "cards", "everything", "pass_month", "pass_year"];

async function verified(body: string, header: string) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t, v1 = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !v1.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`)));
  const hex = [...mac].map((x) => x.toString(16).padStart(2, "0")).join("");
  return v1.some((sig) => sig.length === hex.length && [...sig].reduce((d, c, i) => d | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}
const when = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);
const subStatus = (s: string) => (s === "active" || s === "trialing" ? "active" : s === "past_due" || s === "unpaid" ? "past_due" : "canceled");

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  if (!SECRET) return new Response("not configured", { status: 503 });
  const body = await req.text();
  if (!(await verified(body, req.headers.get("stripe-signature") || ""))) return new Response("bad signature", { status: 400 });
  const ev = JSON.parse(body), o = ev.data?.object || {};
  try {
    const fresh = await sql`insert into party.stripe_events (id, type) values (${ev.id}, ${ev.type}) on conflict do nothing returning id`;
    if (!fresh.length) return new Response("seen", { status: 200 });   // Stripe repeats messages; each counts once
    if (ev.type === "checkout.session.completed" && o.payment_status !== "unpaid") {
      const item = o.metadata?.item, user = o.metadata?.user_id || o.client_reference_id;
      if (ITEMS.includes(item) && user) {
        const sub = typeof o.subscription === "string" ? o.subscription : null;
        await sql`insert into party.purchases (user_id, item, status, livemode, stripe_customer, stripe_session, stripe_subscription, stripe_payment_intent)
                  values (${user}, ${item}, ${sub ? "active" : "paid"}, ${!!ev.livemode}, ${o.customer || null}, ${o.id}, ${sub}, ${typeof o.payment_intent === "string" ? o.payment_intent : null})
                  on conflict (stripe_session) do nothing`;
      }
    } else if (ev.type === "customer.subscription.updated" || ev.type === "customer.subscription.deleted" || ev.type === "customer.subscription.created") {
      const end = o.current_period_end ?? o.items?.data?.[0]?.current_period_end ?? null;
      const status = ev.type === "customer.subscription.deleted" ? "canceled" : subStatus(o.status);
      await sql`update party.purchases set status = ${status}, period_end = ${when(end)}, updated_at = now() where stripe_subscription = ${o.id}`;
    } else if (ev.type === "charge.refunded" && o.refunded && o.payment_intent) {
      await sql`update party.purchases set status = 'refunded', updated_at = now() where stripe_payment_intent = ${o.payment_intent} and status = 'paid'`;
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    await sql`delete from party.stripe_events where id = ${ev.id}`.catch(() => {});
    return new Response("error", { status: 500 });   // Stripe will send it again
  }
});
