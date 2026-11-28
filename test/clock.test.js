// Inner Clock rules: closest wins, spot-on bonus, double final round, the hidden clock stays hidden from phones.
import assert from 'node:assert';
import * as G from '../js/games/clock.js';
const ps = ['a', 'b', 'c', 'd'].map(p => ({ pid: p, name: p })), s = G.setup(ps); let now = Date.now();
assert.equal(s.rounds.length, 6); s.rounds.forEach(r => assert.ok(r.target >= 5 && r.target <= 20 && (r.twist === 'decoy' ? r.speed !== 1 : r.speed === 1)));
G.act(s, 'a', { type: 'stop' }, now); assert.equal(s.stops.a, undefined, 'no stopping before GO');
G.hostAct(s, 'next', now); assert.equal(s.phase, 'run');
assert.ok(!/since|goAt|speed/.test(JSON.stringify(G.phoneView(s, 'a'))), 'phones get no clock');
const T = s.rounds[0].target * 1000;
G.act(s, 'a', { type: 'stop' }, now + T + 50); G.act(s, 'a', { type: 'stop' }, now + T + 900); G.act(s, 'b', { type: 'stop' }, now + T - 700); G.act(s, 'c', { type: 'stop' }, now + T + 2000);
assert.equal(s.phase, 'run'); G.hostAct(s, 'next', now + T + 5000); assert.equal(s.phase, 'result');
assert.deepEqual(s.result.rows.map(r => [r.pid, r.pts]), [['a', 500], ['b', 200], ['c', 100], ['d', 0]]); assert.equal(s.result.rows[0].spot, true); assert.equal(s.result.rows[1].off, -700);
assert.equal(G.tvView(s, now).scores[0].score, 0); assert.equal(G.phoneView(s, 'a').pts, undefined);
G.tick(s, now + T + 9000); assert.equal(G.phoneView(s, 'a').pts, 500); assert.equal(G.tvView(s, now).scores[0].score, 500);
// the last round pays double; everyone stopping ends the round at once
while (s.i < 5) { G.hostAct(s, 'next', now); if (s.phase === 'run') G.hostAct(s, 'next', now); }
if (s.phase === 'result') G.hostAct(s, 'next', now); if (s.phase === 'ready') G.hostAct(s, 'next', now);
assert.equal(s.i, 5); assert.equal(s.phase, 'run'); const T5 = s.rounds[5].target * 1000, before = { ...s.scores };
ps.forEach((p, k) => G.act(s, p.pid, { type: 'stop' }, now + T5 + 300 + k * 300)); assert.equal(s.phase, 'result');
assert.deepEqual(ps.map(p => s.scores[p.pid] - before[p.pid]), [600, 400, 200, 100]);
G.hostAct(s, 'next', now); assert.equal(s.phase, 'over');
// whole games run to the end on the clock alone
for (let g = 0; g < 50; g++) { const s2 = G.setup(ps, Math.random, null, { short: true }); let t = Date.now(), n = 0; while (s2.phase !== 'over' && n++ < 3000) { t += 700; G.tick(s2, t); } assert.equal(s2.phase, 'over'); }
console.log('ok clock');
