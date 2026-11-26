import * as G from '../js/games/charades.js';
import assert from 'node:assert';
assert.equal(new Set(G.CARDS.map(c => c[1])).size, G.CARDS.length);
let fails = 0;
for (let g = 0; g < 800; g++) {
  const n = 3 + (g % 18);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) if (Math.random() < 0.95) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++;
  const total = Object.values(s.scores).reduce((a, b) => a + b, 0); assert.equal(total % 2, 0);
}
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps); G.hostAct(s, 'next');
const actor = ps.find(p => G.phoneView(s, p.pid).isActor).pid;
for (const p of ps) assert.equal(G.phoneView(s, p.pid).card !== undefined, p.pid === actor);
const other = ps.find(p => p.pid !== actor).pid;
G.act(s, actor, { type: 'got', card: s.card, by: actor }); assert.equal(s.scores[actor], 0);   // can't credit yourself
const c = s.card; G.act(s, actor, { type: 'got', card: c, by: other }); G.act(s, actor, { type: 'got', card: c, by: other });
assert.equal(s.scores[other], 1); assert.equal(s.scores[actor], 1);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
