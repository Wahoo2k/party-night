// Rock Paper Showdown rules: score per player beaten, nothing for a missing throw, double on the last, scores held for the reveal.
import assert from 'node:assert';
import * as G from '../js/games/rps.js';
for (let g = 0; g < 200; g++) { const ps = Array.from({ length: 2 + (g % 12) }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), n = 0;
  while (s.phase !== 'over' && n++ < 3000) { if (s.phase === 'throw') assert.ok(!/rock|paper|scissors/.test(JSON.stringify({ ...G.tvView(s, t), lastCount: 0 })), 'throws stay secret'); for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } t += 700; G.tick(s, t); }
  assert.equal(s.phase, 'over'); assert.equal(s.n, s.max); }
const ps = ['a', 'b', 'c', 'd', 'e'].map(p => ({ pid: p, name: p })), s = G.setup(ps); let t = Date.now();
[['a', 'rock'], ['b', 'scissors'], ['c', 'scissors'], ['d', 'paper']].forEach(([p, x]) => G.act(s, p, { type: 'throw', t: x }, t)); G.act(s, 'a', { type: 'throw', t: 'paper' }, t); assert.equal(s.picks.a, 'rock');
G.act(s, 'e', { type: 'throw', t: 'lizard' }, t); assert.equal(s.phase, 'throw'); G.hostAct(s, 'next', t);
assert.deepEqual(ps.map(p => s.scores[p.pid]), [200, 100, 100, 100, 0]);   // rock beats two scissors; each scissors beats the paper; paper beats the rock; no throw scores nothing
assert.ok(G.tvView(s, t).scores.every(x => x.score === 0)); assert.equal(G.phoneView(s, 'a').got, undefined);
G.tick(s, t + 4000); assert.equal(G.phoneView(s, 'a').got, 200); assert.equal(G.phoneView(s, 'a').lostTo, 1); assert.equal(G.tvView(s, t).cols[0].each, 200);
while (s.n < s.max) { G.hostAct(s, 'next', t); if (s.phase === 'result') G.hostAct(s, 'next', t); }
const before = { ...s.scores }; G.act(s, 'a', { type: 'throw', t: 'paper' }, t); G.act(s, 'b', { type: 'throw', t: 'rock' }, t); G.hostAct(s, 'next', t); assert.equal(s.scores.a - before.a, 200, 'the last throw pays double');
console.log('ok rps');
