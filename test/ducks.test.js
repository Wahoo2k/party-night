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
  console.log('twists ok', { bust: !!e.last.bust });
}
process.exit(fails ? 1 : 0);
