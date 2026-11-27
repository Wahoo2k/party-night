// Estimate & Bet: everyone secretly guesses a number. The guesses line up on the TV with payout odds,
// and everyone bets on the guess they think is closest without going over. (Wits & Wagers-style.)
import { esc } from '../ui.js';

export const meta = {
  id: 'estimate',
  name: 'Estimate & Bet',
  min: 2,
  max: 20,
  blurb: 'Guess the number, then bet on whoever is closest.',
};

export const QUESTIONS = [
  ['How many keys are on a standard piano?', 88], ['How many bones are in an adult human body?', 206], ['In what year did the Titanic sink?', 1912],
  ['How many hearts does an octopus have?', 3], ['In what year did people first walk on the Moon?', 1969], ['How many teeth does an adult usually have, counting wisdom teeth?', 32],
  ['How many squares are on a chessboard?', 64], ['In what year was the Eiffel Tower finished?', 1889], ['How many time zones does Russia have?', 11],
  ['How tall is the Statue of Liberty, from the ground to the tip of the torch, in feet?', 305], ['At what temperature are Fahrenheit and Celsius the same?', -40], ['How many hours are in a week?', 168],
  ['How many seconds are in an hour?', 3600], ['In what year was Google founded?', 1998], ['How long is an Olympic swimming pool, in meters?', 50],
  ['In what year did the Berlin Wall fall?', 1989], ['How many bones are in one human hand?', 27], ['How many letters are in the Greek alphabet?', 24],
  ['How many feet are in a mile?', 5280], ['In what year did the Wright brothers make their first powered flight?', 1903], ['How many moons does Mars have?', 2],
  ['How many minutes are in a day?', 1440], ['What is the boiling point of water at sea level, in °F?', 212], ['How many cups are in a gallon?', 16],
  ['How many pounds are in a U.S. ton?', 2000], ['How many countries are in Africa?', 54], ['How many legs does a lobster have?', 10],
  ['How many years did the Hundred Years\' War actually last?', 116], ['How many dots are on a pair of standard dice, in total?', 42], ['How many players are on the field for one soccer team?', 11],
  ['How many strings does a standard violin have?', 4], ['How many days are in a leap year?', 366], ['In what year did the first modern Olympic Games take place?', 1896],
  ['How many sides does a stop sign have?', 8], ['How many stars were on the U.S. flag in 1960, before Hawaii\'s star was added?', 49], ['How many white keys are on a standard piano?', 52],
  ['How many eyes does a typical spider have?', 8], ['How many inches are in a yard?', 36], ['In what year was the Declaration of Independence signed?', 1776],
  ['How many weeks long is a typical human pregnancy?', 40], ['How many Great Lakes are there?', 5], ['How many cards are in a standard deck, counting two jokers?', 54],
];
export const PER_GAME = 7;
export const TIMES = { answer: 45000, bet: 35000, reveal: 9000 };
export const LOW = 'low';   // the "every guess is too high" slot

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Unique guesses in order, with odds: 2 in the middle, more toward the edges, 6 for "all too high".
export function board(guesses) {
  const vals = [...new Set(Object.values(guesses))].sort((a, b) => a - b);
  const mid = (vals.length - 1) / 2;
  const slots = vals.map((n, i) => ({ id: String(n), n, odds: Math.min(5, 2 + Math.floor(Math.abs(i - mid))) }));
  return [{ id: LOW, n: null, odds: 6 }, ...slots];
}
export function winningSlot(guesses, answer) {
  const under = Object.values(guesses).filter(n => n <= answer);
  return under.length ? String(Math.max(...under)) : LOW;
}

export function setup(players, rnd = Math.random) {
  const s = {
    game: 'estimate', players: players.map(p => ({ pid: p.pid, name: p.name })),
    qs: shuffle([...QUESTIONS.keys()], rnd).slice(0, PER_GAME), q: 0, round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
  };
  start(s, Date.now());
  return s;
}

function start(s, now) { s.guesses = {}; s.bets = {}; s.result = null; s.phase = 'answer'; s.round++; s.deadline = now + TIMES.answer; }
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const Q = s => QUESTIONS[s.qs[s.q]];

function toBet(s, now) {
  if (!Object.keys(s.guesses).length) return reveal(s, now);
  s.slots = board(s.guesses);
  s.phase = 'bet'; s.round++; s.deadline = now + TIMES.bet;
}

function reveal(s, now) {
  const answer = Q(s)[1];
  const win = winningSlot(s.guesses, answer);
  const slot = (s.slots || []).find(x => x.id === win);
  const list = s.players.map(p => {
    let pts = 0;
    const closest = s.guesses[p.pid] !== undefined && String(s.guesses[p.pid]) === win;
    if (closest) pts += 3;
    if (s.bets[p.pid] === win && slot) pts += slot.odds;
    s.scores[p.pid] += pts;
    return { pid: p.pid, name: p.name, guess: s.guesses[p.pid], bet: s.bets[p.pid] || null, closest, pts };
  });
  s.result = { answer, win, list };
  s.phase = 'reveal'; s.round++; s.deadline = now + TIMES.reveal;
}

function next(s, now) {
  s.q++;
  s.slots = null;
  if (s.q >= s.qs.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  start(s, now);
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.scores.hasOwnProperty(pid)) return s;
  if (s.phase === 'answer' && a.type === 'guess' && s.guesses[pid] === undefined) {
    const n = Math.round(Number(a.n));
    if (!Number.isFinite(n) || Math.abs(n) > 1e9) return s;
    s.guesses[pid] = n;
    if (s.players.every(p => s.guesses[p.pid] !== undefined)) toBet(s, now);
  } else if (s.phase === 'bet' && a.type === 'bet' && s.slots.some(x => x.id === a.id)) {
    s.bets[pid] = a.id;
    if (s.players.every(p => s.bets[p.pid])) reveal(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'answer') toBet(s, now);
  else if (s.phase === 'bet') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now);
  return s;
}
export function tick(s, now = Date.now()) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
const fmt = n => (n === null || n === undefined ? '—' : Number(n).toLocaleString());
export function narration(s) {
  if (s.phase === 'answer') return `${s.q === 0 ? 'Welcome to Estimate and Bet! Nobody knows these exactly, so just make your best guess. ' : ''}${Q(s)[0]}`;
  if (s.phase === 'bet') return 'Now bet on the guess you think is closest without going over.';
  if (s.phase === 'reveal') return `The answer is ${s.result.answer.toLocaleString()}!`;
  if (s.phase === 'over') return `${ranking(s)[0].name} wins Estimate and Bet!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'answer') return { sound: 'join', wait: 600, title: `Question ${s.q + 1} of ${PER_GAME}` };
  if (s.phase === 'bet') return { sound: 'vote', wait: 300 };
  if (s.phase === 'reveal') return { sound: 'drumroll', wait: 1500 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'answer' && !v.guessed && v._a !== undefined) return { type: 'guess', n: Math.round(v._a * (0.6 + rnd() * 0.8)) };
  if (v.phase === 'bet' && !v.bet) { const opts = v.slots.filter(x => x.id !== LOW || rnd() < 0.1); const mid = opts[Math.floor(opts.length / 2 + (rnd() - 0.5) * 2)] || opts[0]; return { type: 'bet', id: mid.id }; }
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, q: s.q + 1, of: PER_GAME, question: s.qs[s.q] !== undefined ? Q(s)[0] : '', scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'answer') { v.n = Object.keys(s.guesses).length; v.total = s.players.length; }
  if (s.phase === 'bet' || s.phase === 'reveal') {
    v.slots = (s.slots || []).map(x => ({ ...x, by: s.players.filter(p => String(s.guesses[p.pid]) === x.id).map(p => p.name), bets: s.players.filter(p => s.bets[p.pid] === x.id).map(p => p.name) }));
    v.betsIn = Object.keys(s.bets).length; v.total = s.players.length;
  }
  if (s.phase === 'reveal') v.result = s.result;
  return v;
}
export function phoneView(s, pid) {
  if (!s.scores.hasOwnProperty(pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, question: s.qs[s.q] !== undefined ? Q(s)[0] : '', score: s.scores[pid] };
  if (s.phase === 'answer') { v.guessed = s.guesses[pid] !== undefined; if (String(pid).startsWith('bot-')) v._a = Q(s)[1]; }
  if (s.phase === 'bet') { v.slots = s.slots.map(x => ({ id: x.id, n: x.n, odds: x.odds })); v.bet = s.bets[pid] || null; v.mine = s.guesses[pid]; }
  if (s.phase === 'reveal') { const me = s.result.list.find(x => x.pid === pid); v.answer = s.result.answer; v.pts = me.pts; v.closest = me.closest; }
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'reveal' || v.phase === 'over');
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  const boardHTML = () => `<div class="ebboard">${v.slots.map(x => `<div class="ebslot ${v.result && v.result.win === x.id ? 'win' : ''}"><div class="ebodds">${x.odds}×</div><div class="ebnum">${x.id === 'low' ? 'All too high' : fmt(x.n)}</div><small>${x.by.map(esc).join(', ')}</small><div class="ebchips">${x.bets.map(n => `<span title="${esc(n)}">${esc(n.slice(0, 2))}</span>`).join('')}</div></div>`).join('')}</div>`;
  let h = `<p class="cat">Question ${v.q} of ${v.of}</p>`;
  if (v.phase === 'answer') h += `<div class="cq">${esc(v.question)}</div><p class="say">Everyone guess a number on your phone. Closest without going over wins!</p><div class="meter"><span style="width:${(100 * v.n) / v.total}%"></span></div><p class="muted center">${v.n} of ${v.total} guesses in <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">That's enough guesses</button><div class="how"><h3>How to play</h3><ol><li>Guess the answer. Nobody knows exactly!</li><li>All guesses go up on the board, lowest to highest.</li><li>Bet on the one you think is closest <b>without going over</b>. The edges pay more.</li><li>Your own guess being closest earns 3 points too.</li></ol></div>`;
  if (v.phase === 'bet') h += `<div class="cq small">${esc(v.question)}</div>${boardHTML()}<p class="say center">Bet on the closest guess without going over <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Reveal the answer</button>`;
  if (v.phase === 'reveal') h += `<div class="cq small">${esc(v.question)}</div><h2 class="win center">${fmt(v.result.answer)}</h2>${v.slots.length ? boardHTML() : ''}<div class="shres">${v.result.list.filter(x => x.pts).map(x => `<span class="win">${esc(x.name)} +${x.pts}</span>`).join('') || '<span class="muted">Nobody scored!</span>'}</div><button class="btn" data-host="next">Next question</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">${v.score} points</p>`;
  if (v.phase === 'answer') h += v.guessed ? '<h2>Guess locked in!</h2><p class="say">Waiting for the others…</p>' : `<p class="tq small">${esc(v.question)}</p><form id="ef"><input id="en" type="number" inputmode="numeric" step="1" placeholder="Your guess" autocomplete="off"><button class="btn" type="submit">Lock in</button></form>`;
  if (v.phase === 'bet') h += `<p class="tq small">${esc(v.question)}</p><p class="muted">Your guess: <b>${fmt(v.mine)}</b>. Bet on the closest without going over:</p><div class="opts">${v.slots.map(x => `<button class="opt ${v.bet === x.id ? 'on' : ''}" data-b="${esc(x.id)}"><b>${x.id === 'low' ? 'All too high' : fmt(x.n)}</b> <small class="muted">pays ${x.odds}</small></button>`).join('')}</div>`;
  if (v.phase === 'reveal') h += `<h2 class="${v.pts ? 'win' : ''}">+${v.pts}</h2><p class="say">The answer was <b>${fmt(v.answer)}</b>.${v.closest ? ' Your guess was the closest!' : ''}</p>`;
  if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  const f = el.querySelector('#ef');
  if (f) f.onsubmit = e => { e.preventDefault(); const n = f.querySelector('#en').value; if (n === '') return; f.querySelector('button').disabled = true; send({ type: 'guess', n: Number(n) }); };
  el.querySelectorAll('[data-b]').forEach(b => (b.onclick = () => send({ type: 'bet', id: b.dataset.b })));
}

// First-game coach lines, one per step.
export function guide(s) {
  return { answer: 'Nobody is expected to know the number. Just type your best guess.', bet: 'All the guesses are lined up from low to high. Bet your chips on the guess you think is closest WITHOUT going over. You can bet on someone else\'s guess.', reveal: 'The closest guess without going over wins. Bets on it pay out; long shots at the edges pay more.' }[s.phase] || '';
}
