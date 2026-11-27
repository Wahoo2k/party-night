// Color Clash: match the top card by color or symbol, play action cards, be first to empty your hand.
// (A Crazy Eights-style shedding game, with our own colors, cards and a Swap card.)
import { esc } from '../ui.js';

export const meta = {
  id: 'clash',
  name: 'Color Clash',
  min: 2,
  max: 10,
  blurb: 'Match the color or number, play action cards, empty your hand first.',
};

export const COLORS = [
  { name: 'Sun', hex: '#f2b21d' }, { name: 'Sky', hex: '#3f7fe0' }, { name: 'Leaf', hex: '#3fa34d' }, { name: 'Ember', hex: '#e2473b' },
];
const ACTIONS = ['skip', 'rev', 'd2'];
const WILDS = ['wild', 'w4', 'swap'];
export const LABEL = { skip: '⊘', rev: '⇄', d2: '+2', wild: '★', w4: '+4', swap: '⇋' };
export const NAMES = { skip: 'Skip', rev: 'Reverse', d2: 'Draw Two', wild: 'Wild', w4: 'Wild Four', swap: 'Swap Hands' };
export const TIMES = { turn: 30000, over: 0 };
const HAND = 7;

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function makeDeck(rnd = Math.random) {
  const d = [];
  let id = 0;
  for (let c = 0; c < 4; c++) {
    d.push({ id: id++, c, v: '0' });
    for (let k = 0; k < 2; k++) {
      for (let n = 1; n <= 9; n++) d.push({ id: id++, c, v: String(n) });
      for (const v of ACTIONS) d.push({ id: id++, c, v });
    }
  }
  for (let k = 0; k < 4; k++) { d.push({ id: id++, c: null, v: 'wild' }); d.push({ id: id++, c: null, v: 'w4' }); }
  for (let k = 0; k < 2; k++) d.push({ id: id++, c: null, v: 'swap' });
  return shuffle(d, rnd);
}

export const isWild = card => WILDS.includes(card.v);
export const canPlay = (card, top, color) => isWild(card) || card.c === color || card.v === top.v;

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const deck = makeDeck(rnd);
  const hands = {};
  order.forEach(p => (hands[p.pid] = deck.splice(0, HAND)));
  let i = deck.findIndex(c => /^\d$/.test(c.v));
  const top = deck.splice(i, 1)[0];
  return {
    game: 'clash', drawMatch: opts.draw === 'match', players: order, hands, deck, discard: [top], color: top.c,
    turn: 0, dir: 1, drew: null, winner: null, phase: 'play', round: 0, moves: 0,
    last: null, eventId: 0, deadline: Date.now() + TIMES.turn,
  };
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const cur = s => s.players[s.turn].pid;
const top = s => s.discard[s.discard.length - 1];
const step = (s, k = 1) => ((s.turn + s.dir * k) % s.players.length + s.players.length) % s.players.length;

function drawCards(s, pid, n, rnd) {
  const got = [];
  for (let i = 0; i < n; i++) {
    if (!s.deck.length) {
      const t = s.discard.pop();
      s.deck = shuffle(s.discard, rnd);
      s.discard = [t];
      if (!s.deck.length) break;
    }
    got.push(s.deck.pop());
  }
  s.hands[pid].push(...got);
  return got;
}

function nextTurn(s, now, skip = 0) {
  s.turn = step(s, 1 + skip);
  s.drew = null;
  s.moves++;
  s.deadline = now + TIMES.turn;
}

function note(s, text, kind) { s.last = { text, kind }; s.eventId++; }

function play(s, pid, card, a, now, rnd) {
  const hand = s.hands[pid];
  hand.splice(hand.findIndex(c => c.id === card.id), 1);
  s.discard.push(card);
  const who = nameOf(s, pid);
  s.color = isWild(card) ? (a.color >= 0 && a.color < 4 ? a.color : 0) : card.c;
  if (card.v === 'swap') {
    const other = s.players.some(p => p.pid === a.target && p.pid !== pid) ? a.target : s.players[step(s)].pid;
    [s.hands[pid], s.hands[other]] = [s.hands[other], s.hands[pid]];
    note(s, `${who} swapped hands with ${nameOf(s, other)}!`, 'swap');
  } else note(s, `${who} played ${isWild(card) || ACTIONS.includes(card.v) ? NAMES[card.v] : `${COLORS[card.c].name} ${card.v}`}${isWild(card) ? ` and picked ${COLORS[s.color].name}` : ''}`, ACTIONS.includes(card.v) || card.v === 'w4' ? 'action' : 'play');
  if (!s.hands[pid].length) { s.winner = pid; s.phase = 'over'; s.round++; s.deadline = 0; note(s, `${who} is out of cards!`, 'win'); return; }
  let skip = 0;
  if (card.v === 'skip') skip = 1;
  if (card.v === 'rev') { if (s.players.length === 2) skip = 1; else s.dir *= -1; }
  if (card.v === 'd2' || card.v === 'w4') {
    const victim = s.players[step(s)].pid;
    drawCards(s, victim, card.v === 'd2' ? 2 : 4, rnd);
    skip = 1;
  }
  nextTurn(s, now, skip);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || s.phase !== 'play' || pid !== cur(s)) return s;
  if (a.type === 'play') {
    const card = s.hands[pid].find(c => c.id === a.id);
    if (!card || !canPlay(card, top(s), s.color)) return s;
    if (s.drew !== null && card.id !== s.drew) return s;   // after drawing, only the drawn card can be played
    play(s, pid, card, a, now, rnd);
  } else if (a.type === 'draw' && s.drew === null) {
    let [card] = drawCards(s, pid, 1, rnd);
    // House rule: keep drawing until you can play (up to eight cards).
    for (let n = 1; s.drawMatch && card && !canPlay(card, top(s), s.color) && n < 8; n++) [card] = drawCards(s, pid, 1, rnd);
    if (card && canPlay(card, top(s), s.color)) { s.drew = card.id; note(s, `${nameOf(s, pid)} drew a card`, 'draw'); }
    else { note(s, `${nameOf(s, pid)} drew a card`, 'draw'); nextTurn(s, now); }
  } else if (a.type === 'keep' && s.drew !== null) nextTurn(s, now);
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a === 'next' && s.phase === 'play') {   // move things along: the current player draws and passes
    if (s.drew === null) drawCards(s, cur(s), 1, rnd);
    note(s, `${nameOf(s, cur(s))} ran out of time`, 'draw');
    nextTurn(s, now);
  }
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'play' && s.deadline && now >= s.deadline) hostAct(s, 'next', now, rnd);
  return s;
}

export function narration(s) {
  if (s.phase === 'over') return `${nameOf(s, s.winner)} wins Color Clash!`;
  if (s.moves === 0) return `Welcome to Color Clash! Match the color or the symbol. ${nameOf(s, cur(s))} goes first.`;
  return '';
}

export function cue(s) {
  if (s.phase === 'over') return { sound: 'win', wait: 1400, title: `${nameOf(s, s.winner)} Wins!`, sub: 'Out of cards', tone: 'dawn', fx: 'confetti' };
  if (s.round === 0) return { sound: 'join', wait: 700, title: 'Color Clash', sub: 'Match color or symbol' };
  return null;
}

export function cueEvent(s) {
  if (!s.last || s.phase === 'over') return null;
  const one = s.players.find(p => s.hands[p.pid].length === 1);
  const say = s.last.kind === 'swap' ? s.last.text : one && s.last.kind !== 'draw' && s.last.text.startsWith(one.name) ? `${one.name} has one card left!` : '';
  return { id: s.eventId, sound: s.last.kind === 'action' || s.last.kind === 'swap' ? 'death' : s.last.kind === 'draw' ? 'tick' : 'whoosh', fx: s.last.kind === 'action' || s.last.kind === 'swap' ? 'shake' : say ? 'gold' : null, react: say && s.last.kind !== 'swap' ? 'gasp' : null, say };
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'play' || !v.myTurn) return null;
  const ok = v.hand.filter(c => c.ok);
  if (!ok.length) return v.drew === null ? { type: 'draw' } : { type: 'keep' };
  const plain = ok.filter(c => !isWild(c));
  const card = plain.length ? plain[Math.floor(rnd() * plain.length)] : ok[0];
  const counts = [0, 1, 2, 3].map(c => v.hand.filter(x => x.c === c).length);
  const color = counts.indexOf(Math.max(...counts));
  const target = v.others.slice().sort((a, b) => a.count - b.count)[0]?.pid;
  return { type: 'play', id: card.id, color, target };
}

export function tvView(s, now = Date.now()) {
  return {
    phase: s.phase, top: top(s), color: s.color, dir: s.dir, deck: s.deck.length,
    players: s.players.map((p, i) => ({ name: p.name, count: s.hands[p.pid].length, turn: i === s.turn && s.phase === 'play' })),
    current: nameOf(s, cur(s)), last: s.last, winner: s.winner ? nameOf(s, s.winner) : null,
    left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), first: s.moves === 0,
  };
}

export function phoneView(s, pid) {
  if (!s.hands[pid]) return { phase: 'spectate' };
  const myTurn = s.phase === 'play' && cur(s) === pid;
  const t = top(s);
  return {
    phase: s.phase, myTurn, current: nameOf(s, cur(s)), top: t, color: s.color, drew: myTurn ? s.drew : null,
    hand: s.hands[pid].map(c => ({ ...c, ok: myTurn && canPlay(c, t, s.color) && (s.drew === null || s.drew === c.id) })),
    others: s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name, count: s.hands[p.pid].length })),
    won: s.winner === pid, winner: s.winner ? nameOf(s, s.winner) : null,
  };
}

// ---------- renderers ----------
export function cardHTML(c, extra = '', attrs = '') {
  const wild = isWild(c);
  const sym = /^\d$/.test(c.v) ? c.v : LABEL[c.v];
  return `<div class="cc ${wild ? 'wild' : ''} ${extra}" style="--cc:${wild ? '#232a5c' : COLORS[c.c].hex}" ${attrs}><span class="cc-corner">${sym}</span><span class="cc-mid">${sym}</span><span class="cc-corner br">${sym}</span></div>`;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const ring = `<div class="ccseats">${v.players.map(p => `<div class="ccseat ${p.turn ? 'on' : ''} ${p.count === 1 ? 'one' : ''}"><b>${esc(p.name)}</b><div class="ccfan">${Array.from({ length: Math.min(p.count, 12) }, () => '<i></i>').join('')}</div><span>${p.count} card${p.count === 1 ? '' : 's'}${p.count === 1 ? ' · LAST CARD!' : ''}</span></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'play') {
    h = `${ring}<div class="cctable"><div class="ccpile"><div class="cc back"><span class="cc-mid">✦</span></div><small>${v.deck} left</small></div>${cardHTML(v.top, 'big topcard', `key="${v.top.id}"`)}<div class="ccnow"><div class="ccswatch" style="--cc:${COLORS[v.color].hex}">${esc(COLORS[v.color].name)}</div><div class="ccdir">${v.dir > 0 ? '↻' : '↺'}</div></div></div>
      <p class="say center"><b>${esc(v.current)}</b>'s turn <span class="clock ${v.left <= 10 ? 'hurry' : ''}">${v.left}</span></p>${v.last ? `<p class="muted center">${esc(v.last.text)}</p>` : ''}<button class="btn ghost" data-host="next">Skip ${esc(v.current)} (draws a card)</button>`;
    if (v.first) h += `<div class="how"><h3>How to play</h3><ol><li>Play a card that matches the top card's color or symbol.</li><li>★ Wild picks any color. +4 picks a color and the next player draws four.</li><li>⊘ skips the next player, ⇄ reverses direction, +2 makes the next player draw two.</li><li>⇋ Swap Hands trades your whole hand with anyone!</li><li>Can't play? Draw one. First to empty their hand wins.</li></ol></div>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.winner)} wins!</h2>${ring}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div></div>`;
}

let pending = null;   // a wild card waiting for a color (and a target, for Swap)
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'You won!' : `${esc(v.winner)} wins`}</h2>`; return; }
  if (pending && (!v.myTurn || !v.hand.some(c => c.id === pending.id && c.ok))) pending = null;
  const hand = `<div class="cchand">${v.hand.map(c => cardHTML(c, `${c.ok ? 'ok' : v.myTurn ? 'no' : ''} ${v.drew === c.id ? 'drawn' : ''}`, c.ok ? `data-id="${c.id}" role="button" tabindex="0"` : '')).join('')}</div>`;
  const head = `<div class="cchead">${cardHTML(v.top, 'mini')}<div><p class="muted">Color: <b style="color:${COLORS[v.color].hex}">${esc(COLORS[v.color].name)}</b></p><p>${v.myTurn ? '<b class="win">Your turn!</b>' : `${esc(v.current)}'s turn`}</p></div></div>`;
  if (pending) {
    const card = v.hand.find(c => c.id === pending.id);
    el.innerHTML = `${head}<h2>${esc(NAMES[card.v])}</h2>${card.v === 'swap' && !pending.target ? `<p class="muted">Swap hands with…</p><div class="opts">${v.others.map(o => `<button class="opt" data-t="${esc(o.pid)}">${esc(o.name)} <small class="muted">${o.count} cards</small></button>`).join('')}</div>` : `<p class="muted">Pick the new color</p><div class="ccpick">${COLORS.map((c, i) => `<button style="--cc:${c.hex}" data-color="${i}">${esc(c.name)}</button>`).join('')}</div>`}<button class="btn ghost" id="cancel">Back</button>`;
    el.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => { pending.target = b.dataset.t; renderPhone(v, el, send); }));
    el.querySelectorAll('[data-color]').forEach(b => (b.onclick = () => { const p = pending; pending = null; send({ type: 'play', id: p.id, color: Number(b.dataset.color), target: p.target }); }));
    el.querySelector('#cancel').onclick = () => { pending = null; renderPhone(v, el, send); };
    return;
  }
  const canAny = v.hand.some(c => c.ok);
  const btns = !v.myTurn ? '' : v.drew !== null ? '<button class="btn ghost" data-keep>Keep it and pass</button>' : `<button class="btn ${canAny ? 'ghost' : ''}" data-draw>Draw a card</button>`;
  el.innerHTML = `${head}${v.myTurn && v.drew !== null ? '<p class="say">You drew a card you can play. Play it or keep it.</p>' : v.myTurn && !canAny ? '<p class="say">Nothing matches. Draw a card.</p>' : ''}${hand}${btns}<p class="muted small">${v.hand.length} card${v.hand.length === 1 ? '' : 's'} · ${v.others.map(o => `${esc(o.name)} ${o.count}`).join(' · ')}</p>`;
  el.querySelectorAll('[data-id]').forEach(b => (b.onclick = () => {
    const card = v.hand.find(c => c.id === Number(b.dataset.id));
    if (isWild(card)) { pending = { id: card.id }; renderPhone(v, el, send); return; }
    el.querySelectorAll('[data-id]').forEach(x => x.removeAttribute('data-id'));
    try { navigator.vibrate?.(20); } catch {}
    send({ type: 'play', id: card.id });
  }));
  el.querySelector('[data-draw]')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'draw' }); });
  el.querySelector('[data-keep]')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'keep' }); });
}

meta.options = [{ id: 'draw', name: 'No card to play', choices: [['one', 'draw one'], ['match', 'draw until you can']] }];
