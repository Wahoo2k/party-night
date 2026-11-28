// Last One Standing rules: lives, the mercy rule, ghosts, bonuses, nothing leaks early, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/survive.js';
let fails = 0;
assert.deepEqual([1, 3, 4, 6, 7, 12].map(G.levelOf), [0, 0, 1, 1, 2, 2]); assert.equal(G.pointsFor(7, true), 300); assert.equal(G.pointsFor(7, false), 150);
for (let g = 0; g < 300; g++) {
  const nP = 2 + (g % 11), players = Array.from({ length: nP }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 4000) {
    if (s.phase === 'question') { const v = JSON.stringify(G.tvView(s, t)); assert.ok(!/"answer"|"hint"/.test(v), 'the TV never has the answer early'); assert.equal(G.phoneView(s, 'bot-0').hint !== undefined, true); assert.equal(G.phoneView({ ...s, players: [...s.players, { pid: 'human', name: 'H' }], lives: { ...s.lives, human: 3 }, scores: { ...s.scores, human: 0 } }, 'human').hint, undefined); }
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 900; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; continue; }
  const up = players.filter(p => s.lives[p.pid] > 0);
  assert.ok(up.length >= 1, 'somebody is always left standing'); assert.ok(s.n <= s.max);
  assert.ok(s.bonus.winners.length >= 1 && s.bonus.winners.every(p => s.lives[p] > 0));
  if (up.length === 1) assert.equal(s.bonus.each, G.SURVIVOR);
}
const ps = ['a', 'b', 'c'].map(p => ({ pid: p, name: p.toUpperCase() })); const s = G.setup(ps); let t = Date.now();
const R = () => s.q.answer, W = () => (s.q.answer + 1) % 4;
// a right, b wrong, c silent: b and c lose a life; scores and lives wait for the reveal
G.act(s, 'a', { type: 'pick', i: R() }, t); G.act(s, 'a', { type: 'pick', i: W() }, t); G.act(s, 'b', { type: 'pick', i: W() }, t); G.hostAct(s, 'next', t);
assert.equal(s.phase, 'reveal'); assert.deepEqual([s.lives.a, s.lives.b, s.lives.c], [3, 2, 2]); assert.equal(s.scores.a, 100);
let v = G.tvView(s, t); assert.equal(v.scores.find(x => x.pid === 'a').score, 0); assert.equal(G.phoneView(s, 'b').lives, 3); assert.equal(G.phoneView(s, 'b').answer, undefined);
G.tick(s, t + 4000); assert.equal(G.tvView(s, t + 4000).scores.find(x => x.pid === 'a').score, 100); assert.equal(G.phoneView(s, 'b').lost, true);
// everyone standing misses: nobody loses a life
G.hostAct(s, 'next', t); ps.forEach(p => G.act(s, p.pid, { type: 'pick', i: W() }, t)); assert.equal(s.result.mercy, true); assert.deepEqual([s.lives.a, s.lives.b, s.lives.c], [3, 2, 2]);
// b and c miss twice more and are out; a is the last one standing and takes the bonus
for (let k = 0; k < 2; k++) { G.hostAct(s, 'next', t); G.act(s, 'a', { type: 'pick', i: R() }, t); G.act(s, 'b', { type: 'pick', i: W() }, t); G.act(s, 'c', { type: 'pick', i: W() }, t); }
assert.deepEqual([s.lives.b, s.lives.c], [0, 0]); assert.equal(s.last, true); assert.deepEqual(s.bonus, { winners: ['a'], each: G.SURVIVOR });
G.hostAct(s, 'next', t); assert.equal(s.phase, 'over'); assert.equal(G.phoneView(s, 'a').winner, true);
// a ghost still scores half
const s2 = G.setup(ps.concat([{ pid: 'd', name: 'D' }])); s2.lives.d = 0; G.act(s2, 'd', { type: 'pick', i: s2.q.answer }, t); ['a', 'b', 'c'].forEach(p => G.act(s2, p, { type: 'pick', i: s2.q.answer }, t)); assert.equal(s2.scores.d, 50); assert.equal(s2.scores.a, 100);
console.log('fails', fails);
if (fails) process.exit(1);
