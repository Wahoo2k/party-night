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
await me.setViewportSize({ width: 390, height: 844 });
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=wordhunt]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (await me.$('[data-w]')) await me.click('[data-w]', { timeout: 1500 });
    else if (await me.$('[data-t]')) { await me.click('[data-t=yes]', { timeout: 1500 }); await me.click('[data-t=close]', { timeout: 1500 }); if (!shots.h) { await me.screenshot({ path: 'test/wh-host.png' }); shots.h = 1; } await me.click('#got', { timeout: 1500 }); }
    else if (await me.$('[data-by]')) await me.click('[data-by]', { timeout: 1500 });
    else if (await me.$('[data-v]')) await me.click('[data-v]', { timeout: 1500 });
  } catch (e) { }
  if (s.phase === 'ask' && s.log.length > 2 && !shots.t) { await tv.screenshot({ path: 'test/wh-tv.png' }); shots.t = 1; }
  if (s.phase === 'ask' && i % 20 === 19) await tv.click('[data-host=next]', { timeout: 800 }).catch(() => {});
  if (s.phase === 'end') await tv.click('[data-host=next]', { timeout: 800 }).catch(() => {});
  await tv.waitForTimeout(400);
}
const s = await st(); console.log(s.phase, Object.keys(shots), JSON.stringify(s.scores), 'errors', errors);
await b.close();










