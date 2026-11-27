import * as G from '../js/games/haunted.js';
import assert from 'node:assert';
assert.ok(G.QUESTIONS.every(([q, o]) => o.length === 4 && new Set(o).size === 4));
let fails = 0;
for (let g = 0; g < 800; g++) {
  const n = 2 + (g % 9);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 2000; G.tick(s, t);
    if (s.phase === 'question') players.forEach(p => { if (!p.pid.startsWith('bot')) assert.equal(G.phoneView(s, p.pid)._r, undefined); });
  }
  if (s.phase !== 'over') fails++;
}
const s = G.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }]);
assert.equal(G.tvView(s).right, undefined); assert.equal(G.phoneView(s, 'a')._r, undefined);
const right = s.order.indexOf(0);
G.act(s, 'a', { type: 'answer', i: right }); G.act(s, 'b', { type: 'answer', i: (right + 1) % 4 });
assert.deepEqual(s.wrong, ['b']); G.hostAct(s, 'next'); assert.equal(s.phase, 'basement');
console.log('fails', fails);
process.exit(fails ? 1 : 0);
