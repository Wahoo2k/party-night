// Content controls the host runs on the TV, for every game at once:
//  - Kids mode swaps mild put-downs for "oops" in anything players type (the family filter already blocks worse).
//  - Hide an answer: the host can hide any player-written text; it's replaced on the TV, phones and narration.
export const MILD = ['stupid', 'idiot', 'dumb', 'dummy', 'loser', 'ugly', 'fat', 'hate', 'kill', 'killed', 'die', 'dead', 'shutup', 'moron', 'sucks', 'suck', 'weirdo', 'freak', 'gross', 'puke', 'vomit', 'barf', 'fart', 'butt', 'poop', 'pee', 'blood', 'bloody', 'gun', 'beer', 'wine', 'drunk'];
const SKIP_KEYS = new Set(['type', 'pid', 'by', 'card', 'cardId', 'i', 'k', 'c', 'w', 'p', 'v', 'n', 'strokes']);

export function starMild(text) {
  return String(text).replace(/[A-Za-z']+/g, w => (MILD.includes(w.toLowerCase().replace(/'/g, '')) ? 'oops' : w))
    .replace(/shut\s+up/gi, 'oops');
}

// Walk an action from a phone and clean every typed string.
export function cleanAct(a, kids) {
  if (!kids || !a || typeof a !== 'object') return a;
  const walk = (x, key) => {
    if (typeof x === 'string') return SKIP_KEYS.has(key) ? x : starMild(x);
    if (Array.isArray(x)) return key === 'strokes' ? x : x.map(y => walk(y, key));
    if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, y]) => [k, walk(y, k)]));
    return x;
  };
  return walk(a, '');
}

// Player-written strings in an action, for the host's "hide an answer" list.
export function textsIn(a) {
  const out = [];
  const walk = (x, key) => {
    if (typeof x === 'string') { if (!SKIP_KEYS.has(key) && /[a-z]/i.test(x) && x.trim().length >= 2 && x.length <= 60) out.push(x.trim()); }
    else if (Array.isArray(x)) { if (key !== 'strokes') x.forEach(y => walk(y, key)); }
    else if (x && typeof x === 'object') Object.entries(x).forEach(([k, y]) => walk(y, k));
  };
  walk(a, '');
  return out;
}

const HIDDEN = '(hidden by host)';
// Game-logic fields that must never be rewritten, even if someone typed the same word.
const KEEP = new Set(['phase', 'game', 'kind', 'result', 'why', 'lastEvent', 'cls', 'pid', 'by', 'type', 'tone', 'sound']);
const low = t => String(t).trim().toLowerCase();

// Replace hidden answers anywhere in a view (exact string values, case-insensitive).
export function maskView(v, hidden) {
  if (!hidden?.length) return v;
  const set = new Set(hidden.map(low));
  const walk = (x, key) => {
    if (typeof x === 'string') return !KEEP.has(key) && set.has(low(x)) ? HIDDEN : x;
    if (Array.isArray(x)) return x.map(y => walk(y, key));
    if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, y]) => [k, walk(y, k)]));
    return x;
  };
  return walk(v, '');
}

// For narration: hidden answers inside a sentence become "something".
export function maskLine(line, hidden) {
  let out = String(line || '');
  for (const h of hidden || []) if (h.length >= 2) out = out.split(new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')).join('something');
  return out;
}
