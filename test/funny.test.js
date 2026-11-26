import * as G from '../js/games/funny.js';
import { isRude } from '../js/names.js';
import assert from 'node:assert';
for (const p of [...G.PROMPTS, ...G.FINALS]) assert.ok(!isRude(p), p);
let fails = 0, prev = null;
for (let g = 0; g < 2000; g++) {
  const n = 3 + (g % 8);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  // everyone has exactly two prompts, never against themselves
  s.matchups.forEach(m => assert.notEqual(m.a, m.b));
  players.forEach(p => assert.equal(s.matchups.filter(m => m.a === p.pid || m.b === p.pid).length, 2));
  let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 1000) {
    for (const p of players) for (let k = 0; k < 2; k++) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 7000; G.tick(s, t);
  }
  if (s.phase !== 'over') { if (!fails) console.log('stuck', s.phase); fails++; }
  prev = s;
}
// authors can't vote on their own matchup
const s = G.setup([0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i })));
s.matchups.forEach((m, i) => { G.act(s, m.a, { type: 'answer', m: i, text: 'a' + i }, Date.now()); G.act(s, m.b, { type: 'answer', m: i, text: 'b' + i }, Date.now()); });
assert.equal(s.phase, 'vote');
const m = s.matchups[0]; G.act(s, m.a, { type: 'vote', pick: m.b }, Date.now()); assert.equal(Object.keys(m.votes).length, 0);
assert.ok(!G.cleanAnswer('shit happens').ok);
console.log('fails', fails, 'sample', JSON.stringify(prev.scores));
process.exit(fails ? 1 : 0);
