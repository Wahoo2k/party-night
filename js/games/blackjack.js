// Blackjack: everyone plays their own hand against the TV dealer at the same time. Points, never money.
import { esc } from '../ui.js';
import { makeStd, face, RANKS } from './cards.js';

export const meta = {
  id: 'blackjack',
  name: 'Blackjack',
  min: 1,
  max: 8,
  blurb: 'Everyone plays against the TV dealer. Hit, stand, double down.',
};

export const HANDS = 6;
export const START = 100;
export const BETS = [5, 10, 25, 50];
export const TIMES = { bet: 20000, play: 30000, dealer: 1100, results: 6500 };

export function total(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { const r = RANKS[c.r]; if (r === 'A') { aces++; t += 11; } else t += ['J', 'Q', 'K'].includes(r) ? 10 : Number(r); }
  while (t > 21 && aces) { t -= 10; aces--; }
  return { t, soft: aces > 0 };
}
export const isBJ = cards => cards.length === 2 && total(cards).t === 21;

export function setup(players, rnd = Math.random) {
  return {
    game: 'blackjack', players: players.map(p => ({ pid: p.pid, name: p.name })),
    chips: Object.fromEntries(players.map(p => [p.pid, START])),
    hand: 0, round: 0, phase: 'bet', deck: makeStd(rnd, 2), bets: {}, hands: {}, done: {}, dealer: [], results: null,
    deadline: Date.now() + TIMES.bet, eventId: 0, last: null,
  };
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
function draw(s, rnd) { if (s.deck.length < 15) s.deck = makeStd(rnd, 2); return s.deck.pop(); }

function deal(s, now, rnd) {
  s.players.forEach(p => { if (!s.bets[p.pid]) s.bets[p.pid] = Math.min(10, s.chips[p.pid]); });
  s.hands = {}; s.done = {};
  s.players.forEach(p => (s.hands[p.pid] = [draw(s, rnd)]));
  s.dealer = [draw(s, rnd)];
  s.players.forEach(p => s.hands[p.pid].push(draw(s, rnd)));
  s.dealer.push(draw(s, rnd));
  s.players.forEach(p => { if (isBJ(s.hands[p.pid])) s.done[p.pid] = 'bj'; });
  s.phase = 'play'; s.round++;
  s.deadline = now + TIMES.play;
  if (isBJ(s.dealer) || s.players.every(p => s.done[p.pid])) toDealer(s, now);
}

function toDealer(s, now) { s.phase = 'dealer'; s.round++; s.deadline = now + TIMES.dealer; }

function settle(s, now) {
  const d = total(s.dealer).t, dbj = isBJ(s.dealer);
  s.results = s.players.map(p => {
    const h = s.hands[p.pid], t = total(h).t, bet = s.bets[p.pid];
    let out, delta;
    if (t > 21) { out = 'Bust'; delta = -bet; }
    else if (isBJ(h) && !dbj) { out = 'Blackjack!'; delta = Math.ceil(bet * 1.5); }
    else if (dbj && !isBJ(h)) { out = 'Dealer blackjack'; delta = -bet; }
    else if (d > 21 || t > d) { out = 'Win'; delta = bet; }
    else if (t === d) { out = 'Push'; delta = 0; }
    else { out = 'Lose'; delta = -bet; }
    s.chips[p.pid] += delta;
    return { pid: p.pid, name: p.name, out, delta, t };
  });
  s.phase = 'results'; s.round++;
  s.deadline = now + TIMES.results;
}

function nextHand(s, now) {
  s.hand++;
  if (s.hand >= HANDS) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.players.forEach(p => { if (s.chips[p.pid] <= 0) s.chips[p.pid] = 25; });   // the house spots you a few chips
  s.bets = {}; s.results = null; s.dealer = []; s.hands = {};
  s.phase = 'bet'; s.round++;
  s.deadline = now + TIMES.bet;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.chips[pid] && s.chips[pid] !== 0) return s;
  if (s.phase === 'bet' && a.type === 'bet' && BETS.includes(a.amount)) {
    s.bets[pid] = Math.min(a.amount, s.chips[pid]);
    if (s.players.every(p => s.bets[p.pid])) deal(s, now, rnd);
  } else if (s.phase === 'play' && !s.done[pid]) {
    const h = s.hands[pid];
    if (a.type === 'hit') { h.push(draw(s, rnd)); if (total(h).t > 21) s.done[pid] = 'bust'; else if (total(h).t === 21) s.done[pid] = 'stand'; }
    else if (a.type === 'stand') s.done[pid] = 'stand';
    else if (a.type === 'double' && h.length === 2 && s.chips[pid] >= s.bets[pid] * 2) { s.bets[pid] *= 2; h.push(draw(s, rnd)); s.done[pid] = total(h).t > 21 ? 'bust' : 'double'; }
    if (s.players.every(p => s.done[p.pid])) toDealer(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'bet') deal(s, now, rnd);
  else if (s.phase === 'play') { s.players.forEach(p => { if (!s.done[p.pid]) s.done[p.pid] = 'stand'; }); toDealer(s, now); }
  else if (s.phase === 'dealer') {
    const allBust = s.players.every(p => total(s.hands[p.pid]).t > 21);
    if (!allBust && total(s.dealer).t < 17) { s.dealer.push(draw(s, rnd)); s.eventId++; s.deadline = now + TIMES.dealer; }
    else settle(s, now);
  } else if (s.phase === 'results') nextHand(s, now);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (!s.deadline || now < s.deadline) return s;
  return hostAct(s, 'next', now, rnd);
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, chips: s.chips[p.pid] })).sort((a, b) => b.chips - a.chips);

const rot = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every time
export function narration(s) {
  if (s.phase === 'bet') return s.hand === 0 ? `Welcome to the Party Night blackjack table! Everyone starts with ${START} chips. These are points, not real money. Place your bets.` : `Hand ${s.hand + 1}. Place your bets.`;
  if (s.phase === 'play') return rot(['The cards are out. Hit or stand?', 'Hit or stand?', 'Your move. Hit or stand?', 'Check your cards. Hit or stand?'], s.hand);
  if (s.phase === 'dealer') return rot(["Dealer's turn.", 'Now the dealer plays.', 'The dealer turns over the hidden card.'], s.hand);
  if (s.phase === 'results') { const d = total(s.dealer).t; return d > 21 ? rot(['Dealer busts! Everyone still in gets paid.', 'Dealer busts!', 'Too many! The dealer busts.'], s.hand) : `Dealer has ${d}.`; }
  if (s.phase === 'over') return `The table is closed! ${ranking(s)[0].name} leaves with the most chips!`;
  return '';
}

export function cue(s) {
  if (s.phase === 'bet') return { sound: 'join', wait: 600, title: s.hand === 0 ? 'Blackjack' : `Hand ${s.hand + 1} of ${HANDS}`, sub: 'Place your bets' };
  if (s.phase === 'play') return { sound: 'vote', wait: 200 };
  if (s.phase === 'dealer') return { sound: 'drumroll', wait: 300 };
  if (s.phase === 'results') return { sound: total(s.dealer).t > 21 ? 'win' : 'safe', wait: 300 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Table closed', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function cueEvent(s) { return s.phase === 'dealer' && s.eventId ? { id: s.eventId, sound: 'tick', say: '' } : null; }

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'bet' && !v.bet) return { type: 'bet', amount: BETS[Math.floor(rnd() * 3)] };
  if (v.phase === 'play' && !v.done) { if (v.total === 11 && v.cards.length === 2 && rnd() < 0.6 && v.canDouble) return { type: 'double' }; return { type: v.total < 17 ? 'hit' : 'stand' }; }
  return null;
}

export function tvView(s, now = Date.now()) {
  const hide = s.phase === 'play';
  return {
    phase: s.phase, hand: s.hand + 1, hands: HANDS, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
    dealer: s.dealer.map((c, i) => (hide && i === 1 ? null : c)), dealerTotal: hide ? null : s.dealer.length ? total(s.dealer).t : null,
    seats: s.players.map(p => ({ name: p.name, chips: s.chips[p.pid], bet: s.bets[p.pid] || 0, cards: s.hands[p.pid] || [], t: s.hands[p.pid] ? total(s.hands[p.pid]).t : null, done: s.done[p.pid] || null, res: s.results?.find(r => r.pid === p.pid) || null })),
    scores: ranking(s),
  };
}

export function phoneView(s, pid) {
  if (s.chips[pid] === undefined) return { phase: 'spectate' };
  const h = s.hands[pid] || [];
  const v = { phase: s.phase, round: s.round, chips: s.chips[pid], bet: s.bets[pid] || 0, cards: h, total: h.length ? total(h).t : 0, done: s.done[pid] || null, canDouble: h.length === 2 && s.chips[pid] >= (s.bets[pid] || 0) * 2, up: s.dealer[0] || null };
  if (s.phase === 'results') v.res = s.results.find(r => r.pid === pid);
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

const DONE = { bust: 'Bust', stand: 'Stands', double: 'Doubled', bj: 'Blackjack!' };
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  if (v.phase === 'over') {
    el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel"><h2 class="win">${esc(v.scores[0].name)} wins with ${v.scores[0].chips} chips!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.chips}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div></div></div>`;
    return;
  }
  const dealer = `<div class="bjdealer"><p class="cat">Dealer${v.dealerTotal !== null ? ` · ${v.dealerTotal}${v.dealerTotal > 21 ? ' BUST' : ''}` : ''}</p><div class="pcrow">${v.dealer.map(c => face(c, 'big')).join('') || '<span class="muted">Waiting for bets…</span>'}</div></div>`;
  const seats = `<div class="bjseats">${v.seats.map(p => `<div class="bjseat ${p.res ? (p.res.delta > 0 ? 'won' : p.res.delta < 0 ? 'lost' : '') : ''}"><b>${esc(p.name)}</b><div class="pcrow small">${p.cards.map(c => face(c)).join('')}</div><span>${p.t !== null ? p.t : ''}${p.done ? ` · ${DONE[p.done]}` : ''}</span><small>${p.res ? `${esc(p.res.out)} ${p.res.delta > 0 ? '+' : ''}${p.res.delta || ''}` : p.bet ? `Bet ${p.bet}` : 'Betting…'} · ${p.chips} chips</small></div>`).join('')}</div>`;
  const status = v.phase === 'bet' ? `<p class="say center">Place your bets on your phone <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Deal now</button>` : v.phase === 'play' ? `<p class="say center">Hit or stand on your phone <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Everyone stands</button>` : v.phase === 'results' ? '<button class="btn" data-host="next">Next hand</button>' : '';
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel bjtable"><p class="cat">Hand ${v.hand} of ${v.hands} · points only, never money</p>${dealer}${seats}${status}</div></div>`;
}

export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">${v.chips} chips</p>`;
  if (v.phase === 'bet') h += v.bet ? `<h2>Bet ${v.bet}</h2><p class="say">Waiting for the deal…</p>` : `<h2>Place your bet</h2><div class="bjbets">${[5, 10, 25, 50].map(b => `<button class="chipbtn" data-bet="${b}" ${b > v.chips ? 'disabled' : ''}>${b}</button>`).join('')}</div>`;
  else if (v.phase === 'play' || v.phase === 'dealer') {
    h += `<p class="muted">Dealer shows</p><div class="pcrow small">${face(v.up)}${face(null)}</div><p class="muted">You · bet ${v.bet}</p><div class="pcrow">${v.cards.map(c => face(c)).join('')}</div><h2>${v.total}${v.total > 21 ? ' · Bust!' : v.done === 'bj' ? ' · Blackjack!' : ''}</h2>`;
    if (v.phase === 'play' && !v.done) h += `<div class="bjbtns"><button class="btn" data-a="hit">Hit</button><button class="btn ghost" data-a="stand">Stand</button>${v.canDouble ? '<button class="btn ghost" data-a="double">Double down</button>' : ''}</div>`;
    else h += '<p class="say">Watch the dealer on the TV…</p>';
  } else if (v.phase === 'results') h += `<h2 class="${v.res.delta > 0 ? 'win' : v.res.delta < 0 ? 'lose' : ''}">${esc(v.res.out)} ${v.res.delta > 0 ? '+' : ''}${v.res.delta || ''}</h2>`;
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won the table!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-bet]').forEach(b => (b.onclick = () => send({ type: 'bet', amount: Number(b.dataset.bet) })));
  el.querySelectorAll('[data-a]').forEach(b => (b.onclick = () => { el.querySelectorAll('[data-a]').forEach(x => (x.disabled = true)); send({ type: b.dataset.a }); }));
}
