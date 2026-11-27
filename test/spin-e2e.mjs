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
await tv.click('[data-shelf=all]'); await tv.click('[data-game=spin]'); await tv.click('[data-host=start]');
await tv.waitForTimeout(3500);
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
const FREQ = 'TNSRHLDCMGPBFYWKVXJQZ';
for (let i = 0; i < 500; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  if (s.phase === 'roundEnd') { if (!shots.end) { await tv.waitForTimeout(1000); await tv.screenshot({ path: 'test/s-tv-solved.png' }); shots.end = 1; } await tv.click('[data-host=next]'); }
  const pad = await me.$('#spinpad');
  if (pad) { await pad.click(); await tv.waitForTimeout(1500); if (!shots.spin) { await tv.screenshot({ path: 'test/s-tv-spinning.png' }); shots.spin = 1; } await tv.waitForTimeout(2500); if (!shots.land) { await tv.screenshot({ path: 'test/s-tv-landed.png' }); await me.screenshot({ path: 'test/s-phone-letter.png' }); shots.land = 1; } }
  const keys = await me.$$('[data-l]:not([disabled])');
  if (keys.length) { const ls = await Promise.all(keys.map(k => k.getAttribute('data-l'))); const L = FREQ.split('').find(l => ls.includes(l)); await me.click(`[data-l="${L}"]`); }
  const solveBtn = await me.$('[data-solve]');
  if (solveBtn && !(await me.$('#spinpad'))) { await solveBtn.click(); }
  const sf = await me.$('#sf'); if (sf) { const a = (await st()); const PZ = await tv.evaluate(async () => (await import('./js/games/spin.js')).PUZZLES); await me.fill('#sol', PZ[a.puzzles[a.r]].a); await me.click('#sf .btn'); }
  await tv.waitForTimeout(400);
}
await tv.waitForTimeout(3000);
const s = await st(); console.log(s.phase, JSON.stringify(s.total));
await tv.screenshot({ path: 'test/s-tv-over.png' });
console.log('errors', errors);
await b.close();
