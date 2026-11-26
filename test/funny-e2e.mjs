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
await tv.click('[data-game=funny]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {}; let k = 0;
const lines = ['A sock puppet with a law degree', 'Uncle Bob\'s karaoke', 'Tacos, obviously', 'Free hugs from a cactus', 'A llama named Kevin', 'Spaghetti sculpture'];
for (let i = 0; i < 300; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  const f = await me.$('#ff'); if (f) { if (!shots.w) { await me.screenshot({ path: 'test/f-write.png' }); shots.w = 1; } await me.fill('#fa', lines[k++ % lines.length]); await me.click('#ff .btn'); }
  if (s.phase === 'vote') { const p = await me.$('[data-pick]'); if (p && !(await me.$('.opt.on'))) await p.click(); if (!shots.v) { await tv.waitForTimeout(800); await tv.screenshot({ path: 'test/f-tv-vote.png' }); shots.v = 1; } }
  if (s.phase === 'result') { if (!shots.r) { await tv.waitForTimeout(800); await tv.screenshot({ path: 'test/f-tv-result.png' }); shots.r = 1; } await tv.click('[data-host=next]').catch(() => {}); }
  if (s.phase === 'finalVote') { const p = await me.$('[data-pick]'); if (p && !(await me.$('.opt.on'))) await p.click(); }
  if (s.phase === 'finalResult') { await tv.waitForTimeout(1000); await tv.screenshot({ path: 'test/f-tv-final.png' }); await tv.click('[data-host=next]').catch(() => {}); }
  await tv.waitForTimeout(500);
}
const s = await st(); console.log(s.phase, JSON.stringify(s.scores), 'errors', errors);
await b.close();
