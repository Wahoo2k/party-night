import * as G from '../js/games/bluff.js';
import { FACTS } from '../js/games/bluff-facts.js';
import { isRude } from '../js/names.js';
import assert from 'node:assert';
for (const f of FACTS) { assert.equal((f.q.match(/____/g) || []).length, 1, f.q); assert.ok(f.decoys.length >= 3, f.q); for (const d of f.decoys) assert.ok(G.cleanLie(d, f).ok, 'decoy rejected: ' + d + ' / ' + f.q); assert.ok(!G.cleanLie(f.a, f).ok, 'truth accepted ' + f.a); assert.ok(!isRude(f.a), 'rude answer ' + f.a); }
let fails = 0, prev = null;
for (let g = 0; g < 1500; g++) {
  const n = 3 + (g % 8);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'p' + i, name: 'P' + i }));
  const s = G.setup(players, Math.random, prev);
  let t = 0, guard = 0;
  while (s.phase !== 'over' && guard++ < 400) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    if (s.phase === 'pick') for (const p of players) { const v = G.phoneView(s, p.pid); assert.ok(v.options.length >= 2); assert.ok(v.options.every(o => !s.options.find(x => x.id === o.id).authors.includes(p.pid))); }
    t += 4000; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase); }
  const total = Object.values(s.scores).reduce((a, b) => a + b, 0);
  assert.ok(total >= 0);
  prev = s;
}
// truth check variants
const f = FACTS.find(x => x.a === 'cubes');
assert.ok(!G.cleanLie('Cube', f).ok); assert.ok(!G.cleanLie('squares', f).ok); assert.ok(G.cleanLie('triangles', f).ok);
const s = G.setup([0,1,2].map(i => ({ pid: 'p'+i, name: 'P'+i })));
assert.ok(!JSON.stringify(G.tvView(s)).includes('"answer"'));
assert.ok(!JSON.stringify(G.phoneView(s, 'p0')).includes(FACTS[s.facts[0]].a) || FACTS[s.facts[0]].q.includes(FACTS[s.facts[0]].a));
console.log('facts', FACTS.length, 'fails', fails, 'sample scores', prev.scores);
process.exit(fails ? 1 : 0);
