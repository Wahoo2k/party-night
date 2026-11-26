import * as G from '../js/games/estimate.js';
import assert from 'node:assert';
assert.deepEqual(G.board({ a: 10, b: 20, c: 30, d: 20 }).map(x => [x.id, x.odds]), [['low', 6], ['10', 3], ['20', 2], ['30', 3]]);
assert.equal(G.winningSlot({ a: 10, b: 20, c: 30 }, 25), '20'); assert.equal(G.winningSlot({ a: 10 }, 5), 'low'); assert.equal(G.winningSlot({ a: 10 }, 10), '10');
let fails = 0;
for (let g = 0; g < 800; g++) {
  const n = 2 + (g % 19);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
    if (s.phase === 'answer') assert.equal(G.tvView(s).result, undefined);
  }
  if (s.phase !== 'over') fails++;
}
console.log('fails', fails);
process.exit(fails ? 1 : 0);
