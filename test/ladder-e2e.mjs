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
await tv.click('[data-host=addbot]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=ladder]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 300; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  if (s.phase === 'seatIntro') await tv.click('[data-host=next]').catch(() => {});
  const iamhot = await me.$('[data-walk]');
  if (iamhot) {
    if (!shots.q) { await tv.waitForTimeout(800); await tv.screenshot({ path: 'test/l2-tv-q.png' }); await me.screenshot({ path: 'test/l2-phone.png' }); shots.q = 1; }
    if (s.rung === 1 && s.life.fifty) { await me.click('[data-life=fifty]'); await tv.waitForTimeout(400); }
    if (s.rung === 2 && s.life.room) { await me.click('[data-life=room]'); await tv.waitForTimeout(400); await tv.screenshot({ path: 'test/l2-tv-room.png' }); }
    const opts = await me.$$('[data-i]'); await opts[0].click(); await me.click('[data-lock]');
  } else { const o = await me.$('[data-i]:not([disabled])'); if (o && s.phase === 'question' && !(await me.$('.opt.on'))) await o.click(); }
  if (s.phase === 'result') { if (!shots.r) { await tv.waitForTimeout(600); await tv.screenshot({ path: 'test/l2-tv-result.png' }); shots.r = 1; } await tv.click('[data-host=next]').catch(() => {}); }
  await tv.waitForTimeout(500);
}
await tv.waitForTimeout(2500); await tv.screenshot({ path: 'test/l2-tv-over.png' });
const s = await st(); console.log(s.phase, JSON.stringify(s.scores), 'errors', errors);
await b.close();
