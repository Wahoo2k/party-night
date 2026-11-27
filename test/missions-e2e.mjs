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
for (let i = 0; i < 4; i++) await tv.click("[data-host=addbot]");
await tv.click('[data-shelf=all]'); await tv.click('[data-game=missions]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (s.phase === 'roles') { if (!shots.r) { await tv.waitForTimeout(1500); await me.screenshot({ path: 'test/ms-role.png' }); shots.r = 1; } await tv.click('[data-host=next]', { timeout: 800 }); }
    else if (await me.$('[data-p]')) { const n = await me.$$('[data-p]'); for (const x of n.slice(0, 5)) { if (await me.$('#go:not([disabled])')) break; await me.click('[data-p] >> nth=' + n.indexOf(x), { timeout: 1500 }); } await me.click('#go', { timeout: 1500 }); }
    else if (await me.$('[data-y]')) await me.click('[data-y="1"]', { timeout: 1500 });
    else if (await me.$('[data-ok]')) await me.click('[data-ok]', { timeout: 1500 });
  } catch (e) { }
  if (s.phase === 'result' && !shots.t) { await tv.waitForTimeout(1500); await tv.screenshot({ path: 'test/ms-tv.png' }); shots.t = 1; }
  if (['voteShow', 'result'].includes(s.phase)) await tv.click('[data-host=next]', { timeout: 800 }).catch(() => {});
  await tv.waitForTimeout(400);
}
const s = await st(); console.log(s.phase, Object.keys(shots), JSON.stringify(s.scores), 'errors', errors);
await b.close();












