import * as G from '../js/games/midnight.js';
import assert from 'node:assert';
let fails = 0, village = 0, games = 0;
for (let g = 0; g < 2000; g++) {
  const n = 3 + (g % 8);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  assert.equal(players.length + 3, Object.keys(s.start).length + s.center.length);
  while (s.phase !== 'over' && guard++ < 500) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 5000; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++; else { games++; if (s.result.village) village++; }
  // cards are only moved, never created
  const before = [...Object.values(s.start), ...s.centerStart].sort().join(), after = [...Object.values(s.final), ...s.center].sort().join();
  assert.equal(before, after);
}
// robber + troublemaker resolve in order
const ps = ['a', 'b', 'c', 'd'].map(p => ({ pid: p, name: p.toUpperCase() }));
const s = G.setup(ps);
Object.assign(s.start, { a: 'robber', b: 'wolf', c: 'trouble', d: 'insomniac' }); s.final = { ...s.start };
G.hostAct(s, 'next');
G.act(s, 'a', { type: 'night', target: 'b' }); G.act(s, 'b', { type: 'night', center: 0 }); G.act(s, 'c', { type: 'night', pair: ['a', 'd'] }); G.act(s, 'd', { type: 'night' });
assert.equal(s.phase, 'morning');
assert.deepEqual(s.final, { a: 'insomniac', b: 'robber', c: 'trouble', d: 'wolf' });
assert.ok(s.learned.a.includes('Werewolf')); assert.ok(s.learned.d.includes('Werewolf'));
console.log('fails', fails, 'village win rate', (village / games).toFixed(2));
process.exit(fails ? 1 : 0);
