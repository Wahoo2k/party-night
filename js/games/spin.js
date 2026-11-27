// Spin & Solve: a word puzzle on the TV. On your turn, spin the wheel on your phone, call a consonant,
// buy a vowel, or solve. Our own wheel, names and look (inspired by classic TV word-puzzle shows).
import { esc } from '../ui.js';

export const meta = {
  id: 'spin',
  name: 'Spin & Solve',
  min: 2,
  max: 8,
  blurb: 'Spin the wheel on your phone, call letters and solve the puzzle.',
};

export const PUZZLES = [
  { cat: 'Phrase', a: 'BREAK A LEG' }, { cat: 'Phrase', a: 'PIECE OF CAKE' }, { cat: 'Phrase', a: 'BETTER LATE THAN NEVER' },
  { cat: 'Phrase', a: 'THE BALL IS IN YOUR COURT' }, { cat: 'Phrase', a: 'EASY AS PIE' }, { cat: 'Phrase', a: 'HOME SWEET HOME' },
  { cat: 'Phrase', a: 'PRACTICE MAKES PERFECT' }, { cat: 'Phrase', a: 'TIME FLIES WHEN YOU\'RE HAVING FUN' },
  { cat: 'Thing', a: 'BIRTHDAY CAKE' }, { cat: 'Thing', a: 'ROLLER COASTER' }, { cat: 'Thing', a: 'REMOTE CONTROL' },
  { cat: 'Thing', a: 'GARDEN HOSE' }, { cat: 'Thing', a: 'TREASURE CHEST' }, { cat: 'Thing', a: 'HOT AIR BALLOON' },
  { cat: 'Place', a: 'GRAND CANYON' }, { cat: 'Place', a: 'STATUE OF LIBERTY' }, { cat: 'Place', a: 'NIAGARA FALLS' },
  { cat: 'Place', a: 'YELLOWSTONE NATIONAL PARK' }, { cat: 'Place', a: 'MOUNT EVEREST' }, { cat: 'Place', a: 'GREAT WALL OF CHINA' },
  { cat: 'Food & Drink', a: 'PEANUT BUTTER AND JELLY' }, { cat: 'Food & Drink', a: 'CHOCOLATE CHIP COOKIES' },
  { cat: 'Food & Drink', a: 'SPAGHETTI AND MEATBALLS' }, { cat: 'Food & Drink', a: 'HOT COCOA WITH MARSHMALLOWS' },
  { cat: 'Food & Drink', a: 'PUMPKIN PIE' }, { cat: 'Food & Drink', a: 'GRILLED CHEESE SANDWICH' },
  { cat: 'Event', a: 'THANKSGIVING DINNER' }, { cat: 'Event', a: 'FAMILY GAME NIGHT' }, { cat: 'Event', a: 'SURPRISE BIRTHDAY PARTY' },
  { cat: 'Event', a: 'FOURTH OF JULY FIREWORKS' }, { cat: 'Event', a: 'SNOWBALL FIGHT' }, { cat: 'Event', a: 'BACKYARD BARBECUE' },
  { cat: 'Fun & Games', a: 'HIDE AND SEEK' }, { cat: 'Fun & Games', a: 'MUSICAL CHAIRS' }, { cat: 'Fun & Games', a: 'TIC TAC TOE' },
  { cat: 'Fun & Games', a: 'CONNECT THE DOTS' }, { cat: 'Fun & Games', a: 'SCAVENGER HUNT' },
  { cat: 'Animal', a: 'GIANT PANDA' }, { cat: 'Animal', a: 'BALD EAGLE' }, { cat: 'Animal', a: 'GOLDEN RETRIEVER' },
];

// 16 wedges, clockwise from the top. 'skip' = lose your turn, 'wipe' = lose this round's cash and your turn.
export const WEDGES = [500, 300, 900, 'skip', 400, 600, 350, 800, 'wipe', 450, 700, 300, 550, 250, 650, 'skip'];
const SLICE = 360 / WEDGES.length;
export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const VOWEL_COST = 250;
const ROUNDS = 3;
export const TIMES = { spin: 3600, idle: 35000, solveType: 30000, roundEnd: 6000, pass: 1800 };

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const letters = a => [...new Set(a.replace(/[^A-Z]/g, '').split(''))];
const cleanSolve = t => String(t || '').toUpperCase().replace(/[^A-Z]/g, '');

export function setup(players, rnd = Math.random, prev = null) {
  const recent = new Set(prev?.usedPuzzles || []);
  let pool = PUZZLES.map((p, i) => i).filter(i => !recent.has(i));
  if (pool.length < ROUNDS) pool = PUZZLES.map((p, i) => i);
  const picks = shuffle(pool, rnd).slice(0, ROUNDS);
  const cash = {}, total = {};
  players.forEach(p => { cash[p.pid] = 0; total[p.pid] = 0; });
  return {
    game: 'spin',
    phase: 'turn',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    order: shuffle(players.map(p => p.pid), rnd),
    puzzles: picks, r: 0, t: 0,
    guessed: [],            // letters called this round
    sub: 'spin',            // 'spin' | 'letter' (after landing on cash) | 'solve'
    wedge: null, angle: 0, spinId: 0,
    cash, total,
    msg: '', eventId: 0, lastEvent: null,
    busyUntil: 0, deadline: Date.now() + TIMES.idle,
    usedPuzzles: [...recent, ...picks].slice(-30),
    solvedBy: null,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const current = s => s.order[s.t % s.order.length];
const puzzle = s => PUZZLES[s.puzzles[s.r]];
const remaining = s => letters(puzzle(s).a).filter(l => !s.guessed.includes(l));
const consonantsLeft = s => remaining(s).some(l => !VOWELS.includes(l));
const event = (s, name) => { s.eventId++; s.lastEvent = name; };

function pass(s, now, why) {
  s.msg = why;
  s.t++;
  s.sub = 'spin';
  s.wedge = null;
  s.busyUntil = Math.max(s.busyUntil, now + TIMES.pass);
  s.deadline = now + TIMES.pass + TIMES.idle;
}

function solved(s, pid, now) {
  s.total[pid] += Math.max(s.cash[pid], 0);
  s.guessed = letters(puzzle(s).a);
  s.solvedBy = pid;
  s.phase = 'roundEnd';
  s.deadline = now + TIMES.roundEnd;
  event(s, 'solved');
}

function nextRound(s, now) {
  if (s.r + 1 >= s.puzzles.length) { s.phase = 'over'; return; }
  s.r++;
  s.players.forEach(p => (s.cash[p.pid] = 0));
  s.guessed = [];
  s.solvedBy = null;
  s.t = s.r;                 // rotate who starts
  s.sub = 'spin'; s.wedge = null; s.msg = '';
  s.phase = 'turn';
  s.deadline = now + TIMES.idle;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (s.phase !== 'turn' || !a || pid !== current(s) || now < s.busyUntil) return s;
  if (a.type === 'spin' && s.sub === 'spin' && consonantsLeft(s)) {
    const i = Math.floor(rnd() * WEDGES.length);
    const offset = SLICE * (0.15 + rnd() * 0.7);
    const target = 360 - (i * SLICE + offset);
    s.angle = s.angle - (s.angle % 360) + 360 * 5 + target;
    s.wedge = WEDGES[i];
    s.spinId++;
    event(s, 'spin');
    s.busyUntil = now + TIMES.spin;
    s.deadline = now + TIMES.spin + TIMES.idle;
    if (s.wedge === 'skip') { s.pending = 'skip'; }
    else if (s.wedge === 'wipe') { s.pending = 'wipe'; }
    else { s.sub = 'letter'; s.msg = ''; }
  } else if (a.type === 'letter' && s.sub === 'letter') {
    const L = String(a.letter || '').toUpperCase();
    if (!/^[A-Z]$/.test(L) || VOWELS.includes(L) || s.guessed.includes(L)) return s;
    s.guessed.push(L);
    const n = puzzle(s).a.split('').filter(c => c === L).length;
    s.last = { letter: L, n };
    event(s, n ? 'hit' : 'miss');
    if (n) { s.cash[pid] += s.wedge * n; s.msg = `${n} ${L}${n > 1 ? "'s" : ''}! +${(s.wedge * n).toLocaleString()}`; s.sub = 'spin'; s.wedge = null; s.deadline = now + TIMES.idle; }
    else pass(s, now, `No ${L}.`);
  } else if (a.type === 'vowel' && s.sub === 'spin') {
    const L = String(a.letter || '').toUpperCase();
    if (!VOWELS.includes(L) || s.guessed.includes(L) || s.cash[pid] < VOWEL_COST) return s;
    s.cash[pid] -= VOWEL_COST;
    s.guessed.push(L);
    const n = puzzle(s).a.split('').filter(c => c === L).length;
    s.last = { letter: L, n };
    event(s, n ? 'hit' : 'miss');
    if (n) { s.msg = `${n} ${L}${n > 1 ? "'s" : ''}.`; s.deadline = now + TIMES.idle; }
    else pass(s, now, `No ${L}.`);
  } else if (a.type === 'solveStart' && s.sub === 'spin') {
    s.sub = 'solve'; s.deadline = now + TIMES.solveType;
  } else if (a.type === 'solve' && (s.sub === 'solve' || s.sub === 'spin')) {
    if (cleanSolve(a.text) === cleanSolve(puzzle(s).a)) solved(s, pid, now);
    else { event(s, 'miss'); pass(s, now, `"${String(a.text || '').slice(0, 40)}" isn't it.`); }
  }
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'turn') pass(s, now, 'Turn skipped.');
  else if (s.phase === 'roundEnd') nextRound(s, now);
  return s;
}

export function tick(s, now = Date.now()) {
  if (s.phase === 'roundEnd' && now >= s.deadline) return nextRound(s, now), s;
  if (s.phase !== 'turn') return s;
  if (s.pending && now >= s.busyUntil) {
    const p = current(s);
    if (s.pending === 'wipe') { s.cash[p] = 0; event(s, 'wipe'); pass(s, now, 'Wipeout! Round cash gone.'); }
    else { event(s, 'skip'); pass(s, now, 'Skip! Next player.'); }
    s.pending = null;
  } else if (now >= s.deadline && now >= s.busyUntil) pass(s, now, 'Time\'s up.');
  return s;
}

export function narration(s) {
  if (s.phase === 'turn' && s.guessed.length === 0 && !s.spinId) return `Welcome to Spin and Solve! The category is ${puzzle(s).cat}. ${nameOf(s, current(s))}, spin the wheel on your phone.`;
  if (s.phase === 'turn' && s.guessed.length === 0 && s.r > 0) return `Round ${s.r + 1}. The category is ${puzzle(s).cat}.`;
  if (s.phase === 'roundEnd') return `${nameOf(s, s.solvedBy)} solved it!`;
  if (s.phase === 'over') return `${nameOf(s, winner(s))} wins Spin and Solve!`;
  return '';
}
const winner = s => [...s.players].sort((a, b) => s.total[b.pid] - s.total[a.pid])[0].pid;

export function cue(s) {
  if (s.phase === 'turn' && s.guessed.length === 0) return { sound: 'join', wait: 800, title: s.r === 0 ? 'Spin & Solve' : `Round ${s.r + 1}`, sub: puzzle(s).cat };
  if (s.phase === 'roundEnd') return { sound: 'win', wait: 1200, fx: 'confetti' };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: 'Game Over', sub: `${nameOf(s, winner(s))} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function cueEvent(s) {
  if (!s.eventId) return null;
  const id = s.eventId;
  switch (s.lastEvent) {
    case 'spin': return { id, sound: 'drumroll', say: '', delay: 0 };
    case 'hit': return { id, sound: 'safe', say: s.last.n > 1 ? `${s.last.n} ${s.last.letter}'s` : `One ${s.last.letter}` };
    case 'miss': return { id, sound: 'vote', say: s.last && s.msg.startsWith('No') ? `No ${s.last.letter}` : 'Sorry, no.' };
    case 'wipe': return { id, sound: 'lose', say: 'Wipeout!' };
    case 'skip': return { id, sound: 'death', say: 'Skip!' };
  }
  return null;
}

// Bots call common letters, buy vowels now and then, and solve once most of the board is showing.
const FREQ = 'TNSRHLDCMGPBFYWKVXJQZ';
export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'turn' || !v.myTurn || v.busy) return null;
  if (v.sub === 'letter') { const L = FREQ.split('').find(l => !v.guessed.includes(l)); return L ? { type: 'letter', letter: L } : null; }
  if (v.sub === 'solve') return { type: 'solve', text: v._a };
  if (v.shown >= 0.7 || (!v.canSpin && v.shown >= 0.5)) return { type: 'solve', text: rnd() < 0.9 ? v._a : 'no idea' };
  const vowel = 'EAOIU'.split('').find(l => !v.guessed.includes(l));
  if (vowel && v.cash >= VOWEL_COST && (rnd() < 0.3 || !v.canSpin)) return { type: 'vowel', letter: vowel };
  if (v.canSpin) return { type: 'spin' };
  return { type: 'solve', text: v._a };
}

// ---------- views ----------
function rows(text, max = 13) {
  const out = [];
  let line = '';
  for (const w of text.split(' ')) {
    if (line && (line + ' ' + w).length > max) { out.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}

export function tvView(s, now = Date.now()) {
  const pz = puzzle(s);
  const show = c => !/[A-Z]/.test(c) || s.guessed.includes(c);
  return {
    phase: s.phase, round: s.r + 1, rounds: s.puzzles.length, cat: pz.cat,
    rows: rows(pz.a).map(line => line.split('').map(c => ({ c: show(c) ? c : '', blank: c === ' ', hidden: !show(c), fresh: s.last && c === s.last.letter }))),
    guessed: s.guessed,
    who: nameOf(s, current(s)),
    sub: s.sub, wedge: s.wedge, angle: s.angle, spinId: s.spinId,
    spinning: now < s.busyUntil && s.lastEvent === 'spin',
    msg: s.msg,
    board: s.order.map(pid => ({ name: nameOf(s, pid), cash: s.cash[pid], total: s.total[pid], now: pid === current(s) && s.phase === 'turn' })),
    solvedBy: s.solvedBy ? nameOf(s, s.solvedBy) : null,
    answer: s.phase !== 'turn' ? pz.a : null,
    winner: s.phase === 'over' ? nameOf(s, winner(s)) : null,
  };
}

export function phoneView(s, pid, now = Date.now()) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const pz = puzzle(s);
  const all = pz.a.replace(/[^A-Z]/g, '');
  const shownCount = all.split('').filter(c => s.guessed.includes(c)).length;
  const v = {
    phase: s.phase, cat: pz.cat, myTurn: current(s) === pid, who: nameOf(s, current(s)),
    sub: s.sub, wedge: s.wedge, guessed: s.guessed, cash: s.cash[pid], total: s.total[pid],
    busy: now < s.busyUntil, canSpin: consonantsLeft(s), msg: s.msg,
    pattern: pz.a.split('').map(c => (/[A-Z]/.test(c) && !s.guessed.includes(c) ? '_' : c)).join(''),
    shown: all.length ? shownCount / all.length : 0,
    vowelsLeft: VOWELS.some(l => !s.guessed.includes(l)),
  };
  if (String(pid).startsWith('bot-')) v._a = pz.a;
  if (s.phase === 'over') { v.won = winner(s) === pid; v.winner = nameOf(s, winner(s)); }
  if (s.phase === 'roundEnd') { v.answer = pz.a; v.solvedBy = nameOf(s, s.solvedBy); }
  return v;
}

// ---------- wheel drawing ----------
const COLORS = ['#e2483d', '#ffcf6b', '#7fc8a9', '#a9b8ff', '#ff8a1f', '#c77dff', '#4cc9f0', '#f4e9c1'];
function wheelSvg(size = 300) {
  const r = 140;
  const wedge = (i) => {
    const a0 = (i * SLICE - 90) * Math.PI / 180, a1 = ((i + 1) * SLICE - 90) * Math.PI / 180;
    const x0 = r * Math.cos(a0), y0 = r * Math.sin(a0), x1 = r * Math.cos(a1), y1 = r * Math.sin(a1);
    const w = WEDGES[i];
    const fill = w === 'wipe' ? '#111' : w === 'skip' ? '#fff' : COLORS[i % COLORS.length];
    const label = w === 'wipe' ? 'WIPEOUT' : w === 'skip' ? 'SKIP' : String(w);
    const mid = (i + 0.5) * SLICE;
    const ink = w === 'wipe' ? '#fff' : '#1b1b2f';
    return `<path d="M0 0L${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z" fill="${fill}" stroke="#0e1230" stroke-width="2"/>
      <text transform="rotate(${mid}) translate(0 -${r - 10}) rotate(90)" text-anchor="start" dominant-baseline="middle" font-size="${typeof w === 'number' ? 17 : 12}" font-weight="800" fill="${ink}" font-family="Outfit,sans-serif" style="paint-order:normal;stroke:none">${label}</text>`;
  };
  return `<svg viewBox="-150 -150 300 300" width="${size}" height="${size}"><circle r="148" fill="#0e1230"/>${WEDGES.map((_, i) => wedge(i)).join('')}<circle r="22" fill="#f4e9c1" stroke="#0e1230" stroke-width="3"/></svg>`;
}

// ---------- renderers ----------
const money = n => '$' + n.toLocaleString();

export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const boardHtml = `<div class="pboard">${v.rows.map(r => `<div class="prow">${r.map(t => `<div class="ptile ${t.blank ? 'sp' : ''} ${t.hidden ? 'hid' : 'on'} ${t.fresh && !t.hidden ? 'flip' : ''}">${esc(t.c)}</div>`).join('')}</div>`).join('')}</div>`;
  const used = `<div class="used">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => `<span class="${v.guessed.includes(l) ? 'x' : ''} ${'AEIOU'.includes(l) ? 'vw' : ''}">${l}</span>`).join('')}</div>`;
  const scores = `<div class="scores"><h3>Round ${v.round} of ${v.rounds}</h3>${v.board.map(p => `<div class="srow ${p.now ? 'now' : ''}"><span>${esc(p.name)}</span><b>${money(p.cash)}<small class="muted"> · ${money(p.total)}</small></b></div>`).join('')}<p class="muted small">Round cash · banked total</p></div>`;
  const wheel = `<div class="wheelwrap"><div class="pointer"></div><div class="wheel ${v.spinning ? 'spinning' : ''}" style="--to:${v.angle}deg;--from:${v.angle - 1800}deg">${wheelSvg()}</div></div>`;
  let status = '';
  if (v.phase === 'turn') status = v.spinning ? `<p class="say">${esc(v.who)} spins…</p>` : v.sub === 'letter' ? `<p class="say">${esc(v.who)} landed on <b class="win">${money(v.wedge)}</b>. Call a consonant!</p>` : v.sub === 'solve' ? `<p class="say">${esc(v.who)} is solving…</p>` : `<p class="say">${v.msg ? esc(v.msg) + ' ' : ''}<b>${esc(v.who)}</b>: spin, buy a vowel, or solve.</p>`;
  let h = `<p class="cat">${esc(v.cat)}</p>${boardHtml}`;
  if (v.phase === 'turn') h += `<div class="spinrow">${wheel}<div>${status}${used}<button class="btn ghost" data-host="next">Skip turn</button></div></div>`;
  if (v.phase === 'roundEnd') h += `<div class="spinrow">${wheel}<div><h2 class="win">${esc(v.solvedBy)} solved it!</h2><button class="btn" data-host="next">Next puzzle</button></div></div>`;
  if (v.phase === 'over') h += `<h2 class="win">${esc(v.winner)} wins!</h2><div class="podium">${[...v.board].sort((a, b) => b.total - a.total).slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${money(p.total)}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  const pat = `<p class="pattern">${esc(v.pattern || '')}</p>`;
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>';
  else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'You won!' : `${esc(v.winner)} wins!`}</h2><p class="say">You banked ${money(v.total)}.</p>`;
  else if (v.phase === 'roundEnd') h = `<h2>${esc(v.solvedBy)} solved it!</h2><p class="pattern">${esc(v.answer)}</p><p class="muted">Your total: ${money(v.total)}</p>`;
  else if (!v.myTurn) h = `<p class="muted">${esc(v.cat)}</p>${pat}<h2>${esc(v.who)}'s turn</h2><p class="muted">Your round cash: ${money(v.cash)} · banked ${money(v.total)}</p>`;
  else if (v.busy) h = `<p class="muted">${esc(v.cat)}</p>${pat}<h2>Spinning…</h2><p class="say">Watch the wheel!</p>`;
  else if (v.sub === 'letter') h = `<p class="muted">${esc(v.cat)}</p>${pat}<h2>${money(v.wedge)} per letter</h2><p class="muted">Pick a consonant</p><div class="keys">${'BCDFGHJKLMNPQRSTVWXYZ'.split('').map(l => `<button class="key" data-l="${l}" ${v.guessed.includes(l) ? 'disabled' : ''}>${l}</button>`).join('')}</div>`;
  else if (v.sub === 'solve') h = `<p class="muted">${esc(v.cat)}</p>${pat}<form id="sf"><label for="sol">Solve the puzzle</label><input id="sol" autocomplete="off" autocapitalize="characters" required><button class="btn" type="submit">Solve</button></form>`;
  else h = `<p class="muted">${esc(v.cat)}</p>${pat}<h2>Your turn</h2>${v.msg ? `<p class="say">${esc(v.msg)}</p>` : ''}<p class="muted">Round cash: <b>${money(v.cash)}</b></p>
      ${v.canSpin ? '<div class="spinpad" id="spinpad"><div class="miniwheel">' + wheelSvg(140) + '</div><b>Swipe to spin</b><small>or tap</small></div>' : '<p class="say">All consonants are showing. Buy a vowel or solve!</p>'}
      ${v.vowelsLeft ? `<p class="muted">Buy a vowel (${money(VOWEL_COST)})</p><div class="keys vowels">${VOWELS.map(l => `<button class="key" data-v="${l}" ${v.guessed.includes(l) || v.cash < VOWEL_COST ? 'disabled' : ''}>${l}</button>`).join('')}</div>` : ''}
      <button class="btn ghost" data-solve>Solve the puzzle</button>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-l]').forEach(b => (b.onclick = () => send({ type: 'letter', letter: b.dataset.l })));
  el.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => send({ type: 'vowel', letter: b.dataset.v })));
  el.querySelector('[data-solve]')?.addEventListener('click', () => send({ type: 'solveStart' }));
  const sf = el.querySelector('#sf');
  if (sf) { sf.querySelector('input').focus(); sf.onsubmit = e => { e.preventDefault(); sf.querySelector('button').disabled = true; send({ type: 'solve', text: sf.querySelector('input').value }); }; }
  const pad = el.querySelector('#spinpad');
  if (pad) {
    let x0 = null, y0 = null, fired = false;
    const fire = () => { if (fired) return; fired = true; pad.classList.add('go'); try { navigator.vibrate?.(40); } catch {} send({ type: 'spin' }); };
    pad.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; pad.setPointerCapture?.(e.pointerId); });
    pad.addEventListener('pointermove', e => { if (x0 !== null && Math.hypot(e.clientX - x0, e.clientY - y0) > 50) fire(); });
    pad.addEventListener('pointerup', () => { if (x0 !== null) fire(); x0 = null; });
  }
}
