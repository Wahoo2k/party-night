// Full game in one browser: TV tab + 6 phone tabs over BroadcastChannel (?local=1).
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const errors = [];
const watch = (p, tag) => { p.on('pageerror', e => errors.push(tag + ': ' + e.message)); p.on('console', m => m.type() === 'error' && !/fonts|jsdelivr|ERR_/.test(m.text()) && errors.push(tag + ' console: ' + m.text())); };
const tv = await ctx.newPage(); watch(tv, 'tv');
await tv.goto(base + 'tv.html?local=1');
await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
console.log('room', code);
const names = ['Tom', 'Alex', 'Sam', 'Jordan', 'Riley', 'Casey'];
const phones = [];
for (const n of names) {
  const p = await ctx.newPage(); watch(p, n);
  await p.setViewportSize({ width: 390, height: 800 });
  await p.goto(base + 'play.html?local=1');
  await p.fill('#code', code); await p.fill('#name', n); await p.click('form .btn');
  await p.waitForSelector('text=You\'re in');
  phones.push(p);
}
await tv.waitForSelector('text=6 players in');
await tv.screenshot({ path: 'test/shot-lobby.png' });
await phones[0].screenshot({ path: 'test/shot-phone-lobby.png' });
await tv.click('[data-host=start]');
for (const p of phones) await p.waitForSelector('[data-ready]');
// peek at a card
const c = await phones[0].$('#card'); const b = await c.boundingBox();
await phones[0].mouse.move(b.x + 50, b.y + 50); await phones[0].mouse.down();
await phones[0].screenshot({ path: 'test/shot-phone-card.png' }); await phones[0].mouse.up();
for (const p of phones) await p.click('[data-ready]');
await tv.waitForSelector('text=Eyes on your own phone');
let rounds = 0;
const settle = () => new Promise(r => setTimeout(r, 350));
while (rounds++ < 12) {
  const phase = await tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state.phase);
  if (phase === 'over') break;
  if (phase === 'night' || phase === 'vote') {
    for (const p of phones) {
      const btns = await p.$$(phase === 'night' ? '[data-pick]' : '[data-vote]:not([data-vote=skip])');
      if (btns.length) await btns[Math.floor(Math.random() * btns.length)].click();
    }
    if (rounds === 1) { await settle(); await phones[1].screenshot({ path: 'test/shot-phone-night.png' }); await tv.screenshot({ path: 'test/shot-tv-night.png' }); }
    await settle();
  }
  if (phase === 'night') { await tv.click('[data-host=next]'); } // skip the 15 s minimum
  else if (phase === 'day') { if (rounds < 3) await tv.screenshot({ path: 'test/shot-tv-day.png' }); await tv.click('[data-host=next]'); }
  else if (phase === 'verdict') { if (rounds < 4) await tv.screenshot({ path: 'test/shot-tv-verdict.png' }); await tv.click('[data-host=next]'); }
  await settle();
}
await settle();
const final = await tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
console.log('phase', final.phase, 'winner', final.winner, '\n' + final.log.join('\n'));
await tv.screenshot({ path: 'test/shot-tv-over.png' });
await phones[2].screenshot({ path: 'test/shot-phone-over.png' });
// TV refresh mid-lobby recovery: back to lobby, reload TV, phones still listed
await tv.click('[data-host=lobby]'); await tv.reload(); await tv.waitForSelector('text=6 players in');
console.log('errors', errors);
await browser.close();
