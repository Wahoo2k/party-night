import * as G from '../js/games/agents.js';
import assert from 'node:assert';
assert.equal(new Set(G.WORDS).size, G.WORDS.length, 'dupe words');
assert.ok(G.WORDS.length >= 100);
// clue rules
const board = ['Moon', 'Sun', 'Star'];
assert.ok(!G.cleanClue('Moonlight', board).ok);
assert.ok(!G.cleanClue('two words', ['x']).ok === false); // first word only is used
assert.ok(!G.cleanClue('123', board).ok);
assert.ok(G.cleanClue('Space', board).ok);
let fails = 0, prev = null; const out = { trap: 0, found: 0 };
for (let g = 0; g < 1500; g++) {
  const n = 4 + (g % 13);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, prev);
  assert.equal(s.key.filter(k => k === 0).length + s.key.filter(k => k === 1).length, 17);
  assert.equal(s.key.filter(k => k === 'x').length, 1);
  let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
  }
  if (s.phase !== 'over') { if (!fails) console.log('stuck', s.phase); fails++; } else out[s.why]++;
  prev = s;
}
// real players never see the key unless spymaster; TV never shows it mid-game
const ps = [0, 1, 2, 3, 4].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
const guesser = ps.find(p => !s.spy.includes(p.pid)).pid;
assert.ok(G.phoneView(s, guesser).board.every(b => b.k === null));
assert.ok(G.phoneView(s, s.spy[0]).board.every(b => b.k !== null));
assert.ok(G.tvView(s).board.every(b => b.k === null));
// only the spymaster on turn can clue; guesses only by guessers on turn
G.act(s, s.spy[1 - s.turn], { type: 'clue', word: 'Zap', n: 2 }); assert.equal(s.phase, 'clue');
G.act(s, s.spy[s.turn], { type: 'clue', word: 'Zap', n: 2 }); assert.equal(s.phase, 'guess'); assert.equal(s.guessesLeft, 3);
const offTeam = ps.find(p => s.teamOf[p.pid] !== s.turn).pid;
G.act(s, offTeam, { type: 'vote', i: 0 }); assert.ok(!s.revealed[0]);
console.log('fails', fails, out);
process.exit(fails ? 1 : 0);
