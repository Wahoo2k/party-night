// Bracket Battle, Act Natural and Room Meter: bots play many full games; scores stay sane and every game ends.
import assert from 'node:assert';
let fails = 0;
for (const nm of ['bracket', 'faker', 'meter', 'rebus']) {
  const G = await import(`../js/games/${nm}.js`);
  const stats = {};
  for (let g = 0; g < 300; g++) {
    const n = G.meta.min + (g % 7);
    const players = Array.from({ length: n }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
    const s = G.setup(players, Math.random, null, { short: g % 2 === 0 }); let t = Date.now(), guard = 0;
    while (s.phase !== 'over' && guard++ < 4000) {
      for (const p of players) { const v = G.phoneView(s, p.pid); const a = G.botAct(v, Math.random); if (a) G.act(s, p.pid, a, t, Math.random); JSON.stringify(v); }
      JSON.stringify(G.tvView(s, t)); G.narration(s); G.cue(s);
      t += 1500; G.tick(s, t, Math.random);
    }
    if (s.phase !== 'over') { fails++; continue; }
    const v = G.tvView(s, t);
    assert.ok(v.scores.every(x => Number.isFinite(x.score) && x.score >= 0), nm + ' scores');
    assert.equal(G.phoneView(s, 'nobody').phase, 'spectate');
    stats.top = Math.max(stats.top || 0, v.scores[0].score);
    if (nm === 'faker') { assert.ok(!JSON.stringify(G.phoneView({ ...s, phase: 'read' }, s.faker)).includes(s.text), 'faker must not see the instruction'); }
  }
  console.log(nm, 'ok, top score seen', stats.top);
}
// Room Meter: the truth is the real share of yes answers.
{
  const G = await import('../js/games/meter.js');
  const players = Array.from({ length: 4 }, (_, i) => ({ pid: 'p' + i, name: 'P' + i }));
  const s = G.setup(players, Math.random); const t = Date.now();
  players.forEach((p, i) => G.act(s, p.pid, { type: 'answer', yes: i < 3 }, t));
  assert.equal(s.phase, 'guess');
  const sp = s.players[0].pid;
  G.act(s, sp, { type: 'lock', v: 50 }, t);
  players.filter(p => p.pid !== sp).forEach(p => G.act(s, p.pid, { type: 'bet', bet: 'much-higher' }, t));
  assert.equal(s.phase, 'reveal'); assert.equal(s.result.truth, 75);
  assert.equal(s.scores[sp], 2000 - 25 * 50);
  assert.ok(players.filter(p => p.pid !== sp).every(p => s.scores[p.pid] === 2000));
}
{
  const G = await import('../js/games/rebus.js');
  for (const p of G.PUZZLES) { assert.ok(G.isRight(p, p.a), p.a); assert.ok(G.isRight(p, p.a.toUpperCase() + '!'), p.a); (p.alt || []).forEach(x => assert.ok(G.isRight(p, x))); assert.ok(!G.isRight(p, 'banana') || p.a === 'Banana'); }
  assert.equal(new Set(G.PUZZLES.map(p => p.a)).size, G.PUZZLES.length);
  const s = G.setup([{ pid: 'a', name: 'A' }, { pid: 'b', name: 'B' }], Math.random); const t = Date.now();
  assert.ok(!JSON.stringify(G.phoneView({ ...s, phase: 'solve', start: t, deadline: t + 40000 }, 'a', t)).toLowerCase().includes('"' + G.PUZZLES[s.list[0]].a.toLowerCase() + '"'), 'answer not sent to phones');
  console.log('rebus puzzles', G.PUZZLES.length);
}
console.log('fails', fails); process.exit(fails ? 1 : 0);
