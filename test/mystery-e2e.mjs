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
await tv.click('[data-game=mystery]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (s.phase === 'roles' || s.phase === 'act') { await tv.waitForTimeout(1600); if (!shots[s.phase + s.act]) { await tv.screenshot({ path: 'test/mm-tv-' + s.phase + s.act + '.png' }); await me.screenshot({ path: 'test/mm-phone-' + s.phase + s.act + '.png' }); shots[s.phase + s.act] = 1; } await tv.click('[data-host=next]', { timeout: 800 }); }
    else if (await me.$('[data-k=suspect]')) { await me.click('[data-k=suspect]', { timeout: 800 }); await me.click('[data-k=room]:not(.dim)', { timeout: 800 }); await me.click('[data-k=item]:not(.dim)', { timeout: 800 }); await me.screenshot({ path: 'test/mm-phone-accuse.png' }); await me.click('#acc', { timeout: 800 }); }
  } catch (e) { }
  if (s.phase === 'reveal') { await tv.waitForTimeout(2500); await tv.screenshot({ path: 'test/mm-tv-reveal.png' }); break; }
  await tv.waitForTimeout(500);
}
const s = await st(); console.log(s.phase, Object.keys(shots), JSON.stringify(s.scores), 'errors', errors);
await b.close();











