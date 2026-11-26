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
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-game=taboo]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 300; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  if (await me.$('[data-start]')) await me.click('[data-start]');
  if (await me.$('[data-got]')) { if (!shots.g) { await me.screenshot({ path: 'test/t2-giver.png' }); await tv.screenshot({ path: 'test/t2-tv-turn.png' }); shots.g = 1; } await me.click('[data-got]'); }
  if (await me.$('[data-buzz]') && !shots.b) { await me.screenshot({ path: 'test/t2-watch.png' }); shots.b = 1; }
  if (s.phase === 'turn' && !shots.t) { await tv.waitForTimeout(1500); await tv.screenshot({ path: 'test/t2-tv-turn.png' }); shots.t = 1; }
  if (s.phase === 'turnEnd') { if (!shots.e) { await tv.screenshot({ path: 'test/t2-tv-end.png' }); shots.e = 1; } await tv.click('[data-host=next]').catch(() => {}); }
  if (s.phase === 'turn' && i % 8 === 7) await tv.click('[data-host=next]').catch(() => {});   // speed things up
  await tv.waitForTimeout(700);
}
const s = await st(); console.log(s.phase, JSON.stringify(s.teamScore), 'errors', errors);
await b.close();
