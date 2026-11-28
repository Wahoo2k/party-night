// Top Spot rules: what answers pay, one guess per round, the Sweep race, and whole games played by bots.
import assert from 'node:assert';
import * as G from '../js/games/topspot.js';
import { QUESTIONS } from '../js/games/crowd-bank.js';
let fails = 0;
const q = QUESTIONS.find(x => x.a.length >= 8);
assert.equal(G.payFor('top', q, 0), q.a[0][1] * 10); assert.equal(G.payFor('deep', q, 0), 100); assert.equal(G.payFor('deep', q, 7), 800); assert.equal(G.payFor('top', q, -1), 0);
for (let i = 1; i < q.a.length; i++) { assert.ok(G.payFor('top', q, i) <= G.payFor('top', q, i - 1)); assert.ok(G.payFor('deep', q, i) > G.payFor('deep', q, i - 1)); }
assert.equal(G.cleanGuess(' ').ok, false); assert.equal(G.cleanGuess('pepperoni').ok, true);
for (let g = 0; g < 200; g++) {
  const nP = 2 + (g % 8), players = Array.from({ length: nP }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, null, { short: g % 3 === 0 }); let t = Date.now(), guard = 0;
  assert.equal(new Set(s.order).size, s.order.length);
  s.plan.forEach((m, i) => { if (m !== 'top') assert.ok(QUESTIONS[s.order[i]].a.length >= 8, 'long board for ' + m); });
  while (s.phase !== 'over' && guard++ < 6000) {
    for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid)); if (a) G.act(s, p.pid, a, t); }
    const v = G.tvView(s, t);
    if (s.phase === 'reveal' && !s.settled) { for (const x of v.scores) assert.equal(x.score, s.result.before[x.pid]); for (const p of players) assert.equal(G.phoneView(s, p.pid).pts, undefined); }
    if (s.phase === 'guess') assert.ok(!JSON.stringify(v).includes(QUESTIONS[s.order[s.i]].a[0][0]) || QUESTIONS[s.order[s.i]].q.includes(QUESTIONS[s.order[s.i]].a[0][0]), 'the TV never shows an answer while people guess');
    t += 600; G.tick(s, t);
  }
  if (s.phase !== 'over') { fails++; continue; }
  for (const p of players) assert.ok(s.scores[p.pid] >= 0);
  const s2 = G.setup(players, Math.random, s, {}); assert.ok(s2.order.every(i => !s.order.includes(i)));
}
// one guess only in a guess round; a second is ignored
const ps = [0, 1, 2].map(i => ({ pid: 'p' + i, name: 'P' + i })); const s = G.setup(ps); const t0 = Date.now();
const top = QUESTIONS[s.order[0]].a[0][0];
G.act(s, 'p0', { type: 'guess', text: top }, t0); G.act(s, 'p0', { type: 'guess', text: 'zzzz' }, t0);
assert.equal(s.guesses.p0.idx, 0);
// humans' phones never get the board
assert.equal(G.phoneView(s, 'p0')._a, undefined); assert.equal(G.phoneView(s, 'p1')._a, undefined);
// nobody answers: timers still finish the game
let t = t0; for (let i = 0; i < 400 && s.phase !== 'over'; i++) { t += 4000; G.tick(s, t); }
assert.equal(s.phase, 'over');
// Sweep: first finder 150, later finders 50, the same answer twice pays once
const w = G.setup(ps); while (w.plan[w.i] !== 'sweep') { G.hostAct(w, 'next', t); if (w.phase === 'reveal') { w.settled = true; G.hostAct(w, 'next', t); } }
assert.equal(w.phase, 'sweep'); const base = { ...w.scores }, ans = QUESTIONS[w.order[w.i]].a[2][0];
G.act(w, 'p0', { type: 'guess', text: ans }, t); G.act(w, 'p1', { type: 'guess', text: ans }, t); G.act(w, 'p0', { type: 'guess', text: ans }, t);
assert.equal(w.scores.p0 - base.p0, 150); assert.equal(w.scores.p1 - base.p1, 50);
console.log('fails', fails);
if (fails) process.exit(1);
