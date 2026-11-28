// Party Night accounts: what an account owns, linking a TV to it, and starting a Stripe checkout.
// Called from the website (signed in, with the user's token) and from the TV (with only its own TV id).
// Tables live in the "party" schema and are reachable only from here.
import postgres from "npm:postgres@3.4.5";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2 });
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const STRIPE = Deno.env.get("PARTY_STRIPE_SECRET_KEY") || "";

// What is sold. Keep in step with js/packs.js.
const PACKS = ["party", "family", "show", "secret", "cards"];
const ITEMS: Record<string, { name: string; cents: number; every?: "month" | "year"; about: string }> = {
  party: { name: "Party Night: Party Pack", cents: 999, about: "Nine party games, yours to keep." },
  family: { name: "Party Night: Family Pack", cents: 999, about: "Nine games for all ages, yours to keep." },
  show: { name: "Party Night: Game Show Pack", cents: 999, about: "Nine game-show games, yours to keep." },
  secret: { name: "Party Night: Secret Roles Pack", cents: 999, about: "Eight secret-role games, yours to keep." },
  cards: { name: "Party Night: Cards & Creative Pack", cents: 999, about: "Nine card and drawing games, yours to keep." },
  everything: { name: "Party Night: Everything", cents: 3999, about: "All five packs, yours to keep." },
  pass_month: { name: "Party Night: Party Pass (monthly)", cents: 499, every: "month", about: "Every game, plus new ones, while you subscribe." },
  pass_year: { name: "Party Night: Party Pass (yearly)", cents: 2999, every: "year", about: "Every game, plus new ones, while you subscribe." },
};
const ORIGINS = ["https://wahoo2k.github.io", "https://toolshedapps.com", "https://www.toolshedapps.com", "https://partynight.toolshedapps.com"];

const cors = (req: Request) => {
  const o = req.headers.get("origin") || "";
  return { "Access-Control-Allow-Origin": ORIGINS.includes(o) || /^http:\/\/localhost(:\d+)?$/.test(o) ? o : ORIGINS[0], "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
};
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

async function userOf(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token === ANON) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON } });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.id ? { id: u.id as string, email: (u.email || "") as string } : null;
}
// What an account can play right now: packs bought outright, and whether a pass is running.
async function owned(userId: string) {
  const rows = await sql`select item, status, period_end from party.purchases where user_id = ${userId} and status in ('paid','active','past_due')`;
  const packs = new Set<string>(); let pass = false, passEnds: string | null = null, passItem: string | null = null;
  for (const r of rows) {
    if (r.item === "everything") PACKS.forEach((p) => packs.add(p));
    else if (PACKS.includes(r.item)) packs.add(r.item);
    else if (r.status !== "paid" && (!r.period_end || new Date(r.period_end).getTime() > Date.now() - 3 * 864e5)) { pass = true; passEnds = r.period_end; passItem = r.item; }
  }
  return { packs: [...packs], pass, passEnds, passItem };
}
const stripe = async (path: string, form: Record<string, string>) => {
  const r = await fetch("https://api.stripe.com/v1/" + path, { method: "POST", headers: { Authorization: `Bearer ${STRIPE}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form) });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "Stripe refused the request");
  return j;
};
const okReturn = (u: string) => { try { const x = new URL(u); return ORIGINS.includes(x.origin) || x.hostname === "localhost" ? x.origin + x.pathname : null; } catch { return null; } };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "POST only" }, 405);
  let b: Record<string, string> = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const tv = typeof b.tv === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(b.tv) ? b.tv : null;
  try {
    // The TV asks what it may play. It proves nothing but its own id, which only it and its linked account know.
    if (b.action === "tv") {
      if (!tv) return json(req, { error: "bad tv id" }, 400);
      const [row] = await sql`update party.tvs set seen_at = now() where tv_id = ${tv} returning user_id`;
      if (!row) return json(req, { linked: false, packs: [], pass: false });
      return json(req, { linked: true, ...(await owned(row.user_id)) });
    }
    // Survey games send what real players typed, so the boards can be rebuilt from real answers. Only counts are
    // kept: the question, the answer as typed (lower case, 30 characters at most), which board answer it matched,
    // and how many times it has been said. Nothing about who said it, which TV, or when beyond the day.
    if (b.action === "survey") {
      const q = String(b.q || "").slice(0, 140).trim();
      const list = Array.isArray((b as Record<string, unknown>).answers) ? ((b as Record<string, unknown>).answers as unknown[]).slice(0, 40) : [];
      if (q.length < 8 || !list.length) return json(req, { ok: false }, 400);
      let n = 0;
      for (const x of list) {
        const t = String((x as Record<string, unknown>)?.t ?? "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 30);
        const i = Number((x as Record<string, unknown>)?.i);
        if (t.length < 2 || !/^[\p{L}\p{N} '&-]+$/u.test(t)) continue;
        await sql`insert into party.survey_answers (q, answer, hit) values (${q}, ${t}, ${Number.isInteger(i) && i >= 0 && i < 20 ? i : -1})
                  on conflict (q, answer) do update set n = party.survey_answers.n + 1, last_day = current_date, hit = excluded.hit`;
        n++;
      }
      return json(req, { ok: true, n });
    }
    const user = await userOf(req);
    if (!user) return json(req, { error: "Please sign in." }, 401);
    if (b.action === "me") {
      const tvs = await sql`select tv_id, label, linked_at from party.tvs where user_id = ${user.id} order by linked_at desc`;
      return json(req, { email: user.email, ...(await owned(user.id)), tvs: tvs.map((t) => ({ id: t.tv_id.slice(0, 6), label: t.label, linked_at: t.linked_at })), selling: !!STRIPE, test: STRIPE.startsWith("sk_test_") || STRIPE.startsWith("rk_test_") });
    }
    if (b.action === "link") {
      if (!tv) return json(req, { error: "bad tv id" }, 400);
      const n = await sql`select count(*)::int as n from party.tvs where user_id = ${user.id}`;
      if (n[0].n >= 10) return json(req, { error: "This account already has 10 TVs linked. Remove one first." }, 400);
      await sql`insert into party.tvs (tv_id, user_id, label) values (${tv}, ${user.id}, ${String(b.label || "").slice(0, 40) || null}) on conflict (tv_id) do update set user_id = excluded.user_id, linked_at = now()`;
      return json(req, { ok: true });
    }
    if (b.action === "unlink") {
      await sql`delete from party.tvs where user_id = ${user.id} and left(tv_id, 6) = ${String(b.id || "")}`;
      return json(req, { ok: true });
    }
    if (b.action === "checkout") {
      const item = ITEMS[b.item];
      if (!item) return json(req, { error: "Unknown item." }, 400);
      if (!STRIPE) return json(req, { error: "Buying is not open yet." }, 503);
      const back = okReturn(b.back || "");
      if (!back) return json(req, { error: "bad return address" }, 400);
      const have = await owned(user.id);
      if (PACKS.includes(b.item) && have.packs.includes(b.item)) return json(req, { error: "You already own this pack." }, 400);
      if (b.item === "everything" && have.packs.length === PACKS.length) return json(req, { error: "You already own every pack." }, 400);
      if (item.every && have.pass) return json(req, { error: "You already have a Party Pass." }, 400);
      const form: Record<string, string> = {
        mode: item.every ? "subscription" : "payment",
        success_url: back + "?bought=" + b.item, cancel_url: back,
        client_reference_id: user.id, customer_email: user.email,
        "metadata[item]": b.item, "metadata[user_id]": user.id,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": String(item.cents),
        "line_items[0][price_data][product_data][name]": item.name,
        "line_items[0][price_data][product_data][description]": item.about,
        "line_items[0][price_data][tax_behavior]": "exclusive",
        allow_promotion_codes: "true",
      };
      if (item.every) { form["line_items[0][price_data][recurring][interval]"] = item.every; form["subscription_data[metadata][item]"] = b.item; form["subscription_data[metadata][user_id]"] = user.id; }
      else { form["payment_intent_data[metadata][item]"] = b.item; form["payment_intent_data[metadata][user_id]"] = user.id; }
      if (Deno.env.get("PARTY_STRIPE_TAX") === "on") { form["automatic_tax[enabled]"] = "true"; }
      const s = await stripe("checkout/sessions", form);
      return json(req, { url: s.url });
    }
    if (b.action === "portal") {
      const [row] = await sql`select stripe_customer from party.purchases where user_id = ${user.id} and stripe_customer is not null order by created_at desc limit 1`;
      const back = okReturn(b.back || "");
      if (!row || !back) return json(req, { error: "Nothing to manage yet." }, 400);
      const s = await stripe("billing_portal/sessions", { customer: row.stripe_customer, return_url: back });
      return json(req, { url: s.url });
    }
    return json(req, { error: "Unknown action." }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: e instanceof Error ? e.message : "Something went wrong." }, 500);
  }
});
