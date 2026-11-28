// Name That Sound rules: four distinct choices, faster pays more, the answer stays hidden, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/sound.js';
import { SOUNDS } from '../js/games/sound-bank.js';
assert.equal(new Set(SOUNDS.map(s => s[0])).size, SOUNDS.length); SOUNDS.forEach(s => { assert.ok(/^guess-[a-z]+$/.test(s[0])); assert.equal(new Set([s[1], ...s[2]]).size, 4, s[0]); });
assert.equal(G.pointsAt(0), 300); assert.equal(G.pointsAt(G.TIMES.listen), 100);
for (let g = 0; g < 200; g++) { const ps = Array.from({ length: 1 + (g % 9) }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { short: g % 2 === 0 }); let t = Date.now() + 3000, n = 0;
  while (s.phase !== 'over' && n++ < 3000) { if (s.phase === 'listen') assert.ok(!/"answer"|"hint"/.test(JSON.stringify(G.tvView(s, t)))); for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } t += 800; G.tick(s, t); }
  assert.equal(s.phase, 'over'); assert.equal(s.n, s.max); }
const ps = ['a', 'b', 'c'].map(p => ({ pid: p, name: p })), s = G.setup(ps); const t = s.startAt;
G.act(s, 'a', { type: 'pick', i: s.q.answer }, t + 2000); G.act(s, 'a', { type: 'pick', i: (s.q.answer + 1) % 4 }, t + 2500); G.act(s, 'b', { type: 'pick', i: s.q.answer }, t + 12000); G.act(s, 'c', { type: 'pick', i: (s.q.answer + 1) % 4 }, t + 12500);
assert.equal(s.phase, 'reveal'); assert.equal(s.scores.a, G.pointsAt(2000)); assert.ok(s.scores.a > s.scores.b && s.scores.b >= 100); assert.equal(s.scores.c, 0);
assert.ok(G.tvView(s, t).scores.every(x => x.score === 0)); G.tick(s, t + 20000); assert.equal(G.phoneView(s, 'a').got, s.scores.a);
console.log('ok sound');
