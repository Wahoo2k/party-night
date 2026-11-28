// Pick a Case: one contestant at a time keeps a case and opens the others, while a mysterious
// buyer makes offers. Deal, or keep going? Everyone else picks a lucky case and advises.
// Our own name, look and phrasing (inspired by classic TV case-opening shows).
import { esc } from '../ui.js';

export const meta = {
  id: 'cases',
  name: 'Pick a Case',
  min: 2,
  max: 12,
  blurb: 'Open cases, weigh the offers. Deal, or keep going?',
};

export const VALUES = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 75000, 100000];
const OPEN_PLAN = [4, 3, 3, 2, 1, 1];   // cases to open before each offer; the last two cases go to a keep-or-swap
const MAX_CONTESTANTS = 3;
const LUCKY_SHARE = 0.1;
export const TIMES = { pickOwn: 30000, open: 25000, reveal: 1800, offer: 35000, final: 30000, end: 9000, lucky: 25000 };

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random, prev = null) {
  const scores = {};
  players.forEach(p => (scores[p.pid] = 0));
  const order = shuffle(players.map(p => p.pid), rnd);
  const s = {
    game: 'cases',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    contestants: order.slice(0, Math.min(MAX_CONTESTANTS, players.length)),
    c: 0, scores,
    eventId: 0, lastEvent: null,
  };
  startTurn(s, Date.now(), rnd);
  return s;
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const contestant = s => s.contestants[s.c];
const event = (s, name) => { s.eventId++; s.lastEvent = name; };
const closed = s => s.cases.map((_, i) => i).filter(i => !s.opened.includes(i));
const remainingValues = s => closed(s).map(i => s.cases[i]);

function startTurn(s, now, rnd) {
  s.cases = shuffle([...VALUES], rnd);
  s.own = null;
  s.opened = [];
  s.lucky = {};
  s.round = 0;
  s.toOpen = OPEN_PLAN[0];
  s.offer = null;
  s.offers = [];
  s.advice = {};
  s.deal = null;
  s.lastOpened = null;
  s.phase = 'pickOwn';
  s.deadline = now + TIMES.pickOwn;
}

export function offerFor(values, round) {
  const ev = values.reduce((a, b) => a + b, 0) / values.length;
  const factor = Math.min(0.97, 0.32 + round * 0.13);
  const raw = ev * factor;
  const step = raw > 10000 ? 500 : raw > 1000 ? 50 : 5;
  return Math.max(1, Math.round(raw / step) * step);
}

function openCase(s, i, now) {
  s.opened.push(i);
  s.lastOpened = { i, value: s.cases[i] };
  s.toOpen--;
  event(s, 'open');
  s.phase = 'reveal';
  s.deadline = now + TIMES.reveal;
}

function afterReveal(s, now) {
  if (s.toOpen > 0) { s.phase = 'open'; s.deadline = now + TIMES.open; return; }
  if (closed(s).length <= 2) { s.phase = 'final'; s.deadline = now + TIMES.final; return; }
  s.offer = offerFor(remainingValues(s), s.round);
  s.offers.push(s.offer);
  s.advice = {};
  s.phase = 'offer';
  s.deadline = now + TIMES.offer;
  event(s, 'offer');
}

function endTurn(s, now, won, how) {
  const pid = contestant(s);
  s.scores[pid] += won;
  // Everyone else's lucky case pays out a share.
  Object.entries(s.lucky).forEach(([p, i]) => { if (p !== pid) s.scores[p] += Math.round(s.cases[i] * LUCKY_SHARE); });
  s.result = { name: nameOf(s, pid), won, how, ownValue: s.cases[s.own], offer: s.offer };
  s.phase = 'end';
  s.deadline = now + TIMES.end;
  event(s, how === 'deal' ? 'deal' : 'final');
}

function nextTurn(s, now, rnd) {
  if (s.c + 1 >= s.contestants.length) { s.phase = 'over'; return; }
  s.c++;
  startTurn(s, now, rnd);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!P(s, pid) || !a) return s;
  const isC = pid === contestant(s);
  if (a.type === 'lucky' && !isC && s.lucky[pid] === undefined && ['pickOwn', 'open', 'reveal'].includes(s.phase) && s.cases[a.i] !== undefined) { s.lucky[pid] = a.i; return s; }
  if (a.type === 'advice' && !isC && s.phase === 'offer' && (a.v === 'deal' || a.v === 'no')) { s.advice[pid] = a.v; return s; }
  if (!isC) return s;
  if (s.phase === 'pickOwn' && a.type === 'own' && s.cases[a.i] !== undefined) { s.own = a.i; s.phase = 'open'; s.deadline = now + TIMES.open; event(s, 'own'); }
  else if (s.phase === 'open' && a.type === 'open' && a.i !== s.own && closed(s).includes(a.i)) openCase(s, a.i, now);
  else if (s.phase === 'offer' && a.type === 'deal') { s.deal = s.offer; endTurn(s, now, s.offer, 'deal'); }
  else if (s.phase === 'offer' && a.type === 'nodeal') { s.round++; s.toOpen = OPEN_PLAN[Math.min(s.round, OPEN_PLAN.length - 1)]; s.phase = 'open'; s.deadline = now + TIMES.open; event(s, 'nodeal'); }
  else if (s.phase === 'final' && (a.type === 'keep' || a.type === 'swap')) {
    const other = closed(s).find(i => i !== s.own);
    const mine = a.type === 'swap' ? other : s.own;
    s.swapped = a.type === 'swap';
    s.finalOther = s.cases[a.type === 'swap' ? s.own : other];
    endTurn(s, now, s.cases[mine], a.type);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  const pid = contestant(s);
  if (s.phase === 'pickOwn') act(s, pid, { type: 'own', i: Math.floor(rnd() * VALUES.length) }, now, rnd);
  else if (s.phase === 'open') { const c = closed(s).filter(i => i !== s.own); act(s, pid, { type: 'open', i: c[Math.floor(rnd() * c.length)] }, now, rnd); }
  else if (s.phase === 'reveal') afterReveal(s, now);
  else if (s.phase === 'offer') act(s, pid, { type: 'nodeal' }, now, rnd);
  else if (s.phase === 'final') act(s, pid, { type: 'keep' }, now, rnd);
  else if (s.phase === 'end') nextTurn(s, now, rnd);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (now < s.deadline) return s;
  return hostAct(s, 'next', now, rnd);
}

const money = n => n.toLocaleString();
export function narration(s) {
  switch (s.phase) {
    case 'pickOwn': return `${s.c === 0 ? 'Welcome to Pick a Case! ' : ''}${nameOf(s, contestant(s))}, sixteen cases, one hundred thousand points in one of them. Pick the case you'll keep. Everyone else, pick your lucky case.`;
    case 'offer': return `The phone is ringing. The buyer offers ${money(s.offer)} points. Deal, or keep going?`;
    case 'final': return 'Two cases left. Keep yours, or swap?';
    case 'end': return s.result.how === 'deal' ? `Deal! ${s.result.name} takes ${money(s.result.won)}. Their case had ${money(s.result.ownValue)}.` : `No deal, all the way to the end! ${s.result.name} wins ${money(s.result.won)} points!`;
    case 'over': return 'That\'s the end of Pick a Case!';
  }
  return '';
}

export function cue(s) {
  switch (s.phase) {
    case 'pickOwn': return { sound: 'join', wait: 900, title: nameOf(s, contestant(s)), sub: 'Pick your case' };
    case 'offer': return { sound: 'drumroll', wait: 2000, title: 'The Offer', sub: `${money(s.offer)} points`, tone: 'night' };
    case 'final': return { sound: 'drumroll', wait: 1800, title: 'Keep or Swap?', sub: 'Two cases left' };
    case 'end': return { sound: s.result.won >= 25000 ? 'win' : 'safe', wait: 1200, fx: s.result.won >= 25000 ? 'confetti' : null };
    case 'over': return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'Biggest winner takes it', tone: 'dawn', fx: 'confetti' };
  }
  return null;
}

export function cueEvent(s) {
  if (s.lastEvent === 'open' && s.eventId) {
    const v = s.lastOpened.value;
    return { id: s.eventId, sound: v >= 25000 ? 'death' : v <= 100 ? 'safe' : 'tick', say: money(v), delay: 900 };
  }
  if (s.lastEvent === 'nodeal' && s.eventId) return { id: s.eventId, sound: 'vote', say: 'No deal!' };
  return null;
}

// Bots: take the deal once it's close to the average, or late in the game.
export function botAct(v, rnd = Math.random) {
  if (!v.isContestant) {
    if (v.myLucky === null && v.canLucky) { const c = v.cases.filter(x => !x.opened); return { type: 'lucky', i: c[Math.floor(rnd() * c.length)].i }; }
    if (v.phase === 'offer' && !v.myAdvice) return { type: 'advice', v: rnd() < 0.5 ? 'deal' : 'no' };
    return null;
  }
  if (v.phase === 'pickOwn') return { type: 'own', i: Math.floor(rnd() * v.cases.length) };
  if (v.phase === 'open') { const c = v.cases.filter(x => !x.opened && !x.own); return { type: 'open', i: c[Math.floor(rnd() * c.length)].i }; }
  if (v.phase === 'offer') return v.offer >= v.average * (0.8 + rnd() * 0.15) || (v.round >= 4 && rnd() < 0.6) ? { type: 'deal' } : { type: 'nodeal' };
  if (v.phase === 'final') return { type: rnd() < 0.5 ? 'keep' : 'swap' };
  return null;
}

// ---------- views ----------
function caseList(s, reveal) {
  return s.cases.map((val, i) => ({ i, n: i + 1, opened: s.opened.includes(i), own: s.own === i, value: s.opened.includes(i) || reveal ? val : null }));
}
const adviceCount = s => { const c = { deal: 0, no: 0 }; Object.values(s.advice).forEach(v => c[v]++); return c; };

export function tvView(s, now = Date.now()) {
  const gone = new Set(s.opened.map(i => s.cases[i]));
  const v = {
    phase: s.phase, who: nameOf(s, contestant(s)), turn: s.c + 1, turns: s.contestants.length,
    values: VALUES.map(x => ({ x, gone: gone.has(x) })),
    cases: caseList(s, s.phase === 'end' || s.phase === 'over'),
    toOpen: s.toOpen, offer: s.offer, offers: s.offers, advice: adviceCount(s),
    lastOpened: s.lastOpened, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
    scores: s.players.map(p => ({ name: p.name, score: s.scores[p.pid], c: p.pid === contestant(s) })).sort((a, b) => b.score - a.score),
    luckyCount: Object.keys(s.lucky).length,
  };
  if (s.phase === 'end' || s.phase === 'over') v.result = s.result;
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const isC = pid === contestant(s);
  const vals = remainingValues(s);
  const v = {
    phase: s.phase, isContestant: isC, who: nameOf(s, contestant(s)), cases: caseList(s, false), toOpen: s.toOpen, round: s.round,
    offer: s.offer, average: vals.reduce((a, b) => a + b, 0) / vals.length, high: Math.max(...vals), low: Math.min(...vals),
    myLucky: s.lucky[pid] ?? null, canLucky: !isC && ['pickOwn', 'open', 'reveal'].includes(s.phase), myAdvice: s.advice[pid] || null,
    advice: isC ? adviceCount(s) : null, score: s.scores[pid],
  };
  if (s.phase === 'end') { v.result = s.result; v.luckyValue = s.lucky[pid] !== undefined ? s.cases[s.lucky[pid]] : null; }
  if (s.phase === 'over') { const r = [...s.players].sort((a, b) => s.scores[b.pid] - s.scores[a.pid]); v.rank = r.findIndex(p => p.pid === pid) + 1; v.of = r.length; }
  return v;
}

// ---------- renderers ----------
const short = n => (n >= 1000 ? (n / 1000) + 'K' : String(n));
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const half = v.values.length / 2;
  const board = `<div class="valboard"><div>${v.values.slice(0, half).map(x => `<span class="${x.gone ? 'gone' : ''}">${money(x.x)}</span>`).join('')}</div><div>${v.values.slice(half).map(x => `<span class="hi ${x.gone ? 'gone' : ''}">${money(x.x)}</span>`).join('')}</div></div>`;
  const side = `<div class="side">${board}<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow ${p.c ? 'now' : ''}"><span>${esc(p.name)}</span><b>${money(p.score)}</b></div>`).join('')}</div></div>`;
  const grid = `<div class="casegrid">${v.cases.map(c => `<div class="case ${c.opened ? 'open' : ''} ${c.own ? 'own' : ''} ${v.lastOpened && v.lastOpened.i === c.i && v.phase === 'reveal' ? 'popping' : ''}"><b>${c.n}</b>${c.value !== null ? `<span>${short(c.value)}</span>` : ''}</div>`).join('')}</div>`;
  let h = `<p class="cat"><b>${esc(v.who)}</b> · contestant ${v.turn} of ${v.turns}</p>`;
  if (v.phase === 'pickOwn') h += `<h2>Pick your case</h2><p class="say">${esc(v.who)}, choose the case you'll keep on your phone. Everyone else, pick a lucky case: you get 10% of what's inside.</p>${grid}`;
  if (v.phase === 'open' || v.phase === 'reveal') h += `<h2>${v.phase === 'reveal' ? `Case ${v.lastOpened.i + 1}: <span class="${v.lastOpened.value >= 25000 ? 'lose' : 'win'}">${money(v.lastOpened.value)}</span>` : `Open ${v.toOpen} more case${v.toOpen === 1 ? '' : 's'}`}</h2>${grid}${v.offers.length ? `<p class="muted">Offers so far: ${v.offers.map(money).join(' → ')}</p>` : ''}`;
  if (v.phase === 'offer') h += `<div class="offercard"><p>☎ The buyer offers</p><b>${money(v.offer)}</b><small>points</small></div><p class="say center">Deal, or keep going?</p><div class="advice"><span class="win">Deal ${v.advice.deal}</span><span class="lose">Keep going ${v.advice.no}</span></div><p class="clock small center">${v.left}</p>`;
  if (v.phase === 'final') h += `<h2>Two cases left</h2><p class="say">Keep your case, or swap for the last one?</p>${grid}`;
  if (v.phase === 'end') h += `<h2 class="win">${esc(v.result.name)} wins ${money(v.result.won)}!</h2><p class="say">${v.result.how === 'deal' ? `They took the deal. Their case had <b>${money(v.result.ownValue)}</b>.` : v.result.how === 'swap' ? 'They swapped cases.' : 'They kept their case to the end.'}</p>${grid}<button class="btn" data-host="next">${v.turn >= v.turns ? 'Finish' : 'Next contestant'}</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0]?.name || '')} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${money(p.score)}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${side}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  const grid = (attr, filter) => `<div class="casegrid small">${v.cases.map(c => `<button class="case ${c.opened ? 'open' : ''} ${c.own ? 'own' : ''} ${v.myLucky === c.i ? 'lucky' : ''}" ${filter(c) ? `data-${attr}="${c.i}"` : 'disabled'}><b>${c.n}</b>${c.value !== null ? `<span>${short(c.value)}</span>` : ''}</button>`).join('')}</div>`;
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2>';
  else if (v.phase === 'over') h = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You won!' : `You came ${v.rank} of ${v.of}`}</h2><p class="say">${money(v.score)} points</p>`;
  else if (v.phase === 'end') h = `<h2>${esc(v.result.name)} won ${money(v.result.won)}</h2>${v.luckyValue !== null && !v.isContestant ? `<p class="say">Your lucky case had ${money(v.luckyValue)}: +${money(Math.round(v.luckyValue * LUCKY_SHARE))}</p>` : ''}<p class="muted">Your score: ${money(v.score)}</p>`;
  else if (v.isContestant) {
    if (v.phase === 'pickOwn') h = `<h2>Pick the case you'll keep</h2>${grid('own', c => true)}`;
    else if (v.phase === 'open') h = `<h2>Open ${v.toOpen} case${v.toOpen === 1 ? '' : 's'}</h2><p class="muted">Still in play: ${money(v.low)} to ${money(v.high)}</p>${grid('open', c => !c.opened && !c.own)}`;
    else if (v.phase === 'reveal') h = '<h2>Opening…</h2><p class="say">Watch the TV!</p>';
    else if (v.phase === 'offer') h = `<div class="offercard small"><p>The buyer offers</p><b>${money(v.offer)}</b></div><p class="muted center">Average left: ${money(Math.round(v.average))} · Room says: deal ${v.advice.deal}, keep going ${v.advice.no}</p><button class="btn" data-deal>Deal!</button><button class="btn ghost" data-nodeal>No deal, keep going</button>`;
    else if (v.phase === 'final') h = `<h2>Keep or swap?</h2><p class="say">It's ${money(v.low)} or ${money(v.high)}.</p><button class="btn" data-keep>Keep my case</button><button class="btn ghost" data-swap>Swap</button>`;
  } else {
    if (v.canLucky && v.myLucky === null) h = `<h2>Pick your lucky case</h2><p class="muted">You win 10% of what's inside when ${esc(v.who)}'s turn ends.</p>${grid('lucky', c => !c.opened && !c.own)}`;
    else if (v.phase === 'offer') h = `<h2>${esc(v.who)} got an offer</h2><div class="offercard small"><b>${money(v.offer)}</b></div><p class="muted center">What should they do?</p><button class="btn ${v.myAdvice === 'deal' ? '' : 'ghost'}" data-adv="deal">Take the deal</button><button class="btn ${v.myAdvice === 'no' ? '' : 'ghost'}" data-adv="no">Keep going</button>`;
    else h = `<h2>${esc(v.who)} is playing</h2>${v.myLucky !== null ? `<p class="say">Your lucky case: #${v.myLucky + 1}${v.cases[v.myLucky].opened ? ` (${money(v.cases[v.myLucky].value)})` : ''}</p>` : ''}<p class="muted">Still in play: ${money(v.low)} to ${money(v.high)}</p>`;
  }
  el.innerHTML = h;
  el.querySelectorAll('[data-own]').forEach(b => (b.onclick = () => send({ type: 'own', i: Number(b.dataset.own) })));
  el.querySelectorAll('[data-open]').forEach(b => (b.onclick = () => send({ type: 'open', i: Number(b.dataset.open) })));
  el.querySelectorAll('[data-lucky]').forEach(b => (b.onclick = () => send({ type: 'lucky', i: Number(b.dataset.lucky) })));
  el.querySelectorAll('[data-adv]').forEach(b => (b.onclick = () => send({ type: 'advice', v: b.dataset.adv })));
  el.querySelector('[data-deal]')?.addEventListener('click', () => send({ type: 'deal' }));
  el.querySelector('[data-nodeal]')?.addEventListener('click', () => send({ type: 'nodeal' }));
  el.querySelector('[data-keep]')?.addEventListener('click', () => send({ type: 'keep' }));
  el.querySelector('[data-swap]')?.addEventListener('click', () => send({ type: 'swap' }));
}
