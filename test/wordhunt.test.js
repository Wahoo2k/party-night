import * as G from '../js/games/wordhunt.js';
import assert from 'node:assert';
let fails = 0, caught = 0, escaped = 0, lost = 0;
for (let g = 0; g < 800; g++) {
  const n = 4 + (g % 9);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 3000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    if (s.phase === 'ask') for (const p of players) { const v = G.phoneView(s, p.pid); assert.equal(v.word !== undefined, p.pid === s.host || p.pid === s.insider); }
    t += 3000; G.tick(s, t);
    if (s.phase === 'end' && s.result) { s.result.found ? (s.result.caught ? caught++ : escaped++) : lost++; }
  }
  if (s.phase !== 'over') fails++;
}
const ps = [0, 1, 2, 3].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
assert.notEqual(s.host, s.insider);
assert.equal(JSON.stringify(G.tvView(s)).includes(s.options[0].word), false);
console.log('fails', fails, { caught, escaped, lost });
process.exit(fails ? 1 : 0);
