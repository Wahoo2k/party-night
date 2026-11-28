// Gold Rush rules: chests only for right answers, stealing and swapping, nothing leaks, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/gold.js';
const seq = (...xs) => { let i = 0; return () => xs[Math.min(i++, xs.length - 1)]; };
assert.equal(G.roll(() => 0), 'gold'); assert.equal(G.roll(() => 0.55), 'jackpot'); assert.equal(G.roll(() => 0.65), 'hole'); assert.equal(G.roll(() => 0.75), 'steal'); assert.equal(G.roll(() => 0.95), 'swap');
for (let g = 0; g < 300; g++) {
  const ps = Array.from({ length: 2 + (g % 9) }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), n = 0;
  while (s.phase !== 'over' && n++ < 4000) {
    if (s.phase === 'ask') assert.ok(!/"answer"|"hint"/.test(JSON.stringify(G.tvView(s, t))));
    const total = Object.values(s.scores).reduce((a, b) => a + b, 0);
    for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } t += 800; G.tick(s, t);
    assert.ok(Object.values(s.scores).every(x => x >= 0), 'nobody goes below zero');
  }
  assert.equal(s.phase, 'over');
}
const ps = ['a', 'b', 'c'].map(p => ({ pid: p, name: p })); let t = Date.now();
const start = gold => { const s = G.setup(ps); Object.assign(s.scores, gold); return s; };
const answer = (s, right) => ps.forEach(p => G.act(s, p.pid, { type: 'pick', i: right.includes(p.pid) ? s.q.answer : (s.q.answer + 1) % 4 }, t));
// a wrong answer gets no chest; a gold chest pays
let s = start({ a: 0, b: 400, c: 0 }); answer(s, ['a']); assert.equal(s.phase, 'chest'); assert.equal(G.phoneView(s, 'b').canOpen, undefined);
G.act(s, 'b', { type: 'chest', i: 0 }, t); assert.equal(s.chests.b, undefined);
G.act(s, 'a', { type: 'chest', i: 1 }, t, seq(0, 0.5)); assert.equal(s.phase, 'reveal'); assert.equal(s.scores.a, 300);
assert.equal(G.tvView(s, t).scores.find(x => x.pid === 'a').score, 0); assert.equal(G.phoneView(s, 'a').delta, undefined);
G.tick(s, t + 9000); assert.equal(G.phoneView(s, 'a').delta, 300);
// steal: choose who; takes a quarter (at least 100)
s = start({ a: 0, b: 1000, c: 200 }); answer(s, ['a']); G.act(s, 'a', { type: 'chest', i: 0 }, t, seq(0.75)); assert.equal(s.phase, 'chest');
assert.deepEqual(G.phoneView(s, 'a').targets.map(x => x.pid), ['b', 'c']); G.act(s, 'a', { type: 'target', pid: 'a' }, t); assert.equal(s.phase, 'chest');
G.act(s, 'a', { type: 'target', pid: 'b' }, t); assert.equal(s.phase, 'reveal'); assert.deepEqual([s.scores.a, s.scores.b], [250, 750]);
G.tick(s, t + 9000); assert.equal(G.phoneView(s, 'b').robbed[0].by, 'a');
// steal from someone with nothing: a small find instead; no target in time goes for the richest
s = start({ a: 0, b: 0, c: 0 }); answer(s, ['a']); G.act(s, 'a', { type: 'chest', i: 0 }, t, seq(0.75)); G.hostAct(s, 'next', t); assert.equal(s.scores.a, 100);
s = start({ a: 0, b: 300, c: 900 }); answer(s, ['a']); G.act(s, 'a', { type: 'chest', i: 0 }, t, seq(0.75)); G.hostAct(s, 'next', t); assert.deepEqual([s.scores.a, s.scores.c], [230, 670]);
// swap, or keep your own; a hole costs a quarter
s = start({ a: 100, b: 900, c: 0 }); answer(s, ['a', 'b']); G.act(s, 'a', { type: 'chest', i: 0 }, t, seq(0.95)); G.act(s, 'b', { type: 'chest', i: 2 }, t + 5, seq(0.65)); G.act(s, 'a', { type: 'target', pid: 'b' }, t + 9);
assert.equal(s.phase, 'reveal'); assert.deepEqual([s.scores.a, s.scores.b], [900, 70]);   // in opening order: a swaps first, then the hole takes a quarter of what b has left
s = start({ a: 500, b: 100, c: 0 }); answer(s, ['a']); G.act(s, 'a', { type: 'chest', i: 0 }, t, seq(0.95)); G.act(s, 'a', { type: 'target', pid: null }, t); assert.equal(s.phase, 'reveal'); assert.equal(s.scores.a, 500);
// nobody right: straight to the reveal with no chests
s = start({}); answer(s, []); assert.equal(s.phase, 'reveal'); assert.equal(s.events.length, 0);
console.log('ok gold');
