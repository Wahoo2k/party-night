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
await tv.click('[data-game=hearts]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (await me.$('#go')) { const ids = await me.$$('.hhand [data-id]'); for (const x of ids.slice(-3)) await x.click({ timeout: 1500 }); if (!shots.p) { await me.screenshot({ path: 'test/h-pass.png' }); shots.p = 1; } await me.click('#go', { timeout: 1500 }); }
    else if (await me.$('.hhand [data-id]')) { if (!shots.h) { await me.screenshot({ path: 'test/h-play.png' }); shots.h = 1; } await me.click('.hhand [data-id]', { timeout: 1500 }); }
  } catch (e) { }
  if (s.phase === 'play' && s.trick.length >= 2 && !shots.t) { await tv.screenshot({ path: 'test/h-tv.png' }); shots.t = 1; }
  if (s.phase === 'handEnd') { if (!shots.e) { await tv.screenshot({ path: 'test/h-tv-end.png' }); shots.e = 1; } await tv.click('[data-host=next]', { timeout: 800 }).catch(() => {}); }
  await tv.waitForTimeout(300);
}
const s = await st(); console.log(s.phase, Object.keys(shots), JSON.stringify(s.scores), 'errors', errors);
await b.close();






