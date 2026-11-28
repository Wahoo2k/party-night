// Doodle Dash rules: judging guesses, falling points, the word never leaks, the artist is paid per guesser, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/dash.js';
assert.equal(new Set(G.WORDS).size, G.WORDS.length); assert.ok(G.WORDS.length >= 150);
assert.equal(G.judge('Cats', 'cat'), 'right'); assert.equal(G.judge('ice-cream!', 'ice cream'), 'right'); assert.equal(G.judge('girafe', 'giraffe'), 'close'); assert.equal(G.judge('dog', 'cat'), 'wrong'); assert.equal(G.judge('soccer', 'soccer ball'), 'close'); assert.equal(G.judge('', 'cat'), 'wrong');
assert.equal(G.pointsAt(0), 300); assert.equal(G.pointsAt(G.TIMES.draw), 100); assert.ok(G.pointsAt(35000) < 300 && G.pointsAt(35000) > 100);
assert.equal(G.hint('ice cream', 0).join(''), '___ _____'); assert.equal(G.hint('giraffe', 0.6).filter(c => c !== '_').length, 1); assert.equal(G.hint('giraffe', 0.8).filter(c => c !== '_').length, 2);
for (let g = 0; g < 150; g++) {
  const ps = Array.from({ length: 3 + (g % 8) }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i })), s = G.setup(ps, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), n = 0;
  while (s.phase !== 'over' && n++ < 6000) {
    if (s.phase === 'draw') { assert.ok(!JSON.stringify(G.tvView(s, t)).includes('"' + s.word + '"'), 'the TV never shows the word while drawing'); }
    for (const p of ps) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); } t += 900; G.tick(s, t);
  }
  assert.equal(s.phase, 'over');
}
const ps = ['a', 'b', 'c', 'd'].map(p => ({ pid: p, name: p })), s = G.setup(ps); let t = Date.now(); const art = s.order[0], others = ps.map(p => p.pid).filter(p => p !== art);
assert.equal(G.phoneView(s, others[0]).choices, undefined); G.act(s, others[0], { type: 'word', i: 0 }, t); assert.equal(s.phase, 'pick');
G.act(s, art, { type: 'word', i: 1 }, t); assert.equal(s.phase, 'draw'); const w = s.word;
assert.equal(G.phoneView(s, art).word, w); assert.ok(!JSON.stringify(G.phoneView(s, others[0])).includes(w));
G.act(s, art, { type: 'draft', strokes: [{ c: 1, w: 1, p: [1, 2, 3, 4] }] }, t); assert.equal(G.tvView(s, t).strokes.length, 1);
G.act(s, others[0], { type: 'draft', strokes: [] }, t); assert.equal(s.strokes.length, 1, 'only the artist draws');
G.act(s, art, { type: 'guess', text: w }, t); assert.equal(Object.keys(s.got).length, 0, 'the artist cannot guess');
G.act(s, others[0], { type: 'guess', text: 'zzzz' }, t + 1000); assert.equal(G.phoneView(s, others[0]).last, 'wrong'); assert.equal(G.tvView(s, t).feed[0].text, 'zzzz');
G.act(s, others[0], { type: 'guess', text: w.toUpperCase() }, t + 2000); assert.equal(s.got[others[0]].pts, G.pointsAt(2000));
G.act(s, others[0], { type: 'guess', text: w }, t + 3000); assert.equal(s.feed.length, 2);
G.act(s, others[1], { type: 'guess', text: w }, t + 40000); assert.equal(s.phase, 'draw');
G.hostAct(s, 'next', t + 70000); assert.equal(s.phase, 'result'); assert.equal(s.scores[art], 100); assert.equal(s.scores[others[2]], 0);
assert.equal(G.tvView(s, t).scores.every(x => x.score === 0), true); assert.equal(G.phoneView(s, art).word, undefined);
G.tick(s, t + 73000); assert.equal(G.phoneView(s, art).pts, 100); assert.equal(G.tvView(s, t).word, w);
console.log('ok dash');
