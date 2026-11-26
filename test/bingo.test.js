import * as G from '../js/games/bingo.js';
import assert from 'node:assert';
// cards: right columns, unique, free center
for (let k = 0; k < 500; k++) {
  const c = G.makeCard('numbers', Math.random);
  assert.equal(c[12], null); assert.equal(new Set(c).size, 25);
  c.forEach((v, i) => { if (v !== null) { const col = i % 5; assert.ok(v > col * 15 && v <= col * 15 + 15); } });
  const p = G.makeCard('pictures', Math.random); assert.equal(new Set(p).size, 25);
}
const card = G.makeCard('numbers', Math.random);
assert.ok(G.hasPattern(card, new Set([card[0], card[1], card[2], card[3], card[4]]), 'line'));
assert.ok(G.hasPattern(card, new Set([card[0], card[6], card[18], card[24]]), 'line'));   // diagonal through free space
assert.ok(!G.hasPattern(card, new Set([card[0], card[1], card[2], card[3]]), 'line'));
assert.ok(G.hasPattern(card, new Set([card[0], card[4], card[20], card[24]]), 'corners'));
let fails = 0, calls = { line: 0, corners: 0, blackout: 0 }, prev = null;
for (let g = 0; g < 600; g++) {
  const n = 2 + (g % 25);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  let t = 0;
  G.hostAct(s, g % 2 ? 'numbers' : 'pictures', t);
  let guard = 0, lastRound = -1;
  while (s.phase !== 'over' && guard++ < 5000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    if (s.phase === 'roundEnd' && s.round !== lastRound) { calls[G.PATTERNS[s.round].id] += s.called.length; lastRound = s.round; }
    t += 7000; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase); }
  prev = s;
}
// false claim rejected
const s = G.setup([{ pid: 'tom', name: 'T' }, { pid: 'bot-1', name: 'B' }]); G.hostAct(s, 'numbers', 0); G.tick(s, 5000);
G.act(s, 'tom', { type: 'bingo' }, 5001); assert.equal(s.phase, 'calling'); assert.equal(s.falseClaims.tom, 1);
console.log('fails', fails, 'avg calls to win', Object.fromEntries(Object.entries(calls).map(([k, v]) => [k, (v / 600).toFixed(1)])));
process.exit(fails ? 1 : 0);
