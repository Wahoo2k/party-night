// One Word with three real phones: two clue-givers type the same clue (both vanish), a third gets through, the guesser gets it right.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errs = [], out = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1&lite=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
const phones = {};
for (const n of ['Ana', 'Raj', 'Mia', 'Lee']) { const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 800 }); p.on('pageerror', e => errs.push(n + ' ' + e.message)); await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join'); phones[n] = p; }
await tv.waitForTimeout(500);
await tv.evaluate(() => document.querySelector('.gcard[data-game=oneword]').click()); await tv.waitForTimeout(700);
await tv.click('[data-host=start]'); await tv.waitForTimeout(500); if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');
for (const p of Object.values(phones)) { await p.waitForTimeout(300); const r = await p.$('#rdy'); if (r) await r.click(); }
const st = () => tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')), s = h.state; return s ? { ph: s.phase, word: s.words[s.i], guesser: h.players.find(p => p.pid === s.order[s.i % s.order.length]).name, hits: s.hits, settled: s.settled } : null; });
let t0 = Date.now(); while (!(await st()) && Date.now() - t0 < 30000) await tv.waitForTimeout(200);
await tv.waitForTimeout(3500);
const s0 = await st(), givers = Object.keys(phones).filter(n => n !== s0.guesser);
const tvHidesWord = !(await tv.evaluate(w => document.body.innerText.includes(w), s0.word));
const guesserBlind = !(await phones[s0.guesser].evaluate(w => document.body.innerText.includes(w), s0.word));
if (out) await tv.screenshot({ path: out + '-clue.png' });
const clues = ['Zzyzx', 'zzyzx', 'Qwfp'];
for (let i = 0; i < 3; i++) { const p = phones[givers[i]]; await p.waitForSelector('#owi'); await p.fill('#owi', clues[i]); await p.click('#owf button'); await tv.waitForTimeout(300); }
t0 = Date.now(); while ((await st()).ph !== 'guess' && Date.now() - t0 < 10000) await tv.waitForTimeout(100);
await tv.waitForTimeout(1500); if (out) { await tv.screenshot({ path: out + '-guess.png' }); await phones[s0.guesser].screenshot({ path: out + '-phone.png' }); }
const seen = await phones[s0.guesser].$$eval('.owlist span', els => els.map(e => e.textContent));
await phones[s0.guesser].fill('#owi', s0.word); await phones[s0.guesser].click('#owf button');
t0 = Date.now(); while (!(await st()).settled && Date.now() - t0 < 20000) await tv.waitForTimeout(100);
await tv.waitForTimeout(700); if (out) await tv.screenshot({ path: out + '-result.png' });
const end = await st(), cut = await tv.evaluate(() => document.querySelectorAll('.owclue.cut').length);
const ok = tvHidesWord && guesserBlind && JSON.stringify(seen) === '["Qwfp"]' && end.hits === 1 && cut === 2 && !errs.length;
console.log(ok ? 'ok oneword-e2e' : 'FAIL', JSON.stringify({ tvHidesWord, guesserBlind, seen, hits: end.hits, cut, errs }));
await b.close(); process.exit(ok ? 0 : 1);
