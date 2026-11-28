// Top Spot on a TV with a real phone: one guess lands on the board, the reveal plays, and the Sweep race takes several answers.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errs = [];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1&lite=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
const ph = await ctx.newPage(); await ph.setViewportSize({ width: 390, height: 800 }); ph.on('pageerror', e => errs.push('phone ' + e.message));
await ph.goto(base + 'play.html?local=1'); await ph.fill('#code', code); await ph.fill('#name', 'Tom'); await ph.click('#join'); await tv.waitForTimeout(500);
await tv.evaluate(() => document.querySelector('.gcard[data-game=topspot]').click()); await tv.waitForTimeout(700);
await tv.click('[data-host=start]'); await tv.waitForTimeout(500); if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')), s = h.state; return s ? { ph: s.phase, i: s.i, mode: s.plan[s.i], q: s.order[s.i], me: h.players.find(p => p.name === 'Tom').pid, score: s.scores[h.players.find(p => p.name === 'Tom').pid], settled: s.settled } : null; });
const { QUESTIONS } = await import('../js/games/crowd-bank.js');
await ph.waitForSelector('#tsi', { timeout: 20000 });
let s = await st(); const first = QUESTIONS[s.q].a[0][0];
await ph.fill('#tsi', first); await ph.click('#tsf button'); await tv.waitForTimeout(300);
const locked = await ph.evaluate(() => document.querySelector('#app').innerText.includes('Locked in'));
let t0 = Date.now(); while ((await st()).ph !== 'reveal' && Date.now() - t0 < 40000) await tv.waitForTimeout(100);
const heldPhone = await ph.evaluate(() => document.querySelector('#app').innerText.includes('Watch the TV'));
t0 = Date.now(); while (!(await st()).settled && Date.now() - t0 < 20000) await tv.waitForTimeout(100);
await tv.waitForTimeout(500);
const after = await st(); const tiles = await tv.evaluate(() => document.querySelectorAll('.tstile.flip').length);
const phoneWin = await ph.evaluate(() => document.querySelector('#app').innerText.replace(/\s+/g, ' ').slice(0, 160));
// jump to the Sweep round and find three answers
t0 = Date.now(); while ((await st()).ph !== 'sweep' && Date.now() - t0 < 60000) { await tv.evaluate(() => document.querySelector('.stage [data-host=next]')?.click()); await tv.waitForTimeout(400); }
s = await st(); const before = s.score; await ph.waitForSelector('#tsi');
for (const a of QUESTIONS[s.q].a.slice(0, 3)) { await ph.fill('#tsi', a[0]); await ph.click('#tsf button'); await tv.waitForTimeout(350); }
const sw = await st(); const found = await tv.evaluate(() => document.querySelectorAll('.tstile.found').length);
const ok = locked && heldPhone && tiles >= 6 && /\+\d/.test(phoneWin) && sw.score - before >= 150 && found >= 3 && !errs.length;
console.log(ok ? 'ok topspot-e2e' : 'FAIL', JSON.stringify({ locked, heldPhone, firstScore: after.score, tiles, phoneWin, sweepGain: sw.score - before, found, errs }));
await b.close(); process.exit(ok ? 0 : 1);
