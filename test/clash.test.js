import * as G from '../js/games/clash.js';
import assert from 'node:assert';
const d = G.makeDeck(); assert.equal(d.length, 4 * (1 + 2 * 12) + 10); assert.equal(new Set(d.map(c => c.id)).size, d.length);
let fails = 0, total = 0;
for (let g = 0; g < 800; g++) {
  const n = 2 + (g % 9);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) if (Math.random() < 0.97) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 2000; G.tick(s, t);
    // conservation of cards
    const count = s.deck.length + s.discard.length + Object.values(s.hands).reduce((a, h) => a + h.length, 0);
    assert.equal(count, d.length);
  }
  if (s.phase !== 'over') fails++;
  total += guard;
}
// rules: can't play out of turn or an unmatched card
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
const turnPid = s.players[s.turn].pid, other = s.players[1].pid;
const before = s.hands[other].length; G.act(s, other, { type: 'play', id: s.hands[other][0].id }); assert.equal(s.hands[other].length, before);
const top = s.discard.at(-1);
s.hands[turnPid] = [{ id: 900, c: (top.c + 1) % 4, v: top.v === '5' ? '6' : '5' }, { id: 901, c: top.c, v: 'skip' }];
G.act(s, turnPid, { type: 'play', id: 900 }); assert.equal(s.hands[turnPid].length, 2);
G.act(s, turnPid, { type: 'play', id: 901 }); assert.equal(s.hands[turnPid].length, 1); assert.equal(s.players[s.turn].pid, s.players[2].pid);
console.log('fails', fails, 'avg steps', Math.round(total / 800));
process.exit(fails ? 1 : 0);
