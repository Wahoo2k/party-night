import * as G from '../js/games/missions.js';
import assert from 'node:assert';
let fails = 0; const w = { crew: 0, traitors: 0 };
for (let g = 0; g < 1500; g++) {
  const n = 5 + (g % 6);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.9) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++; else w[s.winner]++;
}
// loyal crew can't fail; crew never sees traitors
const ps = [0, 1, 2, 3, 4].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
const loyal = ps.find(p => !s.traitors.includes(p.pid)).pid;
assert.deepEqual(G.phoneView(s, loyal).partners, []);
assert.equal(G.tvView(s).traitors, null);
G.hostAct(s, 'next'); G.hostAct(s, 'next'); ps.forEach(p => G.act(s, p.pid, { type: 'vote', yes: true })); G.hostAct(s, 'next');
assert.equal(s.phase, 'mission');
s.team.forEach(pid => G.act(s, pid, { type: 'play', ok: false }));
assert.equal(s.lastMission.fails, s.team.filter(p => s.traitors.includes(p)).length);
console.log('fails', fails, w);
process.exit(fails ? 1 : 0);
