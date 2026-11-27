// Phone polish: your-move banner, watch-the-TV nudge, points toast, finishing place, final-round ribbon, night tally.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const errors = [];
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const me = await ctx.newPage(); me.on('pageerror', e => errors.push('me ' + e.message));
await me.setViewportSize({ width: 390, height: 800 });
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 4; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-host=settings]'); await tv.click('[data-host=short]'); await tv.click('[data-host=menu]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=quick]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const saw = {};
for (let i = 0; i < 1600; i++) {
  const s = await st(); if (!s || s.phase === 'over') break;
  const f = await me.evaluate(() => ({ turn: !!document.querySelector('.yourturn'), watch: !!document.querySelector('.watchtv'), toast: document.querySelector('.ptoast')?.textContent }));
  if (f.turn) saw.turn = 1; if (f.watch) saw.watch = 1; if (f.toast) saw['toast ' + f.toast.replace(/\d+/, 'N')] = 1;
  if (await tv.evaluate(() => document.body.classList.contains('finalround'))) saw.ribbon = 1;
  if (s.phase === 'vote') { const p = await me.$('[data-pick]'); if (p) await p.click().catch(() => {}); const g = await me.$('[data-guess]'); if (g) await g.click().catch(() => {}); }
  if (s.phase === 'reveal' && i % 4 === 3) await tv.click('[data-host=next]').catch(() => {});
  await tv.waitForTimeout(300);
}
console.log('phase', (await st())?.phase, JSON.stringify(saw)); await tv.waitForTimeout(1500);
saw.place = await me.evaluate(() => document.querySelector('.myplace')?.textContent);
await me.screenshot({ path: (process.env.SHOTS || 'test') + '/phone-over.png' });
await tv.evaluate(() => document.querySelector('.ceremony')?.click()); await tv.waitForTimeout(800);
await tv.click('[data-host=lobby]'); await tv.waitForSelector('[data-host=awards]'); await tv.click('[data-host=awards]'); await tv.waitForTimeout(3500);
saw.awards = await tv.evaluate(() => document.querySelectorAll('.naward').length);
await tv.screenshot({ path: (process.env.SHOTS || 'test') + '/night-awards.png' });
console.log(JSON.stringify(saw), 'errors', errors);
await b.close(); process.exit(errors.length ? 1 : 0);
