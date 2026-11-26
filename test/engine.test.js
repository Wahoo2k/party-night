import * as W from '../js/games/werewolf.js';
import assert from 'node:assert';
let fails = 0;
const games = { V: 0, W: 0 };
for (let g = 0; g < 2000; g++) {
  const n = 5 + (g % 12);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'p' + i, name: 'P' + i }));
  let t = 0;
  const s = W.setup(players);
  assert.equal(s.players.filter(p => p.role === 'W').length, n <= 6 ? 1 : n <= 10 ? 2 : 3);
  s.players.forEach(p => W.act(s, p.pid, { type: 'ready' }, t));
  assert.equal(s.phase, 'night');
  let guard = 0;
  while (s.phase !== 'over' && guard++ < 200) {
    for (const p of s.players) {
      const v = W.phoneView(s, p.pid);
      if (s.phase === 'night' && v.options && !v.saw) W.act(s, p.pid, { type: 'pick', target: v.options[Math.random() * v.options.length | 0].pid }, t);
      if (s.phase === 'vote' && v.options) W.act(s, p.pid, { type: 'vote', target: Math.random() < .1 ? 'skip' : v.options[Math.random() * v.options.length | 0].pid }, t);
      // TV view never leaks living roles
      const tv = W.tvView(s, t);
      if (s.phase !== 'over') tv.players.forEach((x, i) => { if (x.role && s.players[i].alive) fails++; });
    }
    t += 20000; W.tick(s, t);          // night min time passes / verdict times out
    if (s.phase === 'day') { t += 200000; W.tick(s, t); }
    // votes are cast on the next loop pass; all-in resolves the vote
    if (s.phase === 'verdict') { t += 20000; W.tick(s, t); }
  }
  if (s.phase !== 'over') { fails++; console.log('stuck', s.phase); }
  const a = s.players.filter(p => p.alive), w = a.filter(p => p.role === 'W').length;
  assert.ok(s.winner === 'V' ? w === 0 : w >= a.length - w);
  games[s.winner]++;
  if (g === 0) { console.log(s.log.join('\n')); console.log(JSON.stringify(W.phoneView(s, 'p0'))); }
}
// seer only sees once, wolves cannot target wolves
{
  const s = W.setup([0,1,2,3,4,5,6].map(i => ({ pid: 'p' + i, name: 'P' + i })));
  W.hostAct(s, 'next', 0);
  const seer = s.players.find(p => p.role === 'S'), wolf = s.players.find(p => p.role === 'W');
  const other = s.players.find(p => p.role === 'V');
  W.act(s, seer.pid, { type: 'pick', target: wolf.pid }, 0);
  W.act(s, seer.pid, { type: 'pick', target: other.pid }, 0);
  assert.equal(W.phoneView(s, seer.pid).saw.wolf, true);
  const w2 = s.players.filter(p => p.role === 'W')[1];
  W.act(s, wolf.pid, { type: 'pick', target: w2.pid }, 0);
  assert.equal(s.night.picks[wolf.pid], undefined);
}
console.log('wins', games, 'fails', fails);
process.exit(fails ? 1 : 0);
