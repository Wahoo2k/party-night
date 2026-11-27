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
await tv.click('[data-game=bowl]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (await me.$('#bf')) { await me.fill('#b0', 'Grandpa Joe'); await me.click('#help'); if (!shots.s) { await me.screenshot({ path: 'test/sb-submit.png' }); shots.s = 1; } await me.click('#bf [type=submit]'); }
    if (await me.$('[data-start]')) await me.click('[data-start]');
    if (await me.$('[data-got]')) { if (!shots.g) { await me.screenshot({ path: 'test/sb-giver.png' }); shots.g = 1; } await me.click('[data-got]'); }
  } catch (e) { }
  if (s.phase === 'turn' && !shots.t) { await tv.waitForTimeout(1200); await tv.screenshot({ path: 'test/sb-tv-turn.png' }); shots.t = 1; }
  if (s.phase === 'roundEnd' && !shots.r) { await tv.screenshot({ path: 'test/sb-tv-round.png' }); shots.r = 1; }
  if (['turnEnd', 'roundEnd', 'ready'].includes(s.phase)) await tv.click('[data-host=next]').catch(() => {});
  await tv.waitForTimeout(400);
}
const s = await st(); console.log(s.phase, Object.keys(shots), s.teamScore, s.names.includes('Grandpa Joe'), 'errors', errors);
await b.close();
