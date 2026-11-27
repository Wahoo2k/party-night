// One screen, no scrolling: every game is played by bots inside the page and each phase's TV picture is measured
// at laptop-browser and TV sizes, before and after the automatic fit.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const SIZES = [[1366, 625], [1280, 720], [1920, 1080], [1024, 600]];
const worst = {}; let fails = 0; const errors = [];
for (const [w, h] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto('http://localhost:8765/watch.html?local=1'); await p.waitForSelector('#wf');
  const res = await p.evaluate(async () => {
    const { GAMES } = await import('./js/games/index.js'); const { fitScreen } = await import('./js/ui.js');
    const app = document.getElementById('app'); const out = [];
    const THEME = { funny: 'comic', bracket: 'comic', split: 'comic', dares: 'comic', bluffcards: 'comic', bluff: 'paper', truths: 'paper', whosaid: 'paper', meter: 'paper', letters: 'paper', sketch: 'sketch', doodle: 'sketch', shade: 'sketch', hunt: 'kids', freeze: 'kids', copycat: 'kids', memory: 'kids', ducks: 'kids', potato: 'kids', bingo: 'kids', charades: 'kids', gofish: 'kids', trivia: 'show', spin: 'show', crowd: 'show', ladder: 'show', cases: 'show', quick: 'show', estimate: 'show', rebus: 'show', imposter: 'noir', faker: 'noir', wordhunt: 'noir', agents: 'noir', missions: 'noir', mystery: 'noir', bomb: 'noir', taboo: 'teams', bowl: 'teams', crew: 'teams', meld: 'teams', clash: 'felt', blackjack: 'felt', hearts: 'felt' };
    const names = ['Alexandria', 'Bo', 'Christopher', 'Dee', 'Evangeline', 'Finn', 'Gwendolyn', 'Hal'];
    for (const [id, G] of Object.entries(GAMES)) {
      const row = { id, raw: 0, zoom: 1, left: 0, phase: '', n: 0 };
      for (const count of [G.meta.min, Math.min(G.meta.max, 8)]) for (let g = 0; g < 2; g++) {
        try {
          const players = names.slice(0, count).map((name, i) => ({ pid: 'bot-' + i, name }));
          const s = G.setup(players, Math.random, null, {}); let t = Date.now(), guard = 0, last = '', stuck = 0;
          document.body.className = 'tv watch'; document.body.dataset.theme = THEME[id] || ''; document.body.dataset.game = id;
          const shot = () => {
            app.style.zoom = ''; app.style.maxWidth = ''; app.style.width = ''; G.renderTV({ ...G.tvView(s, t), fresh: false }, app);
            const over = app.getBoundingClientRect().bottom - innerHeight; const z = fitScreen(app); const left = app.getBoundingClientRect().bottom - innerHeight;
            row.n++; if (over > row.raw) { row.raw = Math.round(over); } if (z < row.zoom) { row.zoom = +z.toFixed(2); row.phase = s.phase + ' (' + count + 'p)'; } if (left > row.left) row.left = Math.round(left);
          };
          while (s.phase !== 'over' && guard++ < 1500) {
            const key = s.phase + s.round; if (key !== last) { last = key; stuck = 0; shot(); } else stuck++;
            for (const pl of players) { const a = G.botAct?.(G.phoneView(s, pl.pid, t)); if (a) G.act(s, pl.pid, a, t); }
            t += 1500; G.tick(s, t); if (stuck > 40) { G.hostAct?.(s, 'next', t); stuck = 0; }
            if (guard % 25 === 0) shot();
          }
          shot();
        } catch (e) { row.err = String(e).slice(0, 80); }
      }
      out.push(row);
    }
    return out;
  });
  for (const r of res) { const k = r.id; worst[k] = worst[k] || {}; worst[k][w + 'x' + h] = r; if (r.left > 2) fails++; }
  await ctx.close();
}
const tight = Object.entries(worst).map(([id, by]) => ({ id, z: Math.min(...Object.values(by).map(r => r.zoom)), raw: Math.max(...Object.values(by).map(r => r.raw)), left: Math.max(...Object.values(by).map(r => r.left)), at: Object.entries(by).sort((a, c) => a[1].zoom - c[1].zoom)[0] })).sort((a, c) => a.z - c.z);
console.log('games', tight.length, 'needed shrinking', tight.filter(t => t.z < 1).length, 'still overflowing', fails);
for (const t of tight.filter(t => t.z < 1).slice(0, 25)) console.log(t.id.padEnd(11), 'smallest scale', t.z, 'was over by', t.raw + 'px', 'at', t.at[0], t.at[1].phase, t.at[1].err || '');
for (const [w, h] of SIZES) { const k = w + 'x' + h; const zs = Object.values(worst).map(by => by[k].zoom); console.log(k, 'fit as drawn', zs.filter(z => z === 1).length, '| scaled 0.8+', zs.filter(z => z < 1 && z >= 0.8).length, '| 0.65-0.8', zs.filter(z => z < 0.8 && z >= 0.65).length, '| below 0.65', zs.filter(z => z < 0.65).length); }
console.log('errors', errors.slice(0, 3)); await b.close(); process.exit(fails || errors.length ? 1 : 0);
