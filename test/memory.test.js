import * as G from '../js/games/memory.js';
import assert from 'node:assert';
let fails = 0;
for (let g = 0; g < 800; g++) {
  const n = 1 + (g % 8);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 1000; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++;
}
// face-down cards never reveal their picture to phones or the TV
const s = G.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }]);
assert.ok(G.phoneView(s, 'a').cards.every(c => c.pic === null)); assert.ok(G.tvView(s).cards.every(c => c.pic === null));
console.log('fails', fails);
process.exit(fails ? 1 : 0);
