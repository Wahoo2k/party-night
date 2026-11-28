// GOAT Toss: a press-your-luck tossing game. Toss two little goats, score by how they land,
// keep tossing to build your turn, or bank before they butt heads and wipe it out. First to the target is the
// Greatest Of All Time. Our own pieces, landing names and scoring (not affiliated with any commercial dice game).
// (The file and game id are still "ducks" from the first version, so saved rooms and links keep working.)
import { esc } from '../ui.js';

export const meta = {
  how: ['Swipe up on your phone to toss two goats onto the table. With four or more players, everybody tosses at the same time.', 'How they land scores points: hooves up and on all fours are 5, a nose dive is 10, a horn stand is 15. Two the same is worth four times as much.', 'Keep tossing to build your turn, or bank your points to keep them.', "If the goats land on two different sides they butt heads and you lose the turn's points. First to 100 is the G.O.A.T.", 'Twists: now and then a turn is double or nothing, and once a game each player can shout "one more!" to make the thrower toss again before banking.'],
  id: 'ducks',
  name: 'GOAT Toss',
  min: 2,
  max: 10,
  blurb: 'Toss two goats, see how they land, and push your luck. First to 100 is the G.O.A.T.',
  kids: true,
};

export const TARGET = 100;
export const TIMES = { anim: 3000, endTurn: 3400, idle: 30000 };

// How one goat lands. One flank has a painted spot, so the two "lying down" sides can be told apart.
export const POSES = {
  left:  { name: 'Spot side',   pts: 0,  p: 0.33 },
  right: { name: 'Plain side',  pts: 0,  p: 0.29 },
  back:  { name: 'Hooves up',   pts: 5,  p: 0.20 },
  stand: { name: 'On all fours', pts: 5, p: 0.10 },
  nose:  { name: 'Nose dive',   pts: 10, p: 0.05 },
  horn:  { name: 'Horn stand',  pts: 15, p: 0.03 },
};
const PILE_CHANCE = 0.006;   // goats land touching: lose your whole score

const DOUBLE = { back: 'Double hooves up', stand: 'Stampede', nose: 'Double nose dive', horn: 'G.O.A.T. landing' };

function pose(rnd) {
  let r = rnd();
  for (const [k, v] of Object.entries(POSES)) { if ((r -= v.p) < 0) return k; }
  return 'left';
}

// Score a pair of landings.
export function score(a, b) {
  const isSide = k => k === 'left' || k === 'right';
  if (isSide(a) && isSide(b)) return a === b ? { name: 'Nap time', pts: 1 } : { name: 'Butt heads!', pts: 0, bust: true };
  if (isSide(a)) return { name: POSES[b].name, pts: POSES[b].pts };
  if (isSide(b)) return { name: POSES[a].name, pts: POSES[a].pts };
  if (a === b) return { name: DOUBLE[a], pts: POSES[a].pts * 4, double: true };
  return { name: `${POSES[a].name} + ${POSES[b].name}`, pts: POSES[a].pts + POSES[b].pts, combo: true };
}

export function toss(rnd = Math.random) {
  if (rnd() < PILE_CHANCE) return { a: 'pile', b: 'pile', name: 'Goat pile!', pts: 0, pile: true };
  const a = pose(rnd), b = pose(rnd);
  return { a, b, ...score(a, b) };
}

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const order = players.map(p => p.pid);
  // Rotate who goes first each game.
  const start = prev ? (order.indexOf(prev.order?.[0]) + 1) % order.length : Math.floor(rnd() * order.length);
  const rotated = order.slice(start).concat(order.slice(0, start));
  const scores = {};
  players.forEach(p => (scores[p.pid] = 0));
  const st = {
    game: 'ducks',
    phase: 'turn',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    order: rotated,
    t: 0,
    scores,
    turnPts: 0,
    tosses: [],        // this turn's tosses
    last: null,        // last toss result
    eventId: 0,
    busyUntil: 0,
    ending: 0,         // when the turn hands over after a bust or bank
    endReason: null,
    deadline: Date.now() + TIMES.idle,
    winner: null,
    twist: null,       // 'double' on a double-or-nothing turn
    dares: Object.fromEntries(order.map(pid => [pid, 1])),   // each player may once make a thrower toss again before banking
    forced: null,      // who called 'one more!' on this turn's thrower, until the next toss
  };
  // Four or more players all toss at the same time, so nobody waits five turns to touch their phone.
  if (players.length >= TOGETHER_MIN && opts?.together !== false) {
    st.mode = 'together';
    st.tg = { round: 1, wave: 1, step: 'wave', pens: Object.fromEntries(order.map(pid => [pid, newPen()])) };
    st.deadline = Date.now() + TG.first;
  }
  return st;
}

// ---------- everyone at once (4+ players) ----------
// A round: everybody tosses together. Whoever is still standing then chooses, secretly, to toss again or bank; the
// choices play out together, and so on until every player has banked or butted heads. Then the next round. The game
// ends at the end of a round in which somebody has reached the target: highest score wins, a tie plays on.
export const TOGETHER_MIN = 4;
export const TG = { first: 10000, choose: 10000, anim: 2600, show: 2000, roundEnd: 3000 };
const newPen = () => ({ pts: 0, state: 'in', choice: null, last: null, got: 0, lost: 0, kept: 0, tossed: false });
const tgIn = s => s.order.filter(pid => s.tg.pens[pid].state === 'in');
const tgEvent = (s, name) => { s.eventId++; s.lastEvent = name; };
function tgStartRound(s, now, rnd = Math.random) {
  const g = s.tg; g.round++; g.wave = 1; g.step = 'wave';
  for (const pid of s.order) g.pens[pid] = newPen();
  s.twist = rnd() < DOUBLE_CHANCE ? 'double' : null;
  s.busyUntil = 0; s.deadline = now + TG.first;
  tgEvent(s, s.twist ? 'twist' : 'tgRound');
}
function tgRoundEnd(s, now) { s.tg.step = 'roundEnd'; s.deadline = now + TG.roundEnd; tgEvent(s, 'tgRoundEnd'); }
function tgResolve(s, now, rnd = Math.random) {
  const g = s.tg, mult = s.twist === 'double' ? 2 : 1; let tossed = 0;
  for (const pid of s.order) g.pens[pid].tossed = false;
  for (const pid of tgIn(s)) {
    const pen = g.pens[pid], choice = pen.choice || (g.wave === 1 || pen.pts === 0 ? 'toss' : 'bank');   // walked away: keep what you have
    pen.choice = null;
    if (choice === 'bank') { pen.got = pen.pts * mult; s.scores[pid] += pen.got; pen.state = 'banked'; continue; }
    const r = toss(rnd); pen.last = r; pen.tossed = true; tossed++;
    if (r.pile) { pen.lost = s.scores[pid]; s.scores[pid] = 0; pen.pts = 0; pen.state = 'pile'; }
    else if (r.bust) {
      const all = Object.values(s.scores), mine = s.scores[pid];
      pen.kept = mine === Math.min(...all) && Math.max(...all) - mine >= 30 ? Math.floor(pen.pts / 2) : 0;   // the same catch-up as turn by turn
      s.scores[pid] += pen.kept; pen.lost = pen.pts - pen.kept; pen.pts = 0; pen.state = 'bust';
      if (s.twist === 'double') { const cost = Math.min(DOUBLE_COST, s.scores[pid]); s.scores[pid] -= cost; pen.lost += cost; }
    } else pen.pts += r.pts;
  }
  if (!tossed) return tgRoundEnd(s, now);
  g.step = 'land'; s.busyUntil = now + TG.anim; s.deadline = now + TG.anim + TG.show; tgEvent(s, 'tgLand');
}
function tgAdvance(s, now, rnd = Math.random) {
  const g = s.tg;
  if (g.step === 'wave') return tgResolve(s, now, rnd);
  if (g.step === 'land') { if (!tgIn(s).length) return tgRoundEnd(s, now); g.wave++; g.step = 'wave'; s.deadline = now + TG.choose; return tgEvent(s, 'tgWave'); }
  const top = s.order.map(pid => [pid, s.scores[pid]]).sort((a, b) => b[1] - a[1]);
  if (top[0][1] >= TARGET && top[0][1] > top[1][1]) { s.winner = top[0][0]; s.phase = 'over'; return; }
  tgStartRound(s, now, rnd);
}
function tgAct(s, pid, a, now, rnd) {
  const g = s.tg, pen = g.pens[pid];
  if (s.phase !== 'turn' || g.step !== 'wave' || !pen || pen.state !== 'in' || pen.choice) return s;
  if (a.type === 'toss') pen.choice = 'toss'; else if (a.type === 'bank' && g.wave > 1 && pen.pts > 0) pen.choice = 'bank'; else return s;
  if (tgIn(s).every(q => g.pens[q].choice)) tgResolve(s, now, rnd);
  return s;
}
function tgCue(s) {
  const g = s.tg, k = +s.eventId || 0, pick = (...a) => a[k % a.length];
  if (s.lastEvent === 'twist') return { id: s.eventId, sound: 'sting-show', say: 'Double or nothing!', delay: 300 };
  if (s.lastEvent === 'tgRound') return { id: s.eventId, sound: 'whoosh', say: pick('Next round. Everybody toss!', 'New round! Swipe up to toss.', 'Here we go again. All goats in the air!', 'Another round. Toss them!'), delay: 0 };
  if (s.lastEvent === 'tgWave') return { id: s.eventId, sound: 'vote', say: pick('Toss again, or bank it?', 'Push your luck, or bank?', 'Who is brave enough to toss again?', 'Bank it, or risk it?'), delay: 0 };
  if (s.lastEvent === 'tgRoundEnd') return { id: s.eventId, sound: 'points', say: pick('Round over. Check the scores!', 'Everybody is done. Look at that board.', 'That is the round!'), delay: 0 };
  if (s.lastEvent === 'tgLand') {
    const rs = s.order.map(pid => g.pens[pid]).filter(p => p.tossed), busts = rs.filter(p => p.last.bust).length, best = rs.map(p => p.last).sort((a, b) => b.pts - a.pts)[0];
    if (rs.some(p => p.last.pile)) return { id: s.eventId, sound: 'death', react: 'groan', fx: 'shake', say: 'Goat pile! There goes a whole score!', delay: TG.anim };
    if (busts === rs.length) return { id: s.eventId, sound: 'lose', react: 'groan', fx: 'shake', say: rs.length > 1 ? pick('They all butt heads!', 'Butt heads everywhere! Nobody survives that one.') : 'They butt heads! Turn over.', delay: TG.anim };
    if (best.double) return { id: s.eventId, sound: 'win', react: 'cheer', fx: 'gold', say: `${best.name}! ${best.pts} points!`, delay: TG.anim };
    if (busts) return { id: s.eventId, sound: 'sting-comic', react: 'laugh', say: pick('Butt heads! Somebody is out.', 'Ouch. Not everyone survived that.', 'Some goats butt heads!'), delay: TG.anim };
    return { id: s.eventId, sound: best.pts >= 10 ? 'points' : 'pop', react: best.pts >= 15 ? 'cheer' : null, say: best.pts >= 10 ? `${best.name}! ${best.pts}!` : pick('Everybody is still in!', '', 'Safe, all of you.', ''), delay: TG.anim };
  }
  return null;
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const current = s => s.order[s.t % s.order.length];

function endTurn(s, now, reason) {
  s.ending = now + TIMES.endTurn;
  s.endReason = reason;
}

// Twists. Double or nothing: now and then a turn is worth double when banked, but butting heads costs 10 points
// already in the bank. Nobody gets one on their first turn, while the plain rules are still sinking in.
export const DOUBLE_CHANCE = 0.22, DOUBLE_COST = 10;
function nextTurn(s, now, rnd = Math.random) {
  s.t++;
  s.twist = s.t >= s.order.length && rnd() < DOUBLE_CHANCE ? 'double' : null;
  s.forced = null;
  if (s.twist) { s.eventId++; s.lastEvent = 'twist'; }
  s.turnPts = 0;
  s.tosses = [];
  s.last = null;
  s.ending = 0;
  s.endReason = null;
  s.deadline = now + TIMES.idle;
}

function bank(s, now) {
  const pid = current(s);
  const got = s.turnPts * (s.twist === 'double' ? 2 : 1);
  s.scores[pid] += got;
  s.banked = got;
  s.eventId++;
  s.lastEvent = 'bank';
  s.forced = null;
  if (s.scores[pid] >= TARGET) { s.winner = pid; s.phase = 'over'; return; }
  endTurn(s, now, 'bank');
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (s.mode === 'together') return a ? tgAct(s, pid, a, now, rnd) : s;
  // "One more!": once a game, anyone watching can make the thrower toss again before they are allowed to bank.
  if (a && a.type === 'dare') {
    if (s.phase === 'turn' && pid !== current(s) && P(s, pid) && s.dares?.[pid] > 0 && !s.forced && !s.ending && !s.pendingWin && s.turnPts > 0 && now >= s.busyUntil) { s.dares[pid]--; s.forced = pid; s.eventId++; s.lastEvent = 'dare'; s.deadline = now + TIMES.idle; }
    return s;
  }
  if (s.phase !== 'turn' || !a || pid !== current(s) || s.ending || now < s.busyUntil) return s;
  if (a.type === 'toss') {
    const r = toss(rnd);
    s.forced = null;
    s.last = r;
    s.tosses.push(r);
    s.eventId++;
    s.lastEvent = 'toss';
    s.busyUntil = now + TIMES.anim;
    s.deadline = now + TIMES.idle;
    if (r.pile) { s.lost = s.scores[pid]; s.scores[pid] = 0; s.turnPts = 0; endTurn(s, now + TIMES.anim, 'pile'); }
    else if (r.bust) {
      // Catch-up: whoever is in last place and well behind keeps half of the turn's points on a bust.
      const all = Object.values(s.scores), mine = s.scores[current(s)];
      const keep = mine === Math.min(...all) && Math.max(...all) - mine >= 30 ? Math.floor(s.turnPts / 2) : 0;
      s.scores[current(s)] += keep; s.kept = keep; s.lost = s.turnPts - keep; s.turnPts = 0;
      if (s.twist === 'double') { const cost = Math.min(DOUBLE_COST, s.scores[current(s)]); s.scores[current(s)] -= cost; s.lost += cost; }   // the 'nothing' half of double or nothing
      endTurn(s, now + TIMES.anim, 'bust');
    }
    else {
      s.turnPts += r.pts;
      // Auto-bank the moment you'd cross the target, so nobody has to remember to.
      if (s.scores[pid] + s.turnPts * (s.twist === 'double' ? 2 : 1) >= TARGET) { s.busyUntil = now + TIMES.anim; s.pendingWin = now + TIMES.anim; }
    }
  } else if (a.type === 'bank' && s.turnPts > 0 && !s.forced) bank(s, now);
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (s.mode === 'together') { if (a === 'next' && s.phase === 'turn' && now >= s.busyUntil) tgAdvance(s, now); return s; }
  if (a === 'next' && s.phase === 'turn') { if (s.ending) nextTurn(s, now); else if (s.turnPts > 0) bank(s, now); else { endTurn(s, now, 'skip'); } }
  return s;
}

export function tick(s, now = Date.now()) {
  if (s.phase !== 'turn') return s;
  if (s.mode === 'together') { if (now >= s.deadline) tgAdvance(s, now); return s; }
  if (s.pendingWin && now >= s.pendingWin) { s.pendingWin = 0; bank(s, now); return s; }
  if (s.ending && now >= s.ending) nextTurn(s, now);
  else if (!s.ending && now >= s.deadline && now >= s.busyUntil) { if (s.forced) act(s, current(s), { type: 'toss' }, now); else if (s.turnPts > 0) bank(s, now); else endTurn(s, now, 'skip'); }   // a thrower who was dared and walked away gets the toss made for them
  return s;
}

export function narration(s) {
  if (s.mode === 'together' && s.phase === 'turn') return s.tg.round === 1 && s.tg.wave === 1 && s.tg.step === 'wave' ? `Welcome to GOAT Toss! Everybody tosses at the same time. Keep tossing to build your round, or bank your points before your goats butt heads. First to ${TARGET} is the greatest of all time. Swipe up on your phone to toss!` : '';
  if (s.phase === 'turn' && s.t === 0 && !s.tosses.length) return `Welcome to GOAT Toss! First to ${TARGET} points is the greatest of all time. ${nameOf(s, current(s))}, you're up first. Swipe up on your phone to toss.`;
  if (s.phase === 'over') return `${nameOf(s, s.winner)} is the greatest of all time!`;
  return '';
}

export function cue(s) {
  if (s.mode === 'together' && s.phase === 'turn') return s.tg.round === 1 && s.tg.wave === 1 && s.tg.step === 'wave' ? { sound: 'join', wait: 700, title: 'GOAT Toss', sub: `Everybody tosses at once. First to ${TARGET} wins` } : null;
  if (s.phase === 'turn' && s.t === 0 && !s.tosses.length) return { sound: 'join', wait: 700, title: 'GOAT Toss', sub: `First to ${TARGET} is the Greatest Of All Time` };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: `${nameOf(s, s.winner)} is the G.O.A.T.!`, sub: 'Greatest Of All Time', tone: 'dawn', fx: 'confetti' };
  return null;
}

// Sounds and lines for moments inside a turn (tosses, banks). The TV plays these as they happen.
export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.mode === 'together') return s.phase === 'turn' ? tgCue(s) : null;
  const pickOf = (...a) => a[(+s.eventId || 0) % a.length];   // the same moment does not sound the same twice running
  if (s.lastEvent === 'bank') return { id: s.eventId, sound: pickOf('points', 'safe', 'lockin'), react: s.banked >= 20 ? 'cheer' : null, say: `Banked! ${nameOf(s, current(s))} banks ${s.banked}.`, delay: 0 };
  if (s.lastEvent === 'twist') return { id: s.eventId, sound: 'sting-show', say: 'Double or nothing!', delay: 300 };
  if (s.lastEvent === 'dare') return { id: s.eventId, sound: 'sting-comic', react: 'laugh', say: 'One more toss! No banking yet.', delay: 0 };
  const r = s.last;
  if (!r) return null;
  if (r.pile) return { id: s.eventId, sound: pickOf('lose', 'death'), react: 'groan', fx: 'shake', say: 'Goat pile! There goes your whole score!', delay: TIMES.anim };
  if (r.bust) return { id: s.eventId, sound: pickOf('death', 'lose', 'sting-comic'), react: pickOf('groan', 'laugh', 'gasp'), fx: 'shake', say: s.kept ? `They butt heads! But the underdog keeps ${s.kept}.` : 'They butt heads! Turn over.', delay: TIMES.anim };
  if (r.double) return { id: s.eventId, sound: 'win', react: 'cheer', fx: 'gold', say: `${r.name}! ${r.pts} points!`, delay: TIMES.anim };
  return { id: s.eventId, sound: r.pts >= 10 ? pickOf('points', 'safe', 'win') : pickOf('pop', 'stamp', 'lockin', 'points'), react: r.pts >= 15 ? 'cheer' : null, say: r.pts >= 10 ? `${r.name}! ${r.pts}!` : '', delay: TIMES.anim };
}

export function botAct(v, rnd = Math.random) {
  if (v.tg) { if (v.phase !== 'turn' || v.tg.step !== 'wave' || v.tg.state !== 'in' || v.tg.chosen) return null; if (v.tg.wave === 1) return { type: 'toss' }; const m = v.twist === 'double' ? 2 : 1; return v.score + v.tg.pts * m >= TARGET || v.tg.pts >= 15 + Math.floor(rnd() * 10) ? { type: 'bank' } : { type: 'toss' }; }
  if (v.phase === 'turn' && !v.myTurn && v.canDare && !v.busy && v.theirTurnPts >= 15 && rnd() < 0.12) return { type: 'dare' };
  if (v.phase !== 'turn' || !v.myTurn || v.busy || v.ending) return null;
  if (v.forced) return { type: 'toss' };
  const need = TARGET - v.score;
  if (v.turnPts * (v.twist === 'double' ? 2 : 1) >= need) return { type: 'bank' };
  return v.turnPts >= 15 + Math.floor(rnd() * 10) ? { type: 'bank' } : { type: 'toss' };
}

// ---------- views ----------
const board = s => s.mode === 'together' ? s.order.map(pid => ({ pid, name: nameOf(s, pid), score: s.scores[pid], now: false })).sort((a, b) => b.score - a.score) : s.order.map(pid => ({ pid, name: nameOf(s, pid), score: s.scores[pid], now: pid === current(s) && s.phase === 'turn' }));

export function tvView(s, now = Date.now()) {
  if (s.mode === 'together') {
    const g = s.tg;
    return {
      phase: s.phase, target: TARGET, mode: 'together', twist: s.twist || null, eventId: s.eventId,
      round: g.round, wave: g.wave, step: g.step, animating: now < s.busyUntil, animLeft: Math.max(0, s.busyUntil - now),
      left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
      pens: s.order.map(pid => { const p = g.pens[pid]; return { name: nameOf(s, pid), pts: p.pts, state: p.state, chosen: !!p.choice, tossed: p.tossed, got: p.got, lost: p.lost, kept: p.kept, last: p.last && { a: p.last.a, b: p.last.b, name: p.last.name, pts: p.last.pts, bust: !!p.last.bust, pile: !!p.last.pile, double: !!p.last.double } }; }),
      board: board(s), winner: s.winner ? nameOf(s, s.winner) : null,
    };
  }
  return {
    phase: s.phase, target: TARGET,
    who: nameOf(s, current(s)),
    turnPts: s.turnPts, twist: s.twist || null, forcedBy: s.forced ? nameOf(s, s.forced) : null,
    tosses: s.tosses.map(r => ({ name: r.name, pts: r.pts, bust: !!r.bust, pile: !!r.pile })),
    last: s.last, eventId: s.eventId, lastEvent: s.lastEvent,
    animating: now < s.busyUntil,
    animLeft: Math.max(0, s.busyUntil - now),
    ending: !!s.ending, endReason: s.endReason, lost: s.lost, banked: s.banked,
    board: board(s),
    winner: s.winner ? nameOf(s, s.winner) : null,
  };
}

export function phoneView(s, pid, now = Date.now()) {
  if (!P(s, pid)) return { phase: 'spectate' };
  if (s.mode === 'together') {
    const g = s.tg, p = g.pens[pid];
    return { phase: s.phase, target: TARGET, score: s.scores[pid], twist: s.twist || null, eventId: s.eventId, busy: now < s.busyUntil,
      tg: { step: g.step, wave: g.wave, round: g.round, state: p.state, chosen: !!p.choice, choice: p.choice, pts: p.pts, got: p.got, lost: p.lost, kept: p.kept, tossed: p.tossed, last: p.last && { name: p.last.name, pts: p.last.pts, bust: !!p.last.bust, pile: !!p.last.pile } },
      won: s.winner === pid, winner: s.winner ? nameOf(s, s.winner) : null };
  }
  return {
    phase: s.phase,
    myTurn: current(s) === pid,
    who: nameOf(s, current(s)),
    score: s.scores[pid],
    turnPts: current(s) === pid ? s.turnPts : 0,
    theirTurnPts: s.turnPts, twist: s.twist || null, forced: current(s) === pid && !!s.forced, forcedBy: s.forced ? nameOf(s, s.forced) : null,
    canDare: current(s) !== pid && s.dares?.[pid] > 0 && !s.forced && !s.ending && !s.pendingWin && s.turnPts > 0 && now >= s.busyUntil, daresLeft: s.dares?.[pid] || 0,
    target: TARGET,
    busy: now < s.busyUntil,
    ending: !!s.ending,
    endReason: s.endReason,
    last: s.last ? { name: s.last.name, pts: s.last.pts, bust: !!s.last.bust, pile: !!s.last.pile } : null,
    eventId: s.eventId,
    won: s.winner === pid,
    winner: s.winner ? nameOf(s, s.winner) : null,
  };
}

// ---------- goat drawing ----------
// One painted goat piece, standing and facing right (art/goat.png). Every landing is the same piece turned a
// different way, like a real tossed game piece. The spot is drawn on top for the spotted flank.
const ROT = { left: 90, right: -90, back: 180, stand: 0, nose: 62, horn: 138, pile: 24 };
const LIFT = { left: 18, right: 18, back: 10, stand: 0, nose: 4, horn: 6, pile: 0 };   // how far the turned piece sinks to rest on the table (% of its size)
// Six painted landings of the same piece, seen from the table's camera (art/goats.png, 3 across and 2 down).
const POSE_AT = { left: 0, right: 1, back: 2, stand: 3, nose: 4, horn: 5, pile: 0 };
const posAt = n => `${(n % 3) * 50}% ${Math.floor(n / 3) * 100}%`;
const goatImg = (k) => `<span class="gspr" style="background-position:${posAt(POSE_AT[k] ?? 3)}"></span>`;


// ---------- the toss, in 3D ----------
// The table is a real plane in a CSS 3D scene and the goats are upright pieces standing in it, so the browser does
// the perspective. A toss shakes the cup, tips it, and the two goats fly out, fall under gravity, bounce a few
// times (each bounce lower and slower) and spin until they stop on the side the game already chose.
// The whole path is worked out from the toss's id, so a redraw halfway through carries on from the same place.
const T_REL = 880, G = 2500, BOUNCE = 0.46, DRAG = 0.68;
const rng = seed => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const CUP = { x: -450, d: 250 };
let planned = { key: '', plan: null };
function tossPlan(eid, a, b, pile) {
  const key = [eid, a, b, pile].join('|');
  if (planned.key === key) return planned.plan;
  const r = rng(eid * 7919 + 13);
  const goats = [0, 1].map(i => {
    const from = { x: CUP.x + 125, d: CUP.d - 10 - i * 30, h: 150 };
    // "Butt heads" (one goat on each side) has to look like it: the two end up level, close together and head to
    // head. The goat lying with its head to the right stops on the left, the other on the right. Without this they
    // could land tail to tail and look like two goats napping the same way.
    const me = i ? b : a, butt = !pile && a !== b && ['left', 'right'].includes(a) && ['left', 'right'].includes(b);
    const to = pile ? { x: i ? 40 : -40, d: i ? 150 : 140, h: i ? 92 : 0 }
      : butt ? { x: (me === 'right' ? -134 : 134) + (r() - 0.5) * 12, d: 150 + (r() - 0.5) * 10, h: 0 }
      : { x: (i ? 190 : -150) + (r() - 0.5) * 110, d: 90 + r() * 150, h: 0 };
    // Fall and bounce: heights over time, and how much ground is covered (slower after every bounce).
    const pts = []; let h = from.h, vh = 420 + r() * 160, t = 0, speed = 1, dist = 0, bounces = [];
    const dt = 1 / 120;
    while (t < 2.4) {
      vh -= G * dt; h += vh * dt; dist += speed * dt; t += dt;
      if (h <= 0) { h = 0; if (Math.abs(vh) < 150) { pts.push([t, 0, dist]); break; } vh = -vh * (BOUNCE + r() * 0.08); speed *= DRAG; bounces.push(t); }
      pts.push([t, h, dist]);
    }
    const slide = 0.16; for (let k = 1; k <= 12; k++) { const q = k / 12; dist += speed * (slide / 12) * (1 - q); pts.push([t + slide * q, 0, dist]); }
    const total = dist, end = t + slide;
    const key2 = i ? b : a, flip = !pile && key2 === 'right';
    return { from, to, pts: pts.map(([tt, hh, dd]) => [tt, hh, dd / total]), end, bounces, pose: pile ? (i ? 3 : 0) : POSE_AT[key2] ?? 3, first: Math.floor(r() * 6), flips: 7 + Math.floor(r() * 4), tilt: 150 + r() * 120, dir: i ? -1 : 1 };
  });
  planned = { key, plan: { goats } };
  return planned.plan;
}
// Where everything is, `ms` after the toss began.
function tossPlace(root, plan, ms) {
  const sh = root.querySelectorAll('.gsh'), gs = root.querySelectorAll('.g3');
  plan.goats.forEach((g, i) => {
    const el = gs[i], t = (ms - T_REL - i * 60) / 1000;
    if (!el) return;
    if (t < 0) { el.style.opacity = 0; if (sh[i]) sh[i].style.opacity = 0; return; }
    let k = g.pts.length - 1; if (t < g.end) { k = 0; while (k < g.pts.length - 1 && g.pts[k][0] < t) k++; }
    const [, h0, p] = g.pts[k], rest = Math.max(0, t - g.end);
    const x = g.from.x + (g.to.x - g.from.x) * p, d = g.from.d + (g.to.d - g.from.d) * p;
    const land = Math.min(1, Math.max(0, (p - 0.82) / 0.18));                    // the last stretch: settle onto its resting side
    const h = h0 + g.from.h * 0 + g.to.h * land;
    const wobble = rest < 0.5 && t >= g.end ? 9 * Math.exp(-7 * rest) * Math.sin(26 * rest) : 0;
    // In the air the piece flips through its other faces and leans; on the last stretch it shows the side it lands on.
    const rot = g.dir * g.tilt * (1 - p) ** 1.3 + wobble, face = land > 0 ? g.pose : (g.first + Math.floor(p / 0.82 * g.flips)) % 6;
    el.style.opacity = 1;
    el.style.transform = `translate3d(${x.toFixed(1)}px,${(-h).toFixed(1)}px,${(-d).toFixed(1)}px)`;
    el.firstElementChild.style.transform = `rotate(${rot.toFixed(1)}deg)`;
    el.firstElementChild.style.backgroundPosition = posAt(face);
    if (sh[i]) { const lift = Math.min(1, h / 260); sh[i].style.opacity = 0.5 - 0.3 * lift; sh[i].style.transform = `translate(${(850 + x - 145).toFixed(1)}px,${(900 - d - 62).toFixed(1)}px) scale(${(1 - 0.45 * lift).toFixed(2)})`; }
  });
}
let tossHeard = null, tossTimers = [];
function tossRun(root, v) {
  const last = v.last;
  if (!last) return;
  const plan = tossPlan(v.eventId, last.a, last.b, !!last.pile);
  const start = v.animating && typeof performance !== 'undefined' ? performance.now() - (TIMES.anim - (v.animLeft ?? 0)) : null;
  // The toss is heard as well as seen: the cup rattles, each goat knocks on the table as it bounces (softer taps are
  // skipped), and a goat or two has something to say when it lands. Scheduled once per toss, from wherever it is now.
  if (start !== null && tossHeard !== v.eventId) {
    tossHeard = v.eventId; tossTimers.forEach(clearTimeout); tossTimers = [];
    const since = performance.now() - start, at = (ms, name) => { if (ms >= since - 40) tossTimers.push(setTimeout(() => import('../sfx.js').then(m => m.play(name)).catch(() => {}), Math.max(0, ms - since))); };
    at(0, 'cup-shake'); at(T_REL - 60, 'whoosh');
    plan.goats.forEach((g, i) => { g.bounces.slice(0, 3).forEach((t, k) => at(T_REL + t * 1000 + i * 35, 'thud')); });
    const land = T_REL + Math.max(...plan.goats.map(g => g.end)) * 1000;
    if (last.bust || last.pile) { at(land - 150, 'bleat'); at(land + 180, 'bleat'); } else if ((v.eventId * 7) % 10 < 6) at(land - 80, 'bleat');
  }
  const step = () => {
    const ms = start === null ? 1e6 : performance.now() - start;
    tossPlace(root, plan, ms);
    if (start !== null && ms < TIMES.anim + 600 && root.isConnected && typeof requestAnimationFrame === 'function') requestAnimationFrame(step);
  };
  step();
}
const CUP_SVG = '<svg viewBox="0 0 120 150" aria-hidden="true"><defs><linearGradient id="gcupg" x1="0" x2="1"><stop offset="0" stop-color="#4a2a14"/><stop offset=".45" stop-color="#8a5226"/><stop offset="1" stop-color="#3a200f"/></linearGradient></defs><path d="M14 14h92l-12 124a8 8 0 0 1-8 7H34a8 8 0 0 1-8-7z" fill="url(#gcupg)"/><ellipse cx="60" cy="15" rx="47" ry="11" fill="#2a1609"/><ellipse cx="60" cy="15" rx="47" ry="11" fill="none" stroke="#e3b26a" stroke-width="4"/><path d="M19 44h82M23 112h74" stroke="#e3b26a" stroke-width="3" stroke-dasharray="7 6" opacity=".75"/></svg>';
function tossScene(v) {
  const last = v.last, since = last && v.animating ? TIMES.anim - (v.animLeft ?? 0) : 0;
  return `<div class="gtable g3d ${last ? '' : 'empty'}" data-e="${v.eventId}" data-anim="${last && v.animating ? 1 : 0}"><div class="gclip"><div class="gtop"><i class="gsh"></i><i class="gsh"></i><i class="gsh cupsh"></i></div><div class="glip"></div></div><div class="gworld">
    <div class="gcup ${last && v.animating ? 'pour' : ''}" style="animation-delay:-${Math.round(since)}ms">${CUP_SVG}</div>
    ${last ? [0, 1].map(() => `<div class="g3"><span class="gspr"></span></div>`).join('') : ''}
  </div>${last ? '' : '<p class="say">Swipe up on your phone to toss!</p>'}</div>`;
}

// ---------- renderers ----------
const shown = { land: '', landAt: 0, turn: '', turnAt: 0 }; let turnCount = 0, tgSeen = 0;
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  // While a toss is in the air, the screen is left alone: redrawing it (the clock does, every second) would rebuild
  // the scene mid-flight and cost frames. The same toss keeps animating; the full redraw comes when it lands.
  const live = el.querySelector('.g3d');
  if (v.phase === 'turn' && v.mode !== 'together' && v.animating && live && live.dataset.anim === '1' && live.dataset.e === String(v.eventId)) return;
  const board = `<div class="scores"><h3>First to ${v.target}</h3>${v.board.map(p => `<div class="srow ${p.now ? 'now' : ''}"><span>${esc(p.name)}</span><b>${p.score}${p.now && v.ending && !v.animating && v.endReason === 'bank' && v.banked ? `<small class="ggain">+${v.banked}</small>` : ''}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'turn' && v.mode === 'together') {
    const since = v.animating ? TG.anim - v.animLeft : TG.anim, landed = !v.animating;
    const head = v.step === 'roundEnd' ? 'Round over' : v.step === 'land' ? (landed ? 'How they landed' : 'Goats in the air!') : v.wave === 1 ? 'Everybody toss!' : 'Toss again, or bank?';
    const pen = (p, i) => {
      const flying = p.tossed && v.step === 'land' && !landed;
      const goats = p.last ? `<div class="gpgoats ${p.tossed && v.step === 'land' ? 'drop' : ''}" style="--d:${-since + (i % 4) * 90}ms">${goatImg(p.last.a)}${goatImg(p.last.b)}</div>` : `<div class="gpgoats idle">${goatImg('stand')}${goatImg('stand')}</div>`;
      const what = flying ? '<small class="gpwhat">…</small>' : p.state === 'banked' ? `<small class="gpwhat win">Banked +${p.got}</small>` : p.state === 'bust' ? `<small class="gpwhat lose">Butt heads!${p.lost ? ` −${p.lost}` : ''}${p.kept ? ` kept ${p.kept}` : ''}</small>` : p.state === 'pile' ? '<small class="gpwhat lose">Goat pile! Back to 0</small>' : p.last ? `<small class="gpwhat">${esc(p.last.name)}${p.last.pts ? ` +${p.last.pts}` : ''}</small>` : '<small class="gpwhat">Swipe up to toss</small>';
      const chip = p.state === 'in' && v.step === 'wave' ? `<i class="gpchip ${p.chosen ? 'ok' : ''}">${p.chosen ? '✓ ready' : 'deciding…'}</i>` : '';
      return `<div class="gpen ${flying ? 'in' : p.state} ${p.state === 'in' && p.last && p.last.double && landed ? 'gold' : ''}"><h4>${esc(p.name)}</h4>${goats}${what}<b class="gppts">${p.state === 'in' && !flying ? p.pts : p.state === 'banked' ? '✓' : flying ? '' : '✗'}</b>${chip}</div>`;
    };
    const legend = `<div class="glegend">${[['bust', 'left', 'right', 'Butt heads', 'out', 'lose'], ['nap', 'left', 'left', 'Nap time', '1'], ['back', 'back', '', 'Hooves up', '5'], ['stand', 'stand', '', 'On all fours', '5'], ['nose', 'nose', '', 'Nose dive', '10'], ['horn', 'horn', '', 'Horn stand', '15'], ['pair', 'back', 'back', 'Two alike', '×4'], ['pile', 'left', 'left', 'Goat pile', 'back to 0', 'lose']].map(([k, a, b, n, p, c]) => `<div class="gl ${c || ''}"><span class="glpic ${k === 'pile' ? 'pile' : ''}">${goatImg(a)}${b ? goatImg(b) : ''}</span><small>${n}</small><b>${p}</b></div>`).join('')}</div>`;
    h = `<div class="ghead"><h2>Round ${v.round} · ${head}</h2>${v.step === 'wave' ? `<span class="clock small ${v.left <= 3 ? 'hurry' : ''}">${v.left}</span>` : ''}</div>${v.twist === 'double' ? '<p class="gtwist dbl">✨ Double or nothing: bank for double, butt heads costs 10</p>' : ''}
      <div class="gpens n${Math.min(10, v.pens.length)}">${v.pens.map(pen).join('')}</div>${legend}<button class="btn ghost" data-host="next" ${v.animating ? 'style="visibility:hidden"' : ''}>${v.step === 'wave' ? 'Go now' : 'Next'}</button>`;
  } else if (v.phase === 'turn') {
    const last = v.last;
    const table = tossScene(v);
    const result = last && !v.animating ? `<div class="toss-name ${last.bust || last.pile ? 'lose' : last.double ? 'win' : ''}">${esc(last.name)} ${last.pts ? `<b>+${last.pts}</b>` : ''}</div>` : '<div class="toss-name blank"></div>';
    const status = v.ending && !v.animating
      ? v.endReason === 'bank' ? `<p class="say win">Banked ${v.banked} points!${v.twist === 'double' ? ' Doubled!' : ''}</p>` : v.endReason === 'bust' ? `<p class="say lose">They butt heads! ${v.lost ? `Lost ${v.lost} points this turn.` : 'Turn over.'}</p>` : v.endReason === 'pile' ? `<p class="say lose">Goat pile! Back to zero.</p>` : '<p class="say">Turn skipped.</p>'
      : `<p class="say">This turn: <b class="turnpts">${v.turnPts}</b></p>${(() => { const c = v.board.find(p => p.now); if (!c) return ''; const need = v.target - c.score - v.turnPts; return need <= 0 ? '<p class="say win" data-pop="bankwin" data-snd="gasp">Bank it to be the G.O.A.T.!</p>' : need <= 15 ? `<p class="say" data-pop="near${c.name}" data-snd="gasp">🔥 ${need} away from winning!</p>` : ''; })()}`;
    // The key to the landings, named exactly as the game calls them. Once the goats have landed, the entries that
    // just happened light up, so the key teaches itself.
    const side = k => k === 'left' || k === 'right', L = last && !v.animating ? last : null;
    const hit = L ? new Set(L.pile ? ['pile'] : side(L.a) && side(L.b) ? [L.a === L.b ? 'nap' : 'bust'] : [side(L.a) ? '' : L.a, side(L.b) ? '' : L.b, L.a === L.b ? 'pair' : ''].filter(Boolean)) : new Set();
    const legend = `<div class="glegend">${[['bust', 'left', 'right', 'Butt heads', 'lose turn', 'lose'], ['nap', 'left', 'left', 'Nap time', '1'], ['back', 'back', '', 'Hooves up', '5'], ['stand', 'stand', '', 'On all fours', '5'], ['nose', 'nose', '', 'Nose dive', '10'], ['horn', 'horn', '', 'Horn stand', '15'], ['pair', 'back', 'back', 'Two alike', '×4'], ['pile', 'left', 'left', 'Goat pile', 'back to 0', 'lose']].map(([k, a, b, n, p, c]) => `<div class="gl ${c || ''} ${hit.has(k) ? 'hit' : ''}"><span class="glpic ${k === 'pile' ? 'pile' : ''}">${goatImg(a)}${b ? goatImg(b) : ''}</span><small>${n}</small><b>${p}</b></div>`).join('')}</div>`;
    const twists = `${v.twist === 'double' ? '<p class="gtwist dbl">✨ Double or nothing: bank for double, butt heads costs 10</p>' : ''}${v.forcedBy ? `<p class="gtwist dare">😈 ${esc(v.forcedBy)} says: one more toss!</p>` : ''}`;
    h = `<div class="ghead"><h2>${esc(v.who)}'s turn</h2>${result}</div>${table}<div class="gfoot">${status}${twists}<div class="history">${v.tosses.map(t => `<span class="${t.bust || t.pile ? 'lose' : ''}">${esc(t.name)}${t.pts ? ' +' + t.pts : ''}</span>`).join('')}</div></div>${legend}<button class="btn ghost" data-host="next" ${v.animating ? 'style="visibility:hidden"' : ''}>${v.ending ? 'Next player' : 'Skip / bank for them'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.winner)} is the G.O.A.T.!</h2><p class="say">Greatest Of All Time, at least until the next game.</p><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  // Big moments, drawn over the table so they never change the layout: whose turn it is when it changes hands,
  // what a toss scored once it lands, and what a turn banked or lost. Each one animates once.
  let over = '';
  if (v.phase === 'turn' && v.mode !== 'together') {
    const turnKey = v.who, landKey = `${v.eventId}.${v.ending ? v.endReason : ''}`, last = v.last, now = Date.now();
    // A redraw while one of these is still playing carries on from where it was.
    const land = () => { if (landKey !== shown.land) { shown.land = landKey; shown.landAt = now; } const el = now - shown.landAt; return el < 2200 ? `in" style="animation-delay:-${el}ms` : ''; };
    if (!v.animating && v.ending) {
      const t = v.endReason === 'bank' ? ['win', `Banked`, `+${v.banked}`] : v.endReason === 'bust' ? ['lose', 'Butt heads!', v.lost ? `−${v.lost}` : ''] : v.endReason === 'pile' ? ['lose', 'Goat pile!', 'Back to 0'] : null;
      if (t) over = `<div class="gcall ${t[0]} ${land()}"><small>${t[1]}</small><b>${t[2]}</b></div>`;
    } else if (!v.animating && last && last.pts) {
      over = `<div class="gcall ${last.double ? 'win big' : last.pts >= 10 ? 'big' : ''} ${land()}"><small>${esc(last.name)}</small><b>+${last.pts}</b></div>`;
    } else if (!v.animating && !last) {
      if (turnKey !== shown.turn) { shown.turn = turnKey; shown.turnAt = now; import('../sfx.js').then(m => m.play(['whoosh', 'join', 'lockin'][turnCount++ % 3])).catch(() => {}); }
      const el = now - shown.turnAt;
      if (el < 1900) over = `<div class="gturn in" style="animation-delay:-${el}ms"><small>Up next</small><b>${esc(v.who)}</b></div>`;
    }
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}${over ? `<div class="gover">${over}</div>` : ''}</div>${board}</div>`;
  const scene = el.querySelector('.g3d'); if (scene && v.last) tossRun(scene, v);
  if (v.mode === 'together' && v.step === 'land' && v.animating && tgSeen !== v.eventId) { tgSeen = v.eventId; import('../sfx.js').then(m => { m.play('whoosh'); setTimeout(() => m.play('stamp'), TG.anim - 500); }).catch(() => {}); }
}

export function renderPhone(v, el, send) {
  let h = '';
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>';
  else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'You are the G.O.A.T.!' : `${esc(v.winner)} is the G.O.A.T.`}</h2><p class="say">You finished with ${v.score}.</p>`;
  else if (v.tg) {
    const t = v.tg, mult = v.twist === 'double' ? 2 : 1, dbl = v.twist === 'double' ? '<p class="say win">✨ Double or nothing! Bank for double. Butt heads costs you 10.</p>' : '';
    const bar = `<div class="turnbar"><div><small>This round</small><b>${t.pts}</b></div><div><small>Banked</small><b>${v.score}</b></div><div><small>Need</small><b>${Math.max(0, v.target - v.score - t.pts * mult)}</b></div></div>`;
    if (t.state === 'banked') h = `<h2 class="win">Banked +${t.got}</h2><p class="say">You are safe. Watch the others push their luck.</p>${bar}`;
    else if (t.state === 'bust' || t.state === 'pile') h = v.busy ? `<h2>Goats in the air…</h2>${bar}` : `<h2 class="lose">${t.state === 'pile' ? 'Goat pile!' : 'Butt heads!'}</h2><p class="say">${t.state === 'pile' ? 'Back to zero. Ouch.' : t.kept ? `You keep ${t.kept} as the underdog.` : 'You are out until the next round.'}</p>${bar}`;
    else if (t.step === 'land' || t.chosen) h = `<h2>${t.step === 'land' ? (v.busy ? 'Goats in the air…' : `${esc(t.last?.name || '')}${t.last?.pts ? ` +${t.last.pts}` : ''}`) : t.choice === 'bank' ? 'Banking…' : 'Ready to toss!'}</h2><p class="say">${t.step === 'land' ? 'Watch the TV.' : 'Waiting for the others.'}</p>${dbl}${bar}`;
    else if (t.step === 'roundEnd') h = `<h2>Round over</h2>${bar}`;
    else h = `<h2>${t.wave === 1 ? 'Toss your goats!' : 'Toss again, or bank?'}</h2>${dbl}${t.last ? `<p class="say">${esc(t.last.name)}${t.last.pts ? ` +${t.last.pts}` : ''}</p>` : ''}
      <div class="swipe" id="swipe" data-pad><div class="ducks-mini">${goatImg('stand')}${goatImg('stand')}</div><b>Swipe up to toss</b><small>or tap</small></div>${bar}
      ${t.wave > 1 ? `<button class="btn" data-bank>Bank ${t.pts * mult} points</button>` : ''}
      ${t.wave === 1 ? `<p class="muted">Everyone tosses at once. Two goats on different sides butt heads: you lose this round's points.</p>` : ''}`;
  }
  else if (!v.myTurn) h = `<h2>${esc(v.who)} is tossing</h2><p class="say">Their turn so far: <b>${v.theirTurnPts}</b>${v.twist === 'double' ? ' · double or nothing' : ''}</p>${v.forcedBy ? `<p class="say">😈 ${esc(v.forcedBy)} made them toss again!</p>` : ''}<p class="muted">Your score: ${v.score} of ${v.target}</p>${v.daresLeft ? `<button class="btn ghost" data-dare ${v.canDare ? '' : 'disabled'}>😈 One more! Make them toss again</button><p class="muted small">Once a game. They cannot bank until they toss again.</p>` : ''}`;
  else {
    const locked = v.busy || v.ending;
    const msg = v.ending ? (v.endReason === 'bust' ? '<p class="say lose">They butt heads! Turn over.</p>' : v.endReason === 'pile' ? '<p class="say lose">Goat pile! Ouch.</p>' : '<p class="say">Turn over.</p>') : v.last ? `<p class="say">${esc(v.last.name)}${v.last.pts ? ` +${v.last.pts}` : ''}</p>` : '<p class="say">Your turn!</p>';
    h = `<h2>Your turn</h2>${v.twist === 'double' ? '<p class="say win">✨ Double or nothing! Bank for double. Butt heads costs you 10.</p>' : ''}${v.forced ? `<p class="say lose">😈 ${esc(v.forcedBy)} says one more toss before you can bank!</p>` : ''}${msg}
      <div class="swipe ${locked ? 'locked' : ''}" id="swipe"${locked ? '' : ' data-pad'}><div class="ducks-mini">${goatImg('stand')}${goatImg('stand')}</div><b>${locked ? '…' : 'Swipe up to toss'}</b><small>or tap</small></div>
      <div class="turnbar"><div><small>This turn</small><b>${v.turnPts}</b></div><div><small>Banked</small><b>${v.score}</b></div><div><small>Need</small><b>${Math.max(0, v.target - v.score - v.turnPts)}</b></div></div>
      <button class="btn" data-bank ${v.turnPts > 0 && !locked && !v.forced ? '' : 'disabled'}>${v.forced ? 'Toss once more first' : `Bank ${v.turnPts * (v.twist === 'double' ? 2 : 1)} points`}</button>
      <p class="muted">Two goats on different sides butt heads: you lose this turn's points. Bank before your luck runs out.</p>`;
  }
  el.innerHTML = h;
  el.querySelector('[data-bank]')?.addEventListener('click', () => send({ type: 'bank' }));
  el.querySelector('[data-dare]')?.addEventListener('click', () => send({ type: 'dare' }));
  const sw = el.querySelector('#swipe');
  if (sw && !sw.classList.contains('locked')) {
    let y0 = null, fired = false;
    const fire = () => { if (fired) return; fired = true; sw.classList.add('thrown'); try { navigator.vibrate?.(40); } catch {} send({ type: 'toss' }); };
    sw.addEventListener('pointerdown', e => { y0 = e.clientY; sw.setPointerCapture?.(e.pointerId); });
    sw.addEventListener('pointermove', e => { if (y0 !== null && y0 - e.clientY > 60) fire(); });
    sw.addEventListener('pointerup', e => { if (y0 !== null && Math.abs(y0 - e.clientY) < 10) fire(); y0 = null; });
    sw.tabIndex = 0;
    sw.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && fire());
  }
}
