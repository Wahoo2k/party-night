import * as G from '../js/games/split.js';
import assert from 'node:assert';
assert.equal(G.splitScore(2, 2), 1000); assert.equal(G.splitScore(4, 0), 0); assert.equal(G.splitScore(1, 3), 500);
assert.ok(G.PROMPTS.every(p => p.split('____').length === 2));
let fails = 0;
for (let g = 0; g < 600; g++) {
  const n = 3 + (g % 14);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++;
}
console.log('fails', fails);
process.exit(fails ? 1 : 0);
