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
  // nobody draws or guesses their own chain's previous entry
  for (const ch of s.chains) for (let k = 1; k < s.steps; k++) assert.notEqual(ch[k].by, ch[k - 1].by);
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
process.exit(fails ? 1 : 0);
