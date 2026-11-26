// Hearts: four players, trick-taking. Every heart you win is a point and the Queen of Spades is 13.
// Low score wins, unless someone takes every point card and "shoots the moon".
import { esc } from '../ui.js';
import { makeStd, face, SUITS, shuffle } from './cards.js';

export const meta = {
  id: 'hearts',
  name: 'Hearts',
  min: 4,
  max: 4,
  blurb: 'Four-player trick-taking. Dodge the hearts and the Queen of Spades.',
};

export const PASS = ['left', 'right', 'across', 'none'];
export const TARGET = 50;
export const MAX_HANDS = 4;
export const TIMES = { pass: 40000, turn: 30000, trick: 1800, handEnd: 8000 };
const HEART = 1, SPADE = 0, CLUB = 3;
export const val = c => (c.r === 0 ? 13 : c.r);   // aces high
export const pts = c => (c.s === HEART ? 1 : c.s === SPADE && c.r === 11 ? 13 : 0);
const isTwoClubs = c => c.s === CLUB && c.r === 1;
const sortHand = h => h.sort((a, b) => [3, 2, 0, 1].indexOf(a.s) - [3, 2, 0, 1].indexOf(b.s) || val(a) - val(b));

export function setup(players, rnd = Math.random) {
  const s = { game: 'hearts', players: players.map(p => ({ pid: p.pid, name: p.name })), scores: Object.fromEntries(players.map(p => [p.pid, 0])), handNo: 0, round: 0 };
  deal(s, Date.now(), rnd);
  return s;
}

function deal(s, now, rnd) {
  const deck = makeStd(rnd);
  s.hands = {}; s.taken = {}; s.passed = {};
  s.players.forEach((p, i) => { s.hands[p.pid] = sortHand(deck.slice(i * 13, i * 13 + 13)); s.taken[p.pid] = []; });
  s.trick = []; s.broken = false; s.tricks = 0; s.lastTrick = null; s.handPts = null; s.received = {}; s.moon = null;
  s.passDir = PASS[s.handNo % 4];
  if (s.passDir === 'none') startPlay(s, now);
  else { s.phase = 'pass'; s.round++; s.deadline = now + TIMES.pass; }
}

function startPlay(s, now) {
  s.turn = s.players.findIndex(p => s.hands[p.pid].some(isTwoClubs));
  s.phase = 'play'; s.round++;
  s.deadline = now + TIMES.turn;
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const cur = s => s.players[s.turn].pid;
const passTo = (s, i) => (i + (s.passDir === 'left' ? 1 : s.passDir === 'right' ? 3 : 2)) % 4;

export function legal(s, pid) {
  const h = s.hands[pid];
  if (s.tricks === 0 && !s.trick.length) return h.filter(isTwoClubs);
  if (s.trick.length) {
    const led = s.trick[0].card.s;
    const follow = h.filter(c => c.s === led);
    if (follow.length) return follow;
    if (s.tricks === 0) { const safe = h.filter(c => !pts(c)); if (safe.length) return safe; }   // no points on the first trick
    return h;
  }
  if (!s.broken) { const non = h.filter(c => c.s !== HEART); if (non.length) return non; }
  return h;
}

function doPass(s, now) {
  const moving = s.players.map((p, i) => ({ to: s.players[passTo(s, i)].pid, cards: s.passed[p.pid] }));
  s.players.forEach(p => (s.hands[p.pid] = s.hands[p.pid].filter(c => !s.passed[p.pid].some(x => x.id === c.id))));
  moving.forEach(m => { s.hands[m.to].push(...m.cards); sortHand(s.hands[m.to]); });
  s.received = Object.fromEntries(moving.map(m => [m.to, m.cards.map(c => c.id)]));
  startPlay(s, now);
}

function finishTrick(s, now) {
  const led = s.trick[0].card.s;
  const win = s.trick.filter(t => t.card.s === led).sort((a, b) => val(b.card) - val(a.card))[0];
  s.taken[win.pid].push(...s.trick.map(t => t.card));
  s.lastTrick = { cards: s.trick, winner: win.pid, points: s.trick.reduce((a, t) => a + pts(t.card), 0) };
  s.trick = []; s.tricks++;
  s.turn = s.players.findIndex(p => p.pid === win.pid);
  s.phase = 'trick'; s.deadline = now + TIMES.trick;
}

function endHand(s, now) {
  const raw = Object.fromEntries(s.players.map(p => [p.pid, s.taken[p.pid].reduce((a, c) => a + pts(c), 0)]));
  const moon = s.players.find(p => raw[p.pid] === 26);
  s.handPts = moon ? Object.fromEntries(s.players.map(p => [p.pid, p.pid === moon.pid ? 0 : 26])) : raw;
  s.moon = moon ? moon.pid : null;
  s.players.forEach(p => (s.scores[p.pid] += s.handPts[p.pid]));
  s.handNo++;
  const done = s.handNo >= MAX_HANDS || Object.values(s.scores).some(x => x >= TARGET);
  s.phase = done ? 'over' : 'handEnd'; s.round++;
  s.deadline = done ? 0 : now + TIMES.handEnd;
}

function playCard(s, pid, card, now) {
  s.hands[pid] = s.hands[pid].filter(c => c.id !== card.id);
  s.trick.push({ pid, card });
  if (card.s === HEART) s.broken = true;
  if (s.trick.length === 4) finishTrick(s, now);
  else { s.turn = (s.turn + 1) % 4; s.deadline = now + TIMES.turn; }
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.hands?.[pid]) return s;
  if (s.phase === 'pass' && a.type === 'pass' && !s.passed[pid] && Array.isArray(a.ids)) {
    const cards = [...new Set(a.ids)].map(id => s.hands[pid].find(c => c.id === id)).filter(Boolean);
    if (cards.length !== 3) return s;
    s.passed[pid] = cards;
    if (s.players.every(p => s.passed[p.pid])) doPass(s, now);
  } else if (s.phase === 'play' && pid === cur(s) && a.type === 'play') {
    const card = legal(s, pid).find(c => c.id === a.id);
    if (card) playCard(s, pid, card, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a === 'next') {
    if (s.phase === 'pass') { s.players.forEach(p => { if (!s.passed[p.pid]) s.passed[p.pid] = botPass(s.hands[p.pid]); }); doPass(s, now); }
    else if (s.phase === 'play') playCard(s, cur(s), botPlay(s.hands[cur(s)], legal(s, cur(s)), s.trick, s.tricks), now);
    else if (s.phase === 'trick') { if (s.tricks === 13) endHand(s, now); else { s.phase = 'play'; s.lastTrickShown = s.lastTrick; s.deadline = now + TIMES.turn; } }
    else if (s.phase === 'handEnd') deal(s, now, rnd);
  }
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.deadline && now >= s.deadline && s.phase !== 'over') hostAct(s, 'next', now, rnd);
  return s;
}

// Simple, decent strategy, used by bots and when a player's time runs out.
function botPass(hand) {
  const danger = c => (c.s === SPADE && c.r === 11 ? 100 : c.s === SPADE && (c.r === 0 || c.r === 12) ? 90 : c.s === HEART ? 50 + val(c) : val(c));
  return hand.slice().sort((a, b) => danger(b) - danger(a)).slice(0, 3);
}
function botPlay(hand, ok, trick, tricks) {
  if (trick.length) {
    const led = trick[0].card.s;
    const following = ok[0].s === led;
    if (following) {
      const high = Math.max(...trick.filter(t => t.card.s === led).map(t => val(t.card)));
      const under = ok.filter(c => val(c) < high).sort((a, b) => val(b) - val(a));
      return under[0] || (trick.length === 3 && !trick.some(t => pts(t.card)) ? ok.sort((a, b) => val(b) - val(a))[0] : ok.sort((a, b) => val(a) - val(b))[0]);
    }
    const q = ok.find(c => c.s === SPADE && c.r === 11);
    if (q) return q;
    return ok.slice().sort((a, b) => (b.s === HEART) - (a.s === HEART) || val(b) - val(a))[0];
  }
  return ok.slice().sort((a, b) => val(a) - val(b))[0];
}

export function botAct(v) {
  if (v.phase === 'pass' && !v.passed) return { type: 'pass', ids: botPass(v.hand).map(c => c.id) };
  if (v.phase === 'play' && v.myTurn) return { type: 'play', id: botPlay(v.hand, v.hand.filter(c => v.legal.includes(c.id)), v.trick, v.tricks).id };
  return null;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => a.score - b.score);
export function narration(s) {
  if (s.phase === 'pass') return s.handNo === 0 ? `Welcome to Hearts! Each heart you take is a point, and the Queen of Spades is thirteen. Lowest score wins. First, pick three cards to pass ${s.passDir}.` : `Pass three cards ${s.passDir}.`;
  if (s.phase === 'play' && s.tricks === 0 && !s.trick.length) return `${nameOf(s, cur(s))} has the two of clubs and leads.`;
  if (s.phase === 'trick' && s.lastTrick.cards.some(t => t.card.s === SPADE && t.card.r === 11)) return `Ouch! ${nameOf(s, s.lastTrick.winner)} takes the Queen of Spades!`;
  if (s.phase === 'handEnd' || s.phase === 'over') {
    const moon = s.moon ? `${nameOf(s, s.moon)} shot the moon! ` : '';
    return s.phase === 'over' ? `${moon}${ranking(s)[0].name} wins with the lowest score!` : `${moon}End of the hand.`;
  }
  return '';
}
export function cue(s) {
  if (s.phase === 'pass') return { sound: 'join', wait: 700, title: s.handNo === 0 ? 'Hearts' : `Hand ${s.handNo + 1}`, sub: `Pass 3 cards ${s.passDir}` };
  if (s.phase === 'trick') return { sound: s.lastTrick.points >= 13 ? 'death' : s.lastTrick.points ? 'lose' : 'tick', wait: 200 };
  if (s.phase === 'handEnd') return { sound: s.moon ? 'win' : 'drumroll', wait: 500, fx: s.moon ? 'confetti' : null };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function tvView(s, now = Date.now()) {
  const show = s.phase === 'trick' ? s.lastTrick.cards : s.trick;
  return {
    phase: s.phase, handNo: s.handNo + (s.phase === 'over' || s.phase === 'handEnd' ? 0 : 1), passDir: s.passDir, broken: s.broken, tricks: s.tricks,
    seats: s.players.map((p, i) => ({ name: p.name, score: s.scores[p.pid], taken: s.taken[p.pid].reduce((a, c) => a + pts(c), 0), count: s.hands[p.pid].length, turn: s.phase === 'play' && i === s.turn, passed: !!s.passed[p.pid], card: show.find(t => t.pid === p.pid)?.card || null, won: s.phase === 'trick' && s.lastTrick.winner === p.pid, hand: s.handPts?.[p.pid] })),
    current: s.phase === 'play' ? nameOf(s, cur(s)) : '', moon: s.moon ? nameOf(s, s.moon) : null,
    scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
  };
}

export function phoneView(s, pid) {
  if (!s.hands?.[pid]) return { phase: 'spectate' };
  const myTurn = s.phase === 'play' && cur(s) === pid;
  return {
    phase: s.phase, round: s.round, myTurn, hand: s.hands[pid], legal: myTurn ? legal(s, pid).map(c => c.id) : [],
    trick: s.trick, tricks: s.tricks, passDir: s.passDir, passed: !!s.passed?.[pid], received: s.phase === 'play' && s.tricks < 2 ? s.received?.[pid] || [] : [],
    current: s.phase === 'play' ? nameOf(s, cur(s)) : '', score: s.scores[pid], taken: s.taken[pid].reduce((a, c) => a + pts(c), 0),
    place: s.phase === 'over' ? ranking(s).findIndex(x => x.pid === pid) + 1 : 0,
  };
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const pos = ['s', 'w', 'n', 'e'];
  const table = `<div class="htable">${v.seats.map((p, i) => `<div class="hseat ${pos[i]} ${p.turn ? 'on' : ''} ${p.won ? 'won' : ''}"><b>${esc(p.name)}</b><small>${p.score} pts${p.taken ? ` · <span class="lose">+${p.taken} this hand</span>` : ''}</small>${v.phase === 'pass' ? `<small>${p.passed ? '✓ passed' : 'choosing…'}</small>` : ''}</div><div class="hplay ${pos[i]}">${p.card ? face(p.card, 'big') : ''}</div>`).join('')}<div class="hcenter">${v.phase === 'pass' ? `<p class="say">Pass 3 cards <b>${esc(v.passDir)}</b></p>` : v.broken ? '<p class="lose">♥ broken</p>' : '<p class="muted">Hearts not broken yet</p>'}</div></div>`;
  let h = '';
  if (v.phase === 'pass' || v.phase === 'play' || v.phase === 'trick') h = `<p class="cat">Hand ${v.handNo} · trick ${Math.min(v.tricks + (v.phase === 'trick' ? 0 : 1), 13)} of 13${v.current ? ` · <b>${esc(v.current)}</b>'s turn <span class="clock">${v.left}</span>` : ''}</p>${table}<button class="btn ghost" data-host="next">${v.phase === 'pass' ? 'Pass for everyone' : 'Play for them'}</button>`;
  if (v.phase === 'handEnd' || v.phase === 'over') h = `<h2 class="${v.phase === 'over' ? 'win' : ''}">${v.moon ? `🌙 ${esc(v.moon)} shot the moon! ` : ''}${v.phase === 'over' ? `${esc(v.scores[0].name)} wins!` : 'End of the hand'}</h2><div class="scores">${v.seats.slice().sort((a, b) => a.score - b.score).map(p => `<div class="srow"><span>${esc(p.name)} <small class="muted">+${p.hand}</small></span><b>${p.score}</b></div>`).join('')}</div><p class="muted">Lowest score wins. Game ends at ${TARGET} points or after ${MAX_HANDS} hands.</p>${v.phase === 'over' ? '<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>' : '<button class="btn" data-host="next">Next hand</button>'}`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel bjtable">${h}</div></div>`;
}

let sel = { round: -1, ids: [] };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (sel.round !== v.round) sel = { round: v.round, ids: [] };
  const head = `<p class="muted">${v.score} points · +${v.taken} this hand</p>`;
  if (v.phase === 'handEnd' || v.phase === 'over') { el.innerHTML = `${head}<h2 class="${v.place === 1 ? 'win' : ''}">${v.phase === 'over' ? (v.place === 1 ? 'You won!' : `You came #${v.place}`) : 'Check the TV'}</h2>`; return; }
  const hand = mode => `<div class="pcrow bchand hhand">${v.hand.map(c => {
    const can = mode === 'pass' ? !v.passed : mode === 'play' && v.legal.includes(c.id);
    return face(c, `${sel.ids.includes(c.id) ? 'sel' : ''} ${mode === 'play' && !can ? 'dim' : ''} ${v.received.includes(c.id) ? 'got' : ''}`, can ? `data-id="${c.id}"` : '');
  }).join('')}</div>`;
  let h = head;
  if (v.phase === 'pass') h += v.passed ? `<h2>Passed!</h2><p class="say">Waiting for the others…</p>${hand('none')}` : `<h2>Pick 3 cards to pass ${esc(v.passDir)}</h2><p class="muted">Tip: pass high hearts and the Queen of Spades.</p>${hand('pass')}<button class="btn" id="go" ${sel.ids.length === 3 ? '' : 'disabled'}>Pass ${sel.ids.length}/3</button>`;
  else if (v.myTurn) h += `<h2>Your turn</h2>${v.trick.length ? `<div class="pcrow small">${v.trick.map(t => face(t.card)).join('')}</div>` : '<p class="muted">You lead.</p>'}${hand('play')}<p class="muted small">Tap a bright card to play it.</p>`;
  else h += `<h2>${esc(v.current || 'Next trick')}${v.current ? "'s turn" : ''}</h2>${v.received.length ? '<p class="muted small">Cards passed to you are outlined.</p>' : ''}${hand('none')}`;
  el.innerHTML = h;
  el.querySelectorAll('[data-id]').forEach(b => (b.onclick = () => {
    const id = Number(b.dataset.id);
    if (v.phase === 'play') { el.querySelectorAll('[data-id]').forEach(x => x.removeAttribute('data-id')); send({ type: 'play', id }); return; }
    sel.ids = sel.ids.includes(id) ? sel.ids.filter(x => x !== id) : sel.ids.length < 3 ? [...sel.ids, id] : sel.ids;
    renderPhone(v, el, send);
  }));
  el.querySelector('#go')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'pass', ids: sel.ids }); });
}
