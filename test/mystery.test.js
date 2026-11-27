import * as G from '../js/games/mystery.js';
import assert from 'node:assert';
let fails = 0, caught = 0, games = 0;
for (let g = 0; g < 1000; g++) {
  const n = 4 + (g % 7);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'reveal' && guard++ < 500) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 10000; G.tick(s, t);
    // public clues never rule out the true room or item; no innocent alibi ever clears the thief
    assert.ok(!s.pub.some(c => c.includes(`the ${G.ROOMS[s.room]}.`) || c.includes(`used the ${G.ITEMS[s.item]}.`)));
    assert.ok(!s.alibied.includes(s.thief));
    for (const p of players) if (p.pid !== s.thief) assert.ok(!s.clues[p.pid].some(c => c.includes(`${G.ROOMS[s.room]} was locked`) || c.includes(`the ${G.ITEMS[s.item]} with you`)));
  }
  if (s.phase !== 'reveal') fails++; else { games++; if (s.caught) caught++; }
  for (const p of players) assert.equal(new Set(s.clues[p.pid].map(c => c.replace(/Act \d: /, ''))).size, s.clues[p.pid].length);
  // innocents never learn who the thief is directly
  for (const p of players) if (p.pid !== s.thief) assert.ok(!s.clues[p.pid].some(c => c.includes('You are the thief')));
}
console.log('fails', fails, 'bots caught the thief', (caught / games).toFixed(2));
process.exit(fails ? 1 : 0);
