// Name That Sound: the TV plays an everyday sound. Everyone picks what it is from four choices on their phone.
// The faster you get it, the more it is worth. Only sounds that have been recorded are used.
import { esc } from '../ui.js';
import { rec } from '../recorded.js';
import { SOUNDS } from './sound-bank.js';

export const meta = {
  id: 'sound',
  name: 'Name That Sound',
  min: 1,
  max: 20,
  kids: true,
  blurb: 'Listen. What made that noise? Fastest ears win.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const TIMES = { listen: 16000, settle: 3200, after: 5000 }, REPLAY_MS = 5500;
export const pointsAt = ms => 100 + Math.round(200 * Math.max(0, 1 - ms / TIMES.listen) / 10) * 10;
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const L = ['A', 'B', 'C', 'D'];
// The sounds with a recording on file. (With none on file, as in tests, the whole list is used and plays silently.)
export const available = () => { const ok = SOUNDS.map((_, i) => i).filter(i => rec.sfx.has(SOUNDS[i][0])); return ok.length >= 5 ? ok : SOUNDS.map((_, i) => i); };

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const pool = available(), max = Math.min(opts.short ? 5 : 8, pool.length);
  let deck = (prev?.deck || []).filter(i => pool.includes(i)); if (deck.length < max) deck = shuffle(pool.slice(), rnd);
  const s = {
    game: 'sound', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    deck, max, n: 0, q: null, picks: {}, startAt: 0, result: null, settled: false, settleAt: 0, phase: 'listen', deadline: 0,
  };
  ask(s, Date.now() + 3000, rnd);
  return s;
}
function ask(s, now, rnd) {
  s.n++; const i = s.deck.shift(), [file, right, wrong] = SOUNDS[i], options = shuffle([right, ...wrong], rnd);
  s.q = { file, options, answer: options.indexOf(right) }; s.picks = {}; s.result = null; s.settled = false;
  s.phase = 'listen'; s.round++; s.startAt = now; s.deadline = now + TIMES.listen;
}
function reveal(s, now) {
  const before = { ...s.scores }, got = {};
  s.players.forEach(({ pid }) => { const p = s.picks[pid]; got[pid] = p && p.i === s.q.answer ? pointsAt(p.ms) : 0; s.scores[pid] += got[pid]; });
  s.result = { before, got };
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'listen' || a.type !== 'pick' || !s.players.some(p => p.pid === pid) || s.picks[pid]) return s;
  const i = Number(a.i); if (!Number.isInteger(i) || i < 0 || i > 3) return s;
  s.picks[pid] = { i, ms: Math.max(0, now - s.startAt) };
  if (s.players.every(p => s.picks[p.pid])) reveal(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'listen') reveal(s, now);
  else if (s.phase === 'reveal') { if (s.n >= s.max) { s.phase = 'over'; s.round++; s.deadline = 0; } else ask(s, now, rnd); }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}
const ranking = (s, sc = s.scores) => s.players.map(p => ({ pid: p.pid, name: p.name, score: sc[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'listen' && s.n === 1) return 'Welcome to Name That Sound! Listen closely, then pick what made the noise.';
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'listen') return s.n === 1 ? { sound: 'fanfare', wait: 2600, title: 'Name That Sound', sub: 'Shh. Listen.' } : null;
  if (s.phase === 'reveal') return s.settled ? null : { sound: 'stamp', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) { return v.phase === 'listen' && v.pick === null && rnd() < 0.4 ? { type: 'pick', i: rnd() < 0.65 ? v.hint : Math.floor(rnd() * 4) } : null; }

export function tvView(s, now = Date.now()) {
  const held = s.phase === 'reveal' && !s.settled;
  const v = { phase: s.phase, n: s.n, max: s.max, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s, held ? s.result.before : s.scores) };
  if (s.phase === 'over') return v;
  v.file = s.q.file; v.options = s.q.options;
  if (s.phase === 'listen') { v.startAt = s.startAt; v.worth = pointsAt(Math.max(0, now - s.startAt)); v.players = s.players.map(p => ({ name: p.name, done: !!s.picks[p.pid] })); }
  if (s.phase === 'reveal') { v.settled = !!s.settled; v.answer = s.q.answer; v.by = s.q.options.map((_, i) => s.players.filter(p => s.picks[p.pid]?.i === i).map(p => ({ name: p.name, got: s.result.got[p.pid] }))); }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const held = s.phase === 'reveal' && !s.settled;
  const v = { phase: s.phase, n: s.n, max: s.max, score: held ? s.result.before[pid] : s.scores[pid] };
  if (s.phase === 'listen') { v.options = s.q.options; v.pick = s.picks[pid] ? s.picks[pid].i : null; if (String(pid).startsWith('bot-')) v.hint = s.q.answer; }
  if (s.phase === 'reveal') { v.settled = !!s.settled; v.options = s.q.options; v.pick = s.picks[pid] ? s.picks[pid].i : null; if (s.settled) { v.answer = s.q.answer; v.got = s.result.got[pid]; } }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// The sound plays when the question appears and again every few seconds while people are still deciding.
let heard = { key: '', timers: [] };
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  const key = v.phase === 'listen' ? 'q' + v.n : '';
  if (heard.key !== key) {
    heard.timers.forEach(clearTimeout); heard = { key, timers: [] };
    if (key) import('../sfx.js').then(m => { const start = Math.max(0, v.startAt - Date.now()); for (let t = start; t < TIMES.listen - 2500; t += REPLAY_MS) heard.timers.push(setTimeout(() => { if (heard.key === key) m.play(v.file); }, t)); }).catch(() => {});
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  else {
    const rev = v.phase === 'reveal';
    h = `<p class="cat">Sound ${v.n} of ${v.max} ${!rev ? `<span class="clock small ${v.left <= 5 ? 'hurry' : ''}">${v.left}</span>` : ''}</p>
      <div class="nsear ${rev ? 'done' : ''}"><i>${rev ? '🔊' : '👂'}</i><b>${rev ? esc(v.options[v.answer]) + '!' : 'What made that noise?'}</b>${!rev ? `<span>Worth ${v.worth} right now. It plays again in a moment.</span>` : ''}</div>
      <div class="loopts ${rev ? 'rev' : ''}">${v.options.map((o, i) => `<div class="loopt ${rev && i === v.answer ? 'right' : ''} ${rev && i !== v.answer ? 'dim' : ''}" style="animation-delay:600ms"><b>${L[i]}</b><span>${esc(o)}</span>${rev ? `<small>${v.by[i].map(p => esc(p.name) + (p.got ? ' +' + p.got : '')).join(', ')}</small>` : ''}</div>`).join('')}</div>
      ${rev ? '' : `<div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div>`}
      <button class="btn ghost" data-host="next">${rev ? (v.n >= v.max ? 'Finish' : 'Next sound') : 'Show the answer'}</button>`;
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel ns">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won! 🏆' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  if (v.phase === 'listen') {
    el.innerHTML = `<h2>👂 What made that noise?</h2><p class="muted">Listen to the TV. Faster is worth more.</p><div class="opts">${v.options.map((o, i) => `<button class="opt ${v.pick === i ? 'on' : ''}" data-i="${i}" ${v.pick !== null ? 'disabled' : ''}><b>${L[i]}</b> ${esc(o)}</button>`).join('')}</div>${v.pick !== null ? '<p class="say center">Locked in.</p>' : ''}`;
    el.querySelectorAll('[data-i]').forEach(b => (b.onclick = () => send({ type: 'pick', i: +b.dataset.i })));
    return;
  }
  if (!v.settled) { el.innerHTML = '<h2>Watch the TV…</h2>'; return; }
  el.innerHTML = `<h2 class="${v.got ? 'win' : 'lose'}">${v.got ? `Good ears! +${v.got}` : v.pick === null ? 'Too slow' : 'Not that'}</h2><p class="say">It was: ${esc(v.options[v.answer])}</p><p class="muted">${v.score.toLocaleString()} points</p>`;
}
