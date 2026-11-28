// Inner Clock: the TV names a time ("stop at 9 seconds"). A clock starts, then vanishes after three seconds. Count in
// your head and tap STOP as close to the target as you can. Some rounds hide the clock from the start, and some
// show a decoy clock that runs at the wrong speed. Stop times are measured on the TV, so every phone is judged alike.
import { esc } from '../ui.js';

export const meta = {
  id: 'clock',
  name: 'Inner Clock',
  min: 1,
  max: 20,
  blurb: 'Stop a hidden clock at exactly the right moment. Count in your head. Don\'t trust the decoy.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const PAY = [300, 200, 100], TAKING_PART = 50, SPOT_ON = 200, SPOT_MS = 100, SHOWN_MS = 3000;
export const TIMES = { ready: 5000, settle: 2600, after: 6500 };
export const TWISTS = {
  plain: { name: 'Count It Out', how: 'The clock vanishes after three seconds. Keep counting in your head.' },
  blind: { name: 'Blind', how: 'No clock at all this time. Start counting on GO.' },
  decoy: { name: 'Decoy Clock', how: 'The clock stays on screen, but it is lying. Trust your own count.' },
};
// [twist, shortest target, longest target] for each round, in seconds.
const PLAN = [['plain', 5, 8], ['plain', 9, 13], ['decoy', 8, 12], ['blind', 6, 10], ['decoy', 12, 17], ['plain', 15, 20]];

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const plan = opts.short ? [PLAN[0], PLAN[2], PLAN[3], PLAN[5]] : PLAN;
  const s = {
    game: 'clock', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    rounds: plan.map(([twist, lo, hi]) => ({ twist, target: lo + Math.floor(rnd() * (hi - lo + 1)), speed: twist === 'decoy' ? (rnd() < 0.5 ? 0.7 : 1.4) : 1 })),
    i: 0, stops: {}, goAt: 0, result: null, settled: false, settleAt: 0, phase: 'ready', deadline: Date.now() + TIMES.ready,
  };
  return s;
}
const cur = s => s.rounds[s.i];
const last = s => s.i === s.rounds.length - 1;
function toReady(s, now) { s.stops = {}; s.result = null; s.settled = false; s.phase = 'ready'; s.round++; s.deadline = now + TIMES.ready; }
function toRun(s, now) { s.phase = 'run'; s.round++; s.goAt = now; s.deadline = now + cur(s).target * 1000 * 2 + 4000; }
// Who came where. off = how far from the target, in ms (negative is early). The last round pays double.
export function standings(s) {
  const target = cur(s).target * 1000, k = last(s) ? 2 : 1;
  const rows = s.players.map(p => ({ pid: p.pid, ms: s.stops[p.pid] ?? null, off: s.stops[p.pid] === undefined ? null : s.stops[p.pid] - target })).sort((a, b) => (a.off === null ? 1e12 : Math.abs(a.off)) - (b.off === null ? 1e12 : Math.abs(b.off)));
  let rank = -1, prev = null;
  rows.forEach((r, i) => {
    if (r.off === null) { r.rank = null; r.pts = 0; r.spot = false; return; }
    const d = Math.abs(r.off); if (d !== prev) { rank = i; prev = d; }
    r.rank = rank; r.spot = d <= SPOT_MS; r.pts = k * ((PAY[rank] ?? TAKING_PART) + (r.spot ? SPOT_ON : 0));
  });
  return rows;
}
function result(s, now) {
  const before = { ...s.scores }, rows = standings(s);
  rows.forEach(r => (s.scores[r.pid] += r.pts));
  s.result = { rows, before };
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'run' || a.type !== 'stop' || !s.players.some(p => p.pid === pid) || s.stops[pid] !== undefined) return s;
  s.stops[pid] = Math.max(0, now - s.goAt);
  if (s.players.every(p => s.stops[p.pid] !== undefined)) result(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'ready') toRun(s, now);
  else if (s.phase === 'run') result(s, now);
  else if (s.phase === 'result') { if (last(s)) { s.phase = 'over'; s.round++; s.deadline = 0; } else { s.i++; toReady(s, now); } }
  return s;
}
export function tick(s, now = Date.now()) {
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s;
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'ready' && s.i === 0) return 'Welcome to Inner Clock! Stop the clock at exactly the right moment. It will not stay on screen for long.';
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'ready') return s.i === 0 ? { sound: 'fanfare', wait: 1500, title: 'Inner Clock', sub: 'Count in your head' } : { sound: 'join', wait: 900, title: last(s) ? 'Final Round' : TWISTS[cur(s).twist].name, sub: last(s) ? 'Double points' : `Round ${s.i + 1} of ${s.rounds.length}` };
  if (s.phase === 'run') return { sound: 'whoosh', wait: 0 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}
// Bots stop somewhere near the target. They are sent how long the clock has been running, which real phones are not.
export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'run' || v.stopped || v.since === undefined) return null;
  return v.since >= v.target * 1000 - 900 && rnd() < 0.45 ? { type: 'stop', _now: true } : null;
}

export function tvView(s, now = Date.now()) {
  const r = cur(s);
  const v = { phase: s.phase, n: s.i + 1, of: s.rounds.length, twist: r.twist, target: r.target, double: last(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  if (s.phase === 'run') { v.goAt = s.goAt; v.speed = r.speed; v.players = s.players.map(p => ({ name: p.name, done: s.stops[p.pid] !== undefined })); }
  if (s.phase === 'result') {
    v.settled = !!s.settled;
    v.rows = s.result.rows.map(x => ({ name: nameOf(s, x.pid), ms: x.ms, off: x.off, rank: x.rank, pts: x.pts, spot: x.spot }));
    if (!s.settled) v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: s.result.before[p.pid] })).sort((a, b) => b.score - a.score);
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const r = cur(s), v = { phase: s.phase, n: s.i + 1, of: s.rounds.length, twist: r.twist, target: r.target, score: s.scores[pid] };
  if (s.phase === 'run') { v.stopped = s.stops[pid] !== undefined; if (String(pid).startsWith('bot-')) v.since = Date.now() - s.goAt; }
  if (s.phase === 'result') { v.settled = !!s.settled; if (s.settled) { const x = s.result.rows.find(y => y.pid === pid); Object.assign(v, { ms: x.ms, off: x.off, rank: x.rank, pts: x.pts, spot: x.spot }); } else v.score = s.result.before[pid]; }
  if (s.phase === 'over') { const k = ranking(s); v.place = k.findIndex(x => x.pid === pid) + 1; v.winner = k[0].name; }
  return v;
}

// ---------- renderers ----------
const secs = ms => (ms / 1000).toFixed(2);
const offText = off => (off === null ? 'never stopped' : Math.abs(off) <= SPOT_MS ? 'spot on!' : `${secs(Math.abs(off))} ${off < 0 ? 'too early' : 'too late'}`);
let raf = 0, resKey = '';
// The running clock is drawn many times a second, between the game's own redraws.
function face(goAt, twist, speed) {
  const real = Date.now() - goAt, hide = twist === 'blind' || (twist === 'plain' && real > SHOWN_MS), lie = twist === 'decoy' && real > SHOWN_MS;
  return { hide, lie, text: hide ? '??.??' : secs(lie ? SHOWN_MS + (real - SHOWN_MS) * speed : real).padStart(5, '0') };
}
function runClock() {
  cancelAnimationFrame(raf);
  const step = () => {
    const c = document.querySelector('.ckface[data-go]'); if (!c) return;
    const f = face(Number(c.dataset.go), c.dataset.twist, Number(c.dataset.speed));
    c.textContent = f.text; c.classList.toggle('hid', f.hide); c.classList.toggle('lie', f.lie);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  const tw = TWISTS[v.twist], head = `<p class="cat">Round ${v.n} of ${v.of} · ${tw.name}${v.double ? ' · double points' : ''}</p><h2 class="cktarget">Stop the clock at <b>${v.target} seconds</b></h2>`;
  let h = '';
  if (v.phase === 'ready') h = `${head}<div class="ckface ${v.left <= 3 ? 'count' : 'hid'}">${v.left <= 3 ? v.left || 'GO' : 'Ready?'}</div><p class="tsrule"><b>${tw.how}</b><span>Thumb over STOP on your phone.</span></p>`;
  const f = v.phase === 'run' ? face(v.goAt, v.twist, v.speed) : null;   // drawn right from the first frame, so a redraw never flashes zero
  if (v.phase === 'run') h = `${head}<div class="ckface ${f.hide ? 'hid' : ''} ${f.lie ? 'lie' : ''}" data-go="${v.goAt}" data-twist="${v.twist}" data-speed="${v.speed}">${f.text}</div><div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">End the round</button>`;
  if (v.phase === 'result') {
    const key = 'r' + v.n, n = v.rows.length;
    if (resKey !== key) { resKey = key; import('../sfx.js').then(m => { v.rows.forEach((r, i) => setTimeout(() => m.play(r.spot ? 'win' : i === 0 && r.pts ? 'points' : r.pts ? 'pop' : 'groan'), 500 + (n - 1 - i) * 450)); if (v.rows[0]?.pts) setTimeout(() => m.play('cheer'), 700 + n * 450); }).catch(() => {}); }
    // the list fills from the bottom, so the closest lands last
    h = `${head}<div class="shrows">${v.rows.map((r, i) => `<div class="pdrow ${i === 0 && r.pts ? 'best' : ''} ${r.pts ? '' : 'nil'}" style="animation-delay:${500 + (n - 1 - i) * 450}ms"><b>${r.rank !== null ? r.rank + 1 + '. ' : ''}${esc(r.name)}${r.ms !== null ? ` · ${secs(r.ms)}s` : ''}</b><span>${offText(r.off)}</span><em>${r.pts ? '+' + r.pts : ''}</em></div>`).join('')}</div><button class="btn" data-host="next">${v.n < v.of ? 'Next round' : 'Finish'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel ck">${h}</div>${scores}</div>`;
  if (v.phase === 'run') runClock();
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won! 🏆' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  if (v.phase === 'result') { el.innerHTML = !v.settled ? '<h2>Watch the TV…</h2>' : `<h2 class="${v.rank === 0 || v.spot ? 'win' : ''}">${v.ms === null ? 'You never stopped it' : `${secs(v.ms)}s · ${offText(v.off)}`}</h2><p class="say">${v.pts ? `${['Closest', '2nd closest', '3rd closest'][v.rank] || v.rank + 1 + 'th closest'} · +${v.pts}` : 'No points this round.'}</p><p class="muted">${v.score.toLocaleString()} points</p>`; return; }
  const head = `<p class="tq small">Stop the clock at <b>${v.target} seconds</b></p>`;
  if (v.phase === 'ready') { el.innerHTML = `${head}<button class="btn shbtn wait" disabled>STOP</button><p class="muted">Don't tap yet. ${esc(TWISTS[v.twist].how)}</p>`; return; }
  if (v.stopped) { el.innerHTML = `${head}<h2>Stopped ✋</h2><p class="say">Watch the TV to see how close you were.</p>`; return; }
  el.innerHTML = `${head}<button class="btn shbtn ckstop" id="ckstop">STOP</button><p class="muted">Count in your head. One tap only.</p>`;
  el.querySelector('#ckstop').onpointerdown = e => { e.preventDefault(); e.currentTarget.disabled = true; send({ type: 'stop' }); };
}
