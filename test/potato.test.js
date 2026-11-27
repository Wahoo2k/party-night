import * as G from '../js/games/potato.js';
import assert from 'node:assert';
let fails = 0;
for (let g = 0; g < 600; g++) {
  const n = 3 + (g % 14);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid, t)); if (a) G.act(s, p.pid, a, t); }
    t += 700; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++;
  assert.equal(Object.values(s.burns).reduce((a, b) => a + b, 0), G.ROUNDS);
}
const s = G.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }, { pid: 'c', name: 'C' }]);
const t0 = Date.now(); G.hostAct(s, 'next', t0); const h = s.holder;
G.act(s, h, { type: 'toss' }, t0 + 200); assert.equal(s.holder, h);           // too quick
G.act(s, h, { type: 'toss' }, t0 + 1500); assert.notEqual(s.holder, h);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
