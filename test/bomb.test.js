import * as G from '../js/games/bomb.js';
import assert from 'node:assert';
for (let i = 0; i < 5000; i++) { const b = G.makeBomb(Math.random, i % 8); assert.ok(b.answer >= 0 && b.answer < b.wires.length); assert.ok(b.rules.at(-1).startsWith('Otherwise')); }
let fails = 0, total = 0;
for (let g = 0; g < 500; g++) {
  const n = 2 + (g % 7);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 2000; G.tick(s, t);
    if (s.hands) { const all = Object.values(s.hands).flat().sort((a, b) => a - b); assert.deepEqual(all, s.bomb.rules.map((_, i) => i)); if (n > 1) assert.equal(s.hands[s.cutter].length, 0); }
  }
  if (s.phase !== 'over') fails++; total += s.defused;
}
const s = G.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }]);
assert.equal(G.tvView(s).rules, undefined); assert.equal(G.phoneView(s, 'a')._a, undefined);
console.log('fails', fails, 'avg defused', (total / 500).toFixed(1));
process.exit(fails ? 1 : 0);
