// Pin Drop rules: distances, points, and a full game played by bots.
import assert from 'node:assert';
import * as G from '../js/games/pindrop.js';
let fails = 0;
// distance: London to Paris is about 344 km; same point is 0; opposite side of the world about 20,000
assert.ok(Math.abs(G.km(51.507, -0.128, 48.857, 2.352) - 344) < 6);
assert.equal(Math.round(G.km(10, 20, 10, 20)), 0);
assert.ok(Math.abs(G.km(0, 0, 0, 180) - 20015) < 30);
// points: bullseye is 1000, never negative, never rises with distance, zero from 5,000 km
assert.equal(G.pointsFor(0), 1000); assert.equal(G.pointsFor(99), 1000); assert.equal(G.pointsFor(5000), 0); assert.equal(G.pointsFor(15000), 0);
for (let d = 100; d < 6000; d += 50) assert.ok(G.pointsFor(d) >= G.pointsFor(d + 50) && G.pointsFor(d) >= 0 && G.pointsFor(d) <= 1000);
// every place is on the map and has all its parts
for (const p of G.PLACES) { assert.equal(p.length, 5); assert.ok(p[2] >= -90 && p[2] <= 90 && p[3] >= -180 && p[3] <= 180, p[0]); assert.ok(p[0] && p[1] && p[4]); }
assert.equal(new Set(G.PLACES.map(p => p[0])).size, G.PLACES.length);
for (let g = 0; g < 200; g++) {
  const nP = 2 + (g % 9), players = Array.from({ length: nP }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), guard = 0;
  assert.equal(new Set(s.order).size, s.order.length);
  while (s.phase !== 'over' && guard++ < 4000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    const v = G.tvView(s, t);
    if (s.phase === 'reveal' && !s.settled) { const held = Object.fromEntries(v.scores.map(x => [x.pid, x.score])); for (const p of players) assert.equal(held[p.pid], s.result.before[p.pid]); for (const p of players) assert.equal(G.phoneView(s, p.pid).where, undefined); }
    t += 700; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; continue; }
  for (const p of players) assert.ok(s.scores[p.pid] >= 0 && s.scores[p.pid] <= 1000 * s.order.length);
  // a second game with the same crowd does not repeat places until they run out
  const s2 = G.setup(players, Math.random, s, {}); assert.ok(s2.order.every(i => !s.order.includes(i)));
}
// nobody pins: the timer still moves the game on and everyone scores nothing
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i })); const s = G.setup(ps); let t = Date.now();
for (let i = 0; i < 400 && s.phase !== 'over'; i++) { t += 4000; G.tick(s, t); }
assert.equal(s.phase, 'over'); assert.ok(ps.every(p => s.scores[p.pid] === 0));
// a human's phone is never told where the place is before the reveal has played
assert.equal(G.phoneView(G.setup(ps), 'p0')._t, undefined);
console.log('fails', fails);
if (fails) process.exit(1);
