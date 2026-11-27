// What this TV may play. The TV has a private id of its own; an account is linked to it from a phone (the website's
// account page), and the server then says which packs that account owns. Nothing is locked unless the shop is on.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { FREE, PACKS, SELLING, packOf } from './packs.js';
import { store, DEMO } from './ui.js';

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const SHOP = !DEMO && (SELLING || q.has('shop'));
export const PARTY_FN = SUPABASE_URL + '/functions/v1/party';
const WEEK = 7 * 864e5;

export function tvId() {
  let id = store.get('pg-tv');
  if (!id) { const a = new Uint8Array(18); crypto.getRandomValues(a); id = [...a].map(x => 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 55]).join('') + Date.now().toString(36); store.set('pg-tv', id); }
  return id;
}
let own = store.get('pg-own') || { linked: false, packs: [], pass: false, at: 0 };
export const owned = () => own;
// A TV that can't reach the server keeps what it last knew for a week, so a flaky connection doesn't lock a paid game.
const fresh = () => Date.now() - (own.at || 0) < WEEK;
export const locked = id => SHOP && !FREE.includes(id) && !(fresh() && (own.pass || own.packs.includes(packOf(id)?.id)));
export async function refreshOwn() {
  if (!SHOP) return own;
  try {
    const r = await fetch(PARTY_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: JSON.stringify({ action: 'tv', tv: tvId() }) });
    if (r.ok) { const j = await r.json(); own = { linked: !!j.linked, packs: j.packs || [], pass: !!j.pass, at: Date.now() }; store.set('pg-own', own); }
  } catch { /* offline: keep what we knew */ }
  return own;
}
export const accountUrl = want => new URL(`site/account.html?tv=${tvId()}${want ? '&want=' + want : ''}`, new URL('..', import.meta.url)).href;
export { PACKS };
