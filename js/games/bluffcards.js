// Liar's Deck: play cards face down and say what they are. The rank to play goes up each turn,
// so sometimes you have to lie. Anyone can call "Bluff!": a liar takes the pile, a wrong call takes it too.
// First to empty their hand wins. (A classic "I Doubt It" / "Cheat" card game.)
import { esc } from '../ui.js';
import { makeStd, face, RANKS, shuffle } from './cards.js';

export const meta = {
  id: 'bluffcards',
  name: 'Liar\'s Deck',
  min: 3,
  max: 8,
  blurb: 'Play cards face down, claim anything. Call out the liars.',
};

export const WORDS = ['Aces', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens', 'Jacks', 'Queens', 'Kings'];
export const TIMES = { turn: 35000, window: 9000, reveal: 4500 };

export function setup(players, rnd = Math.random) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const deck = makeStd(rnd);
  const hands = Object.fromEntries(order.map(p => [p.pid, []]));
  deck.forEach((c, i) => hands[order[i % order.length].pid].push(c));
  return { game: 'bluffcards', players: order, hands, pile: [], rank: 0, turn: 0, phase: 'play', round: 0, moves: 0, claim: null, passes: {}, reveal: null, winner: null, eventId: 0, deadline: Date.now() + TIMES.turn };
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const cur = s => s.players[s.turn].pid;

function nextTurn(s, now) {
  // A player who emptied their hand and survived the window wins.
  if (s.claim && !s.hands[s.claim.pid].length) { s.winner = s.claim.pid; s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.turn = (s.turn + 1) % s.players.length;
  s.rank = (s.rank + 1) % 13;
  s.claim = null; s.passes = {}; s.reveal = null;
  s.phase = 'play'; s.round++; s.moves++;
  s.deadline = now + TIMES.turn;
}

function playCards(s, pid, ids, now) {
  const hand = s.hands[pid];
  const cards = ids.map(id => hand.find(c => c.id === id)).filter(Boolean);
  s.hands[pid] = hand.filter(c => !cards.includes(c));
  s.pile.push(...cards);
  s.claim = { pid, n: cards.length, rank: s.rank, cards };
  s.phase = 'window'; s.round++; s.passes = {};
  s.deadline = now + TIMES.window;
  s.eventId++;
}

function challenge(s, by, now) {
  const { pid, cards, rank } = s.claim;
  const lied = cards.some(c => c.r !== rank);
  const loser = lied ? pid : by;
  s.hands[loser].push(...s.pile);
  s.reveal = { by, liar: pid, lied, cards, loser, size: s.pile.length };
  s.pile = [];
  s.phase = 'reveal'; s.round++;
  s.deadline = now + TIMES.reveal;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.hands[pid]) return s;
  if (s.phase === 'play' && pid === cur(s) && a.type === 'play' && Array.isArray(a.ids)) {
    const ids = [...new Set(a.ids)].filter(id => s.hands[pid].some(c => c.id === id)).slice(0, 4);
    if (ids.length) playCards(s, pid, ids, now);
  } else if (s.phase === 'window' && pid !== s.claim.pid) {
    if (a.type === 'bluff') challenge(s, pid, now);
    else if (a.type === 'pass') { s.passes[pid] = true; if (s.players.every(p => p.pid === s.claim.pid || s.passes[p.pid])) nextTurn(s, now); }
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'play') { const h = s.hands[cur(s)]; const match = h.filter(c => c.r === s.rank); playCards(s, cur(s), (match.length ? match : [h[Math.floor(rnd() * h.length)]]).slice(0, 4).map(c => c.id), now); }
  else if (s.phase === 'window' || s.phase === 'reveal') nextTurn(s, now);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.deadline && now >= s.deadline && s.phase !== 'over') hostAct(s, 'next', now, rnd);
  return s;
}

const claimText = (s, c) => `${nameOf(s, c.pid)} played ${c.n} ${c.n === 1 ? WORDS[c.rank].replace(/es$|s$/, '').replace(/Sixe/, 'Six') : WORDS[c.rank]}`;
export function narration(s) {
  if (s.phase === 'play' && s.moves === 0) return `Welcome to Liar's Deck! Play cards face down and say they're ${WORDS[s.rank]}. Lie if you have to. Anyone can call bluff!`;
  if (s.phase === 'window') return claimText(s, s.claim) + '.';
  if (s.phase === 'reveal') return s.reveal.lied ? `Bluff! ${nameOf(s, s.reveal.liar)} was lying and takes the pile.` : `Nope, ${nameOf(s, s.reveal.liar)} told the truth! ${nameOf(s, s.reveal.by)} takes the pile.`;
  if (s.phase === 'over') return `${nameOf(s, s.winner)} is out of cards and wins!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'play' && s.moves === 0) return { sound: 'join', wait: 700, title: 'Liar\'s Deck', sub: `Start with ${WORDS[s.rank]}` };
  if (s.phase === 'window') return { sound: 'vote', wait: 300 };
  if (s.phase === 'reveal') return { sound: s.reveal.lied ? 'death' : 'lose', wait: 600, title: s.reveal.lied ? 'BLUFF!' : 'TRUTH!', sub: `${nameOf(s, s.reveal.loser)} takes ${s.reveal.size} cards`, tone: s.reveal.lied ? 'blood' : 'dawn' };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: `${nameOf(s, s.winner)} Wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'play' && v.myTurn) {
    const match = v.hand.filter(c => c.r === v.rank);
    if (match.length && rnd() < 0.85) return { type: 'play', ids: match.slice(0, 4).map(c => c.id) };
    const junk = shuffle([...v.hand], rnd).slice(0, 1 + Math.floor(rnd() * 2));
    return { type: 'play', ids: [...match.slice(0, 1), ...junk].slice(0, 4).map(c => c.id) };
  }
  if (v.phase === 'window' && v.canCall && !v.passed) {
    const mine = v.hand.filter(c => c.r === v.claim.rank).length;
    const sure = mine + v.claim.n > 4;
    return sure || rnd() < 0.12 + (v.claimerLeft <= 1 ? 0.5 : 0) ? { type: 'bluff' } : { type: 'pass' };
  }
  return null;
}

export function tvView(s, now = Date.now()) {
  return {
    phase: s.phase, rank: WORDS[s.rank], pile: s.pile.length, current: nameOf(s, cur(s)), first: s.moves === 0,
    claim: s.claim ? { text: claimText(s, s.claim), n: s.claim.n, rank: WORDS[s.claim.rank] } : null,
    reveal: s.reveal ? { ...s.reveal, by: nameOf(s, s.reveal.by), liar: nameOf(s, s.reveal.liar), loser: nameOf(s, s.reveal.loser) } : null,
    seats: s.players.map((p, i) => ({ name: p.name, count: s.hands[p.pid].length, turn: i === s.turn && s.phase !== 'over' })),
    winner: s.winner ? nameOf(s, s.winner) : null, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
  };
}

export function phoneView(s, pid) {
  if (!s.hands[pid]) return { phase: 'spectate' };
  const v = {
    phase: s.phase, round: s.round, myTurn: s.phase === 'play' && cur(s) === pid, rank: s.rank, rankWord: WORDS[s.rank], current: nameOf(s, cur(s)),
    hand: s.hands[pid].slice().sort((a, b) => a.r - b.r || a.s - b.s), won: s.winner === pid, winner: s.winner ? nameOf(s, s.winner) : null,
  };
  if (s.phase === 'window') { v.claim = { text: claimText(s, s.claim), n: s.claim.n, rank: s.claim.rank }; v.canCall = s.claim.pid !== pid; v.passed = !!s.passes[pid]; v.claimerLeft = s.hands[s.claim.pid].length; }
  if (s.phase === 'reveal') v.reveal = { lied: s.reveal.lied, mine: s.reveal.loser === pid };
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'over');
  const seats = `<div class="ccseats">${v.seats.map(p => `<div class="ccseat ${p.turn ? 'on' : ''} ${p.count <= 2 ? 'one' : ''}"><b>${esc(p.name)}</b><div class="ccfan">${Array.from({ length: Math.min(p.count, 14) }, () => '<i></i>').join('')}</div><span>${p.count} card${p.count === 1 ? '' : 's'}</span></div>`).join('')}</div>`;
  const pile = `<div class="bcpile">${Array.from({ length: Math.min(v.pile, 10) }, (_, i) => `<div class="pc back" style="transform:rotate(${(i * 37) % 30 - 15}deg)"><span>✦</span></div>`).join('')}<b>${v.pile}</b></div>`;
  let h = '';
  if (v.phase === 'play') h = `${seats}<div class="bcmid">${pile}<div><p class="cat">Next up</p><div class="cq">${esc(v.rank)}</div></div></div><p class="say center"><b>${esc(v.current)}</b> is choosing cards… <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Hurry them up</button>${v.first ? '<div class="how"><h3>How to play</h3><ol><li>On your turn, play 1 to 4 cards face down. Say they are the rank shown.</li><li>No cards of that rank? Bluff!</li><li>Anyone can call "Bluff!" on their phone. If it was a lie, the liar takes the whole pile. If it was the truth, the caller takes it.</li><li>First to get rid of every card wins.</li></ol></div>' : ''}`;
  if (v.phase === 'window') h = `${seats}<div class="bcmid">${pile}<div><div class="cq">${esc(v.claim.text)}</div><p class="say">Is it true? Call <b class="lose">Bluff!</b> on your phone <span class="clock">${v.left}</span></p></div></div><button class="btn ghost" data-host="next">Nobody calls</button>`;
  if (v.phase === 'reveal') h = `${seats}<h2 class="${v.reveal.lied ? 'lose' : 'win'}">${v.reveal.lied ? `Bluff! ${esc(v.reveal.liar)} was lying` : `${esc(v.reveal.liar)} told the truth!`}</h2><div class="pcrow center">${v.reveal.cards.map(c => face(c, 'big')).join('')}</div><p class="say center">${esc(v.reveal.loser)} picks up ${v.reveal.size} cards.</p><button class="btn" data-host="next">Next</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.winner)} wins!</h2>${seats}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div></div>`;
}

let sel = { round: -1, ids: [] };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'You won!' : `${esc(v.winner)} wins`}</h2>`; return; }
  if (sel.round !== v.round) sel = { round: v.round, ids: [] };
  const hand = clickable => `<div class="pcrow bchand">${v.hand.map(c => face(c, `${sel.ids.includes(c.id) ? 'sel' : ''} ${c.r === v.rank && v.myTurn ? 'match' : ''}`, clickable ? `data-id="${c.id}"` : '')).join('')}</div>`;
  let h = `<p class="muted">${v.hand.length} cards</p>`;
  if (v.myTurn) h += `<h2>Play ${esc(v.rankWord)}</h2><p class="muted">Tap 1–4 cards. ${v.hand.some(c => c.r === v.rank) ? 'Your real ones are glowing.' : "You don't have any. Time to bluff!"}</p>${hand(true)}<button class="btn" id="go" ${sel.ids.length ? '' : 'disabled'}>Play ${sel.ids.length || ''} as ${esc(v.rankWord)}</button>`;
  else if (v.phase === 'play') h += `<h2>${esc(v.current)} is playing ${esc(v.rankWord)}</h2>${hand(false)}`;
  else if (v.phase === 'window') h += v.canCall ? `<div class="cq small">${esc(v.claim.text)}</div>${v.passed ? '<p class="say">You let it go.</p>' : '<button class="buzz live" data-bluff>BLUFF!</button><button class="btn ghost" data-pass>Let it go</button>'}${hand(false)}` : `<h2>Poker face…</h2><p class="say">Will anyone call your bluff?</p>${hand(false)}`;
  else if (v.phase === 'reveal') h += `<h2 class="${v.reveal.mine ? 'lose' : ''}">${v.reveal.mine ? 'You take the pile!' : v.reveal.lied ? 'Caught a liar!' : 'It was the truth!'}</h2>${hand(false)}`;
  el.innerHTML = h;
  el.querySelectorAll('[data-id]').forEach(b => (b.onclick = () => { const id = Number(b.dataset.id); sel.ids = sel.ids.includes(id) ? sel.ids.filter(x => x !== id) : sel.ids.length < 4 ? [...sel.ids, id] : sel.ids; renderPhone(v, el, send); }));
  el.querySelector('#go')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'play', ids: sel.ids }); });
  el.querySelector('[data-bluff]')?.addEventListener('pointerdown', e => { e.preventDefault(); try { navigator.vibrate?.(80); } catch {} send({ type: 'bluff' }); });
  el.querySelector('[data-pass]')?.addEventListener('click', () => send({ type: 'pass' }));
}
