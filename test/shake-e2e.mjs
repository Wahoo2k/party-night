// Shake It with three phones. Two get pretend movement readings (one shakes hard, one gently); the third has no sensor
// and taps instead. Checks the race order, the held-back scores, and the tap stand-in.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errs = [], out = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1&lite=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
const phones = {};
for (const n of ['Ana', 'Raj', 'Mia']) { const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 800 }); p.on('pageerror', e => errs.push(n + ' ' + e.message)); await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join'); phones[n] = p; }
await tv.waitForTimeout(500);
await tv.evaluate(() => document.querySelector('.gcard[data-game=shake]').click()); await tv.waitForTimeout(700);
await tv.click('[data-host=start]'); await tv.waitForTimeout(500); if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');
for (const p of Object.values(phones)) { await p.waitForTimeout(300); const r = await p.$('#rdy'); if (r) await r.click(); }
const st = () => tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')), s = h.state; const by = o => Object.fromEntries(h.players.map(p => [p.name, o[p.pid]])); return s ? { ph: s.phase, kind: s.events[s.i], amt: by(s.amt), scores: by(s.scores), settled: s.settled } : null; });
let t0 = Date.now(); while (!(await st()) && Date.now() - t0 < 30000) await tv.waitForTimeout(200);
await tv.waitForTimeout(3500); if (out) { await tv.screenshot({ path: out + '-setup.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
// pretend movement: a steady stream of readings, 60 a second, at the given strength
const shakeIt = (p, strength) => p.evaluate(a => { window.__m = setInterval(() => window.dispatchEvent(new DeviceMotionEvent('devicemotion', { acceleration: { x: a, y: 0, z: 0 }, interval: 16 })), 16); }, strength);
for (const p of Object.values(phones)) { await p.waitForSelector('#shok'); await p.click('#shok'); await p.waitForTimeout(200); }
await shakeIt(phones.Ana, 30); await shakeIt(phones.Raj, 6);
t0 = Date.now(); while ((await st()).ph !== 'ready' && Date.now() - t0 < 10000) await tv.waitForTimeout(100);
await tv.waitForTimeout(3000); if (out) await tv.screenshot({ path: out + '-ready.png' });
t0 = Date.now(); while ((await st()).ph !== 'go' && Date.now() - t0 < 15000) await tv.waitForTimeout(100);
await phones.Mia.waitForSelector('#shtap'); const miaHasButton = true, anaHasButton = !!(await phones.Ana.$('#shtap'));
for (let i = 0; i < 30; i++) { const t = await phones.Mia.$('#shtap'); if (t) await t.dispatchEvent('pointerdown'); await tv.waitForTimeout(120); }
if (out) { await tv.screenshot({ path: out + '-go.png' }); await phones.Mia.screenshot({ path: out + '-phone2.png' }); }
t0 = Date.now(); while ((await st()).ph !== 'result' && Date.now() - t0 < 15000) await tv.waitForTimeout(100);
const mid = await st(); await tv.waitForTimeout(600); const early = await tv.evaluate(() => [...document.querySelectorAll('.score b,.srow b')].map(e => e.textContent).join(','));
t0 = Date.now(); while (!(await st()).settled && Date.now() - t0 < 20000) await tv.waitForTimeout(100);
await tv.waitForTimeout(2500); if (out) await tv.screenshot({ path: out + '-result.png' });
const end = await st();
const ok = !anaHasButton && miaHasButton && mid.amt.Ana > mid.amt.Raj && mid.amt.Raj > 0 && mid.amt.Mia > 0 && !/300/.test(early) && end.scores.Ana === 300 && !errs.length;
console.log(ok ? 'ok shake-e2e' : 'FAIL', JSON.stringify({ anaHasButton, amt: mid.amt, early, scores: end.scores, errs }));
await b.close(); process.exit(ok ? 0 : 1);
