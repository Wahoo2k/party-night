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
await tv.click('[data-game=doodle]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (await me.$('#skc')) { const box = await (await me.$('#skc')).boundingBox(); await me.mouse.move(box.x + 60, box.y + 60); await me.mouse.down(); for (let j = 0; j < 20; j++) await me.mouse.move(box.x + 60 + j * 10, box.y + 80 + Math.sin(j) * 40); await me.mouse.up(); await me.click('#skdone'); }
    else if (await me.$('#dbf')) { await me.fill('#dbt', 'A grumpy toaster'); await me.click('#dbf button'); }
    else if (await me.$('[data-o]') && !(await me.$('.opt.on'))) await me.click('[data-o]');
  } catch (e) { }
  if (s.phase === 'reveal' && !shots.r) { await tv.waitForTimeout(1500); await tv.screenshot({ path: 'test/db-tv.png' }); shots.r = 1; }
  if (s.phase === 'reveal') await tv.click('[data-host=next]', { timeout: 800 }).catch(() => {});
  await tv.waitForTimeout(400);
}
await tv.waitForTimeout(2500); await tv.screenshot({ path: 'test/sk-tv-over.png' });
const s = await st();
console.log(s.phase, Object.keys(shots), 'errors', errors);
await b.close();

