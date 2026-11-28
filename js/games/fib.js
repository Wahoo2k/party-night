// Fact or Fib: a statement appears. True or false? Everyone answers at once. Right answers in a row build a streak
// that multiplies the points (x2, then x3), and one wrong answer resets it.
import { esc } from '../ui.js';
import { STATEMENTS } from './fib-bank.js';

export const meta = {
  id: 'fib',
  name: 'Fact or Fib',
  min: 1,
  max: 20,
  blurb: 'True or false? Everyone answers at once. Keep a streak going for double and triple points.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const TIMES = { ask: 14000, settle: 3600, after: 5500 };
export const multOf = streak => Math.min(3, Math.max(1, streak));
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  let deck = (prev?.deck || []).slice();
  const max = opts.short ? 6 : 10;
  if (deck.length < max) deck = shuffle(STATEMENTS.map((_, i) => i), rnd);
  const s = {
    game: 'fib', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])), streak: Object.fromEntries(players.map(p => [p.pid, 0])),
    deck, max, n: 0, q: null, picks: {}, result: null, settled: false, settleAt: 0, phase: 'ask', deadline: 0,
  };
  ask(s, Date.now());
  return s;
}
function ask(s, now) {
  s.n++; s.q = s.deck.shift(); s.picks = {}; s.result = null; s.settled = false;
  s.phase = 'ask'; s.round++; s.deadline = now + TIMES.ask;
}
function reveal(s, now) {
  const truth = STATEMENTS[s.q][1], before = { ...s.scores }, was = { ...s.streak }, got = {};
  s.players.forEach(({ pid }) => {
    if (s.picks[pid] === truth) { s.streak[pid]++; got[pid] = 100 * multOf(s.streak[pid]); s.scores[pid] += got[pid]; } else { s.streak[pid] = 0; got[pid] = 0; }
  });
  s.result = { before, was, got, picks: { ...s.picks } };
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'ask' || a.type !== 'pick' || typeof a.v !== 'boolean' || !s.players.some(p => p.pid === pid) || s.picks[pid] !== undefined) return s;
  s.picks[pid] = a.v;
  if (s.players.every(p => s.picks[p.pid] !== undefined)) reveal(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'ask') reveal(s, now);
  else if (s.phase === 'reveal') { if (s.n >= s.max) { s.phase = 'over'; s.round++; s.deadline = 0; } else ask(s, now); }
  return s;
}
export function tick(s, now = Date.now()) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'ask' && s.n === 1) return 'Welcome to Fact or Fib! True or false? Keep getting them right to build a streak.';
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'ask') return s.n === 1 ? { sound: 'fanfare', wait: 1500, title: 'Fact or Fib', sub: 'True or false?' } : s.n === s.max ? { sound: 'sting-show', wait: 1200, title: 'Last One', sub: 'Streaks still count' } : { sound: 'vote', wait: 300 };
  if (s.phase === 'reveal') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'ask' || v.pick !== null) return null;
  return { type: 'pick', v: rnd() < 0.68 ? v.hint : !v.hint };
}

export function tvView(s, now = Date.now()) {
  const held = s.phase === 'reveal' && !s.settled;
  const sc = held ? s.result.before : s.scores, st = held ? s.result.was : s.streak;
  const v = { phase: s.phase, n: s.n, max: s.max, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: s.players.map(p => ({ pid: p.pid, name: p.name, score: sc[p.pid] })).sort((a, b) => b.score - a.score) };
  if (s.phase !== 'over') { v.text = STATEMENTS[s.q][0]; v.players = s.players.map(p => ({ name: p.name, done: s.picks[p.pid] !== undefined, streak: st[p.pid] })); }
  if (s.phase === 'reveal') {
    const r = s.result; v.truth = STATEMENTS[s.q][1]; v.note = STATEMENTS[s.q][2]; v.settled = !!s.settled;
    const side = val => s.players.filter(p => r.picks[p.pid] === val).map(p => ({ name: p.name, got: r.got[p.pid], streak: s.streak[p.pid] }));
    v.yes = side(true); v.no = side(false); v.none = s.players.filter(p => r.picks[p.pid] === undefined).map(p => p.name);
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, n: s.n, max: s.max, score: s.scores[pid], streak: s.streak[pid] };
  if (s.phase === 'ask') { v.text = STATEMENTS[s.q][0]; v.pick = s.picks[pid] ?? null; v.worth = 100 * multOf(s.streak[pid] + 1); if (String(pid).startsWith('bot-')) v.hint = STATEMENTS[s.q][1]; }
  if (s.phase === 'reveal') {
    v.settled = !!s.settled; v.pick = s.result.picks[pid] ?? null;
    if (!s.settled) { v.score = s.result.before[pid]; v.streak = s.result.was[pid]; } else { v.truth = STATEMENTS[s.q][1]; v.note = STATEMENTS[s.q][2]; v.got = s.result.got[pid]; v.lost = s.result.was[pid] >= 2 && !v.got; }
  }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- renderers ----------
let revKey = '', revAt = 0;
const fire = n => (n >= 2 ? `<i class="fbfire">🔥×${multOf(n + 1)}</i>` : '');
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  else {
    const rev = v.phase === 'reveal', key = 'q' + v.n;
    if (rev && revKey !== key) {
      revKey = key; revAt = Date.now();
      import('../sfx.js').then(m => { setTimeout(() => m.play('stamp'), 1900); const right = v.truth ? v.yes : v.no; setTimeout(() => m.play(right.length ? (right.some(p => p.streak >= 3) ? 'cheer' : 'points') : 'groan'), 2500); }).catch(() => {});
    }
    const el0 = rev ? Date.now() - revAt : 0;   // a redraw part-way through carries on where it was
    const names = (list, right) => list.map((p, i) => `<span class="${right ? 'ok' : 'bad'}" style="animation-delay:${300 + i * 180 - el0}ms">${esc(p.name)}${right && p.streak >= 2 ? ` <i>🔥${p.streak}</i>` : ''}${right ? `<b style="animation-delay:${2500 - el0}ms">+${p.got}</b>` : ''}</span>`).join('');
    const tile = val => `<div class="fbtile ${val ? 'yes' : 'no'} ${rev ? (v.truth === val ? 'right' : 'wrong') : ''}" style="--at:${1900 - el0}ms"><h3>${val ? 'TRUE' : 'FALSE'}</h3>${rev ? `<div class="fbnames">${names(val ? v.yes : v.no, v.truth === val)}</div>` : ''}</div>`;
    h = `<p class="cat">Statement ${v.n} of ${v.max} ${!rev ? `<span class="clock small ${v.left <= 5 ? 'hurry' : ''}">${v.left}</span>` : ''}</p><div class="fbq">${esc(v.text)}</div>
      <div class="fbtiles ${rev ? 'rev' : ''}">${tile(true)}${tile(false)}</div>
      ${rev ? `<p class="fbnote" style="animation-delay:${2300 - el0}ms"><b>${v.truth ? 'Fact.' : 'Fib!'}</b> ${esc(v.note)}</p>` : `<div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}${fire(p.streak)}</div>`).join('')}</div>`}
      <button class="btn ghost" data-host="next">${rev ? (v.n >= v.max ? 'Finish' : 'Next') : 'Show the answer'}</button>`;
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel fb">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won! 🏆' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  const streak = v.streak >= 1 ? `<p class="muted">🔥 ${v.streak} in a row</p>` : '';
  if (v.phase === 'ask') {
    el.innerHTML = `${streak}<p class="tq small">${esc(v.text)}</p>${v.pick === null ? `<div class="fbbtns"><button class="btn fbyes" data-v="1">TRUE</button><button class="btn fbno" data-v="0">FALSE</button></div><p class="muted">Worth ${v.worth}. One tap, no changing.</p>` : `<h2>You said ${v.pick ? 'TRUE' : 'FALSE'}</h2><p class="say">Watch the TV.</p>`}`;
    el.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => send({ type: 'pick', v: b.dataset.v === '1' })));
    return;
  }
  if (!v.settled) { el.innerHTML = `${streak}<h2>Watch the TV…</h2><p class="say">${v.pick === null ? 'You did not answer in time.' : `You said ${v.pick ? 'TRUE' : 'FALSE'}.`}</p>`; return; }
  el.innerHTML = `${streak}<h2 class="${v.got ? 'win' : 'lose'}">${v.got ? `Right! +${v.got}` : v.lost ? 'Wrong. Streak gone!' : v.pick === null ? 'Too slow' : 'Wrong'}</h2><p class="say"><b>${v.truth ? 'Fact.' : 'Fib!'}</b> ${esc(v.note)}</p><p class="muted">${v.score.toLocaleString()} points</p>`;
}
