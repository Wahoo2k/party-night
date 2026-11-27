// The shared kit: timer bar, reaction sounds wired, winners' ceremony, and a few signature moments. Bots only.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const out = process.env.SHOTS || 'test';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = [];
async function run(id, steps) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push(id + ' ' + e.message));
  await tv.goto('http://localhost:8765/tv.html?local=1'); await tv.waitForSelector('.code');
  for (let i = 0; i < 5; i++) await tv.click('[data-host=addbot]');
  await tv.click(`[data-game=${id}]`); await tv.click('[data-host=start]');
  const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
  const t0 = Date.now(); const seen = {}; const res = {}; let lastK = '', stuck = 0;
  for (let i = 0; i < 900; i++) {
    const s = await st(); if (!s || Date.now() - t0 > 100000) break;
    for (const [ph, waits] of Object.entries(steps)) if (s.phase === ph && !seen[ph]) {
      seen[ph] = 1; let t = 0;
      for (const w of waits) { await tv.waitForTimeout(w - t); t = w; await tv.screenshot({ path: `${out}/kit-${id}-${ph}-${w}.png` }); }
      res[ph] = await tv.evaluate(() => ({ bar: !document.getElementById('tbar').hidden, cer: !!document.querySelector('.ceremony'), pods: document.querySelectorAll('.cpod').length }));
    }
    if (s.phase === 'over') break;
    const k = s.phase + s.round; if (k === lastK) stuck++; else { stuck = 0; lastK = k; }
    if (stuck > 30) { stuck = 0; await tv.click('[data-host=next]').catch(() => {}); }
    await tv.waitForTimeout(400);
  }
  console.log(id, JSON.stringify(res)); await ctx.close();
}
const which = process.argv[2];
const all = { funny: { vote: [700], result: [1500], over: [5000] }, meld: { reveal: [1000, 2800] }, potato: { live: [6000], boom: [300] }, doodle: { fake: [1500], reveal: [900, 2800] }, quick: { vote: [4000], reveal: [1200, 3000] }, midnight: { over: [5500] }, crew: { reveal: [1600] }, imposter: { clues: [6000] } };
const extra = { rebus: { solve: [6000], reveal: [3000] }, bracket: { predict: [1500], result: [2500], champ: [4500] }, faker: { read: [4200], talk: [1500], result: [1500] }, meter: { bet: [1500], reveal: [3500] }, estimate: { bet: [1500] }, werewolf: { night: [5000] }, imposter: { over: [5200] }, bingo: { calling: [20000] }, crew: { over: [4500] } };
if (which && which.includes(',')) { for (const id of which.split(',')) await run(id, extra[id] || all[id] || {}); }
else for (const [id, steps] of Object.entries(all)) if (!which || which === id) await run(id, steps);
console.log('errors', errors); await b.close(); process.exit(errors.length ? 1 : 0);
