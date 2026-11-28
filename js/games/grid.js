// Word Storm: a 4x4 grid of letters on the TV and on every phone. Trace words through touching letters (sideways,
// up and down, and diagonally), using each tile once per word. Longer words score more, and a word nobody else found
// scores double. The word list (about 44,000 everyday words) is loaded only when this game starts.
import { esc } from '../ui.js';

export const meta = {
  id: 'grid',
  name: 'Word Storm',
  min: 1,
  max: 12,
  blurb: 'Find words in a grid of letters. Longer is better, and words nobody else spots count double.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const TIMES = { ready: 6000, play: 75000, settle: 3000, after: 9000 };
export const SIZE = 4;
// How often each letter turns up (roughly as in English, with Q left out and a few extra vowels).
const BAG = 'eeeeeeeeeeeeaaaaaaaaaiiiiiiiioooooooouuuunnnnnnrrrrrrttttttllllssssssddddgggbbccmmppffhhhvwwyykjxz';
export const pointsFor = len => (len <= 4 ? 100 : len === 5 ? 200 : len === 6 ? 300 : len === 7 ? 500 : 1100);
let DICT = null, loading = null;
// The word list arrives a moment after the game starts; everything that needs it waits for this.
export function ready() { return (loading = loading || import('./grid-dict.js').then(m => { DICT = new Set(m.default.split(' ')); return DICT; })); }

const near = (a, b) => a !== b && Math.abs((a % SIZE) - (b % SIZE)) <= 1 && Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) <= 1;
// Can this word be traced through the grid, each tile used once? Returns the path of tiles, or null.
export function trace(grid, word) {
  const go = (i, k, used) => { if (grid[i] !== word[k]) return null; if (k === word.length - 1) return [i]; used[i] = true; for (let j = 0; j < grid.length; j++) { if (!used[j] && near(i, j)) { const r = go(j, k + 1, used); if (r) { used[i] = false; return [i, ...r]; } } } used[i] = false; return null; };
  for (let i = 0; i < grid.length; i++) { const r = go(i, 0, []); if (r) return r; }
  return null;
}
export function allWords(grid) { if (!DICT) return []; const have = new Set(grid); return [...DICT].filter(w => [...w].every(ch => have.has(ch)) && trace(grid, w)); }
export function makeGrid(rnd) {
  for (let tries = 0; tries < 200; tries++) {
    const g = Array.from({ length: SIZE * SIZE }, () => BAG[Math.floor(rnd() * BAG.length)]), vowels = g.filter(ch => 'aeiou'.includes(ch)).length;
    if (vowels >= 5 && vowels <= 8) return g;
  }
  return [...'tapeslornigeducm'];
}

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  ready().catch(() => {});
  return {
    game: 'grid', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    max: opts.short ? 1 : 2, n: 1, grid: makeGrid(rnd), checked: false, all: [], words: {}, last: {}, result: null, settled: false, settleAt: 0,
    phase: 'ready', deadline: Date.now() + TIMES.ready,
  };
}
// Once the word list is in, make sure the grid is a generous one (at least 40 words to find).
function check(s, rnd) {
  if (s.checked || !DICT) return;
  for (let k = 0; k < 12; k++) { s.all = allWords(s.grid); if (s.all.length >= 40) break; s.grid = makeGrid(rnd); }
  s.all = allWords(s.grid); s.checked = true; s.round++;
}
function toPlay(s, now) { s.words = Object.fromEntries(s.players.map(p => [p.pid, []])); s.last = {}; s.phase = 'play'; s.round++; s.deadline = now + TIMES.play; }
function result(s, now) {
  const before = { ...s.scores }, count = {};
  Object.values(s.words).forEach(list => list.forEach(w => (count[w] = (count[w] || 0) + 1)));
  const solo = s.players.length > 1;
  const rows = s.players.map(({ pid }) => {
    const list = (s.words[pid] || []).map(w => ({ w, only: solo && count[w] === 1, pts: pointsFor(w.length) * (solo && count[w] === 1 ? 2 : 1) })).sort((a, b) => b.pts - a.pts || b.w.length - a.w.length);
    const pts = list.reduce((a, x) => a + x.pts, 0); s.scores[pid] += pts;
    return { pid, pts, n: list.length, only: list.filter(x => x.only).length, best: list.slice(0, 4) };
  }).sort((a, b) => b.pts - a.pts);
  const found = new Set(Object.keys(count)), missed = s.all.filter(w => !found.has(w)).sort((a, b) => b.length - a.length)[0] || null;
  s.result = { before, rows, missed, total: s.all.length, found: found.size };
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'play' || a.type !== 'word' || !s.players.some(p => p.pid === pid)) return s;
  const w = String(a.w || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 16), mine = s.words[pid];
  const why = w.length < 3 ? 'Three letters or more' : mine.includes(w) ? 'You already have that' : !trace(s.grid, w) ? 'Not in the grid' : DICT && !DICT.has(w) ? 'Not in our word list' : '';
  if (!why) mine.push(w);
  s.last[pid] = { w, ok: !why, why, k: (s.last[pid]?.k || 0) + 1 };
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'ready') { check(s, rnd); toPlay(s, now); }
  else if (s.phase === 'play') result(s, now);
  else if (s.phase === 'result') { if (s.n >= s.max) { s.phase = 'over'; s.round++; s.deadline = 0; } else { s.n++; s.grid = makeGrid(rnd); s.checked = false; s.all = []; s.result = null; s.phase = 'ready'; s.round++; s.deadline = now + TIMES.ready; check(s, rnd); } }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'ready') { check(s, rnd); if (now >= s.deadline && (s.checked || now >= s.deadline + 8000)) hostAct(s, 'next', now, rnd); return s; }   // waits a little for the word list
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const ranking = (s, sc = s.scores) => s.players.map(p => ({ pid: p.pid, name: p.name, score: sc[p.pid] })).sort((a, b) => b.score - a.score);
const say = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every round

export function narration(s) {
  if (s.phase === 'ready') return s.n === 1 ? 'Welcome to Word Storm! Find words by tracing through letters that touch.' : say(['A new grid. Same rules.', 'Fresh letters.', 'One more storm.'], s.n);
  if (s.phase === 'play') return say(['Go!', 'Find them!', 'Start tracing!'], s.n);
  if (s.phase === 'result') { const r = s.result; return `${say(['Time!', 'Pencils down.', 'And stop.'], s.n)} ${!r.found ? 'Nobody found a single word!' : r.found * 3 < r.total ? 'Plenty of words got away.' : 'A good haul.'}`; }
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'ready') return s.n === 1 ? { sound: 'fanfare', wait: 1500, title: 'Word Storm', sub: 'Find words in the grid' } : { sound: 'join', wait: 900, title: 'New Grid', sub: `Round ${s.n} of ${s.max}` };
  if (s.phase === 'play') return { sound: 'whoosh', wait: 0 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) { return v.phase === 'play' && v._words?.length && rnd() < 0.25 ? { type: 'word', w: v._words[Math.floor(rnd() * v._words.length)] } : null; }

export function tvView(s, now = Date.now()) {
  const held = s.phase === 'result' && !s.settled;
  const v = { phase: s.phase, n: s.n, max: s.max, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s, held ? s.result.before : s.scores) };
  if (s.phase === 'over') return v;
  v.grid = s.grid;
  if (s.phase === 'ready') v.total = s.checked ? s.all.length : 0;
  if (s.phase === 'play') { v.total = s.all.length; v.players = s.players.map(p => ({ name: p.name, n: s.words[p.pid].length })).sort((a, b) => b.n - a.n); }
  if (s.phase === 'result') { const r = s.result; v.settled = !!s.settled; v.rows = r.rows.map(x => ({ name: nameOf(s, x.pid), pts: x.pts, n: x.n, only: x.only, best: x.best })); v.missed = r.missed; v.total = r.total; v.found = r.found; v.path = r.rows[0]?.best[0] ? trace(s.grid, r.rows[0].best[0].w) : null; }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const held = s.phase === 'result' && !s.settled;
  const v = { phase: s.phase, n: s.n, max: s.max, score: held ? s.result.before[pid] : s.scores[pid] };
  if (s.phase === 'ready') v.grid = null;   // no head start: the letters appear for everyone at once
  if (s.phase === 'play') { v.grid = s.grid; v.words = s.words[pid]; v.last = s.last[pid] || null; if (String(pid).startsWith('bot-')) v._words = s.all.filter(w => !s.words[pid].includes(w)).slice(0, 30); }
  if (s.phase === 'result' && s.settled) { const r = s.result.rows.find(x => x.pid === pid); v.pts = r.pts; v.count = r.n; v.only = r.only; v.best = r.best; }
  if (s.phase === 'result') v.settled = !!s.settled;
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- renderers ----------
let resKey = '';
const gridHtml = (grid, path) => `<div class="wsgrid">${grid.map((ch, i) => `<i class="${path?.includes(i) ? 'lit' : ''}" ${path?.includes(i) ? `style="animation-delay:${1200 + path.indexOf(i) * 160}ms"` : ''}>${ch.toUpperCase()}</i>`).join('')}</div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'ready') h = `<p class="cat">Grid ${v.n} of ${v.max}</p><div class="wsrow"><div class="wsgrid hide">${v.grid.map(() => '<i>?</i>').join('')}</div><div class="wsside"><h2 class="wshead">${v.left <= 3 ? v.left || 'GO' : 'Get ready'}</h2><p class="wsrule">Trace words through letters that touch, in any direction. Each tile once per word.</p><p class="wsrule">Three letters or more. Longer words score more. A word nobody else finds scores <b>double</b>.</p></div></div>`;
  if (v.phase === 'play') h = `<p class="cat">Grid ${v.n} of ${v.max} · ${v.total} words hiding in here <span class="clock small ${v.left <= 10 ? 'hurry' : ''}">${v.left}</span></p><div class="wsrow">${gridHtml(v.grid)}<div class="wsside"><h2 class="wshead small">Words found</h2><div class="wscount">${v.players.map(p => `<div><span>${esc(p.name)}</span><b>${p.n}</b></div>`).join('')}</div></div></div><button class="btn ghost" data-host="next">Stop the clock</button>`;
  if (v.phase === 'result') {
    const key = 'r' + v.n, n = v.rows.length;
    if (resKey !== key) { resKey = key; import('../sfx.js').then(m => { v.rows.forEach((r, i) => setTimeout(() => m.play(i === 0 && r.pts ? 'win' : r.pts ? 'points' : 'groan'), 500 + (n - 1 - i) * 400)); if (v.rows[0]?.pts) setTimeout(() => m.play('cheer'), 700 + n * 400); }).catch(() => {}); }
    h = `<p class="cat">Grid ${v.n} of ${v.max} · the room found ${v.found} of ${v.total} words</p><div class="wsrow">${gridHtml(v.grid, v.path)}<div class="wsside"><div class="wsrows">${v.rows.map((r, i) => `<div class="pdrow ${i === 0 && r.pts ? 'best' : ''}" style="animation-delay:${500 + (n - 1 - i) * 400}ms"><b>${esc(r.name)} · ${r.n} word${r.n === 1 ? '' : 's'}</b><span>${r.best.map(x => `<u class="${x.only ? 'only' : ''}">${esc(x.w)}</u>`).join(' ') || 'nothing this time'}</span><em>${r.pts ? '+' + r.pts.toLocaleString() : ''}</em></div>`).join('')}</div>
      <p class="wsrule"><u class="only">gold</u> = only they found it (double)${v.missed ? ` · everyone missed <b>${esc(v.missed.toUpperCase())}</b>` : ''}</p></div></div><button class="btn" data-host="next">${v.n < v.max ? 'Next grid' : 'Finish'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel ws">${h}</div>${scores}</div>`;
}

// The phone keeps the word being traced between redraws.
let cur = { key: '', path: [], lastK: 0 };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won! 🏆' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  if (v.phase === 'ready') { el.innerHTML = '<h2>Get ready…</h2><p class="say">The letters appear on GO. Drag or tap through letters that touch.</p>'; return; }
  if (v.phase === 'result') { el.innerHTML = !v.settled ? '<h2>Time! Watch the TV…</h2>' : `<h2 class="${v.pts ? 'win' : ''}">${v.count} word${v.count === 1 ? '' : 's'} · +${v.pts.toLocaleString()}</h2><p class="say">${v.only ? `${v.only} that nobody else found.` : ''} ${v.best[0] ? `Best: ${esc(v.best[0].w.toUpperCase())}` : ''}</p><p class="muted">${v.score.toLocaleString()} points</p>`; return; }
  const key = 'g' + v.n; if (cur.key !== key) cur = { key, path: [], lastK: 0 };
  const word = () => cur.path.map(i => v.grid[i]).join('');
  el.innerHTML = `<div class="wsword" id="wsw"></div><div class="wsgrid phone" id="wsg">${v.grid.map((ch, i) => `<i data-i="${i}">${ch.toUpperCase()}</i>`).join('')}</div>
    <div class="row"><button class="btn ghost" id="wsc">Clear</button><button class="btn" id="wss">Enter word</button></div><p id="wsm" class="${v.last?.ok ? 'win' : 'lose'}">${v.last ? (v.last.ok ? `✓ ${esc(v.last.w.toUpperCase())} +${pointsFor(v.last.w.length)}` : `${esc(v.last.w.toUpperCase())}: ${esc(v.last.why)}`) : ''}</p>
    <p class="muted">${v.words.length} found: ${v.words.slice().reverse().slice(0, 14).map(esc).join(', ')}</p>`;
  const g = el.querySelector('#wsg'), show = () => { el.querySelector('#wsw').textContent = word().toUpperCase() || ' '; g.querySelectorAll('i').forEach(t => t.classList.toggle('on', cur.path.includes(+t.dataset.i))); };
  const add = i => { const at = cur.path.indexOf(i); if (at === cur.path.length - 2 && at >= 0) cur.path.pop(); else if (at < 0 && (!cur.path.length || near(cur.path[cur.path.length - 1], i))) cur.path.push(i); show(); };
  const submit = () => { if (cur.path.length >= 3) send({ type: 'word', w: word() }); else if (cur.path.length) el.querySelector('#wsm').textContent = 'Three letters or more'; cur.path = []; show(); };
  let dragging = false, moved = false;
  const tileAt = e => { const t = document.elementFromPoint(e.clientX, e.clientY); if (!t?.dataset?.i || !g.contains(t)) return -1; const r = t.getBoundingClientRect(); return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < r.width * 0.42 ? +t.dataset.i : -1; };   // the middle of a tile only, so diagonals are easy
  g.onpointerdown = e => { e.preventDefault(); const i = tileAt(e); if (i < 0) return; dragging = true; moved = false; add(i); };
  g.onpointermove = e => { if (!dragging) return; const i = tileAt(e); if (i >= 0 && i !== cur.path[cur.path.length - 1]) { moved = true; add(i); } };
  g.onpointerup = g.onpointercancel = () => { if (dragging && moved) submit(); dragging = false; };   // a drag enters the word when you let go; taps build it letter by letter
  el.querySelector('#wsc').onclick = () => { cur.path = []; show(); };
  el.querySelector('#wss').onclick = submit;
  show();
}
