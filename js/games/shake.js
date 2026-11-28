// Shake It: mini-games played by moving the phone itself. Shake Race (shake hardest), Statue (move least) and
// Quick Draw (flick first when the TV says GO, but not before). Phones measure their own movement and send small
// totals a couple of times a second; a phone that cannot feel movement gets a tap button where that is fair.
import { esc } from '../ui.js';

export const meta = {
  id: 'shake',
  name: 'Shake It',
  min: 2,
  max: 10,
  blurb: 'Your phone is the controller. Shake it, hold it dead still, flick it on GO.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const EVENTS = {
  shake: { name: 'Shake Race', icon: '📳', how: 'Shake your phone as hard as you can. Hold on tight!', go: 'SHAKE!', ready: 6000, time: 10000 },
  still: { name: 'Statue', icon: '🗿', how: 'Lay your phone flat on your open palm, arm out. Whoever moves least wins.', go: 'DON\'T MOVE', ready: 8000, time: 10000 },
  draw: { name: 'Quick Draw', icon: '🤠', how: 'Hold still. When the TV says GO, flick your phone. Flick early and you are out.', go: 'GO!', ready: 5000, time: 4000 },
};
export const PAY = [300, 200, 100], TAKING_PART = 50;
export const TIMES = { setup: 30000, settle: 2600, after: 6500 };
const MAX_PER_SEC = 45;        // the most movement a phone can claim per second, so nobody can send a silly number
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const all = ['shake', 'still', 'draw', 'shake'];
  return {
    game: 'shake', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    events: opts.short ? ['shake', 'draw'] : all, i: 0,
    ok: {}, amt: {}, msgs: {}, lastAt: {}, early: {}, hit: {}, goAt: 0, result: null, settled: false, settleAt: 0,
    phase: 'setup', deadline: Date.now() + TIMES.setup,
  };
}
const kind = s => s.events[s.i];
function toReady(s, now, rnd) {
  s.amt = {}; s.msgs = {}; s.lastAt = {}; s.early = {}; s.hit = {}; s.result = null; s.settled = false;
  // Quick Draw waits a different, secret length of time each go.
  s.phase = 'ready'; s.round++; s.deadline = now + EVENTS[kind(s)].ready + (kind(s) === 'draw' ? Math.floor(rnd() * 4500) : 0);
}
function toGo(s, now) { s.phase = 'go'; s.round++; s.goAt = now; s.deadline = now + EVENTS[kind(s)].time; }

// Who came where. Each row: { pid, value, rank (0 = best), pts, out? }. Ties share a rank.
export function standings(s) {
  const k = kind(s), ids = s.players.map(p => p.pid);
  let rows;
  if (k === 'shake') rows = ids.map(pid => ({ pid, value: Math.round(s.amt[pid] || 0), in: (s.amt[pid] || 0) > 0 })).sort((a, b) => b.value - a.value);
  else if (k === 'still') rows = ids.map(pid => ({ pid, value: (s.msgs[pid] || 0) >= 8 ? Math.round(100 * s.amt[pid] / s.msgs[pid]) / 100 : null, in: (s.msgs[pid] || 0) >= 8 })).sort((a, b) => (a.in ? a.value : 1e9) - (b.in ? b.value : 1e9));
  else rows = ids.map(pid => ({ pid, value: s.early[pid] ? null : s.hit[pid] ?? null, early: !!s.early[pid], in: !s.early[pid] && s.hit[pid] !== undefined })).sort((a, b) => (a.in ? a.value : 1e9) - (b.in ? b.value : 1e9));
  let rank = -1, last = null;
  rows.forEach((r, i) => { if (!r.in) { r.rank = null; r.pts = 0; return; } if (r.value !== last) { rank = i; last = r.value; } r.rank = rank; r.pts = PAY[rank] ?? TAKING_PART; });
  return rows;
}
function result(s, now) {
  const before = { ...s.scores }, rows = standings(s);
  rows.forEach(r => (s.scores[r.pid] += r.pts));
  s.result = { rows, before };
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'setup' && a.type === 'ready') { s.ok[pid] = 1; if (s.players.every(p => s.ok[p.pid])) toReady(s, now, rnd); return s; }
  if (a.type !== 'tap') return s;
  const k = kind(s);
  if (s.phase === 'ready' && k === 'draw' && a.early) s.early[pid] = true;
  else if (s.phase === 'go' && k === 'draw') {
    if (s.early[pid] || s.hit[pid] !== undefined) return s;
    s.hit[pid] = Math.max(0, now - s.goAt);
    if (s.players.every(p => s.early[p.pid] || s.hit[p.pid] !== undefined)) result(s, now);
  } else if (s.phase === 'go') {
    const dt = Math.min(1.5, Math.max(0, (now - (s.lastAt[pid] || s.goAt)) / 1000)), e = Math.min(Math.max(0, Number(a.e) || 0), MAX_PER_SEC * dt);
    s.amt[pid] = (s.amt[pid] || 0) + e; s.msgs[pid] = (s.msgs[pid] || 0) + 1; s.lastAt[pid] = now;
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'setup') toReady(s, now, rnd);
  else if (s.phase === 'ready') toGo(s, now);
  else if (s.phase === 'go') result(s, now);
  else if (s.phase === 'result') { if (s.i + 1 >= s.events.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else { s.i++; toReady(s, now, rnd); } }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
const say = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every round

export function narration(s) {
  if (s.phase === 'setup') return 'Welcome to Shake It! Your phone is the controller. Hold on to it tightly.';
  if (s.phase === 'ready') { const k = kind(s); return k === 'shake' ? say(['Shake race! Shake your phone as hard as you can.', 'Shake race again. Hold on tight!'], s.i) : k === 'draw' ? say(['Quick draw! Hold still. When the TV says GO, flick your phone, and not before.', 'Quick draw again. Steady… wait for it.'], s.i) : say(['Statue! Phone flat on your open palm, arm out. Whoever moves least wins.', 'Statue again. Nobody move.'], s.i); }
  if (s.phase === 'result') { const rows = s.result.rows; return !rows.some(r => r.pts > 0) ? 'Nobody scored. Did anyone pick up their phone?' : say(['And the results!', 'Here is how you did.', 'Shaken, and scored.'], s.i); }
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'setup') return { sound: 'fanfare', wait: 1500, title: 'Shake It', sub: 'Your phone is the controller' };
  if (s.phase === 'ready') return { sound: 'join', wait: 900, title: EVENTS[kind(s)].name, sub: `Event ${s.i + 1} of ${s.events.length}` };
  if (s.phase === 'go') return { sound: kind(s) === 'still' ? 'night' : 'whoosh', wait: 0 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'setup' && !v.ok) return { type: 'ready' };
  if (v.phase === 'ready' && v.kind === 'draw' && !v.early && rnd() < 0.03) return { type: 'tap', early: 1 };
  if (v.phase === 'go' && v.kind === 'shake') return { type: 'tap', e: 6 + rnd() * 22 };
  if (v.phase === 'go' && v.kind === 'still') return { type: 'tap', e: 0.05 + rnd() * 0.6 };
  if (v.phase === 'go' && v.kind === 'draw' && !v.early && !v.hit && rnd() < 0.6) return { type: 'tap' };
  return null;
}

export function tvView(s, now = Date.now()) {
  const k = kind(s), ev = EVENTS[k];
  const v = { phase: s.phase, n: s.i + 1, of: s.events.length, kind: k, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  if (s.phase === 'setup') v.players = s.players.map(p => ({ name: p.name, done: !!s.ok[p.pid] }));
  if (s.phase === 'ready') { v.early = s.players.filter(p => s.early[p.pid]).map(p => p.name); if (k === 'draw') delete v.left; }   // nobody may see when GO is coming
  if (s.phase === 'go') {
    if (k === 'draw') { v.hits = s.players.filter(p => s.hit[p.pid] !== undefined).sort((a, b) => s.hit[a.pid] - s.hit[b.pid]).map(p => p.name); v.early = s.players.filter(p => s.early[p.pid]).map(p => p.name); }
    else {
      const val = pid => (k === 'shake' ? s.amt[pid] || 0 : s.msgs[pid] ? s.amt[pid] / s.msgs[pid] : 0), top = Math.max(k === 'shake' ? 60 : 1.2, ...s.players.map(p => val(p.pid)));
      v.bars = s.players.map(p => ({ name: p.name, pct: Math.round(100 * val(p.pid) / top), on: !!s.msgs[p.pid] }));
    }
  }
  if (s.phase === 'result') {
    v.settled = !!s.settled;
    v.rows = s.result.rows.map(r => ({ name: nameOf(s, r.pid), value: r.value, rank: r.rank, pts: r.pts, early: !!r.early }));
    if (!s.settled) v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: s.result.before[p.pid] })).sort((a, b) => b.score - a.score);
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const k = kind(s), v = { phase: s.phase, n: s.i + 1, of: s.events.length, kind: k, score: s.scores[pid] };
  if (s.phase === 'setup') v.ok = !!s.ok[pid];
  if (s.phase === 'ready' || s.phase === 'go') { v.early = !!s.early[pid]; v.hit = s.hit[pid] !== undefined; }
  if (s.phase === 'result') { v.settled = !!s.settled; if (s.settled) { const r = s.result.rows.find(x => x.pid === pid); v.rank = r.rank; v.pts = r.pts; v.early = !!r.early; v.value = r.value; } else v.score = s.result.before[pid]; }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- renderers ----------
const unit = (k, r) => (r.early ? 'too early!' : r.value === null ? (k === 'still' ? 'no reading' : 'missed it') : k === 'shake' ? r.value + ' shakes' : k === 'still' ? 'wobble ' + r.value.toFixed(2) : (r.value / 1000).toFixed(2) + ' s');
let resKey = '';
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  const ev = EVENTS[v.kind];
  let h = '';
  if (v.phase === 'setup') h = `<div class="shbig"><i>📱</i><b>Pick up your phone and tap “I'm ready”.</b><span>It may ask to use motion. Say yes. Then hold on tight all game.</span></div><div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">Start anyway</button>`;
  if (v.phase === 'ready') h = `<p class="cat">Event ${v.n} of ${v.of}</p><div class="shbig"><i>${ev.icon}</i><h2>${ev.name}</h2><b>${ev.how}</b>${v.left !== undefined ? `<em class="shcount ${v.left <= 3 ? 'hurry' : ''}">${v.left <= 3 ? v.left || 'GO' : 'Get ready'}</em>` : '<em class="shcount wait">Wait for it…</em>'}</div>${v.early.length ? `<p class="shearly">Too early: ${v.early.map(esc).join(', ')}</p>` : ''}`;
  if (v.phase === 'go') {
    const body = v.kind === 'draw' ? `<div class="shhits">${v.hits.map((n, i) => `<span class="${i === 0 ? 'first' : ''}">${i + 1}. ${esc(n)}</span>`).join('')}</div>${v.early.length ? `<p class="shearly">Too early: ${v.early.map(esc).join(', ')}</p>` : ''}`
      : `<div class="shbars ${v.kind}">${v.bars.map(b => `<div class="shbar ${b.on ? '' : 'off'}"><span>${esc(b.name)}</span><div><i style="width:${Math.max(2, b.pct)}%"></i></div></div>`).join('')}</div>`;
    h = `<p class="cat">${ev.icon} ${ev.name} ${v.kind !== 'draw' ? `<span class="clock small ${v.left <= 3 ? 'hurry' : ''}">${v.left}</span>` : ''}</p><h2 class="shgo ${v.kind}">${ev.go}</h2>${body}`;
  }
  if (v.phase === 'result') {
    const key = 'r' + v.n;
    if (resKey !== key) { resKey = key; import('../sfx.js').then(m => { const n = v.rows.length; v.rows.forEach((r, i) => setTimeout(() => m.play(i === 0 && r.pts ? 'win' : r.pts ? 'points' : 'groan'), 500 + (n - 1 - i) * 450)); if (v.rows[0]?.pts) setTimeout(() => m.play('cheer'), 700 + n * 450); }).catch(() => {}); }
    const n = v.rows.length;   // the list fills from the bottom, so the winner lands last
    h = `<p class="cat">${ev.icon} ${ev.name}</p><div class="shrows">${v.rows.map((r, i) => `<div class="pdrow ${i === 0 && r.pts ? 'best' : ''} ${r.pts ? '' : 'nil'}" style="animation-delay:${500 + (n - 1 - i) * 450}ms"><b>${r.rank !== null ? r.rank + 1 + '. ' : ''}${esc(r.name)}</b><span>${unit(v.kind, r)}</span><em>${r.pts ? '+' + r.pts : ''}</em></div>`).join('')}</div><button class="btn" data-host="next">${v.n < v.of ? 'Next event' : 'Finish'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel sh">${h}</div>${scores}</div>`;
}

// ----- the phone's own movement sensing -----
// live: movement readings are arriving. cur: what the game wants right now. Readings are added up and sent every 400 ms.
const M = { on: false, live: false, cur: null, sum: 0, taps: 0, last: 0, timer: null, fired: '' };
const FLICK = 14;   // metres per second squared: a clear flick, well above a hand tremor
function onMotion(e) {
  const a = e.acceleration, g = e.accelerationIncludingGravity;
  let lin = null;
  if (a && a.x !== null && a.x !== undefined) lin = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
  else if (g && g.x !== null && g.x !== undefined) lin = Math.abs(Math.hypot(g.x || 0, g.y || 0, g.z || 0) - 9.81);
  if (lin === null) return;
  M.live = true;
  const now = performance.now(), dt = Math.min(0.1, M.last ? (now - M.last) / 1000 : 0.016); M.last = now;
  const c = M.cur; if (!c) return;
  if (c.phase === 'go' && c.kind !== 'draw') M.sum += lin * dt;
  if (c.kind === 'draw' && lin > FLICK && M.fired !== c.key && !c.early && !c.hit) {
    if (c.phase === 'ready') { M.fired = c.key; c.send({ type: 'tap', early: 1 }); } else if (c.phase === 'go') { M.fired = c.key; c.send({ type: 'tap' }); }
  }
}
function flush() {
  const c = M.cur; if (!c || c.phase !== 'go' || c.kind === 'draw') return;
  // Shake Race without a movement sensor: fast taps count instead. Statue has no fair stand-in, so those phones sit out.
  if (M.live) c.send({ type: 'tap', e: Math.round(M.sum * 100) / 100 }); else if (c.kind === 'shake' && M.taps) c.send({ type: 'tap', e: M.taps * 1.5 });
  M.sum = 0; M.taps = 0;
}
async function startMotion() {
  if (M.on) return;
  try { if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') { if ((await DeviceMotionEvent.requestPermission()) !== 'granted') return; } } catch { return; }
  if (typeof window !== 'undefined' && 'ondevicemotion' in window) { window.addEventListener('devicemotion', onMotion); M.on = true; }
}

export function renderPhone(v, el, send) {
  M.cur = v.phase === 'ready' || v.phase === 'go' ? { phase: v.phase, kind: v.kind, key: 'e' + v.n, early: v.early, hit: v.hit, send } : null;
  if (!M.timer && typeof window !== 'undefined') M.timer = setInterval(flush, 400);
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  if (v.phase === 'setup') {
    el.innerHTML = v.ok ? `<h2>Ready ✓</h2><p class="say">${M.live || M.on ? 'Hold your phone tightly. Watch the TV.' : 'This phone cannot feel movement here, so you will get a tap button instead.'}</p>` : '<h2>Your phone is the controller</h2><p class="say">Tap the button. If it asks to use motion, say yes.</p><button class="btn shbtn" id="shok">I\'m ready</button><p class="muted">Hold on tight, and give yourself some room.</p>';
    const b = el.querySelector('#shok'); if (b) b.onclick = async () => { b.disabled = true; await startMotion(); send({ type: 'ready' }); };
    return;
  }
  const ev = EVENTS[v.kind];
  if (v.phase === 'result') { el.innerHTML = !v.settled ? '<h2>Watch the TV…</h2>' : `<h2 class="${v.rank === 0 ? 'win' : ''}">${v.early ? 'Too early! 🙈' : v.rank === null ? 'No score this time' : v.rank === 0 ? `You won ${ev.name}! +${v.pts}` : `${['1st', '2nd', '3rd'][v.rank] || v.rank + 1 + 'th'} · +${v.pts}`}</h2><p class="muted">${v.score.toLocaleString()} points</p>`; return; }
  if (!M.on && !M.asked) { M.asked = true; startMotion(); }   // joined late or reloaded: try quietly (works without a tap on most Android phones)
  const sensor = M.live;
  let h = `<p class="muted">${ev.icon} ${ev.name}</p>`;
  if (v.kind === 'draw') {
    if (v.early) h += '<h2 class="lose">Too early! 🙈</h2><p class="say">You are out of this one.</p>';
    else if (v.hit) h += '<h2 class="win">Bang! 🤠</h2><p class="say">Watch the TV.</p>';
    else h += v.phase === 'ready' ? `<h2>Hold still…</h2><p class="say">Wait for GO on the TV.</p>${sensor ? '' : '<button class="btn shbtn wait" id="shtap">WAIT…</button>'}` : `<h2 class="win">GO! ${sensor ? 'Flick it!' : ''}</h2>${sensor ? '' : '<button class="btn shbtn" id="shtap">TAP!</button>'}`;
  } else if (v.phase === 'ready') h += `<h2>Get ready</h2><p class="say">${esc(ev.how)}</p>`;
  else if (v.kind === 'shake') h += `<h2 class="win">SHAKE! 📳</h2>${sensor ? '<p class="say">As hard as you can. Hold on tight!</p>' : '<button class="btn shbtn" id="shtap">TAP FAST!</button>'}`;
  else h += sensor ? '<h2>Don\'t move 🗿</h2><p class="say">Flat on your palm. Breathe slowly.</p>' : '<h2>Sit this one out</h2><p class="say">This phone cannot feel movement here.</p>';
  el.innerHTML = h;
  const t = el.querySelector('#shtap');
  if (t) t.onpointerdown = e => { e.preventDefault(); if (v.kind === 'draw') send(v.phase === 'ready' ? { type: 'tap', early: 1 } : { type: 'tap' }); else M.taps++; };
}
