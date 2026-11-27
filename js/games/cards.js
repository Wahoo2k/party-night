// A standard 52-card deck shared by the card games, plus how a card looks.
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const shuffle = (a, rnd = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function makeStd(rnd = Math.random, decks = 1) {
  const d = [];
  let id = 0;
  for (let k = 0; k < decks; k++) for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) d.push({ id: id++, s, r });
  return shuffle(d, rnd);
}
export const red = c => c.s === 1 || c.s === 2;
export function face(c, extra = '', attrs = '') {
  if (!c) return `<div class="pc back ${extra}" ${attrs}><span>✦</span></div>`;
  const r = RANKS[c.r], s = SUITS[c.s];
  return `<div class="pc ${red(c) ? 'red' : ''} ${extra}" ${attrs}><b class="tl">${r}<i>${s}</i></b><span class="mid">${s}</span><b class="br">${r}<i>${s}</i></b></div>`;
}

// Content memory: an order over n items with the ones this room hasn't seen first. 'use' is roughly how many a game
// goes through; they're added to the seen list handed to the next game. When nearly everything's been seen, start over.
export function freshOrder(n, prev, use, rnd = Math.random) {
  let seen = new Set((prev?.seenIdx || []).filter(i => i < n));
  if (n - seen.size < use) seen = new Set();
  const all = shuffle([...Array(n).keys()], rnd);
  const order = [...all.filter(i => !seen.has(i)), ...all.filter(i => seen.has(i))];
  return { order, seenIdx: [...seen, ...order.slice(0, use)] };
}
