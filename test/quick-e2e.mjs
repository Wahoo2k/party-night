import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const errors = [];
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
await tv.evaluate(() => localStorage.clear()); await tv.reload(); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const me = await ctx.newPage(); me.on('pageerror', e => errors.push('me ' + e.message));
await me.setViewportSize({ width: 390, height: 800 });
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 4; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-game=quick]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 300; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  const kind = s.rounds[s.n].kind;
  if (s.phase === 'vote') {
    if (!shots['v' + kind]) { await tv.waitForTimeout(3500); await tv.screenshot({ path: `test/q-tv-${kind}.png` }); await me.screenshot({ path: `test/q-${kind}.png` }); shots['v' + kind] = 1; }
    const p = await me.$('[data-pick]'); if (p) await p.click();
    const g = await me.$('[data-guess]'); if (g) await g.click();
  }
  if (s.phase === 'reveal') { if (!shots['r' + kind]) { await tv.waitForTimeout(3200); await tv.screenshot({ path: `test/q-tv-reveal-${kind}.png` }); shots['r' + kind] = 1; } await tv.click('[data-host=next]').catch(() => {}); }
  await tv.waitForTimeout(500);
}
await tv.waitForTimeout(3000); await tv.screenshot({ path: 'test/q-tv-over.png' });
console.log((await st()).phase, 'errors', errors);
await b.close();
