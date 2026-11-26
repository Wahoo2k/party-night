import * as G from '../js/games/hearts.js';
import assert from 'node:assert';
let fails = 0, moons = 0;
for (let g = 0; g < 400; g++) {
  const players = Array.from({ length: 4 }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 6000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 2000; G.tick(s, t);
    const n = Object.values(s.hands).reduce((a, h) => a + h.length, 0) + Object.values(s.taken).reduce((a, h) => a + h.length, 0) + s.trick.length;
    assert.equal(n, 52);
    if (s.phase === 'handEnd') { assert.equal(Object.values(s.handPts).reduce((a, b) => a + b, 0), s.moon ? 78 : 26); if (s.moon) moons++; }
  }
  if (s.phase !== 'over') fails++;
}
// must follow suit
const ps = [0, 1, 2, 3].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
G.hostAct(s, 'next');   // pass for everyone
assert.equal(s.phase, 'play');
const lead = s.players[s.turn].pid;
assert.deepEqual(G.legal(s, lead).map(c => `${c.s}${c.r}`), ['31']);   // 2 of clubs leads
console.log('fails', fails, 'moons', moons);
process.exit(fails ? 1 : 0);
