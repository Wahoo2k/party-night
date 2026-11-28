// Line Up on a TV with a real phone: move cards with the arrows, lock in, watch the order turn over, get scored.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { SETS } from '../js/games/lineup.js';
const base = 'http://localhost:8765/', errs = [], out = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1&lite=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
const ph = await ctx.newPage(); await ph.setViewportSize({ width: 390, height: 800 }); ph.on('pageerror', e => errs.push('phone ' + e.message));
await ph.goto(base + 'play.html?local=1'); await ph.fill('#code', code); await ph.fill('#name', 'Tom'); await ph.click('#join'); await tv.waitForTimeout(500);
await tv.evaluate(() => document.querySelector('.gcard[data-game=lineup]').click()); await tv.waitForTimeout(700);
await tv.click('[data-host=start]'); await tv.waitForTimeout(500); if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')), s = h.state, me = h.players.find(p => p.name === 'Tom').pid; return s ? { ph: s.phase, set: s.order[s.i], score: s.scores[me], settled: s.settled, line: s.lines[me] } : null; });
await ph.waitForSelector('.lulist', { timeout: 20000 }); await tv.waitForTimeout(3000);
if (out) await tv.screenshot({ path: out + '-order.png' });
const truth = SETS[(await st()).set][1].map(x => x[0]);
// sort the phone's list into the true order using only the up arrows (a simple insertion sort, as a person would)
for (let want = 0; want < 5; want++) {
  for (let guard = 0; guard < 6; guard++) {
    const names = await ph.$$eval('.luitem b', els => els.map(e => e.textContent));
    const at = names.indexOf(truth[want]); if (at === want) break;
    await ph.click(`[data-up="${at}"]`);
  }
}
if (out) await ph.screenshot({ path: out + '-phone.png' });
await ph.click('#lulock');
let t0 = Date.now(); while ((await st()).ph !== 'reveal' && Date.now() - t0 < 50000) await tv.waitForTimeout(100);
const mine = (await st()).line;
await tv.waitForTimeout(3000); if (out) await tv.screenshot({ path: out + '-mid.png' });
t0 = Date.now(); while (!(await st()).settled && Date.now() - t0 < 20000) await tv.waitForTimeout(100);
await tv.waitForTimeout(900); if (out) await tv.screenshot({ path: out + '-end.png' });
const end = await st(); const phoneSays = await ph.evaluate(() => document.querySelector('#app').innerText.replace(/\s+/g, ' ').slice(0, 140));
const tiles = await tv.evaluate(() => [...document.querySelectorAll('.luline .tstile b')].map(e => e.textContent));
const ok = JSON.stringify(mine) === '[0,1,2,3,4]' && end.score === 1250 && JSON.stringify(tiles) === JSON.stringify(truth) && /Perfect line/.test(phoneSays) && !errs.length;
console.log(ok ? 'ok lineup-e2e' : 'FAIL', JSON.stringify({ mine, score: end.score, tiles: tiles.length, phoneSays, errs }));
await b.close(); process.exit(ok ? 0 : 1);
