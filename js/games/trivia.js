// Trivia Board: pick a category and point value, race to buzz in on your phone, type your answer.
// One hidden Wager Tile, then a Final Bet round for everyone. Our own name, look and phrasing.
import { esc } from '../ui.js';
import { CATEGORIES, FINALS } from './trivia-bank.js';

export const meta = {
  id: 'trivia',
  name: 'Trivia Board',
  min: 2,
  max: 10,
  blurb: 'Pick a category and point value, then race to buzz in on your phone.',
};

export const VALUES = [100, 200, 300, 400];
const COLS = 4;
export const TIMES = { pick: 25000, readMin: 2500, perChar: 45, buzz: 9000, answer: 15000, rebuzz: 6000, reveal: 4500, wager: 20000, finalWager: 30000, finalAnswer: 35000, finalStep: 4500 };

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- answer checking ----------
const NUM = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12' };
const norm = t => String(t || '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
  .replace(/^\s*(what|who|where)\s+(is|are|was|were)\s+/, '')
  .replace(/\b(the|a|an)\b/g, ' ').replace(/[^a-z0-9 ]/g, ' ')
  .split(/\s+/).filter(Boolean).map(w => NUM[w] || w).join(' ');
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
export function isRight(text, accepted) {
  const t = norm(text);
  if (!t) return false;
  return accepted.some(a => {
    const x = norm(a);
    if (t === x || t === x + 's' || t + 's' === x) return true;
    if (/^\d+$/.test(x)) return false;                                     // numbers must be exact
    const allow = x.length >= 9 ? 2 : x.length >= 5 ? 1 : 0;                // small typos are fine
    return lev(t.replace(/ /g, ''), x.replace(/ /g, '')) <= allow;
  });
}

// ---------- setup ----------
export function setup(players, rnd = Math.random, prev = null) {
  const recent = new Set(prev?.usedCats || []);
  let pool = CATEGORIES.map((c, i) => i).filter(i => !recent.has(i));
  if (pool.length < COLS) pool = CATEGORIES.map((c, i) => i);
  const cats = shuffle(pool, rnd).slice(0, COLS);
  const tiles = cats.map(() => VALUES.map(() => true));                   // true = still on the board
  // The wager tile hides somewhere outside the cheapest row.
  const wager = { c: Math.floor(rnd() * COLS), r: 1 + Math.floor(rnd() * (VALUES.length - 1)) };
  // Twist: one more hidden tile pays double for a right answer (a miss still costs only the face value).
  let bonus = wager; while (bonus.c === wager.c && bonus.r === wager.r) bonus = { c: Math.floor(rnd() * COLS), r: Math.floor(rnd() * VALUES.length) };
  const finalsLeft = FINALS.map((f, i) => i).filter(i => i !== prev?.finalIdx);
  const scores = {};
  players.forEach(p => (scores[p.pid] = 0));
  return {
    game: 'trivia',
    phase: 'pick',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    cats, tiles, wager, bonus,
    finalIdx: finalsLeft[Math.floor(rnd() * finalsLeft.length)],
    picker: players[Math.floor(rnd() * players.length)].pid,
    cur: null,              // {c, r}
    buzzer: null,
    locked: [],             // pids who already missed this clue
    lastAnswer: null,       // {pid, text, right}
    bet: 0,
    finalBets: {}, finalAnswers: {}, finalOrder: [], finalStep: 0,
    scores,
    usedCats: [...recent, ...cats].slice(-8),
    deadline: Date.now() + TIMES.pick,
    eventId: 0, lastEvent: null,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const clue = s => s.cur && CATEGORIES[s.cats[s.cur.c]].clues[s.cur.r];
const value = s => (s.cur ? VALUES[s.cur.r] : 0);
const isWager = (s, c, r) => s.wager.c === c && s.wager.r === r;
const isBonus = s => !!s.cur && !!s.bonus && s.bonus.c === s.cur.c && s.bonus.r === s.cur.r;
const left = s => s.tiles.flat().filter(Boolean).length;
const final = s => FINALS[s.finalIdx];
const readTime = text => Math.max(TIMES.readMin, text.length * TIMES.perChar);
const event = (s, name) => { s.eventId++; s.lastEvent = name; };

function toPick(s, now) {
  s.cur = null; s.buzzer = null; s.locked = []; s.bet = 0;
  if (!left(s)) return startFinal(s, now);
  s.phase = 'pick';
  s.deadline = now + TIMES.pick;
}

function choose(s, c, r, now) {
  if (!s.tiles[c]?.[r]) return;
  s.tiles[c][r] = false;
  s.cur = { c, r };
  s.locked = []; s.buzzer = null; s.lastAnswer = null; s.attempts = [];
  if (isWager(s, c, r)) { s.phase = 'wager'; s.deadline = now + TIMES.wager; event(s, 'wagerTile'); }
  else { s.phase = 'read'; s.deadline = now + readTime(clue(s).q) + (isBonus(s) ? 1800 : 0); if (isBonus(s)) event(s, 'bonusTile'); }
}

function reveal(s, now, right) {
  s.phase = 'reveal';
  s.deadline = now + TIMES.reveal;
  s.revealRight = right;
}

function judge(s, pid, text, now) {
  const right = isRight(text, clue(s).a);
  const amt = s.bet || value(s) * (right && isBonus(s) ? 2 : 1);
  s.scores[pid] += right ? amt : -amt;
  s.lastAnswer = { pid, text: String(text || '').slice(0, 40), right, amt };
  s.attempts = [...(s.attempts || []), s.lastAnswer];
  event(s, right ? 'right' : 'wrong');
  if (right) { s.picker = pid; return reveal(s, now, true); }
  if (s.bet) return reveal(s, now, false);                                  // wager tile: only one try
  s.locked.push(pid);
  s.buzzer = null;
  if (s.players.every(p => s.locked.includes(p.pid))) return reveal(s, now, false);
  s.phase = 'buzz';
  s.deadline = now + TIMES.rebuzz;
}

function startFinal(s, now) {
  s.cur = null;
  s.phase = 'finalWager';
  s.finalBets = {}; s.finalAnswers = {};
  s.deadline = now + TIMES.finalWager;
  // Anyone at zero or below still plays, but can only bet 0.
}
const finalists = s => s.players;
const maxBet = (s, pid) => Math.max(0, s.scores[pid]);

function startFinalAnswer(s, now) {
  finalists(s).forEach(p => { if (s.finalBets[p.pid] === undefined) s.finalBets[p.pid] = 0; });
  s.phase = 'finalAnswer';
  s.deadline = now + TIMES.finalAnswer;
}

function startFinalReveal(s, now) {
  // Reveal from lowest score to highest, for suspense.
  s.finalOrder = finalists(s).map(p => p.pid).sort((a, b) => s.scores[a] - s.scores[b]);
  s.finalStep = -1;
  s.phase = 'finalReveal';
  s.deadline = now + 1500;
}

function finalNext(s, now) {
  if (s.finalStep + 1 >= s.finalOrder.length) { s.phase = 'over'; return; }
  s.finalStep++;
  const pid = s.finalOrder[s.finalStep];
  const right = isRight(s.finalAnswers[pid], final(s).a);
  s.scores[pid] += right ? s.finalBets[pid] : -s.finalBets[pid];
  s.finalRight = { ...(s.finalRight || {}), [pid]: right };
  event(s, right ? 'right' : 'wrong');
  s.deadline = now + TIMES.finalStep;
}

// ---------- actions ----------
export function act(s, pid, a, now = Date.now()) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'pick' && a.type === 'pick' && pid === s.picker) choose(s, a.c, a.r, now);
  else if ((s.phase === 'buzz' || s.phase === 'read') && a.type === 'buzz') {
    if (s.phase === 'read') { s.early = { ...(s.early || {}), [pid]: now }; return s; }    // too early: ignored
    if (s.locked.includes(pid) || s.buzzer) return s;
    s.buzzer = pid;
    s.phase = 'answer';
    s.deadline = now + TIMES.answer;
    event(s, 'buzz');
  } else if (s.phase === 'answer' && a.type === 'answer' && pid === s.buzzer) judge(s, pid, a.text, now);
  else if (s.phase === 'wager' && a.type === 'bet' && pid === s.picker) {
    const max = Math.max(s.scores[pid], VALUES[VALUES.length - 1]);
    s.bet = Math.max(5, Math.min(max, Math.round(Number(a.amount) || 0)));
    s.buzzer = pid;
    s.phase = 'answer';
    s.deadline = now + readTime(clue(s).q) + TIMES.answer;
  } else if (s.phase === 'finalWager' && a.type === 'bet') {
    s.finalBets[pid] = Math.max(0, Math.min(maxBet(s, pid), Math.round(Number(a.amount) || 0)));
    if (finalists(s).every(p => s.finalBets[p.pid] !== undefined)) startFinalAnswer(s, now);
  } else if (s.phase === 'finalAnswer' && a.type === 'answer') {
    s.finalAnswers[pid] = String(a.text || '').slice(0, 40);
    if (finalists(s).every(p => s.finalAnswers[p.pid] !== undefined)) startFinalReveal(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a === 'overrule' && s.phase === 'reveal' && s.lastAnswer && !s.lastAnswer.right) {
    // The room says the answer should count: undo the penalty and award it.
    const { pid, amt } = s.lastAnswer;
    s.scores[pid] += amt * 2;
    s.lastAnswer.right = true; s.lastAnswer.overruled = true;
    s.picker = pid;
    s.revealRight = true;
    event(s, 'right');
    return s;
  }
  if (a !== 'next') return s;
  if (s.phase === 'pick') { const open = []; s.tiles.forEach((col, c) => col.forEach((on, r) => on && open.push([c, r]))); if (open.length) choose(s, ...open[0], now); }
  else if (s.phase === 'read') { s.phase = 'buzz'; s.deadline = now + TIMES.buzz; }
  else if (s.phase === 'buzz') reveal(s, now, false);
  else if (s.phase === 'answer') judge(s, s.buzzer, '', now);
  else if (s.phase === 'wager') act(s, s.picker, { type: 'bet', amount: 100 }, now);
  else if (s.phase === 'reveal') toPick(s, now);
  else if (s.phase === 'finalWager') startFinalAnswer(s, now);
  else if (s.phase === 'finalAnswer') startFinalReveal(s, now);
  else if (s.phase === 'finalReveal') finalNext(s, now);
  return s;
}

export function tick(s, now = Date.now()) {
  if (now < s.deadline) return s;
  if (s.phase === 'pick') hostAct(s, 'next', now);
  else if (s.phase === 'read') { s.phase = 'buzz'; s.deadline = now + TIMES.buzz; }
  else if (s.phase === 'buzz') reveal(s, now, false);
  else if (s.phase === 'answer') judge(s, s.buzzer, '', now);
  else if (s.phase === 'wager') act(s, s.picker, { type: 'bet', amount: 100 }, now);
  else if (s.phase === 'reveal') toPick(s, now);
  else if (s.phase === 'finalWager') startFinalAnswer(s, now);
  else if (s.phase === 'finalAnswer') startFinalReveal(s, now);
  else if (s.phase === 'finalReveal') finalNext(s, now);
  return s;
}

// ---------- narration & sound ----------
export function narration(s) {
  switch (s.phase) {
    case 'pick': return left(s) === COLS * VALUES.length ? `Welcome to Trivia Board! ${nameOf(s, s.picker)}, pick a category on your phone.` : `${nameOf(s, s.picker)}, pick the next one.`;
    case 'read': return clue(s).q;
    case 'wager': return `You found the Wager Tile! ${nameOf(s, s.picker)}, how much will you bet?`;
    case 'reveal': return s.revealRight ? '' : `The answer was ${clue(s).a[0]}.`;
    case 'finalWager': return `Time for the Final Bet. The category is ${final(s).cat}. Everyone, place your bet on your phone.`;
    case 'finalAnswer': return final(s).q;
    case 'over': { const w = [...s.players].sort((a, b) => s.scores[b.pid] - s.scores[a.pid])[0]; return `${w.name} wins Trivia Board!`; }
  }
  return '';
}

export function cue(s) {
  switch (s.phase) {
    case 'pick': return left(s) === COLS * VALUES.length ? { sound: 'join', wait: 800, title: 'Trivia Board', sub: 'Buzz in on your phone' } : null;
    case 'read': return { sound: 'vote', wait: 300 };
    case 'wager': return { sound: 'win', wait: 1200, title: 'Wager Tile!', sub: 'Bet it all?', tone: 'dawn' };
    case 'finalWager': return { sound: 'drumroll', wait: 2000, title: 'Final Bet', sub: final(s).cat, tone: 'night' };
    case 'finalAnswer': return { sound: 'vote', wait: 400 };
    case 'over': return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'Trivia champion', tone: 'dawn', fx: 'confetti' };
  }
  return null;
}

export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.lastEvent === 'buzz') return { id: s.eventId, sound: 'join', say: nameOf(s, s.buzzer) };
  if (s.lastEvent === 'right') return { id: s.eventId, sound: 'safe', say: s.phase === 'finalReveal' ? '' : 'Correct!' };
  if (s.lastEvent === 'bonusTile') return { id: s.eventId, sound: 'win', say: 'Double value!' };
  if (s.lastEvent === 'wrong') return { id: s.eventId, sound: 'death', say: '' };
  return null;
}

// Bots: buzz sometimes, answer right more often on cheap clues.
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'pick' && v.isPicker) { const open = v.open || []; const t = open[Math.floor(rnd() * open.length)]; return t ? { type: 'pick', c: t.c, r: t.r } : null; }
  if (v.phase === 'buzz' && !v.locked && rnd() < 0.5) return { type: 'buzz' };
  if (v.phase === 'answer' && v.isBuzzer) return { type: 'answer', text: rnd() < 0.85 - v.row * 0.12 ? v._a : 'no idea' };
  if (v.phase === 'wager' && v.isPicker) return { type: 'bet', amount: Math.max(100, Math.round(v.score / 2 / 100) * 100) };
  if (v.phase === 'finalWager' && v.bet === undefined) return { type: 'bet', amount: Math.floor(v.maxBet / 2) };
  if (v.phase === 'finalAnswer' && v.answered === undefined) return { type: 'answer', text: rnd() < 0.5 ? v._a : 'no idea' };
  return null;
}

// ---------- views ----------
const board = s => s.players.map(p => ({ name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);

export function tvView(s, now = Date.now()) {
  const v = {
    phase: s.phase,
    cats: s.cats.map(i => CATEGORIES[i].name),
    tiles: s.tiles,
    values: VALUES,
    picker: nameOf(s, s.picker),
    scores: board(s),
    left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
  };
  if (s.cur) Object.assign(v, { cur: s.cur, cat: CATEGORIES[s.cats[s.cur.c]].name, value: s.bet || value(s), q: s.phase === 'wager' ? null : clue(s).q, wagerTile: isWager(s, s.cur.c, s.cur.r), bonus: isBonus(s) });
  if (s.phase === 'buzz' || s.phase === 'answer') v.lockedNames = s.locked.map(p => nameOf(s, p));
  if (s.phase === 'answer') v.buzzer = nameOf(s, s.buzzer);
  if (s.phase === 'reveal') Object.assign(v, { attempts: (s.attempts || []).slice(0, -1).map(a => ({ ...a, name: nameOf(s, a.pid) })), answer: clue(s).a[0], last: s.lastAnswer ? { ...s.lastAnswer, name: nameOf(s, s.lastAnswer.pid) } : null, right: s.revealRight });
  if (s.phase.startsWith('final') || s.phase === 'over') {
    const f = final(s);
    v.final = { cat: f.cat, q: s.phase === 'finalWager' ? null : f.q, answer: s.phase === 'finalReveal' || s.phase === 'over' ? f.a[0] : null };
    v.betsIn = Object.keys(s.finalBets).length; v.answersIn = Object.keys(s.finalAnswers).length; v.total = s.players.length;
    if (s.phase === 'finalReveal' || s.phase === 'over') {
      const upto = s.phase === 'over' ? s.finalOrder.length : s.finalStep + 1;
      v.finalShown = s.finalOrder.slice(0, upto).map(pid => ({ name: nameOf(s, pid), text: s.finalAnswers[pid] || '(no answer)', bet: s.finalBets[pid] || 0, right: !!s.finalRight?.[pid] }));
    }
  }
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, score: s.scores[pid], picker: nameOf(s, s.picker), isPicker: s.picker === pid };
  if (s.phase === 'pick' && v.isPicker) {
    v.cats = s.cats.map(i => CATEGORIES[i].name);
    v.tiles = s.tiles; v.values = VALUES;
    v.open = []; s.tiles.forEach((col, c) => col.forEach((on, r) => on && v.open.push({ c, r })));
  }
  if (s.cur) { v.cat = CATEGORIES[s.cats[s.cur.c]].name; v.value = s.bet || value(s); v.row = s.cur.r; v.bonus = isBonus(s); if (s.phase !== 'wager') v.q = clue(s).q; }
  if (s.phase === 'buzz' || s.phase === 'read') v.locked = s.locked.includes(pid);
  if (s.phase === 'answer') { v.isBuzzer = s.buzzer === pid; v.buzzer = nameOf(s, s.buzzer); }
  if (s.phase === 'wager') v.maxBet = Math.max(s.scores[pid], VALUES[VALUES.length - 1]);
  if (s.phase === 'reveal') { v.answer = clue(s).a[0]; v.last = s.lastAnswer && s.lastAnswer.pid === pid ? s.lastAnswer : null; }
  if (s.phase.startsWith('final')) {
    v.fcat = final(s).cat;
    v.maxBet = maxBet(s, pid);
    v.bet = s.finalBets[pid];
    v.answered = s.finalAnswers[pid];
    if (s.phase !== 'finalWager') v.q = final(s).q;
  }
  if (s.phase === 'over') { const r = board(s); v.rank = r.findIndex(x => x.name === nameOf(s, pid)) + 1; v.of = r.length; }
  // Bots only (the TV strips nothing here, but phones never show it): the answer, so bots can sometimes be right.
  if (P(s, pid) && String(pid).startsWith('bot-')) v._a = s.phase.startsWith('final') ? final(s).a[0] : s.cur ? clue(s).a[0] : '';
  return v;
}

// ---------- renderers ----------
const pts = n => (n < 0 ? '−' : '') + Math.abs(n).toLocaleString();
const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

function boardHtml(v, small) {
  return `<div class="tboard ${small ? 'small' : ''}" style="--cols:${v.cats.length}">${v.cats.map(c => `<div class="tcat">${esc(c)}</div>`).join('')}${v.values.map((val, r) => v.cats.map((_, c) => {
    const on = v.tiles[c][r];
    const sel = v.cur && v.cur.c === c && v.cur.r === r;
    return small ? `<button class="tile ${on ? '' : 'gone'}" ${on ? `data-tile="${c},${r}"` : 'disabled'}>${on ? val : ''}</button>` : `<div class="tile ${on ? '' : 'gone'} ${sel ? 'sel' : ''}">${on ? val : ''}</div>`;
  }).join('')).join('')}</div>`;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b class="${p.score < 0 ? 'lose' : ''}">${pts(p.score)}</b></div>`).join('')}</div>`;
  let h = '';
  const card = (inner, cls = '') => `<div class="tclue ${cls}"><p class="tcl-cat">${esc(v.cat || '')} · ${v.wagerTile ? `Wager ${pts(v.value)}` : pts(v.value)}${v.bonus ? ' <span class="gtwist dbl">✨ Double if right</span>' : ''}</p>${inner}</div>`;
  if (v.phase === 'pick') h = `<h2>${esc(v.picker)}, pick a clue</h2><p class="muted">Choose on your phone.</p>${boardHtml(v)}`;
  if (v.phase === 'read') h = card(`<div class="tq">${esc(v.q)}</div><p class="muted">Get ready to buzz…</p>`, 'zoom');
  if (v.phase === 'buzz') h = card(`<div class="tq">${esc(v.q)}</div><p class="say buzzopen">Buzz in now! <span class="clock ${v.left <= 3 ? 'hurry' : ''}">${v.left}</span></p>${v.lockedNames.length ? `<p class="muted">Out on this one: ${v.lockedNames.map(esc).join(', ')}</p>` : ''}`);
  if (v.phase === 'answer') h = card(`<div class="tq">${esc(v.q)}</div><div class="buzzed">${esc(v.buzzer)}</div><p class="say">is answering… <span class="clock">${v.left}</span></p>`);
  if (v.phase === 'wager') h = `<div class="tclue zoom wagercard"><h2>Wager Tile!</h2><p class="say">${esc(v.picker)} is placing a bet on <b>${esc(v.cat)}</b>.</p><p class="clock">${mmss(v.left)}</p></div>`;
  if (v.phase === 'reveal') h = card(`<div class="tq">${esc(v.q)}</div>${v.attempts.map(a => `<div class="judge lose small">${esc(a.name)}: “${esc(a.text || '…')}” ✗ −${pts(a.amt)}</div>`).join('')}${v.last ? `<div class="judge ${v.last.right ? 'win' : 'lose'}">${esc(v.last.name)}: “${esc(v.last.text || '…')}” ${v.last.right ? `✓ +${pts(v.last.amt)}${v.last.overruled ? ' (counted by the room)' : ''}` : `✗ −${pts(v.last.amt)}`}</div>` : '<div class="judge">Nobody got it.</div>'}<div class="tanswer">Answer: <b>${esc(v.answer)}</b></div>${v.last && !v.last.right ? '<button class="btn ghost" data-host="overrule">That should count</button>' : ''}<button class="btn" data-host="next">Continue</button>`);
  if (v.phase === 'finalWager') h = `<div class="tclue zoom"><p class="tcl-cat">Final Bet</p><div class="tq">${esc(v.final.cat)}</div><p class="say">Everyone bet on your phone, from 0 up to your score.</p><div class="meter"><span style="width:${(100 * v.betsIn) / v.total}%"></span></div><p class="clock">${mmss(v.left)}</p></div>`;
  if (v.phase === 'finalAnswer') h = `<div class="tclue"><p class="tcl-cat">Final Bet · ${esc(v.final.cat)}</p><div class="tq">${esc(v.final.q)}</div><p class="say">Type your answer on your phone.</p><div class="meter"><span style="width:${(100 * v.answersIn) / v.total}%"></span></div><p class="clock">${mmss(v.left)}</p></div>`;
  if (v.phase === 'finalReveal' || v.phase === 'over') {
    h = `<div class="tclue"><p class="tcl-cat">Final Bet · ${esc(v.final.cat)}</p><div class="tq small">${esc(v.final.q)}</div><div class="tanswer">Answer: <b>${esc(v.final.answer)}</b></div><div class="reveals">${(v.finalShown || []).map(f => `<div class="rv ${f.right ? 'truth' : 'lie'}"><div class="rv-text">${esc(f.name)}: “${esc(f.text)}”</div><div class="rv-tag">${f.right ? '+' : '−'}${pts(f.bet)}</div></div>`).join('')}</div></div>`;
    if (v.phase === 'over') h += `<h2 class="win">${esc(v.scores[0]?.name || '')} wins!</h2><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
    else h += '<button class="btn ghost" data-host="next">Next</button>';
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  const top = v.cat ? `<p class="muted">${esc(v.cat)} · ${pts(v.value)}</p>` : '';
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>';
  else if (v.phase === 'pick' && v.isPicker) h = `<h2>Pick a clue</h2>${boardHtml(v, true)}`;
  else if (v.phase === 'pick') h = `<h2>${esc(v.picker)} is picking</h2><p class="say">Get your buzzer finger ready.</p><p class="muted">Your score: ${pts(v.score)}</p>`;
  else if (v.phase === 'read' || v.phase === 'buzz') {
    const ready = v.phase === 'buzz' && !v.locked;
    h = `${top}<p class="tq small">${esc(v.q)}</p><button class="buzz ${ready ? 'live' : ''}" data-buzz ${ready ? '' : 'disabled'}>${v.locked ? 'Out on this one' : ready ? 'BUZZ' : 'Wait…'}</button>`;
  } else if (v.phase === 'answer' && v.isBuzzer) h = `${top}<p class="tq small">${esc(v.q)}</p><form id="tf"><label for="ans">${v.value && v.isPicker && v.phase === 'answer' ? 'Your answer' : 'You buzzed! Your answer'}</label><input id="ans" maxlength="40" autocomplete="off" autocapitalize="off" required><button class="btn" type="submit">Answer</button></form>`;
  else if (v.phase === 'answer') h = `${top}<h2>${esc(v.buzzer)} buzzed in</h2><p class="say">Fingers crossed they're wrong…</p>`;
  else if (v.phase === 'wager' && v.isPicker) h = `<h2>Wager Tile!</h2><p class="say">Category: <b>${esc(v.cat)}</b></p><form id="wf"><label for="bet">Bet 5 to ${pts(v.maxBet)}</label><input id="bet" type="number" inputmode="numeric" min="5" max="${v.maxBet}" step="5" value="${Math.min(v.maxBet, Math.max(100, Math.round(v.score / 2 / 100) * 100))}" required><button class="btn" type="submit">Lock in bet</button></form>`;
  else if (v.phase === 'wager') h = `<h2>Wager Tile!</h2><p class="say">${esc(v.picker)} is betting.</p>`;
  else if (v.phase === 'reveal') h = `${top}<h2>${v.last ? (v.last.right ? '<span class="win">Correct!</span>' : '<span class="lose">Not quite</span>') : 'Answer'}</h2><p class="say">${esc(v.answer)}</p><p class="muted">Your score: ${pts(v.score)}</p>`;
  else if (v.phase === 'finalWager' && v.bet === undefined) h = `<h2>Final Bet</h2><p class="say">Category: <b>${esc(v.fcat)}</b></p><form id="fw"><label for="bet">Bet 0 to ${pts(v.maxBet)}</label><input id="bet" type="number" inputmode="numeric" min="0" max="${v.maxBet}" step="5" value="${Math.floor(v.maxBet / 2)}" required><button class="btn" type="submit">Lock in bet</button></form>`;
  else if (v.phase === 'finalWager') h = `<h2>Bet locked: ${pts(v.bet)}</h2><p class="say">Waiting for everyone…</p>`;
  else if (v.phase === 'finalAnswer' && v.answered === undefined) h = `<p class="muted">Final Bet · ${esc(v.fcat)} · you bet ${pts(v.bet)}</p><p class="tq small">${esc(v.q)}</p><form id="tf"><label for="ans">Your answer</label><input id="ans" maxlength="40" autocomplete="off" required><button class="btn" type="submit">Lock it in</button></form>`;
  else if (v.phase === 'finalAnswer') h = `<h2>Answer locked</h2><p class="say">“${esc(v.answered)}”</p>`;
  else if (v.phase === 'finalReveal') h = '<h2>Watch the TV!</h2>';
  else if (v.phase === 'over') h = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You won!' : `You came ${v.rank} of ${v.of}`}</h2><p class="say">${pts(v.score)} points</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-tile]').forEach(b => (b.onclick = () => { const [c, r] = b.dataset.tile.split(',').map(Number); send({ type: 'pick', c, r }); }));
  const bz = el.querySelector('[data-buzz]');
  if (bz) bz.addEventListener('pointerdown', e => { e.preventDefault(); if (bz.disabled) return; bz.classList.add('hit'); try { navigator.vibrate?.(60); } catch {} send({ type: 'buzz' }); });
  const tf = el.querySelector('#tf');
  if (tf) { tf.querySelector('input').focus(); tf.onsubmit = e => { e.preventDefault(); tf.querySelector('button').disabled = true; send({ type: 'answer', text: tf.querySelector('input').value.trim() }); }; }
  const wf = el.querySelector('#wf') || el.querySelector('#fw');
  if (wf) wf.onsubmit = e => { e.preventDefault(); wf.querySelector('button').disabled = true; send({ type: 'bet', amount: Number(wf.querySelector('input').value) }); };
}
