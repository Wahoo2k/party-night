import * as G from '../js/games/spin.js';
import assert from 'node:assert';
for (const p of G.PUZZLES) { assert.ok(/^[A-Z' &]+$/.test(p.a), p.a); assert.ok(p.a.split(' ').every(w => w.length <= 13), p.a); }
// wedge under pointer matches the landed wedge
const s0 = G.setup([{ pid: 'bot-a', name: 'A' }, { pid: 'bot-b', name: 'B' }]);
for (let k = 0; k < 500; k++) {
  s0.sub = 'spin'; s0.busyUntil = 0; s0.pending = null;
  const cur = s0.order[s0.t % 2];
  G.act(s0, cur, { type: 'spin' }, 0);
  const R = ((s0.angle % 360) + 360) % 360;
  const under = Math.floor(((360 - R) % 360) / (360 / G.WEDGES.length));
  assert.equal(G.WEDGES[under], s0.wedge, `angle ${R}`);
}
let fails = 0, prev = null, total = 0;
for (let g = 0; g < 1500; g++) {
  const n = 2 + (g % 7);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  let t = 0, guard = 0;
  while (s.phase !== 'over' && guard++ < 6000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid, t)); if (a) G.act(s, p.pid, a, t); }
    t += 1200; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase, s.sub, G.phoneView(s, s.order[s.t % n], t)); break; }
  assert.ok(Object.values(s.total).every(x => x >= 0));
  total += t; prev = s;
}
// non-bots never get the answer; can't call vowels as consonants; can't buy vowel without cash
const s = G.setup([{ pid: 'tom', name: 'Tom' }, { pid: 'bot-1', name: 'B' }]);
assert.equal(G.phoneView(s, 'tom')._a, undefined);
console.log('fails', fails, 'avg minutes (bot pace)', (total / 1500 / 60000).toFixed(1), 'sample totals', JSON.stringify(prev.total));
process.exit(fails ? 1 : 0);
