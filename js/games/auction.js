// Going Once: a sealed-bid auction. Everyone starts with the same money. Each lot is worth something inside a range
// shown on the TV; one player (the insider) is secretly told exactly what. Everyone bids at once on their phone, the
// highest bid buys the lot, and then its true worth is revealed. Money left plus what your lots are worth wins.
import { esc } from '../ui.js';

export const meta = {
  id: 'auction',
  name: 'Going Once',
  min: 3,
  max: 10,
  blurb: 'Bid on mystery lots. One of you secretly knows what each is worth. Buy bargains, dodge junk.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const START = 1000, STEP = 10;
// [what, picture, least it could be worth, most]
export const LOTS = [
  ['A dusty painting from the attic', '🖼️', 50, 900], ['Grandma\'s "priceless" vase', '🏺', 20, 700], ['A mystery crate, still nailed shut', '📦', 0, 800], ['A signed baseball. Signed by whom?', '⚾', 30, 600],
  ['A treasure map with a coffee stain', '🗺️', 0, 1000], ['A slightly haunted doll', '🪆', 10, 500], ['A suit of armor, one glove missing', '🛡️', 100, 800], ['A jar of very old coins', '🫙', 50, 700],
  ['A guitar that "belonged to a legend"', '🎸', 40, 900], ['A meteorite, or possibly a rock', '☄️', 0, 900], ['A golden trophy for something', '🏆', 60, 500], ['A chest of pirate costume jewelry', '💍', 20, 800],
  ['A first-edition comic, slightly chewed', '📚', 30, 700], ['A robot butler that mostly works', '🤖', 100, 900], ['A racehorse named Probably Fine', '🐎', 0, 1000], ['A crystal ball with a crack', '🔮', 20, 600],
  ['A stamp collection, 3 stamps', '✉️', 10, 600], ['A grand piano, delivery not included', '🎹', 150, 900], ['A dinosaur egg. Certificate lost.', '🥚', 0, 1000], ['A crown from a school play, or a real king', '👑', 10, 900],
  ['A telescope pointed at the neighbors', '🔭', 50, 500], ['A very fancy cheese, aged 40 years', '🧀', 20, 600], ['A magic lamp, lightly rubbed', '🪔', 0, 900], ['A vintage arcade machine', '🕹️', 100, 800],
];
export const TIMES = { bid: 22000, settle: 4200, after: 6000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const round10 = x => Math.round(x / STEP) * STEP;

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const max = opts.short ? 5 : 7;
  let deck = (prev?.deck || []).slice(); if (deck.length < max) deck = shuffle(LOTS.map((_, i) => i), rnd);
  // each lot gets a different insider where possible, so the secret moves round the room
  const seats = shuffle(players.map(p => p.pid), rnd);
  const s = {
    game: 'auction', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    cash: Object.fromEntries(players.map(p => [p.pid, START])), items: Object.fromEntries(players.map(p => [p.pid, []])),
    scores: Object.fromEntries(players.map(p => [p.pid, START])),
    lots: deck.splice(0, max).map((i, k) => ({ i, value: round10(LOTS[i][2] + rnd() * (LOTS[i][3] - LOTS[i][2])), insider: seats[k % seats.length] })),
    deck, n: 0, bids: {}, result: null, settled: false, settleAt: 0, phase: 'bid', deadline: Date.now() + TIMES.bid + 3000,
  };
  return s;
}
const lot = s => s.lots[s.n];
const worth = (s, pid) => s.cash[pid] + s.items[pid].reduce((a, x) => a + x.value, 0);
function result(s, now) {
  const before = { ...s.scores }, l = lot(s);
  const bids = s.players.map(p => ({ pid: p.pid, amount: s.bids[p.pid]?.amount || 0, at: s.bids[p.pid]?.at ?? 1e15 })).sort((a, b) => b.amount - a.amount || a.at - b.at);
  const win = bids[0].amount > 0 ? bids[0] : null;
  if (win) { s.cash[win.pid] -= win.amount; s.items[win.pid].push({ i: l.i, value: l.value, paid: win.amount }); }
  s.players.forEach(p => (s.scores[p.pid] = worth(s, p.pid)));
  s.result = { before, bids: bids.map(b => ({ pid: b.pid, amount: b.amount })), winner: win?.pid || null, paid: win?.amount || 0 };
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'bid' || a.type !== 'bid' || !s.players.some(p => p.pid === pid) || s.bids[pid]) return s;
  const amount = round10(Number(a.amount)); if (!(amount >= 0) || amount > s.cash[pid]) return s;
  s.bids[pid] = { amount, at: now };
  if (s.players.every(p => s.bids[p.pid])) result(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'bid') result(s, now);
  else if (s.phase === 'result') { if (s.n + 1 >= s.lots.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else { s.n++; s.bids = {}; s.result = null; s.settled = false; s.phase = 'bid'; s.round++; s.deadline = now + TIMES.bid; } }
  return s;
}
export function tick(s, now = Date.now()) {
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s;
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const ranking = (s, sc = s.scores) => s.players.map(p => ({ pid: p.pid, name: p.name, score: sc[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'bid' && s.n === 0) return 'Welcome to Going Once! Bid on each lot from your phone. One of you secretly knows what it is really worth.';
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'bid') return s.n === 0 ? { sound: 'fanfare', wait: 1500, title: 'Going Once', sub: 'Everyone starts with $1,000' } : { sound: 'join', wait: 500 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Sold!', sub: `${ranking(s)[0].name} is worth the most`, tone: 'dawn', fx: 'confetti' };
  return null;
}
// Bots bid around what they think it is worth: the insider knows, the rest guess the middle of the range.
export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'bid' || v.bid !== null || rnd() < 0.4) return null;
  const guess = v.secret ?? (v.low + v.high) / 2;
  return { type: 'bid', amount: Math.max(0, Math.min(v.cash, round10(guess * (0.3 + rnd() * 0.6)))) };
}

export function tvView(s, now = Date.now()) {
  const held = s.phase === 'result' && !s.settled, l = lot(s), L = LOTS[l.i];
  const v = { phase: s.phase, n: s.n + 1, of: s.lots.length, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s, held ? s.result.before : s.scores) };
  if (s.phase === 'over') { v.hauls = ranking(s).map(r => ({ name: r.name, cash: s.cash[r.pid], items: s.items[r.pid].map(x => ({ icon: LOTS[x.i][1], value: x.value, paid: x.paid })), total: r.score })); return v; }
  v.lot = { name: L[0], icon: L[1], low: L[2], high: L[3] };
  if (s.phase === 'bid') v.players = s.players.map(p => ({ name: p.name, done: !!s.bids[p.pid] }));
  if (s.phase === 'result') { const r = s.result; v.settled = !!s.settled; v.bids = r.bids.map(b => ({ name: nameOf(s, b.pid), amount: b.amount })).reverse(); v.winner = r.winner ? nameOf(s, r.winner) : null; v.paid = r.paid; v.value = l.value; v.insider = nameOf(s, l.insider); }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const held = s.phase === 'result' && !s.settled, l = lot(s), L = LOTS[l.i];
  const v = { phase: s.phase, n: s.n + 1, of: s.lots.length, cash: s.cash[pid], score: held ? s.result.before[pid] : s.scores[pid] };
  if (s.phase === 'bid') { v.lot = L[0]; v.icon = L[1]; v.low = L[2]; v.high = L[3]; v.bid = s.bids[pid] ? s.bids[pid].amount : null; if (l.insider === pid) v.secret = l.value; }
  if (s.phase === 'result') { v.settled = !!s.settled; if (s.settled) { v.won = s.result.winner === pid; v.paid = s.result.paid; v.value = l.value; v.winner = s.result.winner ? nameOf(s, s.result.winner) : null; } else v.cash = s.cash[pid] + (s.result.winner === pid ? s.result.paid : 0); }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

const $ = n => '$' + Number(n).toLocaleString();
let revKey = '', revAt = 0;
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const scores = `<div class="scores"><h3>Worth</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} is worth the most!</h2><div class="auhauls">${v.hauls.slice(0, 6).map(x => `<div class="auhaul"><b>${esc(x.name)}</b><span>${x.items.map(i => `<i title="${i.value}">${i.icon}</i>`).join('') || '<small>bought nothing</small>'}</span><em>${$(x.cash)} cash${x.items.length ? ` + ${$(x.total - x.cash)} in lots` : ''} = ${$(x.total)}</em></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  else {
    const card = `<div class="aulot"><i>${v.lot.icon}</i><div><h2>${esc(v.lot.name)}</h2><p>Worth somewhere from <b>${$(v.lot.low)}</b> to <b>${$(v.lot.high)}</b></p></div></div>`;
    if (v.phase === 'bid') h = `<p class="cat">Lot ${v.n} of ${v.of} <span class="clock small ${v.left <= 5 ? 'hurry' : ''}">${v.left}</span></p>${card}<p class="tsrule"><b>Bid in secret on your phone. Highest bid buys it.</b><span>One of you has been told exactly what it is worth.</span></p><div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">Close the bidding</button>`;
    else {
      const key = 'l' + v.n, n = v.bids.length, tSold = 500 + n * 300, tWorth = tSold + 1400, diff = v.value - v.paid;
      if (revKey !== key) { revKey = key; revAt = Date.now(); import('../sfx.js').then(m => { v.bids.forEach((_, i) => setTimeout(() => m.play('pop'), 500 + i * 300)); setTimeout(() => m.play('stamp'), tSold); setTimeout(() => m.play(!v.winner ? 'laugh' : diff >= 0 ? 'cheer' : 'groan'), tWorth); }).catch(() => {}); }
      const el0 = Date.now() - revAt;
      h = `<p class="cat">Lot ${v.n} of ${v.of}</p>${card}<div class="aubids">${v.bids.map((b, i) => `<span class="${i === n - 1 && v.winner ? 'top' : ''}" style="animation-delay:${500 + i * 300 - el0}ms">${esc(b.name)} <b>${b.amount ? $(b.amount) : 'no bid'}</b></span>`).join('')}</div>
        <p class="ausold" style="animation-delay:${tSold - el0}ms">${v.winner ? `SOLD to ${esc(v.winner)} for ${$(v.paid)}` : 'No bids. Nobody wanted it.'}</p>
        <p class="auworth ${diff >= 0 ? 'good' : 'bad'}" style="animation-delay:${tWorth - el0}ms">It was worth <b>${$(v.value)}</b>${v.winner ? (diff >= 0 ? ` · a bargain: +${$(diff)}` : ` · ouch: −${$(-diff)}`) : ''} <small>${esc(v.insider)} knew all along</small></p>
        <button class="btn" data-host="next">${v.n < v.of ? 'Next lot' : 'Finish'}</button>`;
    }
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel au">${h}</div>${scores}</div>`;
}
let mine = { key: '', amount: 0 };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You are worth the most! 🏆' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'}, worth ${$(v.score)}.</p>`; return; }
  const purse = `<p class="muted">💵 ${$(v.cash)} to spend</p>`;
  if (v.phase === 'result') { el.innerHTML = !v.settled ? `${purse}<h2>Watch the TV…</h2>` : `${purse}<h2 class="${v.won ? (v.value >= v.paid ? 'win' : 'lose') : ''}">${v.won ? (v.value >= v.paid ? `Bargain! +${$(v.value - v.paid)}` : `Ouch. −${$(v.paid - v.value)}`) : v.winner ? `${esc(v.winner)} bought it` : 'Nobody bought it'}</h2><p class="say">It was worth ${$(v.value)}${v.winner ? `, sold for ${$(v.paid)}` : ''}.</p>`; return; }
  if (v.bid !== null) { el.innerHTML = `${purse}<h2>${v.bid ? `You bid ${$(v.bid)}` : 'You passed'}</h2><p class="say">Sealed. Watch the TV.</p>`; return; }
  const key = 'a' + v.n; if (mine.key !== key) mine = { key, amount: Math.min(v.cash, 100) };
  const set = x => { mine.amount = Math.max(0, Math.min(v.cash, Math.round(x / STEP) * STEP)); const o = el.querySelector('#auamt'), r = el.querySelector('#aur'); if (o) o.textContent = $(mine.amount); if (r) r.value = mine.amount; };
  el.innerHTML = `${purse}<p class="tq small">${v.icon} ${esc(v.lot)}</p><p class="muted">Worth somewhere from ${$(v.low)} to ${$(v.high)}.</p>${v.secret !== undefined ? `<p class="ausecret">🤫 Only you know: it is worth exactly <b>${$(v.secret)}</b>. Keep a straight face.</p>` : ''}
    <div class="aubid"><b id="auamt">${$(mine.amount)}</b><input type="range" id="aur" min="0" max="${v.cash}" step="${STEP}" value="${mine.amount}"><div class="row">${[-100, -10, 10, 100].map(d => `<button class="btn ghost small" data-d="${d}">${d > 0 ? '+' : '−'}${Math.abs(d)}</button>`).join('')}</div></div>
    <button class="btn" id="aubid">Place my bid</button><button class="btn ghost" id="aupass">Pass</button>`;
  el.querySelector('#aur').oninput = e => set(+e.target.value);
  el.querySelectorAll('[data-d]').forEach(b => (b.onclick = () => set(mine.amount + +b.dataset.d)));
  el.querySelector('#aubid').onclick = () => send({ type: 'bid', amount: mine.amount });
  el.querySelector('#aupass').onclick = () => send({ type: 'bid', amount: 0 });
}
