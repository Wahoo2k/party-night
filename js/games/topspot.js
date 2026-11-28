// Top Spot: a survey game where everybody plays at once. The TV asks a survey question ("Name a pizza topping").
// Three kinds of round: Top Spot (one guess: aim for the most popular answer), Deep Cut (one guess: find an answer
// that is on the board but that hardly anyone says) and Sweep (a race to find as many answers as you can).
// The lists are our own best judgment of what most people would say, not a real poll.
import { esc } from '../ui.js';
import { isRude } from '../names.js';
import { QUESTIONS } from './crowd-bank.js';
import { match } from './crowd.js';

export const meta = {
  id: 'topspot',
  name: 'Top Spot',
  min: 2,
  max: 20,
  blurb: 'A survey, a board of answers, and everyone guessing at once. Go popular, go obscure, then race.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const TIMES = { guess: 25000, after: 7000, sweep: 45000, sweepEnd: 9000 };
// The rounds of one game, in order. `short` drops the middle pair.
const PLAN = ['top', 'deep', 'top', 'deep', 'sweep'], PLAN_SHORT = ['top', 'deep', 'sweep'];
export const MODES = {
  top: { name: 'Top Spot', rule: 'One guess. Aim for the MOST popular answer.', hint: 'The more people who say it, the more it pays.' },
  deep: { name: 'Deep Cut', rule: 'One guess. Find an answer hardly anyone says.', hint: 'It must be on the board. The lower down, the more it pays.' },
  sweep: { name: 'Sweep', rule: 'Find as many answers as you can!', hint: 'First to find an answer gets 150. Finding it later gets 50.' },
};
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const Q = s => QUESTIONS[s.order[s.i]];
const mode = s => s.plan[s.i];
// What an answer pays. Top Spot: ten points per person in a hundred who said it. Deep Cut: 100 for the top answer,
// 100 more for each step down the board.
export const payFor = (m, q, idx) => (idx < 0 ? 0 : m === 'top' ? q.a[idx][1] * 10 : m === 'deep' ? 100 * (idx + 1) : 0);

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const used = new Set(prev?.usedQs || []);
  const plan = opts.short ? PLAN_SHORT : PLAN;
  // Deep Cut and Sweep want a long board, so they get the questions with the most answers.
  let pool = QUESTIONS.map((_, i) => i).filter(i => !used.has(i));
  if (pool.length < plan.length) { used.clear(); pool = QUESTIONS.map((_, i) => i); }
  shuffle(pool, rnd);
  const long = pool.filter(i => QUESTIONS[i].a.length >= 8), order = [];
  for (const m of plan) { const from = m === 'top' ? pool : (long.some(i => !order.includes(i)) ? long : pool); order.push(from.find(i => !order.includes(i))); }
  return {
    game: 'topspot', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    plan, order, i: 0, usedQs: [...used, ...order],
    guesses: {},            // one-guess rounds: pid -> { text, idx }
    found: {}, tries: {},   // Sweep: answer index -> [pids in the order they found it]; pid -> how many guesses
    result: null, settled: false, settleAt: 0, eventId: 0, last: null,
    phase: 'guess', deadline: Date.now() + TIMES.guess,
  };
}

export function cleanGuess(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 30);
  if (x.length < 2) return { ok: false, why: 'Type an answer.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: x };
}

// The reveal on the TV: the board turns over one answer at a time from the bottom up, and each player lands on
// the answer they hit. Times in ms from the start of the reveal.
export const revealMs = n => 900 + n * 700 + 1500;
function reveal(s, now) {
  const q = Q(s), m = mode(s), before = { ...s.scores };
  const rows = s.players.map(p => { const g = s.guesses[p.pid]; const idx = g ? g.idx : -1; return { pid: p.pid, text: g ? g.text : null, idx, pts: payFor(m, q, idx) }; });
  rows.forEach(r => (s.scores[r.pid] += r.pts));
  s.result = { rows, before };
  s.settled = false; s.settleAt = now + revealMs(q.a.length);
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
function next(s, now) {
  if (s.i + 1 >= s.plan.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.i++; s.guesses = {}; s.found = {}; s.tries = {}; s.result = null; s.settled = false; s.last = null;
  if (mode(s) === 'sweep') { s.phase = 'sweep'; s.deadline = now + TIMES.sweep; } else { s.phase = 'guess'; s.deadline = now + TIMES.guess; }
  s.round++;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || a.type !== 'guess' || !s.players.some(p => p.pid === pid)) return s;
  const r = cleanGuess(a.text);
  if (!r.ok) return s;
  const q = Q(s);
  if (s.phase === 'guess' && !s.guesses[pid]) {
    s.guesses[pid] = { text: r.text, idx: match(r.text, q.a) };
    if (s.players.every(p => s.guesses[p.pid])) reveal(s, now);
  } else if (s.phase === 'sweep' && (s.tries[pid] || 0) < 40) {
    s.tries[pid] = (s.tries[pid] || 0) + 1;
    const idx = match(r.text, q.a);
    s.eventId++;
    if (idx < 0) { s.last = { pid, hit: false, text: r.text }; return s; }
    const who = (s.found[idx] ||= []);
    if (who.includes(pid)) { s.last = { pid, hit: false, again: true, text: q.a[idx][0] }; return s; }
    who.push(pid);
    const pts = who.length === 1 ? 150 : 50;
    s.scores[pid] += pts;
    s.last = { pid, hit: true, idx, first: who.length === 1, pts };
    if (q.a.every((_, i) => (s.found[i] || []).length === s.players.length)) { s.phase = 'sweepEnd'; s.round++; s.deadline = now + TIMES.sweepEnd; }
  }
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'guess') reveal(s, now);
  else if (s.phase === 'sweep') { s.phase = 'sweepEnd'; s.round++; s.deadline = now + TIMES.sweepEnd; }
  else if (s.phase === 'reveal' || s.phase === 'sweepEnd') next(s, now);
  return s;
}
export function tick(s, now = Date.now()) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }   // the reveal has played: scores and phones catch up
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'guess' && s.i === 0) return 'Welcome to Top Spot! One guess each. Aim for the most popular answer.';
  if (s.phase === 'over') return 'And that\'s the survey. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'guess' || s.phase === 'sweep') return { sound: s.phase === 'sweep' ? 'fanfare' : 'join', wait: 800, title: MODES[mode(s)].name, sub: MODES[mode(s)].rule };
  if (s.phase === 'reveal') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'sweepEnd') return { sound: 'safe', wait: 300 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} takes the top spot`, tone: 'dawn', fx: 'confetti' };
  return null;
}
// Sounds for answers found during Sweep. The TV plays these as they happen.
export function cueEvent(s) {
  if (s.phase !== 'sweep' || !s.eventId || !s.last) return null;
  return s.last.hit ? { id: s.eventId, sound: s.last.first ? ['points', 'lockin', 'stamp'][s.eventId % 3] : 'pop', delay: 0 } : null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'guess' && !v.sent && v._a) {
    // Bots know the board (they are for testing): mostly a real answer, sometimes a miss.
    const pick = v.mode === 'deep' ? v._a[Math.floor(v._a.length / 2 + rnd() * (v._a.length / 2))] : v._a[Math.floor(rnd() * rnd() * v._a.length)];
    return { type: 'guess', text: rnd() < 0.85 ? pick : 'Rubber duck' };
  }
  if (v.phase === 'sweep' && v._a && rnd() < 0.3) { const open = v._a.filter((_, i) => !v.mine.includes(i)); return open.length ? { type: 'guess', text: open[Math.floor(rnd() * open.length)] } : null; }
  return null;
}

export function tvView(s, now = Date.now()) {
  const q = Q(s), m = mode(s);
  const v = { phase: s.phase, n: s.i + 1, of: s.plan.length, mode: m, modeName: MODES[m].name, rule: MODES[m].rule, hint: MODES[m].hint, q: q.q, size: q.a.length, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  if (s.phase === 'guess') v.players = s.players.map(p => ({ name: p.name, done: !!s.guesses[p.pid] }));
  if (s.phase === 'reveal') {
    v.settled = !!s.settled;
    v.tiles = q.a.map((a, i) => ({ text: a[0], pct: a[1], pay: payFor(m, q, i), hits: s.result.rows.filter(r => r.idx === i).map(r => nameOf(s, r.pid)) }));
    v.misses = s.result.rows.filter(r => r.idx < 0).map(r => ({ name: nameOf(s, r.pid), text: r.text }));
    if (!s.settled) v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: s.result.before[p.pid] })).sort((a, b) => b.score - a.score);
  }
  if (s.phase === 'sweep' || s.phase === 'sweepEnd') {
    v.tiles = q.a.map((a, i) => { const who = s.found[i] || []; return who.length || s.phase === 'sweepEnd' ? { text: a[0], pct: a[1], first: who.length ? nameOf(s, who[0]) : null, more: Math.max(0, who.length - 1), missed: !who.length } : null; });
    v.eventId = s.eventId; v.lastHit = s.last && s.last.hit ? s.last.idx : -1;
    v.foundCount = q.a.filter((_, i) => (s.found[i] || []).length).length;
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const q = Q(s), m = mode(s), bot = String(pid).startsWith('bot-');
  const v = { phase: s.phase, n: s.i + 1, of: s.plan.length, mode: m, modeName: MODES[m].name, rule: MODES[m].rule, hint: MODES[m].hint, q: q.q, score: s.scores[pid] };
  if (s.phase === 'guess') { v.sent = !!s.guesses[pid]; v.mine = s.guesses[pid]?.text || null; if (bot) v._a = q.a.map(a => a[0]); }
  if (s.phase === 'reveal') { v.settled = !!s.settled; if (s.settled) { const r = s.result.rows.find(x => x.pid === pid); v.text = r?.text || null; v.hit = r && r.idx >= 0 ? q.a[r.idx][0] : null; v.rank = r && r.idx >= 0 ? r.idx + 1 : 0; v.pts = r ? r.pts : 0; } }
  if (s.phase === 'sweep' || s.phase === 'sweepEnd') {
    v.mine = q.a.map((_, i) => i).filter(i => (s.found[i] || []).includes(pid));
    v.mineText = v.mine.map(i => q.a[i][0]); v.size = q.a.length;
    v.last = s.last && s.last.pid === pid ? { hit: s.last.hit, again: !!s.last.again, text: s.last.hit ? q.a[s.last.idx][0] : s.last.text, pts: s.last.pts || 0, first: !!s.last.first, id: s.eventId } : null;
    if (bot) v._a = q.a.map(a => a[0]);
  }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- renderers ----------
// Each row of the board has its own bright colour, the same from question to question.
const TILE = ['#ff4d6d', '#ff9f1c', '#ffd60a', '#06d6a0', '#4cc9f0', '#4361ee', '#b5179e', '#f15bb5', '#80ed99', '#ffb4a2'];
let revealKey = '', revealAt = 0, revealTimers = [], sweepKey = '';
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  const head = `<div class="tshead tm-${v.mode}"><span class="tsmode">${esc(v.modeName)}</span><b>${esc(v.q)}</b>${v.phase === 'guess' || v.phase === 'sweep' ? `<em class="clock ${v.left <= 8 ? 'hurry' : ''}">${v.left}</em>` : ''}</div>`;
  let h = '';
  if (v.phase === 'guess') {
    h = `<p class="cat">Round ${v.n} of ${v.of}</p>${head}<div class="tsrule"><b>${esc(v.rule)}</b><span>${esc(v.hint)}</span></div>
      <div class="tsboard cols${v.size > 5 ? 2 : 1}">${Array.from({ length: v.size }, (_, i) => `<div class="tstile back" style="--c:${TILE[i % TILE.length]}"><i>${i + 1}</i><b>?</b></div>`).join('')}</div>
      <div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">Show the board</button>`;
  }
  if (v.phase === 'reveal') {
    const key = 'r' + v.n, first = key !== revealKey;
    if (first) { revealKey = key; revealAt = Date.now(); revealTimers.forEach(clearTimeout); revealTimers = []; }
    const el0 = Date.now() - revealAt, n = v.tiles.length, at = i => 900 + (n - 1 - i) * 700;   // bottom of the board first; a redraw part-way through carries on
    h = `<p class="cat">Round ${v.n} of ${v.of}</p>${head}
      <div class="tsboard cols${n > 5 ? 2 : 1}">${v.tiles.map((t, i) => `<div class="tstile flip ${t.hits.length ? 'hit' : ''}" style="--c:${TILE[i % TILE.length]};--d:${at(i) - el0}ms"><i>${i + 1}</i><b>${esc(t.text)}</b><em>${v.mode === 'deep' ? `+${t.pay}` : `${t.pct}%`}</em>${t.hits.length ? `<span class="tshits">${t.hits.map(esc).map(x => `<u>${x}</u>`).join('')}<strong>+${t.pay.toLocaleString()}</strong></span>` : ''}</div>`).join('')}</div>
      ${v.misses.length ? `<p class="tsmiss" style="animation-delay:${900 + n * 700 + 300 - el0}ms">Not on the board: ${v.misses.map(m => `<span>${esc(m.name)}${m.text ? ` “${esc(m.text)}”` : ' (no answer)'}</span>`).join('')}</p>` : ''}<button class="btn" data-host="next">Next</button>`;
    if (first) import('../sfx.js').then(m => {
      const later = (ms, fn) => revealTimers.push(setTimeout(fn, ms));
      v.tiles.forEach((t, i) => later(at(i), () => m.play(t.hits.length ? (i === 0 ? 'win' : ['points', 'lockin', 'safe'][i % 3]) : 'pop')));
      if (v.tiles[0].hits.length && v.mode === 'top') later(at(0) + 450, () => m.play('cheer'));
      if (v.misses.length) later(900 + n * 700 + 300, () => m.play(['groan', 'laugh', 'sting-comic'][v.n % 3]));
    }).catch(() => {});
  }
  if (v.phase === 'sweep' || v.phase === 'sweepEnd') {
    // During the race only a tile that has just been found is redrawn with a flip; the rest of the board stays put.
    const sk = 's' + v.n, board = el.querySelector('.tsboard.sweep');
    const tile = (t, i) => t ? `<div class="tstile ${t.missed ? 'missed' : 'found'} ${i === v.lastHit && v.phase === 'sweep' ? 'pop' : ''}" data-i="${i}" data-s="${t.first || ''}|${t.more}" style="--c:${TILE[i % TILE.length]}"><i>${i + 1}</i><b>${esc(t.text)}</b>${t.first ? `<span class="tshits"><u>${esc(t.first)}</u>${t.more ? `<u>+${t.more} more</u>` : ''}</span>` : '<em>nobody</em>'}</div>` : `<div class="tstile back" data-i="${i}" data-s="" style="--c:${TILE[i % TILE.length]}"><i>${i + 1}</i><b>?</b></div>`;
    if (v.phase === 'sweep' && board && sweepKey === sk) {
      v.tiles.forEach((t, i) => { const cur = board.querySelector(`[data-i="${i}"]`), want = t ? `${t.first || ''}|${t.more}` : ''; if (cur && cur.dataset.s !== want) cur.outerHTML = tile(t, i); });
      const c = el.querySelector('.tshead .clock'); if (c) { c.textContent = v.left; c.classList.toggle('hurry', v.left <= 8); }
      const f = el.querySelector('.tsfound'); if (f) f.textContent = `${v.foundCount} of ${v.size} found`;
      return;
    }
    sweepKey = v.phase === 'sweep' ? sk : '';
    h = `<p class="cat">Round ${v.n} of ${v.of} · last round</p>${head}<div class="tsrule"><b>${v.phase === 'sweep' ? esc(v.rule) : 'Time! Here is what was left.'}</b><span class="tsfound">${v.foundCount} of ${v.size} found</span></div>
      <div class="tsboard sweep cols${v.size > 5 ? 2 : 1}">${v.tiles.map(tile).join('')}</div><button class="btn ${v.phase === 'sweep' ? 'ghost' : ''}" data-host="next">${v.phase === 'sweep' ? 'Stop the clock' : 'Finish'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} takes the top spot!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel ts">${h}</div>${scores}</div>`;
}

let typed = { key: '', text: '' };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You took the top spot!' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  const top = `<p class="muted">Round ${v.n} of ${v.of} · <b>${esc(v.modeName)}</b></p><p class="tq small">${esc(v.q)}</p>`;
  if (v.phase === 'reveal') {
    el.innerHTML = !v.settled ? `${top}<h2>Watch the TV…</h2><p class="say">The board is turning over.</p>`
      : `${top}<h2 class="${v.pts ? 'win' : 'lose'}">${v.pts ? `+${v.pts.toLocaleString()}` : 'Not on the board'}</h2><p class="say">${v.hit ? `“${esc(v.hit)}” was number ${v.rank}.` : v.text ? `Nobody else said “${esc(v.text)}”.` : 'You did not answer.'}</p><p class="muted">${v.score.toLocaleString()} point${v.score === 1 ? '' : 's'}</p>`;
    return;
  }
  if (v.phase === 'guess' && v.sent) { el.innerHTML = `${top}<h2>Locked in 🔒</h2><p class="say">You said “${esc(v.mine || '')}”.</p>`; return; }
  if (v.phase === 'sweepEnd') { el.innerHTML = `${top}<h2>Time!</h2><p class="say">You found ${v.mine.length} of ${v.size}.</p>`; return; }
  const key = v.phase + v.n;
  if (typed.key !== key) typed = { key, text: '' };
  const sweep = v.phase === 'sweep';
  const note = sweep && v.last ? `<p class="tsnote ${v.last.hit ? 'win' : 'lose'}">${v.last.hit ? `✓ ${esc(v.last.text)} +${v.last.pts}${v.last.first ? ' · first!' : ''}` : v.last.again ? `You already have ${esc(v.last.text)}` : `✗ “${esc(v.last.text)}” is not on the board`}</p>` : '';
  el.innerHTML = `${top}<div class="ahelp"><p><b>${esc(v.rule)}</b></p><p>${esc(v.hint)}</p></div>
    <form id="tsf"><input id="tsi" maxlength="30" autocomplete="off" autocapitalize="off" placeholder="${sweep ? 'Type an answer, press Send, repeat' : 'Your one guess'}" value="${esc(typed.text)}"><p class="lose" id="err"></p><button class="btn" type="submit">${sweep ? 'Send' : 'Lock it in'}</button></form>
    ${note}${sweep ? `<p class="muted">Found ${v.mine.length} of ${v.size}${v.mineText.length ? ': ' + v.mineText.map(esc).join(', ') : ''}</p>` : ''}`;
  const f = el.querySelector('#tsf'), inp = f.querySelector('#tsi');
  inp.oninput = () => { typed.text = inp.value; };
  if (sweep) inp.focus();
  f.onsubmit = e => {
    e.preventDefault();
    const r = cleanGuess(inp.value);
    if (!r.ok) { f.querySelector('#err').textContent = r.why; return; }
    typed.text = ''; if (sweep) { inp.value = ''; inp.focus(); } else f.querySelector('button').disabled = true;
    send({ type: 'guess', text: r.text });
  };
}
