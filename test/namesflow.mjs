import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const errors = [];
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
await tv.evaluate(() => localStorage.clear()); await tv.reload(); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const join = async (n, expectError) => {
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(n + ' ' + e.message));
  await p.setViewportSize({ width: 390, height: 700 });
  await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join');
  if (expectError) { await p.waitForSelector('.lose'); return [p, await p.textContent('.lose')]; }
  await p.waitForSelector("text=You're in"); return [p, await p.textContent('#app h2')];
};
const [a, an] = await join('Tom'); const [b2, bn] = await join('tom'); const [c, cerr] = await join('sh1t', true);
const [d, dn] = await join('  Zoë​  🐺  ');
console.log(an, '|', bn, '|', cerr, '|', dn);
await b2.screenshot({ path: 'test/n-phone.png' });
// host renames Tom 2 then removes Zoë
await tv.click('[data-game=quick]'); await tv.waitForSelector('.lobby.gather');   // names are managed on the join screen's seats
await tv.click('button.seat:has-text("tom 2")');
await tv.fill('#rename', 'Grandpa'); await tv.click('[data-host=rename]');
await b2.waitForSelector('text=Grandpa'); console.log('renamed:', await b2.textContent('#app h2'), await b2.textContent('.note'));
await tv.click('button.seat:has-text("Zoë")'); await tv.screenshot({ path: 'test/n-tv.png' });
await tv.click('[data-host=kick]');
await d.waitForSelector('text=You were removed'); console.log('kicked ok');
console.log('roster:', await tv.$$eval('.seat.taken b', els => els.map(e => e.textContent)));
// dice
await c.click('#dice'); console.log('dice:', await c.inputValue('#name'));
console.log('errors', errors);
await b.close();
