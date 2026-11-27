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
await me.setViewportSize({ width: 390, height: 900 });
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=letters]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 200; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  const f = await me.$('#lf2');
  if (f) {
    const L = s.letters[s.round];
    // type into fields one by one (focus must survive bots finishing)
    for (let k = 0; k < 6; k++) { await me.fill(`#c${k}`, L + ['ango', 'olly', 'ella', 'ustin', 'ipper', 'ango'][k]); await me.press(`#c${k}`, 'Tab'); }
    if (!shots.w) { await tv.waitForTimeout(500); await tv.screenshot({ path: 'test/s2-tv-write.png' }); await me.screenshot({ path: 'test/s2-phone-write.png' }); shots.w = 1; }
    const kept = await me.inputValue('#c3'); if (!kept) errors.push('typed answer lost');
    await me.click('#lf2 .btn');
  }
  if (s.phase === 'review') { if (!shots.r) { await tv.waitForTimeout(600); await tv.screenshot({ path: 'test/s2-tv-review.png' }); await me.screenshot({ path: 'test/s2-phone-review.png' }); const v = await me.$('[data-veto]'); if (v) await v.click(); shots.r = 1; } await tv.click('[data-host=next]').catch(() => {}); }
  if (s.phase === 'scores') await tv.click('[data-host=next]').catch(() => {});
  await tv.waitForTimeout(400);
}
const s = await st(); console.log(s.phase, JSON.stringify(s.scores), 'errors', errors);
await b.close();
