import * as G from '../js/games/truths.js';
import assert from 'node:assert';
let fails = 0;
for (let g = 0; g < 600; g++) {
  const n = 3 + (g % 10);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
    if (s.phase === 'vote') players.forEach(p => assert.equal(JSON.stringify(G.phoneView(s, p.pid)).includes('lie'), false));
  }
  if (s.phase !== 'over') fails++;
}
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
ps.forEach(p => G.act(s, p.pid, { type: 'set', lines: ['A one', 'B two', 'C three ' + p.pid], lie: 2 }));
assert.equal(s.phase, 'vote');
const set = s.sets[s.order[0]]; assert.ok(set.lines[set.lie].startsWith('C three'));
assert.equal(G.tvView(s).result, undefined);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
