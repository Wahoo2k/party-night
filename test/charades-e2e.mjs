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
await tv.click('[data-shelf=all]'); await tv.click('[data-game=charades]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (await me.$('[data-start]')) await me.click('[data-start]');
    if (await me.$('[data-by]')) { if (!shots.a) { await me.screenshot({ path: 'test/ch-actor.png' }); shots.a = 1; } await me.click('[data-by]'); }
  } catch (e) { }
  if (s.phase === 'turn' && !shots.t) { await tv.waitForTimeout(1200); await tv.screenshot({ path: 'test/ch-tv-turn.png' }); shots.t = 1; }
  if (s.phase === 'turnEnd' && !shots.e) { await tv.waitForTimeout(800); await tv.screenshot({ path: 'test/ch-tv-end.png' }); shots.e = 1; }
  if (s.phase === 'turnEnd' || s.phase === 'ready') await tv.click('[data-host=next]').catch(() => {});
  if (s.phase === 'turn' && i % 15 === 14) await tv.click('[data-host=next]').catch(() => {});
  await tv.waitForTimeout(400);
}
const s = await st(); console.log(s.phase, Object.keys(shots), JSON.stringify(s.scores), 'errors', errors);
await b.close();

