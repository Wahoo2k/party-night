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
await tv.click('[data-game=meld]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 300; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (await me.$('#mf')) { if (!shots.p) { await me.screenshot({ path: 'test/mm-psychic.png' }); shots.p = 1; } await me.fill('#mc', 'A warm bath'); await me.click('#mf button'); }
    else if (await me.$('#md')) { await me.$eval('#md', el => { el.value = 70; el.dispatchEvent(new Event('input')); }); if (!shots.d) { await me.screenshot({ path: 'test/mm-dial.png' }); shots.d = 1; } await me.click('#lock'); }
  } catch (e) { }
  if (s.phase === 'reveal' && !shots.r) { await tv.waitForTimeout(1800); await tv.screenshot({ path: 'test/mm-tv-reveal.png' }); shots.r = 1; }
  if (s.phase === 'guess' && !shots.g) { await tv.waitForTimeout(1500); await tv.screenshot({ path: 'test/mm-tv-guess.png' }); shots.g = 1; }
  if (s.phase === 'reveal' && i % 4 === 0) await tv.click('[data-host=next]').catch(() => {});
  await tv.waitForTimeout(500);
}
const s = await st(); console.log(s.phase, Object.keys(shots), JSON.stringify(s.scores), 'errors', errors);
await b.close();
