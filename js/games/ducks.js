// GOAT Toss: a press-your-luck tossing game. Toss two little goats, score by how they land,
// keep tossing to build your turn, or bank before they butt heads and wipe it out. First to the target is the
// Greatest Of All Time. Our own pieces, landing names and scoring (not affiliated with any commercial dice game).
// (The file and game id are still "ducks" from the first version, so saved rooms and links keep working.)
import { esc } from '../ui.js';

export const meta = {
  how: ['On your turn, swipe up on your phone to toss two goats onto the table.', 'How they land scores points: hooves up and on all fours are 5, a nose dive is 10, a horn stand is 15. Two the same is worth four times as much.', 'Keep tossing to build your turn, or bank your points to keep them.', "If the goats land on two different sides they butt heads and you lose the turn's points. First to 100 is the G.O.A.T."],
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
    ending: 0,         // when the turn hands over after a bust or bank
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
    else if (r.bust) {
      // Catch-up: whoever is in last place and well behind keeps half of the turn's points on a bust.
      const all = Object.values(s.scores), mine = s.scores[current(s)];
      const keep = mine === Math.min(...all) && Math.max(...all) - mine >= 30 ? Math.floor(s.turnPts / 2) : 0;
      s.scores[current(s)] += keep; s.kept = keep; s.lost = s.turnPts - keep; s.turnPts = 0; endTurn(s, now + TIMES.anim, 'bust');
    }
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
  if (s.phase === 'turn' && s.t === 0 && !s.tosses.length) return `Welcome to GOAT Toss! First to ${TARGET} points is the greatest of all time. ${nameOf(s, current(s))}, you're up first. Swipe up on your phone to toss.`;
  if (s.phase === 'over') return `${nameOf(s, s.winner)} is the greatest of all time!`;
  return '';
}

export function cue(s) {
  if (s.phase === 'turn' && s.t === 0 && !s.tosses.length) return { sound: 'join', wait: 700, title: 'GOAT Toss', sub: `First to ${TARGET} is the Greatest Of All Time` };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: `${nameOf(s, s.winner)} is the G.O.A.T.!`, sub: 'Greatest Of All Time', tone: 'dawn', fx: 'confetti' };
  return null;
}

// Sounds and lines for moments inside a turn (tosses, banks). The TV plays these as they happen.
export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.lastEvent === 'bank') return { id: s.eventId, sound: 'safe', say: `${nameOf(s, current(s))} banks ${s.banked}.`, delay: 0 };
  const r = s.last;
  if (!r) return null;
  if (r.pile) return { id: s.eventId, sound: 'lose', react: 'groan', fx: 'shake', say: 'Goat pile! There goes your whole score!', delay: TIMES.anim };
  if (r.bust) return { id: s.eventId, sound: 'death', react: 'groan', fx: 'shake', say: s.kept ? `They butt heads! But the underdog keeps ${s.kept}.` : 'They butt heads! Turn over.', delay: TIMES.anim };
  if (r.double) return { id: s.eventId, sound: 'win', react: 'cheer', fx: 'gold', say: `${r.name}! ${r.pts} points!`, delay: TIMES.anim };
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
const goatImg = (k) => `<span class="goatpic ${k === 'right' ? 'flip' : ''}" style="--rot:${ROT[k] || 0}deg;--lift:${LIFT[k] || 0}%"><img src="art/goat.png" alt="">${k === 'right' ? '' : '<u></u>'}</span>`;


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
    const to = pile ? { x: i ? 70 : -40, d: 150, h: i ? 78 : 0 } : { x: (i ? 190 : -150) + (r() - 0.5) * 110, d: 90 + r() * 150, h: 0 };
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
    return { from, to, pts: pts.map(([tt, hh, dd]) => [tt, hh, dd / total]), end, bounces, rot: ROT[pile ? 'pile' : key2] || 0, lift: LIFT[pile ? 'pile' : key2] || 0, flip, spins: (2 + Math.floor(r() * 2)) * 360 + r() * 90, dir: i ? -1 : 1 };
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
    const rot = g.rot + g.dir * g.spins * (1 - p) ** 1.25 + wobble;
    el.style.opacity = 1;
    el.style.transform = `translate3d(${x.toFixed(1)}px,${(-h).toFixed(1)}px,${(-d).toFixed(1)}px)`;
    el.firstElementChild.style.transform = `translateY(${(g.lift * land).toFixed(1)}%) rotate(${rot.toFixed(1)}deg)${g.flip ? ' scaleX(-1)' : ''}`;
    if (sh[i]) { const lift = Math.min(1, h / 260); sh[i].style.opacity = 0.5 - 0.3 * lift; sh[i].style.transform = `translate(${(850 + x - 115).toFixed(1)}px,${(900 - d - 43).toFixed(1)}px) scale(${(1 - 0.45 * lift).toFixed(2)})`; }
  });
}
function tossRun(root, v) {
  const last = v.last;
  if (!last) return;
  const plan = tossPlan(v.eventId, last.a, last.b, !!last.pile);
  const start = v.animating && typeof performance !== 'undefined' ? performance.now() - (TIMES.anim - (v.animLeft ?? 0)) : null;
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
  return `<div class="gtable g3d ${last ? '' : 'empty'}"><div class="gtop"><i class="gsh"></i><i class="gsh"></i><i class="gsh cupsh"></i></div><div class="glip"></div><div class="gworld">
    <div class="gcup ${last && v.animating ? 'pour' : ''}" style="animation-delay:-${Math.round(since)}ms">${CUP_SVG}</div>
    ${last ? [last.a, last.b].map(k => `<div class="g3"><span class="goatpic"><img src="art/goat.png" alt="">${!last.pile && k === 'right' ? '' : '<u></u>'}</span></div>`).join('') : ''}
  </div>${last ? '' : '<p class="say">Swipe up on your phone to toss!</p>'}</div>`;
}

// ---------- renderers ----------
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const board = `<div class="scores"><h3>First to ${v.target}</h3>${v.board.map(p => `<div class="srow ${p.now ? 'now' : ''}"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'turn') {
    const last = v.last;
    const table = tossScene(v);
    const result = last && !v.animating ? `<div class="toss-name ${last.bust || last.pile ? 'lose' : last.double ? 'win' : ''}">${esc(last.name)} ${last.pts ? `<b>+${last.pts}</b>` : ''}</div>` : '<div class="toss-name blank"></div>';
    const status = v.ending && !v.animating
      ? v.endReason === 'bank' ? `<p class="say win">Banked ${v.banked} points!</p>` : v.endReason === 'bust' ? `<p class="say lose">They butt heads! Lost ${v.lost} points this turn.</p>` : v.endReason === 'pile' ? `<p class="say lose">Goat pile! Back to zero.</p>` : '<p class="say">Turn skipped.</p>'
      : `<p class="say">This turn: <b class="turnpts">${v.turnPts}</b></p>${(() => { const c = v.board.find(p => p.now); if (!c) return ''; const need = v.target - c.score - v.turnPts; return need <= 0 ? '<p class="say win" data-pop="bankwin" data-snd="gasp">Bank it to be the G.O.A.T.!</p>' : need <= 15 ? `<p class="say" data-pop="near${c.name}" data-snd="gasp">🔥 ${need} away from winning!</p>` : ''; })()}`;
    const legend = `<div class="glegend">${[['left', 'right', 'Different sides', 'lose turn', 'lose'], ['left', 'left', 'Same side', '1'], ['back', '', 'Hooves up', '5'], ['stand', '', 'On all fours', '5'], ['nose', '', 'Nose dive', '10'], ['horn', '', 'Horn stand', '15'], ['back', 'back', 'Two alike', '×4']].map(([a, b, n, p, c]) => `<div class="gl ${c || ''}"><span class="glpic">${goatImg(a)}${b ? goatImg(b) : ''}</span><small>${n}</small><b>${p}</b></div>`).join('')}</div>`;
    h = `<div class="ghead"><h2>${esc(v.who)}'s turn</h2>${result}</div>${table}<div class="gfoot">${status}<div class="history">${v.tosses.map(t => `<span class="${t.bust || t.pile ? 'lose' : ''}">${esc(t.name)}${t.pts ? ' +' + t.pts : ''}</span>`).join('')}</div></div>${legend}<button class="btn ghost" data-host="next" ${v.animating ? 'style="visibility:hidden"' : ''}>${v.ending ? 'Next player' : 'Skip / bank for them'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.winner)} is the G.O.A.T.!</h2><p class="say">Greatest Of All Time, at least until the next game.</p><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${board}</div>`;
  const scene = el.querySelector('.g3d'); if (scene && v.last) tossRun(scene, v);
}

export function renderPhone(v, el, send) {
  let h = '';
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>';
  else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'You are the G.O.A.T.!' : `${esc(v.winner)} is the G.O.A.T.`}</h2><p class="say">You finished with ${v.score}.</p>`;
  else if (!v.myTurn) h = `<h2>${esc(v.who)} is tossing</h2><p class="say">Their turn so far: <b>${v.theirTurnPts}</b></p><p class="muted">Your score: ${v.score} of ${v.target}</p>`;
  else {
    const locked = v.busy || v.ending;
    const msg = v.ending ? (v.endReason === 'bust' ? '<p class="say lose">They butt heads! Turn over.</p>' : v.endReason === 'pile' ? '<p class="say lose">Goat pile! Ouch.</p>' : '<p class="say">Turn over.</p>') : v.last ? `<p class="say">${esc(v.last.name)}${v.last.pts ? ` +${v.last.pts}` : ''}</p>` : '<p class="say">Your turn!</p>';
    h = `<h2>Your turn</h2>${msg}
      <div class="swipe ${locked ? 'locked' : ''}" id="swipe"${locked ? '' : ' data-pad'}><div class="ducks-mini">${goatImg('stand')}${goatImg('stand')}</div><b>${locked ? '…' : 'Swipe up to toss'}</b><small>or tap</small></div>
      <div class="turnbar"><div><small>This turn</small><b>${v.turnPts}</b></div><div><small>Banked</small><b>${v.score}</b></div><div><small>Need</small><b>${Math.max(0, v.target - v.score - v.turnPts)}</b></div></div>
      <button class="btn" data-bank ${v.turnPts > 0 && !locked ? '' : 'disabled'}>Bank ${v.turnPts} points</button>
      <p class="muted">Two goats on different sides butt heads: you lose this turn's points. Bank before your luck runs out.</p>`;
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
