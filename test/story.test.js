// Silly Story rules: every blank gets one owner, phones never see the story early, votes pay the writer, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/story.js';
let fails = 0;
for (const [title, text] of G.STORIES) {
  const p = G.parse(text), blanks = p.filter(x => x.blank !== undefined);
  assert.ok(blanks.length >= 9 && blanks.length <= 14, title + ' has ' + blanks.length + ' blanks');
  blanks.forEach(b => assert.ok(G.KINDS[b.kind], title + ': unknown blank ' + b.kind));
  const ls = G.lines(text); assert.ok(ls.length >= 4 && ls.length <= 8, title + ' has ' + ls.length + ' lines');
  assert.equal(ls.flat().filter(x => x.blank !== undefined).length, blanks.length);
  assert.ok(!/[{}]/.test(ls.flat().map(x => x.text || '').join('')), title + ': stray brace');
}
assert.equal(G.cleanWord('   ').ok, false); assert.equal(G.cleanWord('a  big   dog').text, 'a big dog');
for (let g = 0; g < 200; g++) {
  const nP = 2 + (g % 9), players = Array.from({ length: nP }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 4000) {
    if (s.phase === 'fill') { const c = {}; s.owner.forEach(o => (c[o] = (c[o] || 0) + 1)); const n = Object.values(c); assert.ok(Math.max(...n) - Math.min(...n, n.length < nP ? 0 : 99) <= 1 || n.length < nP, 'blanks are shared out evenly'); assert.equal(G.tvView(s, t).lines, undefined, 'the TV keeps the story back'); }
    for (const p of players) { const v = G.phoneView(s, p.pid); if (s.phase === 'fill') assert.ok(!JSON.stringify(v).includes(G.STORIES[s.order[s.i]][0]), 'phones never see the story'); const a = G.botAct(v); if (a) G.act(s, p.pid, a, t); }
    t += 700; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; continue; }
  assert.equal(Object.values(s.scores).reduce((a, b) => a + b, 0) % 100, 0);
}
// two people: words go in, nobody can vote for their own, votes pay the writer, scores wait for the reveal
const ps = [{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }]; const s = G.setup(ps, Math.random, null, { short: true }); const t0 = Date.now();
G.act(s, 'a', { type: 'word', blank: s.owner.indexOf('b'), text: 'cheat' }, t0); assert.ok(s.words.every(w => w === null));
s.owner.forEach((o, k) => G.act(s, o, { type: 'word', blank: k, text: o + k }, t0));
assert.equal(s.phase, 'story'); G.hostAct(s, 'next', t0); assert.equal(s.phase, 'vote');
const ka = s.owner.indexOf('a'), kb = s.owner.indexOf('b');
G.act(s, 'a', { type: 'vote', blank: ka }, t0); assert.equal(s.votes.a, undefined);
assert.ok(G.phoneView(s, 'a').options.every(o => s.owner[o.blank] === 'b'));
G.act(s, 'a', { type: 'vote', blank: kb }, t0); G.act(s, 'b', { type: 'vote', blank: ka }, t0);
assert.equal(s.phase, 'result'); assert.equal(s.scores.a, 100); assert.equal(s.scores.b, 100);
assert.equal(G.tvView(s, t0).scores[0].score, 0); assert.equal(G.phoneView(s, 'a').got, undefined);
G.tick(s, t0 + 4000); assert.equal(G.tvView(s, t0 + 4000).scores[0].score, 100); assert.equal(G.phoneView(s, 'a').got, 1);
// time runs out: empty blanks are filled in and score nothing
const s2 = G.setup(ps, Math.random, null, { short: true }); G.hostAct(s2, 'next', t0); assert.ok(s2.words.every(w => w.auto)); G.hostAct(s2, 'next', t0);
G.act(s2, 'a', { type: 'vote', blank: s2.owner.indexOf('b') }, t0); G.act(s2, 'b', { type: 'vote', blank: s2.owner.indexOf('a') }, t0); assert.equal(s2.scores.a + s2.scores.b, 0);
console.log('fails', fails);
if (fails) process.exit(1);
