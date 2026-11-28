import * as G from '../js/games/sketch.js';
import assert from 'node:assert';
assert.equal(new Set(G.PROMPTS).size, G.PROMPTS.length);
// stroke cleaning caps and clamps
const big = G.cleanStrokes([{ c: 99, w: -3, p: Array(20000).fill(999) }, 'junk', { c: 1, w: 1, p: [1] }]);
assert.equal(big.length, 1); assert.equal(big[0].c, 7); assert.equal(big[0].w, 0); assert.ok(big[0].p.length <= 6000 && big[0].p.every(x => x === 255));
assert.ok(!G.cleanText('x').ok);
let fails = 0;
for (let g = 0; g < 600; g++) {
  const nP = 3 + (g % 8);
  const players = Array.from({ length: nP }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players);
  let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) { if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } }
    t += 3000; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; continue; }
  // every chain complete, alternating kinds, and each player handled each step once
  assert.equal(s.chains.length, nP);
  for (const ch of s.chains) { assert.equal(ch.length, s.steps); ch.forEach((e, k) => assert.equal(e.kind, k % 2 ? 'draw' : 'text')); }
  for (let k = 0; k < s.steps; k++) assert.equal(new Set(s.chains.map(ch => ch[k].by)).size, nP);
  // the owner picks the idea and draws it; after that nobody draws or guesses the entry they made just before
  for (const ch of s.chains) { assert.equal(ch[1].by, ch[0].by); for (let k = 2; k < s.steps; k++) assert.notEqual(ch[k].by, ch[k - 1].by); assert.equal(new Set(ch.slice(1).map(e => e.by)).size, ch.length - 1); }
  G.tvView(s); players.forEach(p => G.phoneView(s, p.pid));
}
// timeouts: nobody acts -> drafts or fallbacks fill everything
const ps = [0, 1, 2, 3].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps); let t = Date.now();
G.act(s, 'p0', { type: 'draft', text: 'A half typed idea' }, t);
for (let i = 0; i < 400 && s.phase !== 'over'; i++) { t += 5000; G.tick(s, t); }
assert.equal(s.phase, 'over');
assert.ok(s.chains.some(ch => ch[0].text === 'A half typed idea'));
// guessers see the drawing but never the words before it (humans)
const s2 = G.setup(ps); ps.forEach(p => G.act(s2, p.pid, { type: 'text', text: 'Secret phrase ' + p.pid }));
ps.forEach(p => G.act(s2, p.pid, { type: 'draw', strokes: [{ c: 1, w: 1, p: [1, 2, 3, 4] }] }));
assert.equal(s2.phase, 'guess');
ps.forEach(p => assert.ok(!JSON.stringify(G.phoneView(s2, p.pid)).includes('Secret phrase')));
console.log('fails', fails);
// The twists: "from memory" is pick, draw, then drawings copied from a look, then one final guess.
{
  const G = await import('../js/games/sketch.js');
  for (const mode of ['memory', 'ink', 'squiggle']) for (let n = 3; n <= 8; n++) {
    const ps = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { mode }); let t = Date.now(), guard = 0;
    while (!['reveal', 'over'].includes(s.phase) && guard++ < 500) {
      for (const p of ps) { const v = G.phoneView(s, p.pid);
        if (mode === 'memory' && v.phase === 'draw' && !v.done) { if (s.step === 1) { if (!v.task || v.look) throw new Error('first drawing is from words'); } else if (!v.look || v.task) throw new Error('later drawings are from a look'); }
        if (mode === 'squiggle' && v.phase === 'draw' && !v.done && !(v.start?.length >= 2)) throw new Error('no squiggle');
        if (mode === 'ink' && v.phase === 'draw' && !v.done && !v.ink) throw new Error('no ink flag');
        const a = G.botAct(v); if (a) G.act(s, p.pid, a, t); }
      t += 1000; G.tick(s, t);
    }
    if (s.phase !== 'reveal') throw new Error(mode + ' did not reach the reveal');
    if (mode === 'memory') { const kinds = s.chains[0].map(e => e.kind).join(); if (kinds !== ['text', ...Array(s.steps - 2).fill('draw'), 'text'].join()) throw new Error('memory chain was ' + kinds); }
  }
  if (JSON.stringify(G.squiggle(5)) !== JSON.stringify(G.squiggle(5))) throw new Error('squiggle should repeat for a seed');
  console.log('twists ok');
}

process.exit(fails ? 1 : 0);
