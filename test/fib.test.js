// Fact or Fib rules: streaks multiply, a miss resets, nothing leaks early, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/fib.js';
import { STATEMENTS } from '../js/games/fib-bank.js';
assert.ok(STATEMENTS.length >= 90); assert.equal(new Set(STATEMENTS.map(x => x[0])).size, STATEMENTS.length);
STATEMENTS.forEach(x => { assert.equal(typeof x[1], 'boolean'); assert.ok(x[0].length <= 110 && x[2].length > 4, x[0]); });
const t = STATEMENTS.filter(x => x[1]).length; assert.ok(Math.abs(t - (STATEMENTS.length - t)) <= 6, 'about as many facts as fibs');
assert.deepEqual([0, 1, 2, 3, 7].map(G.multOf), [1, 1, 2, 3, 3]);
for (let g = 0; g < 200; g++) {
  const ps = Array.from({ length: 1 + (g % 8) }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { short: g % 2 === 0 }); let now = Date.now(), n = 0;
  while (s.phase !== 'over' && n++ < 2000) { if (s.phase === 'ask') assert.ok(!/"truth"|"note"|"hint"/.test(JSON.stringify(G.tvView(s, now)))); for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, now); } now += 800; G.tick(s, now); }
  assert.equal(s.phase, 'over'); assert.equal(s.n, s.max);
}
const ps = ['a', 'b'].map(p => ({ pid: p, name: p })), s = G.setup(ps); let now = Date.now();
const truth = () => STATEMENTS[s.q][1];
assert.equal(G.phoneView(s, 'a').hint, undefined);
// a is right three times running: 100, 200, 300. b is right, wrong, right: 100, 0, 100.
[[true, true], [true, false], [true, true]].forEach(([ra, rb], k) => {
  G.act(s, 'a', { type: 'pick', v: ra ? truth() : !truth() }, now); G.act(s, 'a', { type: 'pick', v: !truth() }, now); G.act(s, 'b', { type: 'pick', v: rb ? truth() : !truth() }, now);
  assert.equal(s.phase, 'reveal');
  if (k === 0) { assert.equal(G.tvView(s, now).scores.find(x => x.pid === 'a').score, 0); assert.equal(G.phoneView(s, 'a').got, undefined); G.tick(s, now + 4000); assert.equal(G.phoneView(s, 'a').got, 100); }
  G.hostAct(s, 'next', now);
});
assert.equal(s.scores.a, 600); assert.equal(s.scores.b, 200); assert.equal(s.streak.a, 3); assert.equal(s.streak.b, 1);
// no answer in time breaks the streak
G.act(s, 'b', { type: 'pick', v: truth() }, now); G.hostAct(s, 'next', now); assert.equal(s.streak.a, 0); assert.equal(s.streak.b, 2);
console.log('ok fib');
