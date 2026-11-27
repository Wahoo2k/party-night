import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 760 } });
const errors = [];
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
await tv.evaluate(() => localStorage.clear()); await tv.reload(); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const me = await ctx.newPage(); me.on('pageerror', e => errors.push('me ' + e.message));
await me.setViewportSize({ width: 390, height: 760 });
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=whosaid]'); await tv.click('[data-host=start]');
await me.waitForSelector('#af'); await tv.waitForTimeout(3500);
await me.screenshot({ path: 'test/w-answer.png' }); await tv.screenshot({ path: 'test/w-tv-answer.png' });
await me.fill('#a0', 'Grilled cheese'); await me.fill('#a1', 'Fly fishing'); await me.click('#af .btn');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 150; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  if (s.phase === 'guess') {
    if (!shots.g) { await tv.waitForTimeout(2500); await tv.screenshot({ path: 'test/w-tv-guess.png' }); await me.screenshot({ path: 'test/w-guess.png' }); shots.g = 1; }
    const o = await me.$('[data-who]'); if (o && !(await me.$('.opt.on'))) await o.click();
  }
  if (s.phase === 'reveal') { if (!shots.r) { await tv.waitForTimeout(1200); await tv.screenshot({ path: 'test/w-tv-reveal.png' }); shots.r = 1; } await tv.click('[data-host=next]'); }
  await tv.waitForTimeout(600);
}
await tv.waitForTimeout(3500);
const s = await st(); console.log(s.phase, s.items.length, JSON.stringify(s.scores));
await tv.screenshot({ path: 'test/w-tv-over.png' });
console.log('errors', errors);
await b.close();
