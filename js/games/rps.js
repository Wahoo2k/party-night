// Rock Paper Showdown: everyone throws at once. You score for every player your throw beats, and a throw that beats
// nobody scores nothing, so the trick is guessing what the whole room is about to do. The last round pays double.
import { esc } from '../ui.js';

export const meta = {
  id: 'rps',
  name: 'Rock Paper Showdown',
  min: 2,
  max: 20,
  kids: true,
  blurb: 'Everyone throws at once. Score for every player you beat. Guess what the room will do.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const THROWS = { rock: ['✊', 'Rock', 'scissors'], paper: ['✋', 'Paper', 'rock'], scissors: ['✌️', 'Scissors', 'paper'] };
export const EACH = 100;
export const TIMES = { throw: 10000, settle: 3000, after: 5000 };

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  return {
    game: 'rps', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    max: opts.short ? 5 : 8, n: 1, picks: {}, result: null, settled: false, settleAt: 0, history: [],
    phase: 'throw', deadline: Date.now() + TIMES.throw + 3000,
  };
}
const last = s => s.n === s.max;
function result(s, now) {
  const before = { ...s.scores }, count = { rock: 0, paper: 0, scissors: 0 }, got = {};
  s.players.forEach(p => { if (s.picks[p.pid]) count[s.picks[p.pid]]++; });
  s.players.forEach(({ pid }) => { const t = s.picks[pid]; got[pid] = t ? count[THROWS[t][2]] * EACH * (last(s) ? 2 : 1) : 0; s.scores[pid] += got[pid]; });
  s.result = { before, count, got, picks: { ...s.picks } }; s.history.push(count);
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'throw' || a.type !== 'throw' || !THROWS[a.t] || !s.players.some(p => p.pid === pid) || s.picks[pid]) return s;
  s.picks[pid] = a.t;
  if (s.players.every(p => s.picks[p.pid])) result(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'throw') result(s, now);
  else if (s.phase === 'result') { if (last(s)) { s.phase = 'over'; s.round++; s.deadline = 0; } else { s.n++; s.picks = {}; s.result = null; s.settled = false; s.phase = 'throw'; s.round++; s.deadline = now + TIMES.throw; } }
  return s;
}
export function tick(s, now = Date.now()) {
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s;
}
const ranking = (s, sc = s.scores) => s.players.map(p => ({ pid: p.pid, name: p.name, score: sc[p.pid] })).sort((a, b) => b.score - a.score);
const say = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every round

export function narration(s) {
  if (s.phase === 'throw') return s.n === 1 ? 'Welcome to Rock Paper Showdown! Everyone throws at once. You score for every player you beat.' : last(s) ? 'Final throw. Double points!' : say(['Throw!', 'Again!', 'Rock, paper, scissors!', 'Ready? Throw!'], s.n);
  if (s.phase === 'result') {
    const c = s.result.count, kinds = Object.keys(THROWS).filter(t => c[t] > 0);
    if (kinds.length <= 1) return 'Everybody threw the same. No points!';
    if (kinds.length === 3) return say(['A bit of everything. Points all round!', 'Rock, paper and scissors. Everybody beats somebody.'], s.n);
    const win = kinds.find(t => kinds.includes(THROWS[t][2]));
    return { rock: 'Rock crushes scissors!', paper: 'Paper covers rock!', scissors: 'Scissors cut paper!' }[win];
  }
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'throw') return s.n === 1 ? { sound: 'fanfare', wait: 1500, title: 'Rock Paper Showdown', sub: 'Everyone throws at once' } : last(s) ? { sound: 'sting-kids', wait: 1100, title: 'Last Throw', sub: 'Double points' } : { sound: 'join', wait: 300 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'drumroll', wait: TIMES.settle - 400 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) { return v.phase === 'throw' && !v.pick && rnd() < 0.6 ? { type: 'throw', t: Object.keys(THROWS)[Math.floor(rnd() * 3)] } : null; }

export function tvView(s, now = Date.now()) {
  const held = s.phase === 'result' && !s.settled;
  const v = { phase: s.phase, n: s.n, max: s.max, double: last(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s, held ? s.result.before : s.scores) };
  if (s.phase === 'throw') { v.players = s.players.map(p => ({ name: p.name, done: !!s.picks[p.pid] })); v.lastCount = s.history[s.history.length - 1] || null; }
  if (s.phase === 'result') {
    const r = s.result; v.settled = !!s.settled; v.count = r.count;
    v.cols = Object.keys(THROWS).map(t => ({ t, beats: THROWS[t][2], each: r.count[THROWS[t][2]] * EACH * (last(s) ? 2 : 1), names: s.players.filter(p => r.picks[p.pid] === t).map(p => p.name) }));
    v.none = s.players.filter(p => !r.picks[p.pid]).map(p => p.name);
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const held = s.phase === 'result' && !s.settled;
  const v = { phase: s.phase, n: s.n, max: s.max, double: last(s), score: held ? s.result.before[pid] : s.scores[pid] };
  if (s.phase === 'throw') v.pick = s.picks[pid] || null;
  if (s.phase === 'result') { v.settled = !!s.settled; v.pick = s.result.picks[pid] || null; if (s.settled) { v.got = s.result.got[pid]; v.beat = v.pick ? s.result.count[THROWS[v.pick][2]] : 0; v.lostTo = v.pick ? s.result.count[Object.keys(THROWS).find(t => THROWS[t][2] === v.pick)] : 0; } }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

let revKey = '', revAt = 0;
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'throw') h = `<p class="cat">Throw ${v.n} of ${v.max}${v.double ? ' · double points' : ''} <span class="clock small ${v.left <= 3 ? 'hurry' : ''}">${v.left}</span></p>
    <div class="rpbig"><i>✊</i><i>✋</i><i>✌️</i></div><p class="tsrule"><b>Pick your throw on your phone.</b><span>${EACH * (v.double ? 2 : 1)} for every player you beat.${v.lastCount ? ` Last time: ✊ ${v.lastCount.rock} · ✋ ${v.lastCount.paper} · ✌️ ${v.lastCount.scissors}` : ''}</span></p>
    <div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">Throw now</button>`;
  if (v.phase === 'result') {
    const key = 'r' + v.n; if (revKey !== key) { revKey = key; revAt = Date.now(); import('../sfx.js').then(m => { setTimeout(() => m.play('splat'), 300); setTimeout(() => m.play(v.cols.some(c => c.each && c.names.length) ? 'cheer' : 'laugh'), 2100); }).catch(() => {}); }
    const el0 = Date.now() - revAt;
    h = `<p class="cat">Throw ${v.n} of ${v.max}${v.double ? ' · double points' : ''}</p><div class="rpcols">${v.cols.map((c, i) => `<div class="rpcol ${c.each && c.names.length ? 'win' : ''}" style="animation-delay:${300 + i * 450 - el0}ms"><i>${THROWS[c.t][0]}</i><h3>${THROWS[c.t][1]} <small>× ${c.names.length}</small></h3><div class="rpnames">${c.names.map(esc).map(n => `<span>${n}</span>`).join('') || '<span class="none">nobody</span>'}</div>
      <p class="rppay" style="animation-delay:${2100 - el0}ms">${c.names.length ? (c.each ? `beats ${v.count[c.beats]} ${THROWS[c.beats][1].toLowerCase()} · <b>+${c.each}</b> each` : `no ${THROWS[c.beats][1].toLowerCase()} to beat`) : ''}</p></div>`).join('')}</div>
      ${v.none.length ? `<p class="shearly">No throw: ${v.none.map(esc).join(', ')}</p>` : ''}<button class="btn" data-host="next">${v.n < v.max ? 'Next throw' : 'Finish'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel rp">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won! 🏆' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  if (v.phase === 'throw') {
    el.innerHTML = v.pick ? `<h2>${THROWS[v.pick][0]} ${THROWS[v.pick][1]}!</h2><p class="say">Locked in. Watch the TV.</p>` : `<p class="muted">Throw ${v.n} of ${v.max}${v.double ? ' · double points' : ''}</p><h2>Pick your throw</h2><div class="rpbtns">${Object.keys(THROWS).map(t => `<button class="btn" data-t="${t}"><i>${THROWS[t][0]}</i>${THROWS[t][1]}</button>`).join('')}</div><p class="muted">You score for every player you beat.</p>`;
    el.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => send({ type: 'throw', t: b.dataset.t })));
    return;
  }
  if (!v.settled) { el.innerHTML = `<h2>${v.pick ? THROWS[v.pick][0] : '⏰'} Watch the TV…</h2>`; return; }
  el.innerHTML = `<h2 class="${v.got ? 'win' : 'lose'}">${!v.pick ? 'Too slow!' : v.got ? `You beat ${v.beat}! +${v.got}` : 'You beat nobody'}</h2><p class="say">${v.pick ? `${THROWS[v.pick][0]} ${v.lostTo ? `${v.lostTo} beat you.` : 'Nobody beat you.'}` : 'No throw, no points.'}</p><p class="muted">${v.score.toLocaleString()} points</p>`;
}
