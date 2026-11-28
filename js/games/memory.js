// Memory Match: animal cards face down on the TV. On your turn, flip two on your phone. A pair? Keep it and go again.
// All pictures, and the narrator says whose turn it is, so kids who can't read yet can play.
import { esc } from '../ui.js';
import { pic } from '../art.js';

export const meta = {
  id: 'memory',
  name: 'Memory Match',
  min: 1,
  max: 8,
  blurb: 'Flip two cards, find the animal pairs. All pictures!',
  kids: true,
};

export const PICS = ['🐶', '🐱', '🐸', '🐷', '🐮', '🐵', '🦁', '🐧', '🐢', '🐙', '🦄', '🐝', '🦖', '🐰', '🦊'];
export const NAMES = { '🐶': 'dog', '🐱': 'cat', '🐸': 'frog', '🐷': 'pig', '🐮': 'cow', '🐵': 'monkey', '🦁': 'lion', '🐧': 'penguin', '🐢': 'turtle', '🐙': 'octopus', '🦄': 'unicorn', '🐝': 'bee', '🦖': 'dinosaur', '🐰': 'bunny', '🦊': 'fox' };
export const TIMES = { turn: 30000, peek: 1800 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random) {
  const pairs = players.length <= 4 ? 8 : 10;
  const pics = shuffle([...PICS], rnd).slice(0, pairs);
  const cards = shuffle([...pics, ...pics], rnd).map((pic, i) => ({ i, pic, owner: null }));
  return { game: 'memory', players: shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd), cards, cols: pairs === 8 ? 4 : 5, turn: 0, open: [], phase: 'play', round: 0, moves: 0, eventId: 0, last: null, deadline: Date.now() + TIMES.turn, seen: {} };
}

const cur = s => s.players[s.turn].pid;
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const score = (s, pid) => s.cards.filter(c => c.owner === pid).length / 2;

function flipBack(s, now) {
  s.open = []; s.peekUntil = 0;
  s.turn = (s.turn + 1) % s.players.length; s.moves++;
  s.deadline = now + TIMES.turn;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'play' || pid !== cur(s) || a.type !== 'flip' || s.peekUntil) return s;
  const c = s.cards[a.i];
  if (!c || c.owner || s.open.includes(c.i)) return s;
  s.open.push(c.i);
  s.seen[c.i] = c.pic;
  s.eventId++;
  if (s.open.length === 2) {
    const [x, y] = s.open.map(i => s.cards[i]);
    if (x.pic === y.pic) {
      x.owner = y.owner = pid; s.open = []; s.last = { match: true, pic: x.pic, name: nameOf(s, pid) };
      s.deadline = now + TIMES.turn;
      if (s.cards.every(c => c.owner)) { s.phase = 'over'; s.round++; s.deadline = 0; }
    } else { s.last = { match: false }; s.peekUntil = now + TIMES.peek; }
  } else s.last = null;
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next' || s.phase !== 'play') return s;
  if (s.peekUntil) return flipBack(s, now), s;
  // time's up: flip two random cards for them
  const free = s.cards.filter(c => !c.owner && !s.open.includes(c.i));
  while (s.open.length < 2 && free.length && s.phase === 'play' && !s.peekUntil) act(s, cur(s), { type: 'flip', i: free.splice(Math.floor(rnd() * free.length), 1)[0].i }, now);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase !== 'play') return s;
  if (s.peekUntil && now >= s.peekUntil) flipBack(s, now);
  else if (!s.peekUntil && now >= s.deadline) hostAct(s, 'next', now, rnd);
  return s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: score(s, p.pid) })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'over') { const r = ranking(s); return r[1] && r[0].score === r[1].score ? "It's a tie! Great memory, everyone!" : `Every pair is found! What a memory! ${r[0].name} found the most pairs!`; }
  if (s.moves === 0 && !s.open.length) return `Let's play Memory Match! Find two animals that are the same. ${nameOf(s, cur(s))}, you go first. Tap two cards on your phone.`;
  return '';
}
export function cue(s) {
  if (s.phase === 'over') return { sound: 'win', wait: 1200, title: 'All matched!', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  if (s.moves === 0) return { sound: 'join', wait: 600, title: 'Memory Match', sub: 'Find the pairs!' };
  return null;
}
export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.last?.match) return { id: s.eventId, sound: 'win', say: `A match! Two ${({ octopus: 'octopuses', fox: 'foxes', bunny: 'bunnies' })[NAMES[s.last.pic]] || NAMES[s.last.pic] + 's'}! Go again, ${s.last.name}!` };
  if (s.last && !s.last.match) return { id: s.eventId, sound: 'lose', say: `Not a match. ${nameOf(s, s.players[(s.turn + 1) % s.players.length].pid)}'s turn next!` };
  return { id: s.eventId, sound: 'tick', say: '' };
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'play' || !v.myTurn || v.peeking) return null;
  const free = v.cards.filter(c => !c.owner && !c.up);
  const up = v.cards.find(c => c.up && !c.owner);
  // Bots remember a few cards they've seen.
  if (up && rnd() < 0.5) { const twin = free.find(c => v._seen[c.i] === up.pic); if (twin) return { type: 'flip', i: twin.i }; }
  if (!up && rnd() < 0.4) { for (const a of free) { const b = free.find(c => c.i !== a.i && v._seen[c.i] && v._seen[c.i] === v._seen[a.i]); if (b) return { type: 'flip', i: a.i }; } }
  const c = free[Math.floor(rnd() * free.length)];
  return c ? { type: 'flip', i: c.i } : null;
}

const board = (s, extra = {}) => s.cards.map(c => ({ i: c.i, owner: c.owner ? nameOf(s, c.owner) : null, up: s.open.includes(c.i) || !!c.owner, pic: s.open.includes(c.i) || c.owner ? c.pic : null, ...extra }));
export function tvView(s) {
  return { phase: s.phase, cards: board(s), cols: s.cols, current: nameOf(s, cur(s)), scores: ranking(s), last: s.last, peeking: !!s.peekUntil };
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, cards: board(s), cols: s.cols, myTurn: s.phase === 'play' && cur(s) === pid, current: nameOf(s, cur(s)), mine: score(s, pid), peeking: !!s.peekUntil };
  if (String(pid).startsWith('bot-')) v._seen = s.seen;
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

const grid = (v, tap) => `<div class="mmgrid" style="--cols:${v.cols};--rows:${Math.ceil(v.cards.length / v.cols)}">${v.cards.map(c => `<button class="mmcard ${c.up ? 'up' : ''} ${c.owner ? 'got' : ''}" ${tap && !c.up ? `data-i="${c.i}"` : 'disabled'}><span>${c.up ? pic(c.pic) : '⭐'}</span></button>`).join('')}</div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Pairs</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  const h = v.phase === 'over' ? `<h2 class="win">${esc(v.scores[0].name)} wins!</h2>${grid(v)}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>` : `<h2>${esc(v.current)}'s turn</h2>${grid(v)}${v.last?.match ? `<p class="say win center">Match! ${v.last.pic}${v.last.pic}</p>` : v.peeking ? '<p class="say center">Not a match…</p>' : ''}<button class="btn ghost" data-host="next">Flip for them</button>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  const top = v.phase === 'over' ? `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? '🏆 You won!' : '🎉 Great job!'}</h2>` : v.myTurn ? '<h2 class="kidturn">👉 Your turn! Tap two cards</h2>' : `<h2>⏳ ${esc(v.current)}'s turn</h2>`;
  el.innerHTML = `${top}<p class="kidscore">${'⭐'.repeat(v.mine) || '—'}</p>${grid(v, v.myTurn && !v.peeking)}`;
  el.querySelectorAll('[data-i]').forEach(b => (b.onclick = () => { b.classList.add('up'); send({ type: 'flip', i: Number(b.dataset.i) }); }));
}
