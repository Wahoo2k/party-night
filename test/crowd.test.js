import * as G from '../js/games/crowd.js';
import { QUESTIONS } from '../js/games/crowd-bank.js';
import assert from 'node:assert';
for (const q of QUESTIONS) {
  const sum = q.a.reduce((a, x) => a + x[1], 0); assert.ok(sum >= 90 && sum <= 105, q.q + ' ' + sum);
  q.a.forEach((a, i) => { assert.equal(G.match(a[0], q.a), i, `${q.q}: ${a[0]}`); a.slice(2).forEach(alt => assert.equal(G.match(alt, q.a), i, `${q.q}: alt ${alt} -> ${G.match(alt, q.a)}`)); });
  for (let i = 1; i < q.a.length; i++) assert.ok(q.a[i][1] <= q.a[i - 1][1], 'ranked ' + q.q);
}
const beach = QUESTIONS[0].a;
assert.equal(G.match('a beach towel', beach), 0); assert.equal(G.match('sun screen', beach), 1); assert.equal(G.match('towl', beach), 0); assert.equal(G.match('car', beach), -1);
let fails = 0, prev = null, wins = [0, 0, 0];
for (let g = 0; g < 2000; g++) {
  const n = 2 + (g % 12);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 2000; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase); }
  wins[s.teamScore[0] > s.teamScore[1] ? 0 : s.teamScore[1] > s.teamScore[0] ? 1 : 2]++;
  prev = s;
}
const s = G.setup([{ pid: 'tom', name: 'Tom' }, { pid: 'bot-1', name: 'B' }]);
assert.equal(G.phoneView(s, 'tom')._a, undefined);
assert.ok(!JSON.stringify(G.tvView(s).board).includes('Towel') || s.qs[0] !== 0);
console.log('fails', fails, 'sun/moon/tie', wins);
process.exit(fails ? 1 : 0);
