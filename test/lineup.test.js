// Line Up rules: pair scoring, the phone never learns the order, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/lineup.js';
let fails = 0;
assert.equal(G.pairsRight([0, 1, 2, 3, 4]), 10); assert.equal(G.pairsRight([4, 3, 2, 1, 0]), 0); assert.equal(G.pairsRight([1, 0, 2, 3, 4]), 9);
assert.equal(G.pointsFor([0, 1, 2, 3, 4]), 1250); assert.equal(G.pointsFor([1, 0, 2, 3, 4]), 900); assert.equal(G.pointsFor([4, 3, 2, 1, 0]), 0);
for (const [rule, items] of G.SETS) { assert.ok(rule.length > 5); assert.equal(items.length, 5, rule); assert.equal(new Set(items.map(x => x[0])).size, 5, rule); }
for (let g = 0; g < 200; g++) {
  const nP = 2 + (g % 8), players = Array.from({ length: nP }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    assert.ok(s.phase !== 'order' || !s.shown.every((x, i) => x === i), 'never dealt already in order');
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    const v = G.tvView(s, t);
    if (s.phase === 'reveal' && !s.settled) for (const x of v.scores) assert.equal(x.score, s.result.before[x.pid]);
    t += 700; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; continue; }
  for (const p of players) assert.ok(s.scores[p.pid] >= 0 && s.scores[p.pid] <= 1250 * s.order.length);
}
// a human: the phone gets the cards numbered by their seat, and a correct line built from the real answer scores full marks
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i })); const s = G.setup(ps); const t0 = Date.now();
const pv = G.phoneView(s, 'p0'); assert.deepEqual(pv.items.map(x => x.id), [0, 1, 2, 3, 4]); assert.equal(pv._truth, undefined);
const truth = G.SETS[s.order[0]][1].map(x => x[0]);
const right = truth.map(t => pv.items.find(x => x.t === t).id);
G.act(s, 'p0', { type: 'line', line: right }, t0); G.act(s, 'p1', { type: 'line', line: [...right].reverse() }, t0); G.act(s, 'p2', { type: 'line', line: [0, 0, 1, 2, 3] }, t0);
assert.deepEqual(s.lines.p0, [0, 1, 2, 3, 4]); assert.equal(s.lines.p2, undefined);
G.hostAct(s, 'next', t0); assert.equal(s.scores.p0, 1250); assert.equal(s.scores.p1, 0);
let t = t0; for (let i = 0; i < 300 && s.phase !== 'over'; i++) { t += 4000; G.tick(s, t); }
assert.equal(s.phase, 'over');
console.log('fails', fails);
if (fails) process.exit(1);
