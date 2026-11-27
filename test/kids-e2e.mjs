import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = [];
for (const game of ['memory', 'copycat', 'hunt', 'freeze']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push(game + ' tv ' + e.message));
  await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
  await tv.evaluate(() => localStorage.clear()); await tv.reload(); await tv.waitForSelector('.code');
  const code = (await tv.textContent('.code')).trim();
  const me = await ctx.newPage(); me.on('pageerror', e => errors.push(game + ' me ' + e.message));
  await me.setViewportSize({ width: 390, height: 844 });
  await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Mia'); await me.click('#join');
  await me.waitForSelector("text=You're in");
  await tv.click('[data-host=addbot]');
  await tv.click('[data-shelf=all]'); await tv.click(`[data-game=${game}]`); await tv.click('[data-host=start]');
  const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
  let shot = false;
  for (let i = 0; i < 70; i++) {
    const s = await st(); if (s.phase === 'over') break;
    try {
      if (game === 'memory' && await me.$('.mmcard[data-i]')) { await me.click('.mmcard[data-i] >> nth=0', { timeout: 800 }); await me.waitForTimeout(300); if (await me.$('.mmcard[data-i]')) await me.click('.mmcard[data-i] >> nth=1', { timeout: 800 }); }
      if (game === 'copycat' && s.phase === 'input' && await me.$('[data-k]')) await me.click(`[data-k="${s.pattern[s.progress[Object.keys(s.hearts).find(k => !k.startsWith('bot-'))] || 0]}"]`, { timeout: 800 });
      if ((game === 'hunt' || game === 'freeze') && await me.$('[data-found], .kidbtn.freeze')) await me.click('[data-found], .kidbtn.freeze', { timeout: 800 });
    } catch (e) { }
    if (!shot && ((game === 'memory' && i === 6) || (game === 'copycat' && s.phase === 'input') || (game === 'hunt' && s.phase === 'go') || (game === 'freeze' && s.phase === 'dance'))) { await tv.screenshot({ path: `test/k-${game}-tv.png` }); await me.screenshot({ path: `test/k-${game}-phone.png` }); shot = true; }
    if (['done', 'result'].includes(s.phase)) await tv.click('[data-host=next]', { timeout: 500 }).catch(() => {});
    await tv.waitForTimeout(500);
  }
  console.log(game, (await st()).phase, shot);
  await ctx.close();
}
console.log('errors', errors);
await b.close();
