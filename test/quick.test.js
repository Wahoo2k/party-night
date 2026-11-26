import * as G from '../js/games/quick.js';
import assert from 'node:assert';
let fails = 0, prev = null;
for (let g = 0; g < 2000; g++) {
  const n = 3 + (g % 18);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  assert.deepEqual(s.rounds.map(r => r.kind).slice(0, 3), ['hot', 'wyr', 'mlt']);
  let t = 0, guard = 0;
  while (s.phase !== 'over' && guard++ < 500) {
    for (const p of players) for (let k = 0; k < 2; k++) { const v = G.phoneView(s, p.pid); if (s.phase === 'vote' && v.kind === 'mlt' && n > 2) assert.ok(v.self >= 0); const a = G.botAct(v); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase); }
  prev = s;
}
// can't vote for yourself in Most Likely To
const s = G.setup([0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i })));
while (G.phoneView(s, 'p0').kind !== 'mlt') G.hostAct(s, 'next', 0), G.hostAct(s, 'next', 0);
const self = G.phoneView(s, 'p0').self; G.act(s, 'p0', { type: 'pick', i: self }, 0); assert.equal(s.picks.p0, undefined);
console.log('fails', fails, 'titles sample', JSON.stringify(G.tvView(prev).titles));
process.exit(fails ? 1 : 0);
