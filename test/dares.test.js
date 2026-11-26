import * as G from '../js/games/dares.js';
import assert from 'node:assert';
let fails = 0;
for (let g = 0; g < 300; g++) {
  const n = 3 + (g % 18);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 2000; G.tick(s, t);
    for (const p of players) assert.equal(s.hands[p.pid].length, 3);
    const held = Object.values(s.hands).flat(); if (n * 3 <= G.MISSIONS.length) assert.equal(new Set(held).size, held.length);
  }
  if (s.phase !== 'over') fails++;
}
// a claim counts unless half the others cry foul
const ps = [0, 1, 2, 3, 4].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps); const t0 = Date.now();
const m = s.hands.p0[0]; G.act(s, 'p0', { type: 'done', m }, t0);
const id = s.claims[0].id; G.act(s, 'p1', { type: 'foul', id }, t0); G.act(s, 'p2', { type: 'foul', id }, t0);
G.tick(s, t0 + 20000); assert.equal(s.scores.p0, 0);
const m2 = s.hands.p0[0]; G.act(s, 'p0', { type: 'done', m: m2 }, t0 + 21000); G.act(s, 'p1', { type: 'foul', id: s.claims[0].id }, t0 + 21000);
G.tick(s, t0 + 40000); assert.equal(s.scores.p0, G.MISSIONS[m2][0]);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
