import * as hunt from '../js/games/hunt.js';
import * as freeze from '../js/games/freeze.js';
import assert from 'node:assert';
let fails = 0;
for (const G of [hunt, freeze]) for (let g = 0; g < 300; g++) {
  const n = 1 + (g % 20);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) { for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } t += 1000; G.tick(s, t); }
  if (s.phase !== 'over') fails++;
}
// freeze: tapping during the music cancels your round
const s = freeze.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }]);
freeze.hostAct(s, 'next'); freeze.act(s, 'a', { type: 'tap' }); freeze.hostAct(s, 'next');
freeze.act(s, 'a', { type: 'tap' }); freeze.act(s, 'b', { type: 'tap' });
assert.equal(s.scores.a, 0); assert.equal(s.scores.b, 3);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
