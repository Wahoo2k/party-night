// Going Once rules: highest sealed bid buys, ties go to the first, only the insider sees the worth, worth = cash + lots.
import assert from 'node:assert';
import * as G from '../js/games/auction.js';
G.LOTS.forEach(l => assert.ok(l[2] >= 0 && l[3] > l[2] && l[3] <= 1000, l[0]));
for (let g = 0; g < 200; g++) { const ps = Array.from({ length: 3 + (g % 8) }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), n = 0;
  while (s.phase !== 'over' && n++ < 3000) { if (s.phase === 'bid') assert.ok(!/"value"|"secret"|"insider"/.test(JSON.stringify(G.tvView(s, t)))); for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } t += 800; G.tick(s, t); }
  assert.equal(s.phase, 'over'); ps.forEach(p => { assert.ok(s.cash[p.pid] >= 0); assert.equal(s.scores[p.pid], s.cash[p.pid] + s.items[p.pid].reduce((a, x) => a + x.value, 0)); }); }
const ps = ['a', 'b', 'c'].map(p => ({ pid: p, name: p })), s = G.setup(ps); let t = Date.now(); const l = s.lots[0];
assert.equal(ps.filter(p => G.phoneView(s, p.pid).secret !== undefined).length, 1); assert.equal(G.phoneView(s, l.insider).secret, l.value);
G.act(s, 'a', { type: 'bid', amount: 5000 }, t); assert.equal(s.bids.a, undefined, 'cannot bid more than you have');
G.act(s, 'a', { type: 'bid', amount: 304 }, t); assert.equal(s.bids.a.amount, 300); G.act(s, 'a', { type: 'bid', amount: 900 }, t); assert.equal(s.bids.a.amount, 300);
G.act(s, 'b', { type: 'bid', amount: 300 }, t + 50); G.act(s, 'c', { type: 'bid', amount: 0 }, t + 60);
assert.equal(s.phase, 'result'); assert.equal(s.result.winner, 'a', 'a tie goes to the first bid'); assert.equal(s.cash.a, 700); assert.equal(s.scores.a, 700 + l.value); assert.equal(s.cash.b, 1000);
assert.ok(G.tvView(s, t).scores.every(x => x.score === 1000)); assert.equal(G.phoneView(s, 'a').value, undefined); assert.equal(G.phoneView(s, 'a').cash, 1000);
G.tick(s, t + 5000); assert.equal(G.phoneView(s, 'a').won, true); assert.equal(G.phoneView(s, 'a').cash, 700);
G.hostAct(s, 'next', t); G.hostAct(s, 'next', t); assert.equal(s.result.winner, null, 'no bids, no sale'); assert.equal(s.scores.b, 1000);
console.log('ok auction');
