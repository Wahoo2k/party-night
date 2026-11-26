import * as G from '../js/games/whosaid.js';
import { isRude } from '../js/names.js';
import assert from 'node:assert';
for (const q of G.QUESTIONS) { assert.ok(q.s.length >= 3); for (const a of q.s) assert.ok(G.cleanAnswer(a).ok, a); }
let fails = 0, prev = null;
for (let g = 0; g < 2000; g++) {
  const n = 3 + (g % 10);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'p' + i, name: 'P' + i }));
  const s = G.setup(players, Math.random, g % 3 ? prev : null);
  let t = 0, guard = 0;
  while (s.phase !== 'over' && guard++ < 400) {
    for (const p of players) {
      const v = G.phoneView(s, p.pid);
      if (s.phase === 'guess') assert.ok(!v.options.some(o => o.pid === p.pid));
      const a = G.botAct(v); if (a) G.act(s, p.pid, a, t);
    }
    t += 7000; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase); }
  assert.equal(s.items.length, Math.min(12, n * 2));
  // authors spread: first n items are all different people
  assert.equal(new Set(s.items.slice(0, n).map(i => i.pid)).size, Math.min(n, s.items.length));
  prev = s;
}
// TV never shows author during guessing
const s = G.setup([0,1,2].map(i => ({ pid: 'p'+i, name: 'Name'+i })));
['p0','p1','p2'].forEach(p => G.act(s, p, { type: 'answers', list: ['x '+p, 'y '+p] }, 0));
assert.equal(s.phase, 'guess');
assert.ok(!('author' in G.tvView(s)));
assert.ok(!G.cleanAnswer('fuck off').ok);
console.log('fails', fails, 'awards', JSON.stringify(G.tvView(prev).awards));
process.exit(fails ? 1 : 0);
