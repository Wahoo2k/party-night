import * as G from '../js/games/crew.js';
import assert from 'node:assert';
assert.ok(!G.cleanClue('Penguins', 'Penguin').ok); assert.ok(!G.cleanClue('two words', 'X').ok); assert.ok(G.cleanClue('Tuxedo', 'Penguin').ok);
assert.deepEqual(G.survivors({ a: 'Ice', b: 'ice', c: 'Tuxedos', d: 'tuxedo', e: 'Waddle' }), { a: false, b: false, c: false, d: false, e: true });
let fails = 0; const scores = [];
for (let g = 0; g < 1000; g++) {
  const n = 3 + (g % 10);
  const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players); let t = Date.now(), guard = 0;
  while (s.phase !== 'over' && guard++ < 2000) {
    for (const p of players) if (Math.random() < 0.95) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    t += 3000; G.tick(s, t);
  }
  if (s.phase !== 'over') fails++; else { scores.push(s.score); assert.equal(s.history.length, G.CARDS - (s.history.length > G.CARDS ? 1 : 0) || s.history.length); }
}
// guesser never sees the word or the clues before the guess phase; TV never shows the word early
const ps = [0, 1, 2, 3].map(i => ({ pid: 'p' + i, name: 'P' + i }));
const s = G.setup(ps);
const word = s.deck.length && G.phoneView(s, ps.find(p => p.pid !== s.guesser).pid).word;
assert.ok(!JSON.stringify(G.phoneView(s, s.guesser)).includes(word));
assert.ok(!JSON.stringify(G.tvView(s)).includes(word));
const givers = ps.filter(p => p.pid !== s.guesser);
G.act(s, givers[0].pid, { type: 'clue', text: 'Alpha' }); G.act(s, givers[1].pid, { type: 'clue', text: 'alpha' }); G.act(s, givers[2].pid, { type: 'clue', text: 'Gamma' });
assert.equal(s.phase, 'guess'); assert.deepEqual(G.phoneView(s, s.guesser).alive, ['Gamma']);
assert.ok(!JSON.stringify(G.tvView(s)).includes(word));
G.act(s, s.guesser, { type: 'guess', text: word.toLowerCase() }); assert.equal(s.result, 'right');
console.log('fails', fails, 'avg', (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
process.exit(fails ? 1 : 0);
