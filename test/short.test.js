// Short game length: each supported game ends sooner and still finishes cleanly.
import assert from 'node:assert';
const names = ['potato', 'freeze', 'hunt', 'copycat', 'taboo', 'crew', 'meld', 'charades', 'sketch', 'doodle'];
let fails = 0;
for (const nm of names) {
  const G = await import(`../js/games/${nm}.js`);
  const steps = {};
  for (const short of [false, true]) for (let g = 0; g < 40; g++) {
    const players = Array.from({ length: 6 }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
    const s = G.setup(players, Math.random, null, { short }); let t = Date.now(), guard = 0;
    while (s.phase !== 'over' && guard++ < 6000) { for (const p of players) { const a = G.botAct(G.phoneView(s, p.pid, t)); if (a) G.act(s, p.pid, a, t); } t += 1500; G.tick(s, t); if (s.phase === 'reveal' && nm === 'sketch') G.hostAct(s, 'next', t); }
    if (s.phase !== 'over') fails++;
    steps[short] = (steps[short] || 0) + guard;
  }
  assert.ok(steps.true < steps.false, `${nm}: short ${steps.true} vs full ${steps.false}`);
}
console.log('fails', fails);
process.exit(fails ? 1 : 0);
