import * as G from '../js/games/ducks.js';
import assert from 'node:assert';
// probabilities sum to 1
assert.ok(Math.abs(Object.values(G.POSES).reduce((a, p) => a + p.p, 0) - 1) < 1e-9);
assert.deepEqual(G.score('star', 'star'), { name: 'Snuggle', pts: 1 });
assert.ok(G.score('star', 'plain').splash);
assert.equal(G.score('star', 'head').pts, 10);
assert.equal(G.score('back', 'back').pts, 20);
assert.equal(G.score('head', 'head').pts, 40);
assert.equal(G.score('back', 'sit').pts, 10);
// distribution
const n = 200000, c = { splash: 0, pile: 0 }; let sum = 0;
for (let i = 0; i < n; i++) { const r = G.toss(); if (r.splash) c.splash++; if (r.pile) c.pile++; sum += r.pts; }
console.log('splash', (c.splash / n * 100).toFixed(1) + '%', 'pile', (c.pile / n * 100).toFixed(2) + '%', 'avg pts', (sum / n).toFixed(2));
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
process.exit(fails ? 1 : 0);
