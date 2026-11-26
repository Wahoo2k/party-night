import * as G from '../js/games/shade.js';
import assert from 'node:assert';
assert.ok(!G.cleanClue('Light blue').ok); assert.ok(!G.cleanClue('reddish').ok); assert.ok(!G.cleanClue('swimming pool party').ok); assert.ok(G.cleanClue('Ketchup').ok); assert.ok(G.cleanClue('Swimming pool').ok);
assert.equal(G.dist({ x: 0, y: 3 }, { x: G.COLS - 1, y: 3 }), 1);   // hue wraps
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
}
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
ps.forEach(p => assert.equal(G.phoneView(s, p.pid).options !== undefined, p.pid === s.giver));
G.act(s, s.giver, { type: 'clue', i: 1, text: 'Ketchup' });
assert.equal(s.phase, 'guess'); assert.equal(G.tvView(s).target, undefined);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
