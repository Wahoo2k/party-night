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
await tv.click('[data-game=bluff]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 200; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  const key = s.phase + s.n;
  if (s.phase === 'write' && await me.$('#lf')) {
    if (!shots.w) { await tv.waitForTimeout(3500); await tv.screenshot({ path: 'test/b-tv-write.png' }); await me.screenshot({ path: 'test/b-write.png' }); shots.w = 1; }
    await me.fill('#lie', 'a tiny hat'); await me.click('#lf .btn');
  }
  if (s.phase === 'pick') {
    if (!shots.p) { await tv.waitForTimeout(3500); await tv.screenshot({ path: 'test/b-tv-pick.png' }); await me.screenshot({ path: 'test/b-pick.png' }); shots.p = 1; }
    const o = await me.$('[data-pick]'); if (o && !(await me.$('.opt.on'))) await o.click();
  }
  if (s.phase === 'scores') { if (!shots.s) { await tv.screenshot({ path: 'test/b-tv-reveal.png' }); await me.screenshot({ path: 'test/b-reveal.png' }); shots.s = 1; } await tv.click('[data-host=next]'); }
  await tv.waitForTimeout(700);
}
await tv.waitForTimeout(3000);
const s = await st();
console.log(s.phase, JSON.stringify(s.scores));
await tv.screenshot({ path: 'test/b-tv-over.png' });
console.log('errors', errors);
await b.close();
