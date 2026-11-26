// One human phone + 4 bots, real timers (night min 15 s), local mode.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await browser.newContext();
const errors = [];
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const me = await ctx.newPage(); me.on('pageerror', e => errors.push('me ' + e.message));
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 4; i++) await tv.click('[data-host=addbot]');
await tv.screenshot({ path: 'test/shot-bots-lobby.png' });
await tv.click('[data-host=start]');
await me.click('[data-ready]');
const state = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
let s, n = 0;
while (n++ < 90) {
  s = await state();
  if (s.phase === 'over') break;
  const mine = s.players.find(p => p.name === 'Tom');
  if (s.phase === 'night' && mine.alive) { const b = await me.$('[data-pick]'); if (b && !(await me.$('.opt.on'))) await b.click(); }
  if (s.phase === 'vote' && mine.alive) { const b = await me.$('[data-vote]:not([data-vote=skip])'); if (b && !(await me.$('.opt.on'))) await b.click(); }
  if (s.phase === 'day') await tv.click('[data-host=next]');
  if (s.phase === 'verdict') await tv.click('[data-host=next]');
  await new Promise(r => setTimeout(r, 1500));
}
console.log('phase', s.phase, 'winner', s.winner, 'loops', n, '\n' + s.log.join('\n'));
await me.screenshot({ path: 'test/shot-bots-phone.png' });
console.log('errors', errors);
await browser.close();
