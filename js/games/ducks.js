// Ducky Toss: a press-your-luck tossing game. Toss two rubber ducks, score by how they land,
// keep tossing to build your turn, or bank before a Splash wipes it out. First to the target wins.
// Our own critters, landing names and scoring (not affiliated with any commercial dice game).
import { esc } from '../ui.js';

export const meta = {
  id: 'ducks',
  name: 'Ducky Toss',
  min: 2,
  max: 10,
  blurb: 'Toss two rubber ducks, see how they land, and push your luck.',
};

export const TARGET = 100;
export const TIMES = { anim: 1500, endTurn: 3200, idle: 30000 };

// How one duck lands. The duck has a star painted on one wing.
export const POSES = {
  star:  { name: 'Star side',  pts: 0,  p: 0.35 },
  plain: { name: 'Plain side', pts: 0,  p: 0.30 },
  back:  { name: 'Belly up',   pts: 5,  p: 0.22 },
  sit:   { name: 'Sitting pretty', pts: 5, p: 0.09 },
  head:  { name: 'Headstand',  pts: 10, p: 0.03 },
  lean:  { name: 'Beak lean',  pts: 15, p: 0.01 },
};
const PILE_CHANCE = 0.006;   // ducks land stacked: lose your whole score

const DOUBLE = { back: 'Double belly up', sit: 'Double sitting pretty', head: 'Double headstand', lean: 'Double beak lean' };

function pose(rnd) {
  let r = rnd();
  for (const [k, v] of Object.entries(POSES)) { if ((r -= v.p) < 0) return k; }
  return 'star';
}

// Score a pair of landings.
export function score(a, b) {
  const isSide = k => k === 'star' || k === 'plain';
  if (isSide(a) && isSide(b)) return a === b ? { name: 'Snuggle', pts: 1 } : { name: 'Splash!', pts: 0, splash: true };
  if (isSide(a)) return { name: POSES[b].name, pts: POSES[b].pts };
  if (isSide(b)) return { name: POSES[a].name, pts: POSES[a].pts };
  if (a === b) return { name: DOUBLE[a], pts: POSES[a].pts * 4, double: true };
  return { name: `${POSES[a].name} + ${POSES[b].name}`, pts: POSES[a].pts + POSES[b].pts, combo: true };
}

export function toss(rnd = Math.random) {
  if (rnd() < PILE_CHANCE) return { a: 'pile', b: 'pile', name: 'Duck pile!', pts: 0, pile: true };
  const a = pose(rnd), b = pose(rnd);
  return { a, b, ...score(a, b) };
}

export function setup(players, rnd = Math.random, prev = null) {
  const order = players.map(p => p.pid);
  // Rotate who goes first each game.
  const start = prev ? (order.indexOf(prev.order?.[0]) + 1) % order.length : Math.floor(rnd() * order.length);
  const rotated = order.slice(start).concat(order.slice(0, start));
  const scores = {};
  players.forEach(p => (scores[p.pid] = 0));
  return {
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
    ending: 0,         // when the turn hands over after a splash or bank
    endReason: null,
    deadline: Date.now() + TIMES.idle,
    winner: null,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const current = s => s.order[s.t % s.order.length];

function endTurn(s, now, reason) {
  s.ending = now + TIMES.endTurn;
  s.endReason = reason;
}

function nextTurn(s, now) {
  s.t++;
  s.turnPts = 0;
  s.tosses = [];
  s.last = null;
  s.ending = 0;
  s.endReason = null;
  s.deadline = now + TIMES.idle;
}

function bank(s, now) {
  const pid = current(s);
  s.scores[pid] += s.turnPts;
  s.banked = s.turnPts;
  s.eventId++;
  s.lastEvent = 'bank';
  if (s.scores[pid] >= TARGET) { s.winner = pid; s.phase = 'over'; return; }
  endTurn(s, now, 'bank');
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (s.phase !== 'turn' || !a || pid !== current(s) || s.ending || now < s.busyUntil) return s;
  if (a.type === 'toss') {
    const r = toss(rnd);
    s.last = r;
    s.tosses.push(r);
    s.eventId++;
    s.lastEvent = 'toss';
    s.busyUntil = now + TIMES.anim;
    s.deadline = now + TIMES.idle;
    if (r.pile) { s.lost = s.scores[pid]; s.scores[pid] = 0; s.turnPts = 0; endTurn(s, now + TIMES.anim, 'pile'); }
    else if (r.splash) { s.lost = s.turnPts; s.turnPts = 0; endTurn(s, now + TIMES.anim, 'splash'); }
    else {
      s.turnPts += r.pts;
      // Auto-bank the moment you'd cross the target, so nobody has to remember to.
      if (s.scores[pid] + s.turnPts >= TARGET) { s.busyUntil = now + TIMES.anim; s.pendingWin = now + TIMES.anim; }
    }
  } else if (a.type === 'bank' && s.turnPts > 0) bank(s, now);
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a === 'next' && s.phase === 'turn') { if (s.ending) nextTurn(s, now); else if (s.turnPts > 0) bank(s, now); else { endTurn(s, now, 'skip'); } }
  return s;
}

export function tick(s, now = Date.now()) {
  if (s.phase !== 'turn') return s;
  if (s.pendingWin && now >= s.pendingWin) { s.pendingWin = 0; bank(s, now); return s; }
  if (s.ending && now >= s.ending) nextTurn(s, now);
  else if (!s.ending && now >= s.deadline && now >= s.busyUntil) { if (s.turnPts > 0) bank(s, now); else endTurn(s, now, 'skip'); }
  return s;
}

export function narration(s) {
  if (s.phase === 'turn' && s.t === 0 && !s.tosses.length) return `Welcome to Ducky Toss! First to ${TARGET} points wins. ${nameOf(s, current(s))}, you're up first. Swipe up on your phone to toss.`;
  if (s.phase === 'over') return `${nameOf(s, s.winner)} wins Ducky Toss!`;
  return '';
}

export function cue(s) {
  if (s.phase === 'turn' && s.t === 0 && !s.tosses.length) return { sound: 'join', wait: 700, title: 'Ducky Toss', sub: `First to ${TARGET} wins` };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: `${nameOf(s, s.winner)} Wins!`, sub: 'Ducky Toss champion', tone: 'dawn', fx: 'confetti' };
  return null;
}

// Sounds and lines for moments inside a turn (tosses, banks). The TV plays these as they happen.
export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.lastEvent === 'bank') return { id: s.eventId, sound: 'safe', say: `${nameOf(s, current(s))} banks ${s.banked}.`, delay: 0 };
  const r = s.last;
  if (!r) return null;
  if (r.pile) return { id: s.eventId, sound: 'lose', say: 'Duck pile! There goes your whole score!', delay: TIMES.anim };
  if (r.splash) return { id: s.eventId, sound: 'death', say: 'Splash! Turn over.', delay: TIMES.anim };
  if (r.double) return { id: s.eventId, sound: 'win', say: `${r.name}! ${r.pts} points!`, delay: TIMES.anim };
  return { id: s.eventId, sound: r.pts >= 10 ? 'safe' : 'tick', say: r.pts >= 10 ? `${r.name}! ${r.pts}!` : '', delay: TIMES.anim };
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'turn' || !v.myTurn || v.busy || v.ending) return null;
  const need = TARGET - v.score;
  if (v.turnPts >= need) return { type: 'bank' };
  return v.turnPts >= 15 + Math.floor(rnd() * 10) ? { type: 'bank' } : { type: 'toss' };
}

// ---------- views ----------
const board = s => s.order.map(pid => ({ pid, name: nameOf(s, pid), score: s.scores[pid], now: pid === current(s) && s.phase === 'turn' }));

export function tvView(s, now = Date.now()) {
  return {
    phase: s.phase, target: TARGET,
    who: nameOf(s, current(s)),
    turnPts: s.turnPts,
    tosses: s.tosses.map(r => ({ name: r.name, pts: r.pts, splash: !!r.splash, pile: !!r.pile })),
    last: s.last, eventId: s.eventId, lastEvent: s.lastEvent,
    animating: now < s.busyUntil,
    ending: !!s.ending, endReason: s.endReason, lost: s.lost, banked: s.banked,
    board: board(s),
    winner: s.winner ? nameOf(s, s.winner) : null,
  };
}

export function phoneView(s, pid, now = Date.now()) {
  if (!P(s, pid)) return { phase: 'spectate' };
  return {
    phase: s.phase,
    myTurn: current(s) === pid,
    who: nameOf(s, current(s)),
    score: s.scores[pid],
    turnPts: current(s) === pid ? s.turnPts : 0,
    theirTurnPts: s.turnPts,
    target: TARGET,
    busy: now < s.busyUntil,
    ending: !!s.ending,
    endReason: s.endReason,
    last: s.last ? { name: s.last.name, pts: s.last.pts, splash: !!s.last.splash, pile: !!s.last.pile } : null,
    eventId: s.eventId,
    won: s.winner === pid,
    winner: s.winner ? nameOf(s, s.winner) : null,
  };
}

// ---------- duck drawing ----------
// One rubber duck, drawn facing right, sitting upright. Poses rotate/flip it.
const DUCK = (star) => `<g class="duck-body">
  <ellipse cx="0" cy="14" rx="34" ry="22" fill="#ffd23f"/>
  <path d="M-34 10 Q-46 -4 -36 -12 Q-30 2 -24 4Z" fill="#ffd23f"/>
  <circle cx="14" cy="-14" r="18" fill="#ffd23f"/>
  <path d="M30 -16 Q46 -14 44 -6 Q36 -4 28 -8Z" fill="#ff8a1f"/>
  <circle cx="18" cy="-18" r="3.4" fill="#1b1b2f"/><circle cx="19.2" cy="-19.2" r="1.1" fill="#fff"/>
  <ellipse cx="-4" cy="12" rx="16" ry="10" fill="#f6c225"/>
  ${star ? '<path d="M-4 4 l2.6 5.4 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.8Z" fill="#e2483d"/>' : ''}
  <ellipse cx="-6" cy="2" rx="10" ry="4" fill="#fff" opacity=".35"/>
</g>`;
const POSE_XFORM = { star: 'rotate(90)', plain: 'scale(-1,1) rotate(90)', back: 'rotate(180)', sit: 'rotate(0)', head: 'rotate(-110)', lean: 'rotate(-55)', pile: 'rotate(15)' };

function duckSvg(poseKey, i, animate, eid) {
  const star = poseKey !== 'plain';
  return `<div class="duck ${animate ? 'tumble' : ''} d${i}" style="--dx:${i ? 1 : -1}" data-e="${eid}"><svg viewBox="-60 -60 120 120"><g transform="${POSE_XFORM[poseKey] || ''}">${DUCK(star)}</g></svg></div>`;
}

// ---------- renderers ----------
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const board = `<div class="scores"><h3>First to ${v.target}</h3>${v.board.map(p => `<div class="srow ${p.now ? 'now' : ''}"><span>${esc(p.name)}</span><b>${p.score}</b></div><div class="bar"><span style="width:${Math.min(100, (100 * p.score) / v.target)}%"></span></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'turn') {
    const last = v.last;
    const pond = last
      ? `<div class="pond ${last.pile ? 'pile' : ''}">${duckSvg(last.pile ? 'pile' : last.a, 0, v.animating, v.eventId)}${duckSvg(last.pile ? 'pile' : last.b, 1, v.animating, v.eventId)}</div>`
      : `<div class="pond empty"><p class="say">Swipe up on your phone to toss!</p></div>`;
    const result = last && !v.animating ? `<div class="toss-name ${last.splash || last.pile ? 'lose' : last.double ? 'win' : ''}">${esc(last.name)} ${last.pts ? `<b>+${last.pts}</b>` : ''}</div>` : '<div class="toss-name"> </div>';
    const status = v.ending && !v.animating
      ? v.endReason === 'bank' ? `<p class="say win">Banked ${v.banked} points!</p>` : v.endReason === 'splash' ? `<p class="say lose">Splash! Lost ${v.lost} points this turn.</p>` : v.endReason === 'pile' ? `<p class="say lose">Duck pile! Back to zero.</p>` : '<p class="say">Turn skipped.</p>'
      : `<p class="say">This turn: <b class="turnpts">${v.turnPts}</b></p>`;
    h = `<h2>${esc(v.who)}'s turn</h2>${pond}${result}${status}<div class="history">${v.tosses.map(t => `<span class="${t.splash || t.pile ? 'lose' : ''}">${esc(t.name)}${t.pts ? ' +' + t.pts : ''}</span>`).join('')}</div>${v.animating ? '' : `<button class="btn ghost" data-host="next">${v.ending ? 'Next player' : 'Skip / bank for them'}</button>`}`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.winner)} wins!</h2><div class="podium">${[...v.board].sort((a, b) => b.score - a.score).slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  const legend = `<div class="scores legend"><h3>How ducks land</h3>
    <div class="srow"><span>Matching sides</span><b>1</b></div>
    <div class="srow"><span>Belly up · Sitting pretty</span><b>5</b></div>
    <div class="srow"><span>Headstand</span><b>10</b></div>
    <div class="srow"><span>Beak lean</span><b>15</b></div>
    <div class="srow"><span>Doubles</span><b>×4</b></div>
    <div class="srow lose"><span>Splash (sides don't match)</span><b>lose turn</b></div>
    <div class="srow lose"><span>Duck pile</span><b>lose all</b></div></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div><div class="side">${board}${legend}</div></div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>';
  else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'You won!' : `${esc(v.winner)} wins!`}</h2><p class="say">You finished with ${v.score}.</p>`;
  else if (!v.myTurn) h = `<h2>${esc(v.who)} is tossing</h2><p class="say">Their turn so far: <b>${v.theirTurnPts}</b></p><p class="muted">Your score: ${v.score} of ${v.target}</p>`;
  else {
    const locked = v.busy || v.ending;
    const msg = v.ending ? (v.endReason === 'splash' ? '<p class="say lose">Splash! Turn over.</p>' : v.endReason === 'pile' ? '<p class="say lose">Duck pile! Ouch.</p>' : '<p class="say">Turn over.</p>') : v.last ? `<p class="say">${esc(v.last.name)}${v.last.pts ? ` +${v.last.pts}` : ''}</p>` : '<p class="say">Your turn!</p>';
    h = `<h2>Your turn</h2>${msg}
      <div class="swipe ${locked ? 'locked' : ''}" id="swipe"><div class="ducks-mini">${[0, 1].map(i => `<svg viewBox="-60 -60 120 120" width="64" height="64"${i ? ' style="transform:scaleX(-1)"' : ''}>${DUCK(true)}</svg>`).join('')}</div><b>${locked ? '…' : 'Swipe up to toss'}</b><small>or tap</small></div>
      <div class="turnbar"><div><small>This turn</small><b>${v.turnPts}</b></div><div><small>Banked</small><b>${v.score}</b></div><div><small>Need</small><b>${Math.max(0, v.target - v.score - v.turnPts)}</b></div></div>
      <button class="btn" data-bank ${v.turnPts > 0 && !locked ? '' : 'disabled'}>Bank ${v.turnPts} points</button>
      <p class="muted">Two plain/star sides that don't match is a Splash: you lose this turn's points.</p>`;
  }
  el.innerHTML = h;
  el.querySelector('[data-bank]')?.addEventListener('click', () => send({ type: 'bank' }));
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
