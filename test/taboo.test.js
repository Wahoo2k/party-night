import * as G from '../js/games/taboo.js';
import { isRude } from '../js/names.js';
import assert from 'node:assert';
for (const c of G.CARDS) { assert.equal(c.length, 5); for (const w of c.slice(1)) assert.ok(!w.toLowerCase().includes(c[0].toLowerCase()), c[0] + '/' + w); }
let fails = 0, prev = null;
for (let g = 0; g < 1500; g++) {
  const n = 4 + (g % 13);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) {
      const v = G.phoneView(s, p.pid);
      // guessers never see the card
      if (s.phase === 'turn' && s.teamOf[p.pid] === s.turn % 2 && !v.isGiver) assert.equal(v.card, undefined);
      const a = G.botAct(v); if (a) G.act(s, p.pid, a, t);
    }
    t += 4000; G.tick(s, t);
  }
  if (s.phase !== 'over') { if (!fails) console.log('stuck', s.phase); fails++; }
  prev = s;
}
// TV never shows the current word
const s = G.setup([0, 1, 2, 3].map(i => ({ pid: 'p' + i, name: 'P' + i })));
G.hostAct(s, 'next', Date.now());
assert.ok(!JSON.stringify(G.tvView(s)).includes(G.CARDS[s.card][0]));
// other team's buzz needs the current card id (stale buzz ignored)
const other = s.players.find(p => s.teamOf[p.pid] !== s.turn % 2).pid;
const before = s.teamScore[0] + s.teamScore[1];
G.act(s, other, { type: 'buzz', card: -1 }, Date.now()); assert.equal(s.teamScore[0] + s.teamScore[1], before);
G.act(s, other, { type: 'buzz', card: s.card }, Date.now()); assert.equal(s.teamScore[0] + s.teamScore[1], before - 1);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
