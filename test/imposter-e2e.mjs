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
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-game=imposter]');
await tv.click('[data-host=start]');
await me.waitForSelector('[data-ready]');
const c = await me.$('#card'); const bb = await c.boundingBox(); await me.mouse.move(bb.x + 40, bb.y + 40); await me.mouse.down(); await me.screenshot({ path: 'test/i-card.png' }); await me.mouse.up();
await me.click('[data-ready]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
let shotClue = false, shotBoard = false;
for (let i = 0; i < 120; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  if (s.phase === 'clues' && await me.$('#cf')) {
    if (!shotClue) { await me.screenshot({ path: 'test/i-myturn.png' }); shotClue = true; }
    await me.fill('#clue', s.imposter === 'x' ? 'hmm' : (s.word === 'Cold' ? 'brr' : 'Fuzzy')); await me.click('#cf .btn');
  }
  if (s.phase === 'clues' && s.turn > 4 && !shotBoard) { await tv.screenshot({ path: 'test/i-tv-clues.png' }); shotBoard = true; }
  if (s.phase === 'discuss') { await tv.screenshot({ path: 'test/i-tv-discuss.png' }); await me.screenshot({ path: 'test/i-discuss.png' }); await tv.click('[data-host=next]'); }
  if (s.phase === 'vote') { const o = await me.$('[data-vote]'); if (o && !(await me.$('.opt.on'))) await o.click(); }
  if (s.phase === 'guess' && await me.$('#gf')) { await me.fill('#guess', 'Penguin'); await me.click('#gf .btn'); }
  await tv.waitForTimeout(800);
}
await tv.waitForTimeout(3500);
const s = await st();
console.log(s.phase, s.result, s.word, 'imposter', s.imposter.startsWith('bot') ? 'bot' : 'Tom', s.clues.map(c => c.text).join(','));
await tv.screenshot({ path: 'test/i-tv-over.png' }); await me.screenshot({ path: 'test/i-over.png' });
await tv.click('[data-host=again]'); await tv.waitForTimeout(500);
const s2 = await st(); console.log('round2', s2.round, s2.phase, 'scores kept', JSON.stringify(s2.scores));
console.log('errors', errors);
await b.close();
