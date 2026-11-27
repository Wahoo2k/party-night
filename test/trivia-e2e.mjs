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
for (let i = 0; i < 2; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-game=trivia]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
const shot = async (k, both = true) => { if (shots[k]) return; shots[k] = 1; await tv.screenshot({ path: `test/t-tv-${k}.png` }); if (both) await me.screenshot({ path: `test/t-${k}.png` }); };
for (let i = 0; i < 600; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  if (s.phase === 'pick') { await tv.waitForTimeout(shots.pick ? 0 : 3500); await shot('pick', false); const t = await me.$('[data-tile]'); if (t) { await me.screenshot({ path: 'test/t-pickphone.png' }); await t.click(); } }
  if (s.phase === 'read') await shot('read');
  if (s.phase === 'buzz') { const bz = await me.$('[data-buzz]:not([disabled])'); if (bz) { await shot('buzz'); await bz.dispatchEvent('pointerdown'); } }
  if (s.phase === 'answer' && await me.$('#tf')) { await shot('answer'); await me.fill('#ans', 'Paris'); await me.click('#tf .btn'); }
  if (s.phase === 'wager' && await me.$('#wf')) { await shot('wager'); await me.click('#wf .btn'); }
  if (s.phase === 'reveal') { await shot('reveal', false); await tv.click('[data-host=next]'); }
  if (s.phase === 'finalWager' && await me.$('#fw')) { await tv.waitForTimeout(2500); await shot('fwager'); await me.click('#fw .btn'); }
  if (s.phase === 'finalAnswer' && await me.$('#tf')) { await shot('fanswer'); await me.fill('#ans', 'France'); await me.click('#tf .btn'); }
  if (s.phase === 'finalReveal') { await tv.waitForTimeout(500); }
  await tv.waitForTimeout(350);
}
await tv.waitForTimeout(3500);
const s = await st(); console.log(s.phase, JSON.stringify(s.scores));
await tv.screenshot({ path: 'test/t-tv-over.png' });
console.log('errors', errors);
await b.close();
