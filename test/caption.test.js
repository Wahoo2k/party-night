// Caption This rules: no voting for yourself, votes pay the writer, the favorite gets a bonus, captions are shown mixed up.
import assert from 'node:assert';
import fs from 'node:fs';
import * as G from '../js/games/caption.js';
assert.equal(new Set(G.PICS.map(p => p[0])).size, G.PICS.length);
G.PICS.forEach(p => assert.ok(fs.existsSync(new URL(`../art/${p[0]}.jpg`, import.meta.url)), 'missing picture art/' + p[0] + '.jpg'));
assert.equal(G.cleanCaption(' ').ok, false); assert.equal(G.cleanCaption('  hello   there ').text, 'hello there');
for (let g = 0; g < 200; g++) { const ps = Array.from({ length: 3 + (g % 8) }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), n = 0;
  while (s.phase !== 'over' && n++ < 3000) { if (s.phase === 'vote') assert.ok(!/"by"/.test(JSON.stringify(G.tvView(s, t))), 'no names while voting'); for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } t += 800; G.tick(s, t); }
  assert.equal(s.phase, 'over'); }
const ps = ['a', 'b', 'c'].map(p => ({ pid: p, name: p })), s = G.setup(ps); let t = Date.now();
ps.forEach(p => G.act(s, p.pid, { type: 'caption', text: 'caption by ' + p.pid }, t)); assert.equal(s.phase, 'vote');
const mine = p => s.order.indexOf(p); G.act(s, 'a', { type: 'vote', k: mine('a') }, t); assert.equal(s.votes.a, undefined);
assert.ok(G.phoneView(s, 'a').options.every(o => !o.text.endsWith(' a')));
G.act(s, 'a', { type: 'vote', k: mine('b') }, t); G.act(s, 'c', { type: 'vote', k: mine('b') }, t); G.act(s, 'b', { type: 'vote', k: mine('a') }, t);
assert.equal(s.phase, 'result'); assert.deepEqual([s.scores.a, s.scores.b, s.scores.c], [100, 300, 0]);
assert.ok(G.tvView(s, t).scores.every(x => x.score === 0)); G.tick(s, t + 4000); assert.equal(G.phoneView(s, 'b').fav, true); assert.equal(G.tvView(s, t).rows[0].by, 'b');
console.log('ok caption');
