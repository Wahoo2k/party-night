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
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=crowd]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {}; const guesses = ['pepperoni', 'towel', 'keys', 'cake', 'car', 'cow', 'eggs', 'spiders', 'library', 'basketball', 'popcorn', 'traffic', 'sled', 'batteries', 'brush teeth', 'stranger'];
for (let i = 0; i < 300; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  const f = await me.$('#cf2');
  if (f) { if (!shots[s.phase]) { await me.screenshot({ path: `test/c-${s.phase}.png` }); } await me.fill('#cg', guesses[i % guesses.length]); await me.click('#cf2 .btn'); }
  if (!shots[s.phase] && s.phase !== 'faceoff') { await tv.waitForTimeout(800); await tv.screenshot({ path: `test/c-tv-${s.phase}.png` }); shots[s.phase] = 1; }
  if (s.phase === 'faceoff' && !shots.faceoff) { await tv.waitForTimeout(3500); await tv.screenshot({ path: 'test/c-tv-faceoff.png' }); shots.faceoff = 1; }
  if (s.phase === 'roundEnd') await tv.click('[data-host=next]');
  await tv.waitForTimeout(700);
}
await tv.waitForTimeout(3000);
const s = await st(); console.log(s.phase, JSON.stringify(s.teamScore));
await tv.screenshot({ path: 'test/c-tv-over.png' });
console.log('errors', errors);
await b.close();
