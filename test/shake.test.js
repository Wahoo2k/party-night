// Shake It rules: movement totals are capped, standings for each event, early flicks are out, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/shake.js';
let fails = 0;
for (let g = 0; g < 200; g++) {
  const nP = 2 + (g % 9), players = Array.from({ length: nP }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 4000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    if (s.phase === 'ready' && s.events[s.i] === 'draw') assert.equal(G.tvView(s, t).left, undefined, 'the TV never shows when GO is coming');
    t += 450; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; continue; }
  assert.ok(Object.values(s.scores).every(x => x >= 0));
}
const ps = ['a', 'b', 'c'].map(p => ({ pid: p, name: p.toUpperCase() })); const s = G.setup(ps); let t = Date.now();
ps.forEach(p => G.act(s, p.pid, { type: 'ready' }, t)); assert.equal(s.phase, 'ready'); assert.equal(s.events[0], 'shake');
G.act(s, 'a', { type: 'tap', e: 50 }, t); assert.equal(s.amt.a, undefined, 'nothing counts before GO');
G.hostAct(s, 'next', t); assert.equal(s.phase, 'go');
// a shakes hard, b gently, c claims a silly number that is capped, then goes quiet
for (let k = 1; k <= 10; k++) { G.act(s, 'a', { type: 'tap', e: 12 }, t + k * 400); G.act(s, 'b', { type: 'tap', e: 3 }, t + k * 400); }
G.act(s, 'c', { type: 'tap', e: 99999 }, t + 400); assert.ok(s.amt.c <= 45 * 0.4 + 0.001);
t += 4100; G.hostAct(s, 'next', t); assert.equal(s.phase, 'result');
assert.deepEqual(s.result.rows.map(r => r.pid), ['a', 'b', 'c']); assert.deepEqual(s.result.rows.map(r => r.pts), [300, 200, 100]);
assert.equal(G.tvView(s, t).scores[0].score, 0); assert.equal(G.phoneView(s, 'a').pts, undefined);
G.tick(s, t + 3000); assert.equal(G.tvView(s, t + 3000).scores[0].score, 300); assert.equal(G.phoneView(s, 'a').rank, 0);
// Statue: least movement wins; a phone with no readings does not place
G.hostAct(s, 'next', t); assert.equal(s.events[s.i], 'still'); G.hostAct(s, 'next', t);
for (let k = 1; k <= 12; k++) { G.act(s, 'a', { type: 'tap', e: 0.5 }, t + k * 400); G.act(s, 'b', { type: 'tap', e: 0.1 }, t + k * 400); }
t += 5000; G.hostAct(s, 'next', t); assert.deepEqual(s.result.rows.map(r => [r.pid, r.pts]), [['b', 300], ['a', 200], ['c', 0]]);
// Quick Draw: a flick before GO is out; the first after GO wins
G.hostAct(s, 'next', t); assert.equal(s.events[s.i], 'draw');
G.act(s, 'c', { type: 'tap', early: 1 }, t); G.hostAct(s, 'next', t); assert.equal(s.phase, 'go');
G.act(s, 'c', { type: 'tap' }, t + 100); G.act(s, 'b', { type: 'tap' }, t + 300); G.act(s, 'b', { type: 'tap' }, t + 350); assert.equal(s.phase, 'go'); G.act(s, 'a', { type: 'tap' }, t + 500);
assert.equal(s.phase, 'result'); assert.deepEqual(s.result.rows.map(r => [r.pid, r.pts]), [['b', 300], ['a', 200], ['c', 0]]); assert.equal(s.result.rows[2].early, true);
// ties share a place
const s3 = G.setup(ps, Math.random, null, { short: true }); G.hostAct(s3, 'next', t); G.hostAct(s3, 'next', t);
['a', 'b'].forEach(p => G.act(s3, p, { type: 'tap', e: 5 }, t + 400)); G.hostAct(s3, 'next', t + 500); assert.deepEqual(s3.result.rows.map(r => r.pts), [300, 300, 0]);
console.log('fails', fails);
if (fails) process.exit(1);
