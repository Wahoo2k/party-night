// Bingo: everyone gets a card on their phone, the TV calls numbers (or pictures, for little kids).
// Tap to mark, hit BINGO when you have the pattern. The TV checks every claim against the calls.
import { esc } from '../ui.js';

export const meta = {
  id: 'bingo',
  name: 'Bingo',
  min: 2,
  max: 40,
  blurb: 'Cards on your phone, the TV calls the numbers. Shout it first!',
};

export const PATTERNS = [
  { id: 'line', name: 'Any line', hint: 'A full row, column or diagonal' },
  { id: 'corners', name: 'Four corners', hint: 'All four corner squares' },
  { id: 'blackout', name: 'Full card', hint: 'Every square on the card' },
];
export const PICTURES = [
  ['🐶', 'Dog'], ['🐱', 'Cat'], ['🐮', 'Cow'], ['🐷', 'Pig'], ['🐸', 'Frog'], ['🦁', 'Lion'], ['🐵', 'Monkey'], ['🐔', 'Chicken'],
  ['🐧', 'Penguin'], ['🐢', 'Turtle'], ['🐟', 'Fish'], ['🦋', 'Butterfly'], ['🐝', 'Bee'], ['🐘', 'Elephant'], ['🦒', 'Giraffe'], ['🐰', 'Bunny'],
  ['🍎', 'Apple'], ['🍌', 'Banana'], ['🍕', 'Pizza'], ['🍪', 'Cookie'], ['🍦', 'Ice cream'], ['🥕', 'Carrot'], ['🍓', 'Strawberry'], ['🧁', 'Cupcake'],
  ['🚗', 'Car'], ['🚂', 'Train'], ['✈️', 'Airplane'], ['🚲', 'Bike'], ['🚀', 'Rocket'], ['⛵', 'Boat'], ['🎈', 'Balloon'], ['⚽', 'Ball'],
  ['☀️', 'Sun'], ['🌙', 'Moon'], ['⭐', 'Star'], ['🌈', 'Rainbow'], ['🌳', 'Tree'], ['🌻', 'Flower'], ['🏠', 'House'], ['🎁', 'Present'],
];
export const SPEEDS = { slow: 9000, normal: 6500, fast: 4500 };
const LETTERS = 'BINGO';

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// A card is 25 values in row order; index 12 is the free space (null).
export function makeCard(mode, rnd) {
  const cells = new Array(25);
  if (mode === 'numbers') {
    for (let c = 0; c < 5; c++) {
      const col = shuffle(Array.from({ length: 15 }, (_, i) => c * 15 + i + 1), rnd).slice(0, 5);
      for (let r = 0; r < 5; r++) cells[r * 5 + c] = col[r];
    }
  } else {
    const pics = shuffle(PICTURES.map((p, i) => i), rnd).slice(0, 24);
    for (let i = 0, k = 0; i < 25; i++) if (i !== 12) cells[i] = pics[k++];
  }
  cells[12] = null;
  return cells;
}

const LINES = [
  ...[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map(c => [0, 1, 2, 3, 4].map(r => r * 5 + c)),
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];
export function hasPattern(card, called, pattern) {
  const ok = i => card[i] === null || called.has(card[i]);
  if (pattern === 'line') return LINES.some(l => l.every(ok));
  if (pattern === 'corners') return [0, 4, 20, 24].every(ok);
  return card.every((_, i) => ok(i));
}
// Which squares make the winning pattern (for highlighting).
export function winningCells(card, called, pattern) {
  const ok = i => card[i] === null || called.has(card[i]);
  if (pattern === 'line') return LINES.find(l => l.every(ok)) || [];
  if (pattern === 'corners') return [0, 4, 20, 24];
  return card.map((_, i) => i);
}

export function setup(players, rnd = Math.random, prev = null) {
  const wins = {};
  players.forEach(p => (wins[p.pid] = prev?.wins?.[p.pid] || 0));
  return {
    game: 'bingo',
    phase: 'choose',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    mode: prev?.mode || null,
    speed: prev?.speed || 'normal',
    round: 0,
    wins,
    cards: {}, called: [], bag: [], winners: [], falseClaims: {},
    paused: false,
    deadline: Date.now() + 60000,
    eventId: 0, lastEvent: null,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const pattern = s => PATTERNS[s.round % PATTERNS.length];
const label = (s, v) => (s.mode === 'numbers' ? `${LETTERS[Math.floor((v - 1) / 15)]}-${v}` : PICTURES[v][1]);
const event = (s, name) => { s.eventId++; s.lastEvent = name; };

function startRound(s, now, rnd) {
  s.cards = {};
  s.players.forEach(p => (s.cards[p.pid] = makeCard(s.mode, rnd)));
  s.bag = shuffle(s.mode === 'numbers' ? Array.from({ length: 75 }, (_, i) => i + 1) : PICTURES.map((_, i) => i), rnd);
  s.called = [];
  s.winners = [];
  s.falseClaims = {};
  s.phase = 'calling';
  s.deadline = now + 3500;
}

function call(s, now) {
  if (!s.bag.length) { s.phase = 'roundEnd'; s.deadline = now + 8000; return; }
  s.called.push(s.bag.shift());
  event(s, 'call');
  s.deadline = now + SPEEDS[s.speed];
}

export function act(s, pid, a, now = Date.now()) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'calling' && a.type === 'bingo') {
    if (!hasPattern(s.cards[pid], new Set(s.called), pattern(s).id)) { s.falseClaims[pid] = (s.falseClaims[pid] || 0) + 1; s.lastFalse = pid; event(s, 'false'); return s; }
    s.winners = [pid];
    s.phase = 'bingo';
    s.deadline = now + 3500;           // a short window for anyone else who had it on the same call
    event(s, 'bingo');
  } else if (s.phase === 'bingo' && a.type === 'bingo' && !s.winners.includes(pid) && hasPattern(s.cards[pid], new Set(s.called), pattern(s).id)) {
    s.winners.push(pid);
  }
  return s;
}

function settleBingo(s, now) {
  s.winners.forEach(w => (s.wins[w] = (s.wins[w] || 0) + 1));
  s.phase = 'roundEnd';
  s.deadline = now + 9000;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a === 'numbers' || a === 'pictures') { s.mode = a; s.round = 0; startRound(s, now, rnd); return s; }
  if (a === 'slow' || a === 'normal' || a === 'fast') { s.speed = a; return s; }
  if (a === 'pause' && s.phase === 'calling') { s.paused = !s.paused; s.deadline = now + SPEEDS[s.speed]; return s; }
  if (a === 'next') {
    if (s.phase === 'choose') { s.mode = 'numbers'; startRound(s, now, rnd); }
    else if (s.phase === 'calling') call(s, now);
    else if (s.phase === 'bingo') settleBingo(s, now);
    else if (s.phase === 'roundEnd') nextRound(s, now, rnd);
  }
  return s;
}

function nextRound(s, now, rnd) {
  if (s.round + 1 >= PATTERNS.length) { s.phase = 'over'; return; }
  s.round++;
  startRound(s, now, rnd);
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (now < s.deadline) return s;
  if (s.phase === 'calling' && !s.paused) call(s, now);
  else if (s.phase === 'bingo') settleBingo(s, now);
  else if (s.phase === 'roundEnd') nextRound(s, now, rnd);
  return s;
}

export function narration(s) {
  if (s.phase === 'choose') return 'Welcome to Bingo! Pick numbers or pictures on the TV.';
  if (s.phase === 'calling' && !s.called.length) return `Round ${s.round + 1}: ${pattern(s).name}. ${pattern(s).hint}. Good luck!`;
  if (s.phase === 'roundEnd') return s.winners.length ? `Bingo for ${s.winners.map(w => nameOf(s, w)).join(' and ')}!` : 'Out of calls! No winner this round.';
  if (s.phase === 'over') return 'That\'s all for Bingo. Thanks for playing!';
  return '';
}

export function cue(s) {
  if (s.phase === 'calling' && !s.called.length) return { sound: 'join', wait: 900, title: `Round ${s.round + 1}`, sub: pattern(s).name };
  if (s.phase === 'bingo') return { sound: 'win', wait: 300, title: 'BINGO!', sub: nameOf(s, s.winners[0]), tone: 'dawn', fx: 'confetti' };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'Thanks for playing!', tone: 'dawn' };
  return null;
}

const SAY_NUM = v => { const L = LETTERS[Math.floor((v - 1) / 15)]; return `${L}. ${v}.`; };
export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.lastEvent === 'call') { const v = s.called[s.called.length - 1]; return { id: s.eventId, sound: 'tick', say: s.mode === 'numbers' ? SAY_NUM(v) : PICTURES[v][1] + '!' }; }
  if (s.lastEvent === 'false') return { id: s.eventId, sound: 'vote', say: `Not quite, ${nameOf(s, s.lastFalse)}. Keep playing!` };
  return null;
}

// Bots claim as soon as their card has the pattern (after a human-ish pause).
export function botAct(v) {
  if ((v.phase === 'calling' || v.phase === 'bingo') && v.hasIt && !v.claimed) return { type: 'bingo' };
  return null;
}

// ---------- views ----------
export function tvView(s, now = Date.now()) {
  const v = {
    phase: s.phase, mode: s.mode, speed: s.speed, paused: s.paused,
    round: s.round + 1, rounds: PATTERNS.length, pattern: s.phase === 'choose' ? null : pattern(s),
    count: s.called.length,
    total: s.mode === 'numbers' ? 75 : PICTURES.length,
    last: s.called.length ? s.called[s.called.length - 1] : null,
    recent: s.called.slice(-6, -1).reverse(),
    called: s.called,
    winners: s.winners.map(w => nameOf(s, w)),
    eventId: s.eventId, lastEvent: s.lastEvent, falseName: s.lastEvent === 'false' ? nameOf(s, s.lastFalse) : null,
    standings: s.players.map(p => ({ name: p.name, wins: s.wins[p.pid] || 0 })).sort((a, b) => b.wins - a.wins),
    players: s.players.length,
  };
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, mode: s.mode, round: s.round, wins: s.wins[pid] || 0, pattern: s.phase === 'choose' ? null : pattern(s) };
  if (s.cards[pid]) {
    v.card = s.cards[pid];
    v.called = s.called;
    v.last = s.called.length ? s.called[s.called.length - 1] : null;
    v.hasIt = hasPattern(s.cards[pid], new Set(s.called), pattern(s).id);
    v.claimed = s.winners.includes(pid);
    v.falseClaims = s.falseClaims[pid] || 0;
    v.cardId = `${s.round}-${s.cards[pid].join(',')}`;
  }
  if (s.phase === 'roundEnd' || s.phase === 'bingo') { v.winners = s.winners.map(w => nameOf(s, w)); v.iWon = s.winners.includes(pid); if (v.iWon) v.winCells = winningCells(s.cards[pid], new Set(s.called), pattern(s).id); }
  return v;
}

// ---------- renderers ----------
const cellLabel = (mode, val) => (val === null ? '★' : mode === 'numbers' ? String(val) : PICTURES[val][0]);
const ballText = (mode, val) => (mode === 'numbers' ? `<small>${LETTERS[Math.floor((val - 1) / 15)]}</small>${val}` : `${PICTURES[val][0]}<small>${esc(PICTURES[val][1])}</small>`);

export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const standings = `<div class="scores"><h3>Bingos</h3>${v.standings.slice(0, 12).map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.wins}</b></div>`).join('')}${v.players > 12 ? `<p class="muted small">+${v.players - 12} more</p>` : ''}</div>`;
  let h = '';
  if (v.phase === 'choose') h = `<h2>Bingo</h2><p class="say">Numbers for grown-ups and big kids, pictures for little ones.</p><div class="row"><button class="btn" data-host="numbers">Number bingo</button><button class="btn" data-host="pictures">Picture bingo</button></div><p class="muted">Three rounds: any line, four corners, then a full card.</p>`;
  else {
    const speed = `<div class="row speed"><span class="muted">Speed</span>${['slow', 'normal', 'fast'].map(k => `<button class="btn ghost ${v.speed === k ? 'on' : ''}" data-host="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}<button class="btn ghost" data-host="pause">${v.paused ? 'Resume' : 'Pause'}</button></div>`;
    const ball = v.last !== null ? `<div class="ball ${v.mode}" data-e="${v.eventId}">${ballText(v.mode, v.last)}</div>` : '<div class="ball empty">?</div>';
    const recent = `<div class="recentballs">${v.recent.map(x => `<span>${v.mode === 'numbers' ? `${LETTERS[Math.floor((x - 1) / 15)]}${x}` : PICTURES[x][0]}</span>`).join('')}</div>`;
    const calledSet = new Set(v.called);
    const grid = v.mode === 'numbers'
      ? `<div class="calledgrid">${[0, 1, 2, 3, 4].map(c => `<div class="crow"><b>${LETTERS[c]}</b>${Array.from({ length: 15 }, (_, i) => c * 15 + i + 1).map(n => `<span class="${calledSet.has(n) ? 'on' : ''} ${n === v.last ? 'last' : ''}">${n}</span>`).join('')}</div>`).join('')}</div>`
      : `<div class="calledgrid pics">${PICTURES.map((p, i) => `<span class="${calledSet.has(i) ? 'on' : ''} ${i === v.last ? 'last' : ''}">${p[0]}</span>`).join('')}</div>`;
    const status = v.phase === 'bingo' ? `<p class="say win">BINGO! ${v.winners.map(esc).join(' & ')}</p><p class="muted">Anyone else who had it on this call, hit BINGO now!</p>`
      : v.phase === 'roundEnd' ? `<p class="say ${v.winners.length ? 'win' : ''}">${v.winners.length ? `Round ${v.round} goes to ${v.winners.map(esc).join(' & ')}!` : 'No winner this round.'}</p><button class="btn" data-host="next">${v.round >= v.rounds ? 'Finish' : 'Next round'}</button>`
      : v.phase === 'over' ? `<h2 class="win">${esc(v.standings[0]?.name || '')} leads with ${v.standings[0]?.wins || 0}!</h2><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`
      : v.falseName ? `<p class="say lose">False bingo from ${esc(v.falseName)}! Keep playing.</p>` : `<p class="muted">Call ${v.count} of ${v.total}${v.paused ? ' · paused' : ''}</p>`;
    h = `<p class="cat">Round ${v.round} of ${v.rounds} · <b>${esc(v.pattern.name)}</b> · ${esc(v.pattern.hint)}</p><div class="bingotop">${ball}<div>${recent}${status}</div></div>${grid}${v.phase === 'calling' ? speed : ''}`;
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${standings}</div>`;
}

// Marks live on the phone only (the TV checks claims against its own calls).
let marks = { id: '', set: new Set() };
let auto = (() => { try { return localStorage.getItem('pg-bingo-auto') === '1'; } catch { return false; } })();

export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll get a card next round.</p>'; return; }
  if (v.phase === 'choose' || !v.card) { el.innerHTML = '<h2>Bingo</h2><p class="say">The host is choosing numbers or pictures…</p>'; return; }
  if (marks.id !== v.cardId) marks = { id: v.cardId, set: new Set([12]) };
  const called = new Set(v.called);
  if (auto) v.card.forEach((val, i) => { if (val !== null && called.has(val)) marks.set.add(i); });
  const win = new Set(v.winCells || []);
  const head = v.mode === 'numbers' ? `<div class="bcard-head">${LETTERS.split('').map(l => `<b>${l}</b>`).join('')}</div>` : '';
  const lastTxt = v.last === null ? 'Get ready…' : v.mode === 'numbers' ? `${LETTERS[Math.floor((v.last - 1) / 15)]}-${v.last}` : `${PICTURES[v.last][0]} ${PICTURES[v.last][1]}`;
  let h = `<p class="muted">Round ${v.round + 1} · <b>${esc(v.pattern.name)}</b> · ${esc(v.pattern.hint)}</p>
    <div class="lastcall">Last call: <b>${esc(lastTxt)}</b></div>
    ${head}<div class="bcard ${v.mode}">${v.card.map((val, i) => `<button class="bsq ${marks.set.has(i) ? 'mk' : ''} ${val === null ? 'free' : ''} ${win.has(i) ? 'wn' : ''}" data-i="${i}">${cellLabel(v.mode, val)}</button>`).join('')}</div>`;
  if (v.phase === 'calling') h += `<button class="buzz bingo ${v.claimed ? '' : 'live'}" data-bingo ${v.claimed ? 'disabled' : ''}>BINGO!</button>${v.falseClaims ? '<p class="muted center">Not yet! Check the pattern and keep marking.</p>' : ''}<label class="check"><input type="checkbox" id="auto" ${auto ? 'checked' : ''}> Mark called squares for me</label>`;
  else if (v.phase === 'bingo') h += v.iWon ? '<h2 class="win center">BINGO! You got it!</h2>' : `<p class="say center">${(v.winners || []).map(esc).join(' & ')} called BINGO!</p><button class="buzz bingo live" data-bingo>Me too!</button>`;
  else if (v.phase === 'roundEnd') h += `<h2 class="center ${v.iWon ? 'win' : ''}">${v.iWon ? 'You won this round!' : v.winners?.length ? `${v.winners.map(esc).join(' & ')} won` : 'No winner'}</h2>`;
  else if (v.phase === 'over') h = `<h2>Thanks for playing!</h2><p class="say">You got ${v.wins} bingo${v.wins === 1 ? '' : 's'}.</p>`;
  el.innerHTML = h;
  el.querySelectorAll('.bsq').forEach(b => (b.onclick = () => {
    const i = Number(b.dataset.i);
    if (i === 12) return;
    marks.set.has(i) ? marks.set.delete(i) : marks.set.add(i);
    b.classList.toggle('mk');
    try { navigator.vibrate?.(15); } catch {}
  }));
  el.querySelector('[data-bingo]')?.addEventListener('click', () => { try { navigator.vibrate?.([60, 40, 60]); } catch {} send({ type: 'bingo' }); });
  const a = el.querySelector('#auto');
  if (a) a.onchange = () => { auto = a.checked; try { localStorage.setItem('pg-bingo-auto', auto ? '1' : '0'); } catch {} renderPhone(v, el, send); };
}
