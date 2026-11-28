import * as G from '../js/games/ducks.js';
import assert from 'node:assert';
// probabilities sum to 1
assert.ok(Math.abs(Object.values(G.POSES).reduce((a, p) => a + p.p, 0) - 1) < 1e-9);
assert.deepEqual(G.score('left', 'left'), { name: 'Nap time', pts: 1 });
assert.ok(G.score('left', 'right').bust);
assert.equal(G.score('left', 'nose').pts, 10);
assert.equal(G.score('back', 'back').pts, 20);
assert.equal(G.score('nose', 'nose').pts, 40);
assert.equal(G.score('back', 'stand').pts, 10);
// distribution
const n = 200000, c = { bust: 0, pile: 0 }; let sum = 0;
for (let i = 0; i < n; i++) { const r = G.toss(); if (r.bust) c.bust++; if (r.pile) c.pile++; sum += r.pts; }
console.log('bust', (c.bust / n * 100).toFixed(1) + '%', 'pile', (c.pile / n * 100).toFixed(2) + '%', 'avg pts', (sum / n).toFixed(2));
let fails = 0, turns = 0, prev = null;
for (let g = 0; g < 2000; g++) {
  const np = 2 + (g % 9);
  const players = Array.from({ length: np }, (_, i) => ({ pid: 'p' + i, name: 'P' + i }));
  const s = G.setup(players, Math.random, prev);
  let t = 0, guard = 0;
  while (s.phase !== 'over' && guard++ < 20000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid, t)); if (a) G.act(s, p.pid, a, t); }
    t += 800; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase, s.t); }
  else assert.ok(s.scores[s.winner] >= G.TARGET);
  turns += s.t;
  prev = s;
}
// only current player can act; can't toss while busy
const s = G.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }], () => 0.5);
const cur = s.order[0], other = s.order[1];
G.act(s, other, { type: 'toss' }, 0); assert.equal(s.tosses.length, 0);
G.act(s, cur, { type: 'toss' }, 0); G.act(s, cur, { type: 'toss' }, 100); assert.equal(s.tosses.length, 1);
console.log('games ok, fails', fails, 'avg turns/game', (turns / 2000).toFixed(1));

// Twists: double or nothing, and "one more!"
{
  const players = ['a', 'b', 'c'].map(pid => ({ pid, name: pid.toUpperCase() }));
  const s = G.setup(players, () => 0, null); const cur = () => s.order[s.t % s.order.length];
  // a dare: only someone else, only with points on the table, only once; the thrower cannot bank until they toss
  s.turnPts = 20; const thrower = cur(), other = s.order.find(p => p !== thrower);
  G.act(s, thrower, { type: 'dare' }, 1000); assert.equal(s.forced, null, 'the thrower cannot dare themselves');
  G.act(s, other, { type: 'dare' }, 1000); assert.equal(s.forced, other); assert.equal(s.dares[other], 0);
  G.act(s, thrower, { type: 'bank' }, 1100); assert.equal(s.scores[thrower], 0, 'no banking while dared');
  assert.equal(G.phoneView(s, thrower, 1100).forced, true); assert.equal(G.phoneView(s, other, 1100).canDare, false);
  G.act(s, thrower, { type: 'toss' }, 1200, () => 0.9); assert.equal(s.forced, null, 'the toss clears the dare');
  // double or nothing: banking doubles
  const d = G.setup(players, () => 0, null); d.twist = 'double'; d.turnPts = 12; const t2 = d.order[0];
  G.act(d, t2, { type: 'bank' }, 1000); assert.equal(d.scores[t2], 24); assert.equal(d.banked, 24);
  // ...and butting heads costs ten from the bank (left + right sides)
  const e = G.setup(players, () => 0, null); e.twist = 'double'; const t3 = e.order[0]; e.scores[t3] = 30; e.turnPts = 8;
  let k = 0; G.act(e, t3, { type: 'toss' }, 1000, () => [0.5, 0.1, 0.4][k++] ?? 0.5);
  if (e.last.bust) assert.equal(e.scores[t3], 20, 'a bust on a double turn costs 10');
  // nobody gets a twist on their first turn
  const f = G.setup(players, () => 0, null); assert.equal(f.twist, null);
  // everyone at once (4+ players): waves of tosses, secret toss-or-bank, round ends when all are banked or out
{
  const ps = ['a', 'b', 'c', 'd'].map(p => ({ pid: p, name: p })); const s = G.setup(ps); let t = Date.now();
  assert.equal(s.mode, 'together'); assert.equal(G.setup(ps.slice(0, 3)).mode, undefined);
  const seq = vals => { let i = 0; return () => vals[i++ % vals.length]; };
  // wave 1: nobody can bank; a 'bank' is ignored
  G.act(s, 'a', { type: 'bank' }, t); assert.ok(!s.tg.pens.a.choice);
  // rnd: 0.5 (no pile), then poses: 0.7 -> back, 0.7 -> back  => double hooves up, 20 points for everyone
  for (const p of ps) G.act(s, p.pid, { type: 'toss' }, t, seq([0.5, 0.7, 0.7]));
  assert.equal(s.tg.step, 'land'); for (const p of ps) assert.equal(s.tg.pens[p.pid].pts, 20);
  assert.equal(G.tvView(s, t).pens.length, 4); assert.ok(G.cueEvent(s).say.includes('20'));
  t += G.TG.anim + G.TG.show + 10; G.tick(s, t); assert.equal(s.tg.step, 'wave'); assert.equal(s.tg.wave, 2);
  // a and b bank, c tosses and butts heads (0.1 left, 0.4 right), d walks away and is banked for
  G.act(s, 'a', { type: 'bank' }, t); G.act(s, 'b', { type: 'bank' }, t); assert.equal(s.scores.a, 0, 'hidden until everyone has chosen');
  G.act(s, 'c', { type: 'toss' }, t); t += G.TG.choose + 10; G.tick(s, t, seq([0.5, 0.1, 0.4]));
  assert.equal(s.scores.a, 20); assert.equal(s.scores.b, 20); assert.equal(s.scores.d, 20);
  assert.ok(['bust', 'in', 'pile'].includes(s.tg.pens.c.state));
  let n = 0; while (s.tg.round === 1 && n++ < 50) { for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid, t)); if (a) G.act(s, p.pid, a, t); } t += 1500; G.tick(s, t); }
  assert.equal(s.tg.round, 2); for (const p of ps) assert.equal(s.tg.pens[p.pid].state, 'in');
  // the game ends at the end of a round, highest score wins, a tie plays on
  s.scores = { a: 120, b: 120, c: 10, d: 0 }; s.tg.step = 'roundEnd'; s.deadline = t; G.tick(s, t); assert.equal(s.phase, 'turn', 'tie plays on');
  s.scores.a = 130; s.tg.step = 'roundEnd'; s.deadline = t; G.tick(s, t); assert.equal(s.phase, 'over'); assert.equal(s.winner, 'a');
}
console.log('twists ok', { bust: !!e.last.bust });
}
process.exit(fails ? 1 : 0);
