import * as G from '../js/games/letters.js';
import assert from 'node:assert';
const players = [0, 1, 2, 3].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(players);
const L = s.letters[0];
const words = c => s.cats.map(() => c);
G.act(s, 'p0', { type: 'answers', list: [L + 'pple', L + 'xx', 'zzz', '', L + 'og', 'the ' + L + 'og'], final: true }, Date.now());
G.act(s, 'p1', { type: 'answers', list: [L.toLowerCase() + 'pples', L + 'yy', '', '', L + 'at', L + 'og'], final: true }, Date.now());
G.act(s, 'p2', { type: 'answers', list: ['', '', '', '', '', ''], final: true }, Date.now());
assert.equal(s.phase, 'write');
G.act(s, 'p3', { type: 'answers', list: ['', '', '', '', '', ''], final: true }, Date.now());
assert.equal(s.phase, 'review');
assert.equal(G.judge(s, 0, 'p0'), 'dupe');      // Apple vs apples
assert.equal(G.judge(s, 1, 'p0'), 'ok');
assert.equal(G.judge(s, 2, 'p0'), L === 'Z' ? 'ok' : 'letter');
assert.equal(G.judge(s, 3, 'p0'), 'blank');
assert.equal(G.judge(s, 5, 'p0'), 'dupe');      // "the Xog" vs "Xog"
// veto: majority of the 3 other players
s.c = 1; G.act(s, 'p1', { type: 'veto', who: 'p0' }); assert.equal(G.judge(s, 1, 'p0'), 'ok');
G.act(s, 'p2', { type: 'veto', who: 'p0' }); assert.equal(G.judge(s, 1, 'p0'), 'veto');
G.act(s, 'p2', { type: 'veto', who: 'p0' }); assert.equal(G.judge(s, 1, 'p0'), 'ok');   // toggles off
let fails = 0;
for (let g = 0; g < 1500; g++) {
  const n = 2 + (g % 11);
  const ps = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const st = G.setup(ps);
  let t = Date.now(), guard = 0;
  while (st.phase !== 'over' && guard++ < 1000) {
    for (const p of ps) { const a = G.botAct(G.phoneView(st, p.pid)); if (a) G.act(st, p.pid, a, t); }
    t += 5000; G.tick(st, t);
  }
  if (st.phase !== 'over') { if (!fails) console.log('stuck', st.phase); fails++; }
}
console.log('fails', fails);
process.exit(fails ? 1 : 0);
