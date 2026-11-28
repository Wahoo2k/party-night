// One Word rules: matching clues cancel, clue checks, the TV never shows the word early, whole games by bots.
import assert from 'node:assert';
import * as G from '../js/games/oneword.js';
let fails = 0;
assert.deepEqual(G.survivors({ a: 'Ocean', b: 'oceans', c: 'Wave' }), { a: false, b: false, c: true });
assert.equal(G.cleanClue('two words', 'Beach').ok, false); assert.equal(G.cleanClue('Beaches', 'Beach').ok, false); assert.equal(G.cleanClue('sand', 'Beach').ok, true); assert.equal(G.cleanClue('x', 'Beach').ok, false); assert.equal(G.cleanClue('h2o', 'Water').ok, false);
assert.ok(G.rightGuess('  beaches ', 'Beach')); assert.ok(!G.rightGuess('bench', 'Beach'));
for (let g = 0; g < 200; g++) {
  const nP = 3 + (g % 8), players = Array.from({ length: nP }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), guard = 0;
  assert.equal(new Set(s.words).size, s.words.length);
  while (s.phase !== 'over' && guard++ < 4000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    const v = G.tvView(s, t), word = s.words[s.i];
    if (s.phase === 'clue' || s.phase === 'guess') assert.ok(!JSON.stringify(v).includes('"' + word + '"'), 'the TV never shows the word while it is being guessed');
    if (s.phase === 'clue' || s.phase === 'guess') { const gp = s.order[s.i % s.order.length]; assert.equal(G.phoneView({ ...s }, gp).word, undefined, 'the guesser\'s phone never has the word'); }
    t += 700; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; continue; }
  assert.ok(s.hits >= 0 && s.hits <= s.words.length);
}
// three people: two matching clues vanish, the third gets through, a right guess scores for the room
const ps = [0, 1, 2, 3].map(i => ({ pid: 'p' + i, name: 'P' + i })); const s = G.setup(ps); const t0 = Date.now();
const gp = s.order[0], others = ps.map(p => p.pid).filter(p => p !== gp), word = s.words[0];
G.act(s, gp, { type: 'clue', text: 'cheat' }, t0); assert.equal(s.clues[gp], undefined);
G.act(s, others[0], { type: 'clue', text: 'Zzyzx' }, t0); G.act(s, others[1], { type: 'clue', text: 'zzyzxs' }, t0); G.act(s, others[2], { type: 'clue', text: 'Qwfp' }, t0);
assert.equal(s.phase, 'guess'); assert.deepEqual(G.phoneView(s, gp).clues, ['Qwfp']); assert.equal(G.tvView(s, t0).cancelled, 2);
G.act(s, others[0], { type: 'guess', text: word }, t0); assert.equal(s.phase, 'guess');
G.act(s, gp, { type: 'guess', text: '  ' + word.toLowerCase() + ' ' }, t0); assert.equal(s.phase, 'result'); assert.equal(s.hits, 1);
assert.equal(G.tvView(s, t0).hits, 0); assert.equal(G.phoneView(s, gp).word, undefined);
let t = t0; for (let i = 0; i < 400 && s.phase !== 'over'; i++) { t += 4000; G.tick(s, t); }
assert.equal(s.phase, 'over');
console.log('fails', fails);
if (fails) process.exit(1);
