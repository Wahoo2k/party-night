// The walkthrough: before a room's first Werewolf, the TV shows a sample round with captions; Skip goes to the how-to card.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const out = process.argv[2], game = process.argv[3] || 'werewolf', errs = [];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push(e.message));
await tv.goto('http://localhost:8765/tv.html?local=1&intro=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
const ph = await ctx.newPage(); await ph.goto('http://localhost:8765/play.html?local=1'); await ph.fill('#code', code); await ph.fill('#name', 'Tom'); await ph.click('#join');
await tv.waitForTimeout(500);
await tv.evaluate(g => document.querySelector(`.gcard[data-game=${g}]`)?.click(), game); await tv.waitForTimeout(600);
for (let i = 0; i < 4; i++) { await tv.click('[data-host=addbot]').catch(() => {}); await tv.waitForTimeout(150); }
await tv.click('[data-host=start]'); await tv.waitForTimeout(1200);
const seen = []; let t0 = Date.now(), last = '';
while (Date.now() - t0 < 70000) {
  const cap = await tv.evaluate(() => document.querySelector('.walkbar small')?.textContent || '');
  if (!cap) break;
  if (cap !== last) { last = cap; seen.push(cap + ' | ' + (await tv.evaluate(() => document.querySelector('.walkbar p').textContent)).slice(0, 50)); await tv.waitForTimeout(900); if (out) await tv.screenshot({ path: `${out}/walk-${game}-${seen.length}.png` }); if (seen.length === 4) { await tv.click('.walkbar [data-host=skipwalk]'); await tv.waitForTimeout(600); break; } }
  await tv.waitForTimeout(300);
}
const after = await tv.evaluate(() => ({ bar: !!document.querySelector('.walkbar'), intro: !!document.querySelector('.intro .introsteps') }));
const playing = await tv.evaluate(() => !!JSON.parse(sessionStorage.getItem('pg-host') || localStorage.getItem('pg-host') || '{}').state);
const ok = seen.length >= 4 && !after.bar && after.intro && !playing && !errs.length;
console.log((ok ? 'ok' : 'FAIL') + ' walk-e2e ' + JSON.stringify({ game, seen, after, playing, errs })); await b.close(); process.exit(ok ? 0 : 1);
