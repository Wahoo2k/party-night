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
await tv.click('[data-host=addbot]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=ducks]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const myPid = await me.evaluate(() => Object.entries(sessionStorage).find(([k]) => k.startsWith('pg-pid'))[1].replace(/"/g, ''));
let shots = 0, tossesByMe = 0;
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  const cur = s.order[s.t % s.order.length];
  if (cur === myPid && !s.ending) {
    const sw = await me.$('#swipe:not(.locked)');
    if (sw) {
      if (s.turnPts >= 12) { await me.click('[data-bank]'); }
      else {
        const box = await sw.boundingBox();
        await me.mouse.move(box.x + box.width / 2, box.y + box.height - 10); await me.mouse.down();
        await me.mouse.move(box.x + box.width / 2, box.y + 5, { steps: 6 }); await me.mouse.up();
        tossesByMe++;
        if (shots === 0) { await tv.waitForTimeout(700); await tv.screenshot({ path: 'test/d-tv-mid.png' }); await tv.waitForTimeout(1300); await tv.screenshot({ path: 'test/d-tv-land.png' }); await me.screenshot({ path: 'test/d-phone.png' }); shots = 1; }
      }
    }
  }
  await tv.waitForTimeout(400);
}
await tv.waitForTimeout(3000);
const s = await st(); console.log(s.phase, JSON.stringify(s.scores), 'my tosses', tossesByMe, 'turns', s.t);
await tv.screenshot({ path: 'test/d-tv-over.png' });
console.log('errors', errors);
await b.close();
