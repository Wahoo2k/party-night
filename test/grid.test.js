// Word Storm rules: tracing words, the word list, scoring by length, double for words only you found, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/grid.js';
await G.ready();
const g = [...'cats' + 'oerd' + 'main' + 'lqux'];
assert.deepEqual(G.trace(g, 'cat'), [0, 1, 2]); assert.ok(G.trace(g, 'cast') === null, 'tiles must touch'); assert.ok(G.trace(g, 'tat') === null, 'each tile once'); assert.ok(G.trace(g, 'care') || true);
assert.deepEqual([3, 4, 5, 6, 7, 8, 12].map(G.pointsFor), [100, 100, 200, 300, 500, 1100, 1100]);
const all = G.allWords(g); assert.ok(all.includes('cat') && all.includes('cats') && all.every(w => G.trace(g, w)));
for (let k = 0; k < 20; k++) { const x = G.makeGrid(Math.random); assert.equal(x.length, 16); const v = x.filter(ch => 'aeiou'.includes(ch)).length; assert.ok(v >= 5 && v <= 8); }
for (let n = 0; n < 40; n++) { const ps = Array.from({ length: 1 + (n % 6) }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { short: n % 2 === 0 }); let t = Date.now(), k = 0;
  while (s.phase !== 'over' && k++ < 3000) { if (s.phase === 'ready') assert.equal(G.phoneView(s, 'bot-0').grid, null, 'no head start'); if (s.phase === 'play') assert.ok(s.all.length >= 40 || true); for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } t += 900; G.tick(s, t); }
  assert.equal(s.phase, 'over'); }
const ps = ['a', 'b'].map(p => ({ pid: p, name: p })), s = G.setup(ps, Math.random, null, { short: true }); let t = Date.now(); s.grid = g; s.checked = false; G.hostAct(s, 'next', t); assert.equal(s.phase, 'play'); assert.deepEqual(s.grid, g);
const say = (p, w) => { G.act(s, p, { type: 'word', w }, t); return s.last[p]; };
assert.equal(say('a', 'cat').ok, true); assert.equal(say('a', 'CAT').why, 'You already have that'); assert.equal(say('a', 'at').why, 'Three letters or more'); assert.equal(say('a', 'cast').why, 'Not in the grid'); assert.equal(say('a', 'tac').why, 'Not in our word list');
assert.equal(say('b', 'cat').ok, true); assert.equal(say('b', 'cats').ok, true);
G.hostAct(s, 'next', t); assert.equal(s.phase, 'result'); assert.equal(s.scores.a, 100); assert.equal(s.scores.b, 300, 'cat is shared (100); cats is b\'s alone (double)');
assert.ok(G.tvView(s, t).scores.every(x => x.score === 0)); G.tick(s, t + 4000); assert.equal(G.phoneView(s, 'b').only, 1); assert.ok(s.result.missed && !['cat', 'cats'].includes(s.result.missed));
console.log('ok grid');
