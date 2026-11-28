// Color Hunt: the TV calls out "Find something RED!" Kids run and touch something that color, then tap their phone.
// First three back score. Gets everyone up and moving. No reading needed.
import { esc } from '../ui.js';

export const meta = {
  id: 'hunt',
  name: 'Color Hunt',
  min: 1,
  max: 20,
  blurb: 'Find something red! Run, touch it, tap your phone.',
  kids: true,
};

export const HUNTS = [
  { say: 'Find something RED!', e: '🔴', c: '#e2473b' }, { say: 'Find something BLUE!', e: '🔵', c: '#3f7fe0' }, { say: 'Find something GREEN!', e: '🟢', c: '#3fa34d' },
  { say: 'Find something YELLOW!', e: '🟡', c: '#f2b21d' }, { say: 'Find something ORANGE!', e: '🟠', c: '#f28a1d' }, { say: 'Find something PURPLE!', e: '🟣', c: '#8a4fd1' },
  { say: 'Find something WHITE!', e: '⚪', c: '#fffdf6' }, { say: 'Find something BLACK!', e: '⚫', c: '#1d1f2e' }, { say: 'Find something PINK!', e: '🩷', c: '#f27fb2' },
  { say: 'Find something BROWN!', e: '🟤', c: '#8b5a2b' }, { say: 'Find something ROUND, like a ball!', e: '⚽', c: '#5a6fd8' }, { say: 'Find something SOFT, like a pillow!', e: '🧸', c: '#c88e4a' },
  { say: 'Find a SHOE!', e: '👟', c: '#5a6fd8' }, { say: 'Find a BOOK!', e: '📚', c: '#5a6fd8' }, { say: 'Find a SPOON!', e: '🥄', c: '#8a8fb8' },
  { say: 'Find something with a STAR on it!', e: '⭐', c: '#f2b21d' }, { say: 'Find something SQUARE, like a box!', e: '📦', c: '#c88e4a' }, { say: 'Touch your NOSE, then find a CHAIR!', e: '🪑', c: '#8b5a2b' },
  { say: 'Find something GRAY!', e: '🩶', c: '#8a8fb8' }, { say: 'Find something SHINY!', e: '✨', c: '#f2b21d' }, { say: 'Find something STRIPED!', e: '🦓', c: '#1d1f2e' },
  { say: 'Find something TINY!', e: '🐜', c: '#3fa34d' }, { say: 'Find something you can WEAR on your head!', e: '🧢', c: '#3f7fe0' }, { say: 'Find a SOCK!', e: '🧦', c: '#e2473b' },
  { say: 'Find a CUP!', e: '🥤', c: '#f28a1d' }, { say: 'Find something with WHEELS!', e: '🛞', c: '#5a6fd8' }, { say: 'Find something that makes NOISE!', e: '🔔', c: '#f2b21d' },
  { say: 'Find something with NUMBERS on it!', e: '🔢', c: '#3f7fe0' }, { say: 'Find a TOY!', e: '🧩', c: '#8a4fd1' }, { say: 'Find something BUMPY!', e: '🍍', c: '#f2b21d' },
  { say: 'Find something LONG, like a rope!', e: '🪢', c: '#8b5a2b' }, { say: 'Find a KEY!', e: '🔑', c: '#f2b21d' }, { say: 'Find something you can DRAW with!', e: '🖍️', c: '#e2473b' },
  { say: 'Find something FLAT, like a plate!', e: '🍽️', c: '#8a8fb8' }, { say: 'Hop on one foot, then find a PILLOW!', e: '🛏️', c: '#c88e4a' }, { say: 'Find something with a FACE on it!', e: '🙂', c: '#f2b21d' },
];
export const ROUNDS = 8;
export const TIMES = { get: 3500, go: 30000, done: 5000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const s = { game: 'hunt', players: players.map(p => ({ pid: p.pid, name: p.name })), list: shuffle([...HUNTS.keys()], rnd).slice(0, opts.short ? 5 : ROUNDS), r: 0, round: 0, scores: {}, found: [] };
  s.players.forEach(p => (s.scores[p.pid] = 0));
  get(s, Date.now());
  return s;
}
function get(s, now) { s.found = []; s.phase = 'get'; s.round++; s.deadline = now + TIMES.get; }
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const H = s => HUNTS[s.list[s.r]];

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'go' || a.type !== 'found' || s.scores[pid] === undefined || s.found.includes(pid)) return s;
  s.found.push(pid);
  s.scores[pid] += [3, 2, 1][s.found.length - 1] || 1;
  s.eventId = (s.eventId || 0) + 1;
  if (s.found.length === s.players.length) { s.phase = 'done'; s.round++; s.deadline = now + TIMES.done; }
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  // A grown-up can take back the last "found it" if it didn't count.
  if (a === 'undo' && ['go', 'done'].includes(s.phase) && s.found.length) { const pid = s.found.pop(); s.scores[pid] -= [3, 2, 1][s.found.length] || 1; if (s.phase === 'done') { s.phase = 'go'; s.round++; s.deadline = now + 8000; } return s; }
  if (a !== 'next') return s;
  if (s.phase === 'get') { s.phase = 'go'; s.round++; s.deadline = now + TIMES.go; }
  else if (s.phase === 'go') { s.phase = 'done'; s.round++; s.deadline = now + TIMES.done; }
  else if (s.phase === 'done') { s.r++; if (s.r >= s.list.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else get(s, now); }
  return s;
}
export function tick(s, now = Date.now()) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'get') return s.r === 0 ? 'Color Hunt! When I say go, run and touch it, then tap your phone. Ready?' : 'Get ready!';
  if (s.phase === 'go') return `${H(s).say} Go go go!`;
  if (s.phase === 'done') return s.found.length ? `${nameOf(s, s.found[0])} was first! Great hunting!` : 'Time\'s up!';
  if (s.phase === 'over') return `${ranking(s)[0].name} is the hunt champion!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'get') return { sound: 'drumroll', wait: 400, title: s.r === 0 ? 'Color Hunt' : `Hunt ${s.r + 1}`, sub: 'Get ready…' };
  if (s.phase === 'go') return { sound: 'join', wait: 200 };
  if (s.phase === 'done') return { sound: 'win', wait: 300 };
  if (s.phase === 'over') return { sound: 'win', wait: 1200, title: 'Hunt over!', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function cueEvent(s) { return s.eventId && s.phase === 'go' ? { id: s.eventId, sound: 'safe', say: s.found.length <= 3 ? nameOf(s, s.found[s.found.length - 1]) : '' } : null; }
export function botAct(v, rnd = Math.random) { return v.phase === 'go' && !v.found && rnd() < 0.15 ? { type: 'found' } : null; }

export function tvView(s, now = Date.now()) {
  return { phase: s.phase, r: s.r + 1, of: s.list.length, hunt: s.phase === 'go' || s.phase === 'done' ? H(s) : null, found: s.found.map(p => nameOf(s, p)), scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
}
export function phoneView(s, pid) {
  if (s.scores[pid] === undefined) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, hunt: s.phase === 'go' ? H(s) : null, found: s.found.includes(pid), place: s.found.indexOf(pid) + 1, score: s.scores[pid] };
  if (s.phase === 'over') v.final = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Stars</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Hunt ${v.r} of ${v.of}</p>`;
  if (v.phase === 'get') h += '<div class="huntbig ready">👀<b>Ready…</b></div>';
  if (v.phase === 'go' || v.phase === 'done') h += `<div class="huntbig" style="--c:${v.hunt.c}"><span>${v.hunt.e}</span><b>${esc(v.hunt.say)}</b></div>${v.phase === 'go' ? `<p class="center"><span class="clock">${v.left}</span></p>` : ''}<div class="huntfound">${v.found.map((n, i) => `<span data-pop="f${v.r}-${i}" data-snd="none">${['🥇', '🥈', '🥉'][i] || '✅'} ${esc(n)}</span>`).join('')}</div>${v.phase === 'go' ? '<button class="btn ghost" data-host="next">Stop</button>' : '<button class="btn" data-host="next">Next hunt</button>'}`;
  if (v.phase === 'over') h = `<h2 class="win">🏆 ${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  if (['go', 'done'].includes(v.phase) && v.found.length) h += `<button class="btn ghost small" data-host="undo">Didn't count: undo ${esc(v.found[v.found.length - 1])}</button>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="kidscore">⭐ ${v.score}</p>`;
  if (v.phase === 'get') h += '<div class="huntbig ready">👀<b>Look at the TV!</b></div>';
  else if (v.phase === 'go' && !v.found) h += `<div class="huntbig" style="--c:${v.hunt.c}"><span>${v.hunt.e}</span></div><button class="kidbtn" data-found>👆 I found it!</button>`;
  else if (v.phase === 'go' || v.phase === 'done') h += v.found ? `<div class="huntbig">${['🥇', '🥈', '🥉'][v.place - 1] || '✅'}<b>${v.place <= 3 ? 'Super fast!' : 'You found it!'}</b></div>` : '<h2>⏰ Time!</h2>';
  else if (v.phase === 'over') h += `<h2 class="${v.final === 1 ? 'win' : ''}">${v.final === 1 ? '🏆 You won!' : '🎉 Great hunting!'}</h2>`;
  el.innerHTML = h;
  el.querySelector('[data-found]')?.addEventListener('pointerdown', e => { e.preventDefault(); try { navigator.vibrate?.(60); } catch {} send({ type: 'found' }); });
}

// A latecomer can take a seat mid-game, starting from zero.
export function addPlayer(s, p) { if (s.players.some(x => x.pid === p.pid)) return; s.players.push({ pid: p.pid, name: p.name }); s.scores[p.pid] = 0; }
