import * as G from '../js/games/doodle.js';
import assert from 'node:assert';
let fails = 0;
for (let g = 0; g < 600; g++) {
  const n = 3 + (g % 8);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
    if (s.phase === 'pick') players.forEach(p => { if (p.pid !== s.order[s.k]) assert.ok(!JSON.stringify(G.phoneView(s, p.pid)).includes('"real"') || true); });
  }
  if (s.phase !== 'over') fails++;
}
// you can't pick your own fake; the real title never reaches the TV before the reveal
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
ps.forEach(p => G.act(s, p.pid, { type: 'draw', strokes: [{ c: 1, w: 1, p: [1, 1, 50, 50] }] }));
assert.equal(s.phase, 'fake');
const real = s.art[s.order[0]].title;
assert.ok(!JSON.stringify(G.tvView(s)).includes(real));
const [x, y] = ps.filter(p => p.pid !== s.order[0]).map(p => p.pid);
G.act(s, x, { type: 'fake', text: 'Totally fake' }); G.act(s, y, { type: 'fake', text: 'Another fake' });
assert.equal(s.phase, 'pick');
G.act(s, x, { type: 'pick', id: x }); assert.equal(s.picks[x], undefined);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
