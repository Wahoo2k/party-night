import * as G from '../js/games/copycat.js';
import assert from 'node:assert';
let fails = 0;
for (let g = 0; g < 500; g++) {
  const n = 1 + (g % 20);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (let k = 0; k < 3; k++) for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 1000; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++;
}
const s = G.setup([{ pid: 'a', name: 'A' }]);
assert.equal(G.phoneView(s, 'a')._p, undefined);   // humans never get the pattern
G.hostAct(s, 'next'); G.act(s, 'a', { type: 'tap', k: (s.pattern[0] + 1) % 4 });
assert.equal(s.phase, 'result'); assert.equal(s.hearts.a, 2);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
