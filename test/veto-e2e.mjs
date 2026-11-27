import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const errors = [];
const tv = await ctx.newPage(); tv.setDefaultTimeout(6000); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
await tv.evaluate(() => localStorage.clear()); await tv.reload(); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const me = await ctx.newPage(); me.setDefaultTimeout(6000); me.on('pageerror', e => errors.push('me ' + e.message));
await me.setViewportSize({ width: 390, height: 844 });
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 2; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-host=kids]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=sketch]'); await tv.click('[data-host=start]');
await me.waitForSelector('#skt');
await me.fill('#skt', 'A dumb walrus'); await me.click('#skf [type=submit]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const s1 = await st();
const mine = s1.chains.flat().find(e => e && e.text && e.text.includes('walrus'));
console.log('kids mode text:', mine?.text);
await tv.click('.vetobtn'); await tv.screenshot({ path: 'test/veto-open.png' });
await tv.click('.vetolist [data-host^=hide]');
await tv.click('.vetopanel [data-host=veto]');
// skip ahead to the reveal
for (let i = 0; i < 12; i++) { const s = await st(); if (s.phase === 'reveal') break; await tv.click('[data-host=next]', { timeout: 800 }).catch(() => {}); await tv.waitForTimeout(500); }
let seen = false;
for (let i = 0; i < 30; i++) { const txt = await tv.textContent('#app'); if (txt.includes('hidden by host')) seen = true; if (txt.includes('walrus')) errors.push('walrus visible'); await tv.click('[data-host=next]', { timeout: 800 }).catch(() => {}); await tv.waitForTimeout(400); }
console.log('masked seen', seen, 'errors', errors);
await b.close();
