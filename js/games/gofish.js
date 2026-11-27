// Go Fish, with animal picture cards so little kids can play. Ask someone for an animal you hold;
// if they have any, you take them all and go again. Four of a kind makes a set. Most sets wins.
import { esc } from '../ui.js';
import { pic } from '../art.js';
import { shuffle } from './cards.js';

export const meta = {
  id: 'gofish',
  name: 'Go Fish',
  min: 2,
  max: 6,
  blurb: 'Ask for cards, make matches. Picture cards for little ones.',
  kids: true,
};

export const ANIMALS = [['🐶', 'Dog'], ['🐱', 'Cat'], ['🐸', 'Frog'], ['🐷', 'Pig'], ['🐮', 'Cow'], ['🐵', 'Monkey'], ['🦁', 'Lion'], ['🐧', 'Penguin'], ['🐢', 'Turtle'], ['🐙', 'Octopus'], ['🦄', 'Unicorn'], ['🐝', 'Bee'], ['🦖', 'Dino']];
export const TIMES = { turn: 30000 };

export function setup(players, rnd = Math.random) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const deck = shuffle(ANIMALS.flatMap((_, r) => [0, 1, 2, 3].map(k => ({ id: r * 4 + k, r }))), rnd);
  const n = order.length <= 3 ? 7 : 5;
  const hands = {}, books = {};
  order.forEach(p => { hands[p.pid] = deck.splice(0, n); books[p.pid] = []; });
  const s = { game: 'gofish', players: order, hands, books, deck, turn: 0, phase: 'play', round: 0, moves: 0, last: null, eventId: 0, deadline: Date.now() + TIMES.turn };
  order.forEach(p => makeBooks(s, p.pid));
  return s;
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const cur = s => s.players[s.turn].pid;
const sets = s => s.players.reduce((a, p) => a + s.books[p.pid].length, 0);

function makeBooks(s, pid) {
  const h = s.hands[pid];
  const made = [];
  for (let r = 0; r < ANIMALS.length; r++) if (h.filter(c => c.r === r).length === 4) { s.books[pid].push(r); s.hands[pid] = s.hands[pid].filter(c => c.r !== r); made.push(r); }
  return made;
}

function note(s, text, kind, extra = {}) { s.last = { text, kind, ...extra }; s.eventId++; }

// Move to the next player who can still play (refilling an empty hand from the pond).
function advance(s, now, same = false) {
  if (sets(s) === ANIMALS.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  for (let k = same ? 0 : 1; k <= s.players.length; k++) {
    const i = (s.turn + k) % s.players.length, pid = s.players[i].pid;
    if (!s.hands[pid].length && s.deck.length) s.hands[pid].push(s.deck.pop());
    if (s.hands[pid].length) { s.turn = i; s.moves++; s.deadline = now + TIMES.turn; return; }
  }
  s.phase = 'over'; s.round++; s.deadline = 0;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || s.phase !== 'play' || pid !== cur(s) || a.type !== 'ask') return s;
  const r = Number(a.r), target = a.target;
  if (!s.hands[pid].some(c => c.r === r) || target === pid || !s.hands[target]) return s;
  const got = s.hands[target].filter(c => c.r === r);
  const [emoji, word] = ANIMALS[r];
  if (got.length) {
    s.hands[target] = s.hands[target].filter(c => c.r !== r);
    s.hands[pid].push(...got);
    const made = makeBooks(s, pid);
    note(s, `${nameOf(s, pid)} got ${got.length} ${word}${got.length > 1 ? 's' : ''} ${emoji} from ${nameOf(s, target)}!${made.length ? ' A set!' : ''}`, made.length ? 'set' : 'got', { r });
    return advance(s, now, true), s;
  }
  const fish = s.deck.pop();
  if (fish) s.hands[pid].push(fish);
  const lucky = fish && fish.r === r;
  const made = makeBooks(s, pid);
  note(s, `${nameOf(s, pid)} asked ${nameOf(s, target)} for a ${word} ${emoji}. Go Fish! ${lucky ? `${nameOf(s, pid)} fished up a ${word} ${emoji}!` : ''}${made.length ? ' A set!' : ''}`, lucky ? 'lucky' : 'fish', { r });
  advance(s, now, lucky);
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a === 'next' && s.phase === 'play') {   // time's up: ask for something at random
    const h = s.hands[cur(s)];
    const others = s.players.filter(p => p.pid !== cur(s) && s.hands[p.pid].length);
    if (!others.length) { advance(s, now); return s; }
    act(s, cur(s), { type: 'ask', r: h[Math.floor(rnd() * h.length)].r, target: others[Math.floor(rnd() * others.length)].pid }, now, rnd);
  }
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'play' && now >= s.deadline) hostAct(s, 'next', now, rnd);
  return s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, books: s.books[p.pid].length })).sort((a, b) => b.books - a.books);
export function narration(s) {
  if (s.phase === 'over') { const r = ranking(s); return r[0].books === r[1]?.books ? "It's a tie!" : `${r[0].name} wins with ${r[0].books} sets!`; }
  if (s.moves === 0) return `Let's play Go Fish! Ask someone for an animal you have. Get all four to make a set. ${nameOf(s, cur(s))} goes first.`;
  return '';
}
export function cue(s) {
  if (s.phase === 'over') return { sound: 'win', wait: 1400, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  if (s.moves === 0) return { sound: 'join', wait: 700, title: 'Go Fish', sub: 'Collect all four!' };
  return null;
}
export function cueEvent(s) {
  if (!s.last || s.phase === 'over') return null;
  return { id: s.eventId, sound: s.last.kind === 'set' ? 'win' : s.last.kind === 'fish' ? 'tick' : 'safe', say: s.last.kind === 'fish' ? 'Go fish!' : s.last.kind === 'set' ? 'A set!' : '' };
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'play' || !v.myTurn || !v.groups.length) return null;
  const others = v.others.filter(o => o.count);
  if (!others.length) return null;
  const g = v.groups.slice().sort((a, b) => b.n - a.n)[rnd() < 0.6 ? 0 : Math.floor(rnd() * v.groups.length)];
  return { type: 'ask', r: g.r, target: others[Math.floor(rnd() * others.length)].pid };
}

export function tvView(s, now = Date.now()) {
  return {
    phase: s.phase, pond: s.deck.length, current: nameOf(s, cur(s)), last: s.last, first: s.moves === 0,
    seats: s.players.map((p, i) => ({ name: p.name, count: s.hands[p.pid].length, books: s.books[p.pid], turn: s.phase === 'play' && i === s.turn })),
    scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
  };
}

export function phoneView(s, pid) {
  if (!s.hands[pid]) return { phase: 'spectate' };
  const h = s.hands[pid];
  const groups = [...new Set(h.map(c => c.r))].sort((a, b) => a - b).map(r => ({ r, n: h.filter(c => c.r === r).length }));
  return {
    phase: s.phase, myTurn: s.phase === 'play' && cur(s) === pid, current: nameOf(s, cur(s)), groups, books: s.books[pid], last: s.last,
    others: s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name, count: s.hands[p.pid].length })),
    place: s.phase === 'over' ? ranking(s).findIndex(x => x.pid === pid) + 1 : 0,
  };
}

const animal = r => `<span class="gfa" title="${ANIMALS[r][1]}">${pic(ANIMALS[r][0])}</span>`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const seats = `<div class="gfseats">${v.seats.map(p => `<div class="gfseat ${p.turn ? 'on' : ''}"><b>${esc(p.name)}</b><div class="ccfan">${Array.from({ length: Math.min(p.count, 14) }, () => '<i></i>').join('')}</div><small>${p.count} card${p.count === 1 ? '' : 's'}</small><div class="gfbooks">${p.books.map(animal).join('') || '<small class="muted">no sets yet</small>'}</div></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'play') h = `${seats}<div class="gfpond"><span>🌊</span><b>${v.pond}</b><small>in the pond</small></div>${v.last ? `<p class="say center gflast">${esc(v.last.text)}</p>` : ''}<p class="center"><b>${esc(v.current)}</b>'s turn <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Ask for them</button>${v.first ? '<div class="how"><h3>How to play</h3><ol><li>On your turn, tap an animal you have, then tap who to ask.</li><li>If they have any, they hand them all over and you go again.</li><li>If not: Go Fish! Take one from the pond.</li><li>Collect all four of an animal to make a set. Most sets wins.</li></ol></div>' : ''}`;
  if (v.phase === 'over') h = `<h2 class="win">${v.scores[0].books === v.scores[1]?.books ? "It's a tie!" : `${esc(v.scores[0].name)} wins!`}</h2>${seats}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div></div>`;
}

let picked = null;
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `You came #${v.place}`}</h2><div class="gfbooks">${v.books.map(animal).join('')}</div>`; return; }
  if (!v.myTurn || !v.groups.some(g => g.r === picked)) picked = null;
  const hand = `<div class="gfhand">${v.groups.map(g => `<button class="gfcard ${picked === g.r ? 'on' : ''}" ${v.myTurn ? `data-r="${g.r}"` : 'disabled'}><span>${pic(ANIMALS[g.r][0])}</span><b>${esc(ANIMALS[g.r][1])}</b>${g.n > 1 ? `<i>×${g.n}</i>` : ''}</button>`).join('') || '<p class="muted">No cards</p>'}</div>`;
  let h = v.last ? `<p class="muted small">${esc(v.last.text)}</p>` : '';
  if (v.myTurn) h += picked === null ? '<h2>Your turn! Tap an animal</h2>' : `<h2>Who has a ${esc(ANIMALS[picked][1])}?</h2><div class="opts">${v.others.filter(o => o.count).map(o => `<button class="opt" data-t="${esc(o.pid)}">${esc(o.name)} <small class="muted">${o.count} cards</small></button>`).join('')}</div>`;
  else h += `<h2>${esc(v.current)}'s turn</h2>`;
  h += hand + `<p class="muted">Your sets: ${v.books.map(animal).join('') || 'none yet'}</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-r]').forEach(b => (b.onclick = () => { picked = Number(b.dataset.r); renderPhone(v, el, send); }));
  el.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => { const r = picked; picked = null; el.querySelectorAll('[data-t]').forEach(x => (x.disabled = true)); send({ type: 'ask', r, target: b.dataset.t }); }));
}
