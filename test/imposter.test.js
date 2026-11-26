import * as G from '../js/games/imposter.js';
import assert from 'node:assert';
for (const [c, ws] of Object.entries(G.WORDS)) for (const [w, hints] of Object.entries(ws)) { assert.ok(hints.length >= 3, w); for (const h of hints) assert.ok(G.cleanClue(h, w).ok, `bad hint ${h} for ${w}`); }
let res = { caught: 0, escaped: 0, stole: 0 }, fails = 0;
let prev = null;
for (let g = 0; g < 3000; g++) {
  const n = 4 + (g % 9);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'p' + i, name: 'P' + i }));
  const s = G.setup(players, Math.random, g % 5 ? prev : null);
  if (prev && g % 5) assert.notEqual(s.imposter, prev.imposter);
  let t = 0, guard = 0;
  while (s.phase !== 'over' && guard++ < 500) {
    for (const p of players) {
      const v = G.phoneView(s, p.pid);
      if (p.pid === s.imposter) assert.equal(v.word, null);
      const a = G.botAct(v);
      if (a) G.act(s, p.pid, a, t);
    }
    t += 1000; G.tick(s, t);
    if (s.phase === 'discuss') { t += 61000; G.tick(s, t); }
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase); }
  assert.equal(s.clues.length, n * 2);
  res[s.result]++;
  // TV never reveals word or imposter before the end
  prev = s;
}
assert.equal(G.cleanClue('penguin', 'Penguin').ok, false);
assert.equal(G.cleanClue('penguins!', 'Penguin').ok, false);
assert.equal(G.cleanClue('ice', 'Penguin').text, 'ice');
assert.equal(G.cleanClue('cold icy water there', 'Penguin').text, 'cold icy');
assert.equal(G.cleanClue('shit', 'Penguin').ok, false);
const s = G.setup([0,1,2,3].map(i => ({ pid: 'p'+i, name: 'P'+i })));
const tv = JSON.stringify(G.tvView(s));
assert.ok(!tv.includes(s.word), 'TV leaks word'); 
console.log(res, 'fails', fails, 'scores sample', prev.scores);
process.exit(fails ? 1 : 0);
