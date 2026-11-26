// Million Ladder: one player at a time takes the hot seat and climbs a ladder of harder questions.
// Lifelines: 50/50, Ask the Room, Swap. Everyone else answers along on their phones for bonus points.
// Our own name, look and phrasing (inspired by classic TV quiz ladders).
import { esc } from '../ui.js';
import { EASY, MEDIUM, HARD } from './ladder-bank.js';

export const meta = {
  id: 'ladder',
  name: 'Million Ladder',
  min: 2,
  max: 12,
  blurb: 'Climb a ladder of harder questions. Use your lifelines wisely.',
};

export const RUNGS = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
export const SAFE = [2, 5];                    // rung indexes that lock in (5,000 and 50,000)
const LEVEL = i => (i < 3 ? 'easy' : i < 6 ? 'medium' : 'hard');
const MAX_SEATS = 4;
export const TIMES = { question: 50000, lock: 3200, result: 4500, seatIntro: 4000 };
const SHADOW = 0.1;                            // the room earns 10% of the rung for a right answer

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const BANK = { easy: EASY, medium: MEDIUM, hard: HARD };

export function setup(players, rnd = Math.random, prev = null) {
  const seats = shuffle(players.map(p => p.pid), rnd).slice(0, Math.min(MAX_SEATS, players.length));
  const decks = {};
  for (const k of Object.keys(BANK)) decks[k] = shuffle(BANK[k].map((_, i) => i), rnd);
  const scores = {};
  players.forEach(p => (scores[p.pid] = 0));
  const s = {
    game: 'ladder',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    seats, seat: 0, decks, scores,
    eventId: 0, lastEvent: null,
  };
  startSeat(s, Date.now(), rnd);
  return s;
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const hot = s => s.seats[s.seat];
const event = (s, name) => { s.eventId++; s.lastEvent = name; };

function draw(s, rnd) {
  const lv = LEVEL(s.rung);
  if (!s.decks[lv].length) s.decks[lv] = shuffle(BANK[lv].map((_, i) => i), rnd);
  const [q, right, ...wrong] = BANK[lv][s.decks[lv].shift()];
  const options = shuffle([right, ...wrong], rnd);
  s.q = { q, options, answer: options.indexOf(right) };
  s.hidden = [];
  s.pick = null;
  s.room = {};
  s.roomShown = false;
}

function startSeat(s, now, rnd) {
  s.rung = 0;              // the rung you're playing for (0 = first question)
  s.banked = 0;
  s.life = { fifty: true, room: true, swap: true };
  s.phase = 'seatIntro';
  s.deadline = now + TIMES.seatIntro;
  draw(s, rnd);
}

const safeAmount = s => { let v = 0; SAFE.forEach(i => { if (s.rung > i) v = RUNGS[i]; }); return v; };

function lockIn(s, i, now) {
  s.pick = i;
  s.phase = 'lock';
  s.deadline = now + TIMES.lock;
  event(s, 'lock');
}

function result(s, now) {
  const right = s.pick === s.q.answer;
  // The room scores for right answers too.
  Object.entries(s.room).forEach(([pid, i]) => { if (i === s.q.answer) s.scores[pid] += Math.round(RUNGS[s.rung] * SHADOW); });
  s.right = right;
  if (right) { s.banked = RUNGS[s.rung]; s.rung++; }
  else s.banked = safeAmount(s);
  s.phase = 'result';
  s.deadline = now + TIMES.result;
  event(s, right ? 'right' : 'wrong');
}

function endSeat(s, now, rnd, how) {
  s.scores[hot(s)] += s.banked;
  s.seatEnd = { name: nameOf(s, hot(s)), amount: s.banked, how };
  if (s.seat + 1 >= s.seats.length) { s.phase = 'over'; return; }
  s.seat++;
  startSeat(s, now, rnd);
}

function afterResult(s, now, rnd) {
  if (!s.right) return endSeat(s, now, rnd, 'fell');
  if (s.rung >= RUNGS.length) return endSeat(s, now, rnd, 'top');
  draw(s, rnd);
  s.phase = 'question';
  s.deadline = now + TIMES.question;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!P(s, pid) || !a) return s;
  if (s.phase !== 'question') return s;
  if (pid !== hot(s)) {
    if (a.type === 'room' && !s.hidden.includes(a.i) && a.i >= 0 && a.i < 4) s.room[pid] = a.i;
    return s;
  }
  if (a.type === 'answer' && a.i >= 0 && a.i < 4 && !s.hidden.includes(a.i)) lockIn(s, a.i, now);
  else if (a.type === 'walk') { s.banked = s.rung ? RUNGS[s.rung - 1] : 0; event(s, 'walk'); endSeat(s, now, rnd, 'walked'); }
  else if (a.type === 'life' && s.life[a.name]) {
    s.life[a.name] = false;
    event(s, 'life');
    if (a.name === 'fifty') s.hidden = shuffle([0, 1, 2, 3].filter(i => i !== s.q.answer), rnd).slice(0, 2);
    if (a.name === 'room') s.roomShown = true;
    if (a.name === 'swap') { draw(s, rnd); s.deadline = now + TIMES.question; }
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'seatIntro') { s.phase = 'question'; s.deadline = now + TIMES.question; }
  else if (s.phase === 'question') { s.banked = s.rung ? RUNGS[s.rung - 1] : 0; endSeat(s, now, rnd, 'time'); }
  else if (s.phase === 'lock') result(s, now);
  else if (s.phase === 'result') afterResult(s, now, rnd);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (now < s.deadline) return s;
  return hostAct(s, 'next', now, rnd);
}

const money = n => n.toLocaleString();
export function narration(s) {
  switch (s.phase) {
    case 'seatIntro': return `${s.seat === 0 ? 'Welcome to Million Ladder! ' : ''}${nameOf(s, hot(s))}, take the hot seat. Everyone else, play along on your phones.`;
    case 'question': return `For ${money(RUNGS[s.rung])} points. ${s.q.q}`;
    case 'lock': return 'Locked in. Let\'s see…';
    case 'result': return s.right ? (s.rung >= RUNGS.length ? 'You reached the top of the ladder! One million points!' : `Correct! ${money(s.banked)} points.`) : `Oh no! The answer was ${s.q.options[s.q.answer]}.`;
    case 'over': return 'That\'s the end of Million Ladder!';
  }
  return '';
}

export function cue(s) {
  switch (s.phase) {
    case 'seatIntro': return { sound: 'join', wait: 900, title: nameOf(s, hot(s)), sub: 'Take the hot seat' };
    case 'question': return { sound: 'vote', wait: 500 };
    case 'lock': return { sound: 'drumroll', wait: 300 };
    case 'result': return s.right ? { sound: s.rung >= RUNGS.length ? 'win' : 'safe', wait: 400, fx: s.rung >= RUNGS.length ? 'confetti' : null } : { sound: 'death', wait: 400 };
    case 'over': return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'Who climbed highest?', tone: 'dawn', fx: 'confetti' };
  }
  return null;
}

export function cueEvent(s) {
  if (s.lastEvent === 'walk' && s.eventId) return { id: s.eventId, sound: 'safe', say: `${s.seatEnd?.name || ''} walks away with ${money(s.seatEnd?.amount || 0)} points.` };
  if (s.lastEvent === 'life' && s.eventId) return { id: s.eventId, sound: 'join', say: '' };
  return null;
}

// Bots: the higher the rung, the more likely they're wrong (and the more likely they walk away).
export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'question') return null;
  const open = [0, 1, 2, 3].filter(i => !(v.hidden || []).includes(i));
  if (!v.hot) return v.roomPick === null ? { type: 'room', i: rnd() < 0.65 ? v._ans : open[Math.floor(rnd() * open.length)] } : null;
  if (v.rung >= 6 && v.life.fifty) return { type: 'life', name: 'fifty' };
  if (v.rung >= 7 && rnd() < 0.25) return { type: 'walk' };
  const p = 0.95 - v.rung * 0.055;
  return { type: 'answer', i: rnd() < p ? v._ans : open.filter(i => i !== v._ans)[Math.floor(rnd() * (open.length - 1))] ?? v._ans };
}

// ---------- views ----------
function roomCounts(s) { const c = [0, 0, 0, 0]; Object.values(s.room).forEach(i => c[i]++); return c; }

export function tvView(s, now = Date.now()) {
  const v = {
    phase: s.phase, seat: s.seat + 1, seats: s.seats.length,
    hotName: nameOf(s, hot(s)), rung: s.rung, rungs: RUNGS, safe: SAFE, banked: s.banked,
    life: s.life, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
    scores: s.players.map(p => ({ name: p.name, score: s.scores[p.pid], hot: p.pid === hot(s) })).sort((a, b) => b.score - a.score),
    seatEnd: s.seatEnd || null,
  };
  if (s.q && s.phase !== 'seatIntro') Object.assign(v, { q: s.q.q, options: s.q.options, hidden: s.hidden, pick: s.pick });
  if (s.roomShown) v.room = roomCounts(s);
  if (s.phase === 'result') Object.assign(v, { answer: s.q.answer, right: s.right });
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, hot: pid === hot(s), hotName: nameOf(s, hot(s)), rung: s.rung, value: RUNGS[s.rung] || 0, banked: s.banked, life: s.life, score: s.scores[pid] };
  if (s.phase === 'question' || s.phase === 'lock' || s.phase === 'result') Object.assign(v, { q: s.q.q, options: s.q.options, hidden: s.hidden, pick: s.pick, roomPick: s.room[pid] ?? null, walkValue: s.rung ? RUNGS[s.rung - 1] : 0, safeValue: safeAmount(s) });
  if (s.phase === 'result') Object.assign(v, { answer: s.q.answer, right: s.right });
  if (s.roomShown && v.hot) v.room = roomCounts(s);
  if (String(pid).startsWith('bot-') && s.q) v._ans = s.q.answer;
  if (s.phase === 'over') { const r = [...s.players].sort((a, b) => s.scores[b.pid] - s.scores[a.pid]); v.rank = r.findIndex(p => p.pid === pid) + 1; v.of = r.length; }
  return v;
}

// ---------- renderers ----------
const L = 'ABCD';
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const ladder = `<div class="ladder">${v.rungs.map((r, i) => `<div class="rung ${i === v.rung && v.phase !== 'over' ? 'cur' : ''} ${i < v.rung ? 'done' : ''} ${v.safe.includes(i) ? 'safe' : ''}"><span>${i + 1}</span><b>${money(r)}</b></div>`).reverse().join('')}</div>`;
  const scores = `<div class="side">${ladder}<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow ${p.hot ? 'now' : ''}"><span>${esc(p.name)}</span><b>${money(p.score)}</b></div>`).join('')}</div></div>`;
  let h = '';
  if (v.phase === 'seatIntro') h = `<p class="cat">Hot seat ${v.seat} of ${v.seats}</p><h2>${esc(v.hotName)}, take the hot seat!</h2>${v.seatEnd ? `<p class="say">${esc(v.seatEnd.name)} ${v.seatEnd.how === 'walked' ? 'walked away with' : v.seatEnd.how === 'top' ? 'climbed to the top for' : 'leaves with'} <b>${money(v.seatEnd.amount)}</b>.</p>` : ''}<p class="muted">Ten questions to a million points. Safe havens at 5,000 and 50,000. Everyone else answers along on their phones for bonus points.</p><button class="btn" data-host="next">Start</button>`;
  else if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0]?.name || '')} wins!</h2>${v.seatEnd ? `<p class="say">${esc(v.seatEnd.name)} leaves with ${money(v.seatEnd.amount)}.</p>` : ''}<div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${money(p.score)}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  else {
    const opt = i => {
      const cls = [v.hidden.includes(i) ? 'gone' : '', v.pick === i ? (v.phase === 'result' ? (v.right ? 'right' : 'wrong') : 'locked') : '', v.phase === 'result' && i === v.answer ? 'right' : ''].join(' ');
      return `<div class="lopt ${cls}"><b>${L[i]}</b><span>${v.hidden.includes(i) ? '' : esc(v.options[i])}</span>${v.room && !v.hidden.includes(i) ? `<small>${v.room[i]} 👥</small>` : ''}</div>`;
    };
    const lifelines = `<div class="lifes">${[['fifty', '50:50'], ['room', 'Ask the room'], ['swap', 'Swap']].map(([k, t]) => `<span class="life ${v.life[k] ? '' : 'used'}">${t}</span>`).join('')}</div>`;
    h = `<p class="cat"><b>${esc(v.hotName)}</b> · for ${money(v.rungs[Math.min(v.rung - (v.phase === 'result' && v.right ? 1 : 0), 9)])} points ${v.phase === 'question' ? `<span class="clock small ${v.left <= 10 ? 'hurry' : ''}">${v.left}</span>` : ''}</p>
      <div class="lq">${esc(v.q)}</div><div class="lopts">${[0, 1, 2, 3].map(opt).join('')}</div>${lifelines}
      ${v.phase === 'result' ? `<p class="say ${v.right ? 'win' : 'lose'}">${v.right ? `Correct! ${money(v.banked)} points.` : `Wrong! ${esc(v.hotName)} falls to ${money(v.banked)}.`}</p><button class="btn" data-host="next">Continue</button>` : ''}`;
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

// The hot seat taps an answer, then confirms, so nobody locks in by accident.
let sel = { key: '', i: null };
export function renderPhone(v, el, send) {
  let h = '';
  const key = v.q || '';
  if (sel.key !== key) sel = { key, i: null };
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2>';
  else if (v.phase === 'seatIntro') h = v.hot ? '<h2>You\'re in the hot seat!</h2><p class="say">Answer on your phone. Walk away any time to keep your points.</p>' : `<h2>${esc(v.hotName)} is up</h2><p class="say">Answer along to earn bonus points.</p>`;
  else if (v.phase === 'over') h = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You won!' : `You came ${v.rank} of ${v.of}`}</h2><p class="say">${money(v.score)} points</p>`;
  else {
    const top = `<p class="muted">${v.hot ? `For ${money(v.value)} · safe ${money(v.safeValue)}` : `${esc(v.hotName)} is in the hot seat`}</p><p class="tq small">${esc(v.q)}</p>`;
    const mine = v.hot ? (v.pick ?? sel.i) : v.roomPick;
    const btns = v.options.map((o, i) => (v.hidden.includes(i) ? '' : `<button class="opt ${mine === i ? 'on' : ''} ${v.phase === 'result' && i === v.answer ? 'rightopt' : ''}" data-i="${i}" ${v.phase !== 'question' || (v.hot && v.pick !== null) ? 'disabled' : ''}><b>${L[i]}</b> ${esc(o)}${v.room && v.hot ? ` <small class="muted">(${v.room[i]} 👥)</small>` : ''}</button>`)).join('');
    h = `${top}<div class="opts">${btns}</div>`;
    if (v.hot && v.phase === 'question' && sel.i !== null) h += `<button class="btn" data-lock>Lock in ${L[sel.i]}</button>`;
    if (v.hot && v.phase === 'question') h += `<div class="row lifebtns">${[['fifty', '50:50'], ['room', 'Ask the room'], ['swap', 'Swap']].map(([k, t]) => `<button class="btn ghost" data-life="${k}" ${v.life[k] ? '' : 'disabled'}>${t}</button>`).join('')}</div><button class="btn ghost" data-walk>Walk away with ${money(v.walkValue)}</button>`;
    if (v.phase === 'lock') h += '<p class="say center">Locked in…</p>';
    if (v.phase === 'result') h += `<p class="say ${v.right ? 'win' : 'lose'}">${v.right ? 'Correct!' : 'Wrong!'}</p>`;
    if (!v.hot) h += `<p class="muted">Your bonus: ${money(v.score)}</p>`;
  }
  el.innerHTML = h;
  el.querySelectorAll('[data-i]').forEach(b => (b.onclick = () => {
    const i = Number(b.dataset.i);
    if (v.hot) { sel.i = i; renderPhone(v, el, send); } else send({ type: 'room', i });
  }));
  el.querySelector('[data-lock]')?.addEventListener('click', () => send({ type: 'answer', i: sel.i }));
  el.querySelectorAll('[data-life]').forEach(b => (b.onclick = () => send({ type: 'life', name: b.dataset.life })));
  el.querySelector('[data-walk]')?.addEventListener('click', () => send({ type: 'walk' }));
}
