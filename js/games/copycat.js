// Copy Cat: the TV lights up a pattern of pictures and sounds. Everyone copies it on their phone.
// Each round the pattern gets one longer. Three hearts each. No reading needed.
import { esc } from '../ui.js';

export const meta = {
  id: 'copycat',
  name: 'Copy Cat',
  min: 1,
  max: 20,
  blurb: 'Watch the pattern, then copy it. It grows every round!',
  kids: true,
};

export const PADS = [{ e: '🍎', c: '#e2473b', f: 392 }, { e: '🍋', c: '#f2b21d', f: 494 }, { e: '🐸', c: '#3fa34d', f: 587 }, { e: '🐳', c: '#3f7fe0', f: 784 }];
export const STEP = 750;
// The pattern plays faster as it gets longer.
export const stepFor = len => Math.max(380, STEP - Math.max(0, len - 3) * 45);
export const MAX_ROUNDS = 12, HEARTS = 3;
const rand4 = rnd => Math.floor(rnd() * 4);

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const s = { game: 'copycat', players: players.map(p => ({ pid: p.pid, name: p.name })), pattern: [rand4(rnd), rand4(rnd)], team: opts.mode === 'team', hearts: {}, best: {}, progress: {}, failed: {}, phase: 'show', round: 0, r: 1, max: opts.short ? 8 : MAX_ROUNDS };
  s.players.forEach(p => { s.hearts[p.pid] = HEARTS; s.best[p.pid] = 0; });
  show(s, Date.now());
  return s;
}
function show(s, now) { s.progress = {}; s.failed = {}; s.phase = 'show'; s.round++; s.deadline = now + 1500 + s.pattern.length * stepFor(s.pattern.length); }
const alive = s => s.players.filter(p => s.hearts[p.pid] > 0).map(p => p.pid);
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';

function result(s, now) {
  // Team mode: everyone shares the hearts. If at least half the players get it, nobody loses one.
  if (s.team) {
    const a = alive(s), ok = a.filter(pid => s.progress[pid] === s.pattern.length);
    a.forEach(pid => { if (s.progress[pid] !== s.pattern.length) s.failed[pid] = true; });
    if (ok.length * 2 >= a.length) { a.forEach(pid => (s.best[pid] = s.pattern.length)); s.failed = {}; } else a.forEach(pid => s.hearts[pid]--);
    s.phase = 'result'; s.round++; s.deadline = now + 3500; return;
  }
  for (const pid of alive(s)) {
    if (s.progress[pid] === s.pattern.length) s.best[pid] = s.pattern.length;
    else { s.hearts[pid]--; s.failed[pid] = true; }
  }
  s.phase = 'result'; s.round++; s.deadline = now + 3500;
}
function next(s, now, rnd) {
  s.r++;
  if (s.r > s.max || !alive(s).length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.pattern.push(rand4(rnd));
  show(s, now);
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'input' || !(s.hearts[pid] > 0) || a.type !== 'tap') return s;
  const p = s.progress[pid] || 0;
  if (p >= s.pattern.length || s.progress[pid] === -1) return s;
  s.progress[pid] = a.k === s.pattern[p] ? p + 1 : -1;
  if (alive(s).every(x => s.progress[x] === -1 || s.progress[x] === s.pattern.length)) result(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'show') { s.phase = 'input'; s.round++; s.deadline = now + 5000 + s.pattern.length * 1100; }
  else if (s.phase === 'input') result(s, now);
  else if (s.phase === 'result') next(s, now, rnd);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.best[p.pid], hearts: s.hearts[p.pid] })).sort((a, b) => b.score - a.score || b.hearts - a.hearts);
export function narration(s) {
  if (s.phase === 'show') return s.r === 1 ? 'Welcome to Copy Cat! Watch the TV and listen. Then copy the pattern on your phone!' : `Round ${s.r}. Watch carefully!`;
  if (s.phase === 'input') return 'Your turn! Copy the pattern.';
  if (s.phase === 'over') return `${ranking(s)[0].name} has the best memory! ${ranking(s)[0].score} in a row!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'show') return { sound: 'join', wait: 500, title: s.r === 1 ? 'Copy Cat' : `Round ${s.r}`, sub: '👀 Watch!' };
  if (s.phase === 'input') return { sound: 'vote', wait: 200 };
  if (s.phase === 'result') return { sound: Object.keys(s.failed).length ? 'lose' : 'win', wait: 300, fx: Object.keys(s.failed).length ? null : 'confetti', flash: Object.keys(s.failed).length ? 'buzz' : 'gold' };
  if (s.phase === 'over') return { sound: 'win', wait: 1200, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'input' || !v.alive || v.done) return null;
  const right = v._p[v.progress];
  return { type: 'tap', k: rnd() < 0.96 - v._p.length * 0.02 ? right : (right + 1) % 4 };
}

export function tvView(s, now = Date.now()) {
  return {
    phase: s.phase, r: s.r, pattern: s.phase === 'show' || s.phase === 'result' ? s.pattern : null, len: s.pattern.length,
    players: s.players.map(p => ({ name: p.name, hearts: s.hearts[p.pid], progress: s.progress[p.pid] || 0, ok: s.progress[p.pid] === s.pattern.length, failed: s.progress[p.pid] === -1 || !!s.failed[p.pid] })),
    scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
  };
}
export function phoneView(s, pid) {
  if (s.hearts[pid] === undefined) return { phase: 'spectate' };
  const p = s.progress[pid] || 0;
  const v = { phase: s.phase, round: s.round, alive: s.hearts[pid] > 0, hearts: s.hearts[pid], len: s.pattern.length, progress: Math.max(0, p), wrong: p === -1, done: p === s.pattern.length || p === -1, best: s.best[pid], failed: !!s.failed[pid] };
  if (String(pid).startsWith('bot-')) v._p = s.pattern;
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

const pads = (lit = -1, tap = false) => `<div class="ccpads">${PADS.map((p, k) => `<button class="ccpad" style="--c:${p.c}" ${tap ? `data-k="${k}"` : 'disabled'}><span>${p.e}</span></button>`).join('')}</div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase !== 'show');
  const who = `<div class="ccplayers">${v.players.map(p => `<div class="${p.ok ? 'ok' : p.failed ? 'bad' : ''}"><b>${esc(p.name)}</b><span>${'❤️'.repeat(Math.max(0, p.hearts)) || '💤'}</span>${v.phase === 'input' && p.hearts > 0 ? `<small>${p.ok ? '✅' : p.failed ? '❌' : `${p.progress}/${v.len}`}</small>` : ''}</div>`).join('')}</div>`;
  let h = `<p class="cat">Round ${v.r} · ${v.len} in a row</p>`;
  if (v.phase === 'show') h += `<h2>👀 Watch and listen!</h2>${pads()}`;
  if (v.phase === 'input') h += `<h2>👉 Copy it on your phone!</h2>${pads()}<p class="center"><span class="clock">${v.left}</span></p>`;
  if (v.phase === 'result') h += `<h2>The pattern was</h2><div class="ccseq">${v.pattern.map(k => `<span style="--c:${PADS[k].c}">${PADS[k].e}</span>`).join('')}</div>`;
  if (v.phase === 'over') h = `<h2 class="win">🏆 ${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel">${h}${v.phase !== 'over' ? who : ''}</div></div>`;
  if (v.phase === 'show' && v.fresh !== false) {
    // Light up each pad in turn and play its note.
    const btns = el.querySelectorAll('.ccpad'), step = stepFor(v.pattern.length);
    const lead = 2900;   // the "Round N" title covers the screen for the first 2.6 s; the pattern starts once it has gone
    import('../sfx.js').then(m => v.pattern.forEach((k, i) => { m.note(PADS[k].f, 0.45, (lead + i * step) / 1000); setTimeout(() => { const pad = () => el.querySelectorAll('.ccpad')[k]; pad()?.classList.add('lit'); setTimeout(() => pad()?.classList.remove('lit'), step * 0.7); }, lead + i * step); })).catch(() => {});   // the pad is looked up when it lights, because the screen may have been redrawn since
  }
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  const hearts = `<p class="kidscore">${'❤️'.repeat(Math.max(0, v.hearts)) || '💤'}</p>`;
  let h = hearts;
  if (!v.alive && v.phase !== 'over') h += '<h2>💤 Out of hearts</h2><p class="say">Cheer on the others!</p>';
  else if (v.phase === 'show') h += `<h2>👀 Look at the TV!</h2>${pads()}`;
  else if (v.phase === 'input') h += v.wrong ? '<h2>❌ Oops!</h2>' : v.done ? '<h2>✅ You got it!</h2>' : `<h2>👉 Your turn!</h2><div class="ccdots">${Array.from({ length: v.len }, (_, i) => `<i class="${i < v.progress ? 'on' : ''}"></i>`).join('')}</div>${pads(-1, true)}`;
  else if (v.phase === 'result') h += `<h2>${v.failed ? '💔 Lost a heart' : '🎉 Yes!'}</h2>`;
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? '🏆 You won!' : '🎉 Great job!'}</h2><p class="say">Best: ${v.best} in a row</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-k]').forEach(b => (b.onpointerdown = e => { e.preventDefault(); const k = Number(b.dataset.k); b.classList.add('lit'); setTimeout(() => b.classList.remove('lit'), 200); import('../sfx.js').then(m => m.note(PADS[k].f, 0.3)).catch(() => {}); try { navigator.vibrate?.(20); } catch {} send({ type: 'tap', k }); }));
}

meta.options = [{ id: 'mode', name: 'Mode', choices: [['solo', 'everyone for themselves'], ['team', 'work together']] }];
