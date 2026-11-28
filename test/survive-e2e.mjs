// Last One Standing with three real phones: one right, one wrong, one silent. Lives and scores wait for the reveal on the TV.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errs = [], out = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1&lite=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
const phones = {};
for (const n of ['Ana', 'Raj', 'Mia']) { const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 800 }); p.on('pageerror', e => errs.push(n + ' ' + e.message)); await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join'); phones[n] = p; }
await tv.waitForTimeout(500);
await tv.evaluate(() => document.querySelector('.gcard[data-game=survive]').click()); await tv.waitForTimeout(700);
await tv.click('[data-host=start]'); await tv.waitForTimeout(500); if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');
for (const p of Object.values(phones)) { await p.waitForTimeout(300); const r = await p.$('#rdy'); if (r) await r.click(); }
const st = () => tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')), s = h.state; const by = o => Object.fromEntries(h.players.map(p => [p.name, o[p.pid]])); return s ? { ph: s.phase, answer: s.q.answer, lives: by(s.lives), scores: by(s.scores), settled: s.settled } : null; });
let t0 = Date.now(); while (!(await st()) && Date.now() - t0 < 30000) await tv.waitForTimeout(200);
await tv.waitForTimeout(4000); const s0 = await st();
if (out) { await tv.screenshot({ path: out + '-q.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
const tvHides = (await tv.$$('.loopt.right')).length === 0;
await phones.Ana.click(`.opt[data-i="${s0.answer}"]`); await phones.Raj.click(`.opt[data-i="${(s0.answer + 1) % 4}"]`);
await tv.waitForTimeout(600); await tv.click('[data-host=next]');
await tv.waitForTimeout(700); const early = await tv.evaluate(() => [...document.querySelectorAll('.score b,.srow b')].map(e => e.textContent).join(','));
t0 = Date.now(); while (!(await st()).settled && Date.now() - t0 < 20000) await tv.waitForTimeout(100);
await tv.waitForTimeout(1200); if (out) { await tv.screenshot({ path: out + '-rev.png' }); await phones.Raj.screenshot({ path: out + '-phone2.png' }); }
const end = await st(), hit = await tv.$$eval('.locard.hit', e => e.length), right = await tv.$$eval('.loopt.right span', e => e.length);
const rajSays = await phones.Raj.evaluate(() => document.body.innerText);
const ok = tvHides && !/100/.test(early) && end.lives.Ana === 3 && end.lives.Raj === 2 && end.lives.Mia === 2 && end.scores.Ana === 100 && hit === 2 && right === 1 && /lose a life/.test(rajSays) && !errs.length;
console.log(ok ? 'ok survive-e2e' : 'FAIL', JSON.stringify({ tvHides, early, lives: end.lives, scores: end.scores, hit, right, errs }));
await b.close(); process.exit(ok ? 0 : 1);
