import * as G from '../js/games/meld.js';
import assert from 'node:assert';
assert.equal(G.pointsFor(50, 50), 4); assert.equal(G.pointsFor(59, 50), 3); assert.equal(G.pointsFor(35, 50), 2); assert.equal(G.pointsFor(30, 50), 0);
assert.ok(!G.cleanClue('about 40').ok); assert.ok(G.cleanClue('A warm bath').ok);
let fails = 0;
for (let g = 0; g < 800; g++) {
  const n = 2 + (g % 19);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++;
  assert.equal(s.turns, Math.min(n <= 3 ? n * 2 : n, 8));
}
// humans never see the target unless mind reader; TV doesn't until reveal
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
for (const p of ps) { const v = G.phoneView(s, p.pid); assert.equal(v.target !== undefined, p.pid === s.psychic); }
assert.equal(G.tvView(s).target, undefined);
G.act(s, s.psychic, { type: 'clue', text: 'A warm bath' });
const others = ps.filter(p => p.pid !== s.psychic);
G.act(s, others[0].pid, { type: 'lock', v: s.target }); assert.equal(s.phase, 'guess');
G.act(s, others[1].pid, { type: 'dial', v: 0 }); G.act(s, others[1].pid, { type: 'lock', v: 0 }); assert.equal(s.phase, 'reveal');
assert.equal(s.scores[others[0].pid], 4);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
