// The account page: sign in by email, see what you own, buy a pack or the pass through Stripe, and link a TV.
// A TV sends people here with its id in the address (?tv=…); once signed in, that TV is linked to the account.
import { SUPABASE_URL, SUPABASE_KEY } from '../js/config.js';
import { PACKS, PRICES } from '../js/packs.js';

const FN = SUPABASE_URL + '/functions/v1/party';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: 'party-night-account' } });
const box = document.querySelector('#acct'), title = document.querySelector('#acctitle');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + n.toFixed(2);
const here = location.origin + location.pathname;

// The TV's id and the pack someone came for survive the trip out to email and back.
const q = new URLSearchParams(location.search);
const keep = k => { const v = q.get(k); try { if (v) sessionStorage.setItem('pn-' + k, v), localStorage.setItem('pn-' + k, v); return v || sessionStorage.getItem('pn-' + k) || localStorage.getItem('pn-' + k); } catch { return v; } };
const drop = k => { try { sessionStorage.removeItem('pn-' + k); localStorage.removeItem('pn-' + k); } catch { /* fine */ } };
let tv = keep('tv'); const want = keep('want'), bought = q.get('bought');
if (q.has('tv') || q.has('want')) history.replaceState(null, '', here + (bought ? '?bought=' + bought : ''));

async function call(action, extra = {}) {
  const { data } = await sb.auth.getSession();
  const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (data.session?.access_token || SUPABASE_KEY) }, body: JSON.stringify({ action, ...extra }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Something went wrong. Try again.');
  return j;
}
let note = '';
const say = (t, bad) => { note = t ? `<p class="note ${bad ? 'bad' : ''}" role="status">${esc(t)}</p>` : ''; };

function signedOut(sentTo) {
  title.textContent = tv ? 'Sign in to unlock your TV' : 'Sign in';
  box.innerHTML = `${note}<form class="card" id="f1"><label for="em">Your email</label>
      <input id="em" type="email" autocomplete="email" inputmode="email" required placeholder="you@example.com" value="${esc(sentTo || '')}">
      <button class="btn" type="submit">${sentTo ? 'Send it again' : 'Email me a sign-in link'}</button>
      <p class="fine">No password. We email you a link${sentTo ? '' : ' and a code'}; purchases are tied to this email.</p></form>
    ${sentTo ? `<form class="card" id="f2"><label for="cd">Check ${esc(sentTo)}. Tap the link in the email, or type the code from it here.</label>
      <input id="cd" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" maxlength="8" placeholder="6-digit code" required>
      <button class="btn ghost" type="submit">Sign in with the code</button></form>` : ''}`;
  box.querySelector('#f1').onsubmit = async e => {
    e.preventDefault(); const email = box.querySelector('#em').value.trim(); const b = e.target.querySelector('button'); b.disabled = true;
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: here } });
    say(error ? (/rate|seconds/i.test(error.message) ? 'Too many emails just now. Wait a minute and try again.' : error.message) : '', !!error); signedOut(error ? '' : email);
  };
  const f2 = box.querySelector('#f2');
  if (f2) f2.onsubmit = async e => {
    e.preventDefault(); const { error } = await sb.auth.verifyOtp({ email: sentTo, token: box.querySelector('#cd').value.trim(), type: 'email' });
    if (error) { say('That code did not work. Check it, or ask for a new email.', true); signedOut(sentTo); }
  };
}

async function signedIn() {
  title.textContent = 'Your account';
  let me;
  try {
    if (tv) { await call('link', { tv }); say('Your TV is linked. Anything you own is unlocking on it now.'); drop('tv'); tv = null; }
    me = await call('me');
  } catch (e) { box.innerHTML = `<p class="note bad">${esc(e.message)}</p><p><button class="btn ghost" id="out">Sign out</button></p>`; box.querySelector('#out').onclick = () => sb.auth.signOut(); return; }
  if (bought && !note) say(me.pass || me.packs.length ? 'Thank you! Your games are unlocked.' : 'Thank you! Your payment is being confirmed; this page will update in a moment.');
  const all = me.packs.length === PACKS.length, has = id => me.packs.includes(id);
  const buy = (item, label, disabled, why) => `<button class="btn ${disabled ? 'ghost' : ''}" data-buy="${item}" ${disabled ? 'disabled' : ''}>${esc(disabled ? why : label)}</button>`;
  const closed = !me.selling;
  box.innerHTML = `${note}
    <div class="card row"><div><b>${esc(me.email)}</b><p class="fine">${me.pass ? 'Party Pass active' + (me.passEnds ? ', renews or ends ' + new Date(me.passEnds).toLocaleDateString() : '') : all ? 'You own every pack.' : me.packs.length ? `You own ${me.packs.length} of ${PACKS.length} packs.` : 'Nothing bought yet. Three games are free.'}</p></div>
      <div class="cta">${me.pass || me.packs.length ? '<button class="btn ghost small" id="manage">Receipts & subscription</button>' : ''}<button class="btn ghost small" id="out">Sign out</button></div></div>
    ${me.test ? '<p class="note">Test mode: no real money moves. Use card 4242 4242 4242 4242 with any future date and any CVC.</p>' : ''}
    ${closed ? '<p class="note">Buying opens soon. Your account is ready for when it does.</p>' : ''}
    <h2 class="h">Get everything</h2>
    <div class="plans two">
      <div class="plan best"><h3>Everything</h3><div class="price">${money(PRICES.everything)}</div><p class="fine">One-time. All ${PACKS.length} packs, yours to keep.</p>${buy('everything', 'Buy Everything', all || closed, all ? 'You own this' : 'Coming soon')}</div>
      <div class="plan"><h3>Party Pass</h3><div class="price">${money(PRICES.passMonth)} <small>a month</small></div><p class="fine">Every game, plus new ones. Cancel any time.</p>
        <div class="cta">${buy('pass_month', 'Monthly', me.pass || closed, me.pass ? 'Active' : 'Coming soon')}${me.pass || closed ? '' : buy('pass_year', money(PRICES.passYear) + ' a year')}</div></div>
    </div>
    <h2 class="h">Or one pack at a time</h2>
    <div class="packs">${PACKS.map(p => `<div class="pack ${want === p.id ? 'want' : ''}"><div><h3>${esc(p.name)}</h3><p class="fine">${esc(p.blurb)} ${p.games.length} games.</p></div>
      <div class="cta"><b class="price" style="font-size:28px">${money(PRICES.pack)}</b>${buy(p.id, 'Buy', has(p.id) || closed, has(p.id) ? 'Owned' : 'Coming soon')}<a class="btn ghost small" href="games.html?pack=${p.id}">See games</a></div></div>`).join('')}</div>
    <h2 class="h">Your TVs</h2>
    <div class="card">${me.tvs.length ? me.tvs.map(t => `<div class="row tvrow"><span>📺 Linked ${new Date(t.linked_at).toLocaleDateString()}</span><button class="btn ghost small" data-unlink="${esc(t.id)}">Remove</button></div>`).join('') : '<p class="fine">No TV linked yet. On the TV, pick a locked game and scan the code it shows.</p>'}
      <p class="fine">Linking a TV lets it play what you own. Remove one to stop it.</p></div>`;
  box.querySelector('#out').onclick = () => sb.auth.signOut();
  const mg = box.querySelector('#manage'); if (mg) mg.onclick = async () => { try { location.href = (await call('portal', { back: here })).url; } catch (e) { say(e.message, true); signedIn(); } };
  box.querySelectorAll('[data-buy]').forEach(b => (b.onclick = async () => { b.disabled = true; b.textContent = 'Opening checkout…'; try { location.href = (await call('checkout', { item: b.dataset.buy, back: here })).url; } catch (e) { say(e.message, true); signedIn(); } }));
  box.querySelectorAll('[data-unlink]').forEach(b => (b.onclick = async () => { await call('unlink', { id: b.dataset.unlink }).catch(() => {}); say('TV removed.'); signedIn(); }));
  if (want) box.querySelector('.pack.want')?.scrollIntoView({ block: 'center' });
  // Just paid: the confirmation from Stripe can take a few seconds to land.
  if (bought && !(me.pass || me.packs.length) && (signedIn.tries = (signedIn.tries || 0) + 1) < 8) setTimeout(signedIn, 2500);
  note = '';
}

sb.auth.onAuthStateChange((_e, session) => { setTimeout(() => (session ? signedIn() : signedOut()), 0); });
