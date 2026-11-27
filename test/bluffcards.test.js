import * as G from '../js/games/bluffcards.js';
import assert from 'node:assert';
let fails = 0, lies = 0, calls = 0;
for (let g = 0; g < 1000; g++) {
  const n = 3 + (g % 6);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 15000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    if (s.phase === 'reveal') { calls++; if (s.reveal.lied) lies++; }
    t += 2000; G.tick(s, t);
    assert.equal(s.pile.length + Object.values(s.hands).reduce((a, h) => a + h.length, 0), 52);
  }
  if (s.phase !== 'over') fails++;
}
// other players never see the played cards before a challenge
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps); const p0 = s.players[0].pid;
const card = s.hands[p0][0];
G.act(s, p0, { type: 'play', ids: [card.id] });
assert.equal(s.phase, 'window');
for (const p of ps) if (p.pid !== p0) assert.ok(!JSON.stringify(G.phoneView(s, p.pid)).includes(`"id":${card.id},`) || G.phoneView(s, p.pid).hand.some(c => c.id === card.id) === false && !JSON.stringify(G.phoneView(s, p.pid).claim).includes('cards'));
assert.ok(!JSON.stringify(G.tvView(s).claim).includes('"r"'));
console.log('fails', fails, 'calls', calls, 'lies caught', lies);
process.exit(fails ? 1 : 0);
