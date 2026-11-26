import * as G from '../js/games/cases.js';
import assert from 'node:assert';
let fails = 0, prev = null, deals = 0, finals = 0, total = 0, turns = 0;
for (let g = 0; g < 3000; g++) {
  const n = 2 + (g % 11);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    if (s.phase === 'end') { s.result.how === 'deal' ? deals++ : finals++; total += s.result.won; turns++; }
    t += 2500; G.tick(s, t);
  }
  if (s.phase !== 'over') { if (!fails) console.log('stuck', s.phase); fails++; }
  assert.ok(new Set(s.cases).size === 16);
  prev = s;
}
// offers rise as the game goes on (same values)
const vals = G.VALUES;
assert.ok(G.offerFor(vals, 0) < G.offerFor(vals, 3));
// contestant can't open own case; others can't act for contestant
const s = G.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }]);
const c = s.contestants[0], o = c === 'a' ? 'b' : 'a';
G.act(s, o, { type: 'own', i: 3 }, Date.now()); assert.equal(s.own, null);
G.act(s, c, { type: 'own', i: 3 }, Date.now()); assert.equal(s.own, 3);
G.act(s, c, { type: 'open', i: 3 }, Date.now()); assert.equal(s.opened.length, 0);
console.log('fails', fails, 'deal/final', deals, finals, 'avg win', Math.round(total / turns));
process.exit(fails ? 1 : 0);
