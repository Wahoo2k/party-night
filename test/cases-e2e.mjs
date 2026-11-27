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
await tv.click('[data-shelf=all]'); await tv.click('[data-game=cases]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  for (const sel of ['[data-own]', '[data-open]', '[data-lucky]']) { const x = await me.$(sel); if (x) { if (!shots[sel]) { await me.screenshot({ path: `test/k-phone-${sel.slice(6, -1)}.png` }); shots[sel] = 1; } await x.click(); break; } }
  if (await me.$('[data-nodeal]')) { if (!shots.offer) { await tv.waitForTimeout(2500); await tv.screenshot({ path: 'test/k-tv-offer.png' }); await me.screenshot({ path: 'test/k-phone-offer.png' }); shots.offer = 1; } await me.click(s.offers.length >= 3 ? '[data-deal]' : '[data-nodeal]'); }
  const adv = await me.$('[data-adv]'); if (adv && !shots.adv) { await adv.click(); shots.adv = 1; }
  if (s.phase === 'open' && !shots.open) { await tv.waitForTimeout(800); await tv.screenshot({ path: 'test/k-tv-open.png' }); shots.open = 1; }
  if (s.phase === 'end') { if (!shots.end) { await tv.waitForTimeout(1500); await tv.screenshot({ path: 'test/k-tv-end.png' }); shots.end = 1; } await tv.click('[data-host=next]').catch(() => {}); }
  await tv.waitForTimeout(500);
}
const s = await st(); console.log(s.phase, JSON.stringify(s.scores), 'errors', errors);
await b.close();
