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
await tv.click('[data-shelf=all]'); await tv.click('[data-game=agents]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 300; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  if (await me.$('#af2')) try {
    if (!shots.c) { await me.screenshot({ path: 'test/sa-spy.png' }); shots.c = 1; }
    const w = s.words.find((x, j) => !s.revealed[j]);
    await me.fill('#cw', w + 'y', { timeout: 2000 }); await me.click('#af2 button', { timeout: 2000 });
    if (!(await me.textContent('#err', { timeout: 2000 }))) errors.push('no clue error');
    await me.fill('#cw', 'Zap', { timeout: 2000 }); await me.click('#af2 button', { timeout: 2000 });
  } catch (e) { /* screen changed underneath */ }
  const pick = await me.$('.agrid [data-v]');
  if (pick && !(await me.$('.acard.mine'))) { if (!shots.g) { await me.screenshot({ path: 'test/sa-guess.png' }); shots.g = 1; } await pick.click(); }
  if (s.phase === 'guess' && !shots.t) { await tv.waitForTimeout(1200); await tv.screenshot({ path: 'test/sa-tv.png' }); shots.t = 1; }
  await tv.waitForTimeout(600);
}
await tv.waitForTimeout(2500); await tv.screenshot({ path: 'test/sa-tv-over.png' });
const s = await st(); console.log(s.phase, s.why, s.winner, Object.keys(shots), 'errors', errors);
await b.close();
