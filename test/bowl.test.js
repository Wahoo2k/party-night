import * as G from '../js/games/bowl.js';
import assert from 'node:assert';
let fails = 0, prev = null;
for (let g = 0; g < 1200; g++) {
  const n = 4 + (g % 17);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 4000) {
    for (const p of players) if (Math.random() < 0.95) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 2500; G.tick(s, t);
  }
  if (s.phase !== 'over') { if (!fails) console.log('stuck', s.phase, s.round); fails++; }
  // every name got guessed once per round
  else assert.equal(s.teamScore[0] + s.teamScore[1], s.names.length * 3);
  prev = s;
}
// guessers never see the card; stale taps are ignored
const ps = [0, 1, 2, 3].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps); ps.forEach(p => G.act(s, p.pid, { type: 'names', names: ['Santa Claus', 'santa claus', 'A Pirate'] }));
assert.equal(s.phase, 'ready'); assert.ok(s.names.length >= 10);
assert.equal(s.names.filter(x => x.toLowerCase().includes('santa')).length, 1);
G.hostAct(s, 'next');
for (const p of ps) { const v = G.phoneView(s, p.pid); assert.equal(v.card !== undefined, v.isGiver); }
const giver = ps.find(p => G.phoneView(s, p.pid).isGiver).pid;
const c = s.card; G.act(s, giver, { type: 'got', card: c }); G.act(s, giver, { type: 'got', card: c });
assert.equal(s.teamScore[0] + s.teamScore[1], 1);
console.log('fails', fails);
process.exit(fails ? 1 : 0);
