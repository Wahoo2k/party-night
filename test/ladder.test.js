import * as G from '../js/games/ladder.js';
import { EASY, MEDIUM, HARD } from '../js/games/ladder-bank.js';
import assert from 'node:assert';
for (const q of [...EASY, ...MEDIUM, ...HARD]) { assert.equal(q.length, 5); assert.equal(new Set(q.slice(1)).size, 4, q[0]); }
let fails = 0, tops = 0, prev = null, seats = 0, walks = 0;
for (let g = 0; g < 3000; g++) {
  const n = 2 + (g % 11);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  assert.equal(s.seats.length, Math.min(4, n));
  let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3500; G.tick(s, t);
    if (s.seatEnd && s.seatEnd !== prev?.lastEnd) { }
  }
  if (s.phase !== 'over') { if (!fails) console.log('stuck', s.phase); fails++; }
  prev = s;
}
// 50:50 hides two wrong answers, never the right one
const s = G.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }]);
G.hostAct(s, 'next', Date.now());
const h = s.seats[0];
G.act(s, h, { type: 'life', name: 'fifty' }, 1); assert.equal(s.hidden.length, 2); assert.ok(!s.hidden.includes(s.q.answer));
G.act(s, h, { type: 'life', name: 'fifty' }, 2); assert.equal(s.hidden.length, 2);
// safe haven: answer 3 right then miss -> 5000
for (let k = 0; k < 3; k++) { G.act(s, h, { type: 'answer', i: s.q.answer }, 10); G.tick(s, 1e9); G.tick(s, 2e9); }
assert.equal(s.rung, 3); G.act(s, h, { type: 'answer', i: (s.q.answer + 1) % 4 }, 10); G.tick(s, 3e9); assert.equal(s.banked, 5000);
// humans never see the answer before the result
assert.equal(G.phoneView(s, 'a')._ans, undefined);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
