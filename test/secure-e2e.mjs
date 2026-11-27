// Private messages and pause: a snooping tab on the same channel must not be able to read roles or actions.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const errors = [];
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
await tv.evaluate(() => localStorage.clear()); await tv.reload(); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
// the snoop listens to everything on the room's channel
const snoop = await ctx.newPage(); await snoop.goto(base + 'index.html');
await snoop.evaluate(async code => { const { CHANNEL_PREFIX } = await import('./js/config.js'); window.seen = []; const bc = new BroadcastChannel(CHANNEL_PREFIX + code); bc.onmessage = e => window.seen.push(JSON.stringify(e.data)); }, code);
const phones = [];
for (const name of ['Tom', 'Ann', 'Raj', 'Lee']) {
  const me = await ctx.newPage(); me.on('pageerror', e => errors.push(name + ' ' + e.message));
  await me.setViewportSize({ width: 390, height: 844 });
  await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', name); await me.click('#join');
  await me.waitForSelector("text=You're in"); phones.push(me);
}
await tv.click('[data-game=imposter]'); await tv.click('[data-host=start]');
await tv.waitForTimeout(2500);
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')));
let h = await st();
const word = h.state.word || h.state.secret || '';
const seen = await snoop.evaluate(() => window.seen);
const views = seen.filter(x => x.includes('"t":"view"'));
console.log('word', word, '| views seen', views.length, '| any plaintext view', views.some(x => x.includes('"view":')), '| word leaked', !!word && seen.some(x => x.includes(word)));
// each phone still got its own view
let shown = 0; for (const me of phones) if (!(await me.$("text=You're in"))) shown++;
console.log('phones in game', shown);
// pause shifts the deadline and blocks actions
await tv.click('[data-host=next]').catch(() => {}); await tv.waitForTimeout(1500); h = await st(); console.log('phase', h.state.phase, 'deadline set', h.state.deadline > 1e12);
const d0 = h.state.deadline; await tv.click('[data-host=pause]'); await tv.waitForTimeout(2000);
const pausedOnPhone = await phones[0].evaluate(() => document.body.classList.contains('paused'));
await tv.screenshot({ path: 'test/pause-tv.png' });
await tv.click('[data-host=pause]'); h = await st();
console.log('paused banner on phone', pausedOnPhone, '| deadline moved by', h.state.deadline - d0, 'ms');
// an action after resume works and is encrypted on the wire
const before = (await snoop.evaluate(() => window.seen)).length;
let typed = false; for (let k = 0; k < 6 && !typed; k++) { for (const me of phones) { const inp = await me.$('#app input'); if (inp) { await inp.fill('desert'); await me.keyboard.press('Enter'); typed = true; break; } } await tv.waitForTimeout(500); }
const h2 = await st(); console.log('typed', typed, 'clues', JSON.stringify(h2.state.clues || h2.state.given || '').slice(0, 80));
await tv.waitForTimeout(1200);
const acts = (await snoop.evaluate(() => window.seen)).slice(before).filter(x => x.includes('"t":"act"'));
console.log('acts seen', acts.length, '| plaintext act', acts.some(x => x.includes('"a":')), '| errors', errors);
await b.close();
