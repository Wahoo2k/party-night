import * as G from '../js/games/blackjack.js';
import assert from 'node:assert';
const c = (r, s = 0) => ({ id: Math.random(), r, s });
assert.equal(G.total([c(0), c(12)]).t, 21); assert.ok(G.isBJ([c(0), c(11)]));
assert.equal(G.total([c(0), c(0), c(8)]).t, 21); assert.equal(G.total([c(9), c(9), c(0)]).t, 21); assert.equal(G.total([c(12), c(12), c(1)]).t, 22);
let fails = 0;
for (let g = 0; g < 1000; g++) {
  const n = 1 + (g % 8);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 1500; G.tick(s, t);
    if (s.phase === 'play') assert.equal(G.tvView(s).dealer[1], null);   // hole card stays hidden
    if (s.phase === 'results') assert.ok(G.total(s.dealer).t >= 17 || s.players.every(p => G.total(s.hands[p.pid]).t > 21) || G.isBJ(s.dealer));
    Object.values(s.chips).forEach(x => assert.ok(x >= 0));
  }
  if (s.phase !== 'over') fails++;
}
console.log('fails', fails);
process.exit(fails ? 1 : 0);
