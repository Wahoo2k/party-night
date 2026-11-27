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
await tv.click('[data-shelf=all]'); await tv.click('[data-game=bingo]'); await tv.click('[data-host=start]');
await tv.waitForSelector('[data-host=numbers]'); await tv.click('[data-host=numbers]');
await tv.click('[data-host=fast]').catch(() => {});
await me.waitForSelector('.bcard');
await me.click('#auto');
await tv.waitForTimeout(25000);
await tv.screenshot({ path: 'test/g-tv.png' }); await me.screenshot({ path: 'test/g-phone.png' });
await me.click('[data-bingo]').catch(() => {});  // likely a false claim
await tv.waitForTimeout(800); await tv.screenshot({ path: 'test/g-tv-false.png' });
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
for (let i = 0; i < 120; i++) { const s = await st(); if (s.phase === 'bingo' || s.phase === 'roundEnd') break; const bz = await me.$('[data-bingo].live'); const v = s.cards; await tv.waitForTimeout(1000); }
await tv.waitForTimeout(1200); await tv.screenshot({ path: 'test/g-tv-bingo.png' }); await me.screenshot({ path: 'test/g-phone-bingo.png' });
console.log((await st()).phase, (await st()).winners, 'errors', errors);
await b.close();
