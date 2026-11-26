import * as G from '../js/games/gofish.js';
import assert from 'node:assert';
let fails = 0;
for (let g = 0; g < 1500; g++) {
  const n = 2 + (g % 5);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) if (Math.random() < 0.95) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 2000; G.tick(s, t);
    const cards = s.deck.length + Object.values(s.hands).reduce((a, h) => a + h.length, 0) + Object.values(s.books).reduce((a, b) => a + b.length * 4, 0);
    assert.equal(cards, 52);
  }
  if (s.phase !== 'over') { if (!fails) console.log('stuck', JSON.stringify(Object.values(s.hands).map(h => h.length)), s.deck.length); fails++; }
  else assert.equal(Object.values(s.books).reduce((a, b) => a + b.length, 0), 13);
}
console.log('fails', fails);
process.exit(fails ? 1 : 0);
