// Review capture: plays every game with 4 bots and one real phone, and saves the TV and phone picture at each new phase.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const out = process.env.SHOTS; const ids = process.argv[2].split(',');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const log = {};
async function run(id) {
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } }); const errs = [];
  const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await tv.goto('http://localhost:8765/tv.html?local=1&intro'); await tv.waitForSelector('.code');
  const code = (await tv.textContent('.code')).trim();
  const ph = await ctx.newPage(); await ph.setViewportSize({ width: 390, height: 780 }); ph.on('pageerror', e => errs.push('phone ' + e.message.slice(0, 120)));
  await ph.goto(`http://localhost:8765/play.html?local=1&code=${code}`); await ph.fill('#name', 'Tom'); await ph.click('#join');
  for (let i = 0; i < 4; i++) await tv.click('[data-host=addbot]');
  await tv.click(`[data-game=${id}]`); await tv.click('[data-host=start]');
  const st = () => tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')); return { intro: !!h.intro, s: h.state && { phase: h.state.phase, round: h.state.round } }; });
  let n = 0; const phases = []; const snap = async (tag, wait = 1300) => { await tv.waitForTimeout(wait); const k = `${id}-${String(n++).padStart(2, '0')}-${tag}`; await tv.screenshot({ path: `${out}/${k}-tv.jpg`, quality: 60, type: 'jpeg' }); await ph.screenshot({ path: `${out}/${k}-ph.jpg`, quality: 60, type: 'jpeg' }); phases.push(tag); };
  const t0 = Date.now(); let lastK = '', stuck = 0, seen = {};
  await snap('intro', 1500); await ph.click('#hsok', { timeout: 800 }).catch(() => {}); await ph.click('#rdy', { timeout: 1500 }).catch(() => {});
  for (let i = 0; i < 400 && Date.now() - t0 < 70000; i++) {
    const { intro, s } = await st(); if (intro || !s) { await tv.waitForTimeout(500); if (i > 14) await tv.click('[data-host=next]').catch(() => {}); continue; }
    await ph.click('#hsok', { timeout: 200 }).catch(() => {});
    if (!seen[s.phase] && n < 7) { seen[s.phase] = 1; await snap(s.phase, s.phase === 'over' ? 5500 : 1600); }
    if (s.phase === 'over') break;
    const k = s.phase + s.round; if (k === lastK) stuck++; else { stuck = 0; lastK = k; }
    if (stuck > 6) { stuck = 0; await tv.click('[data-host=next]').catch(() => {}); }
    await tv.waitForTimeout(450);
  }
  log[id] = { phases, errs: [...new Set(errs)].slice(0, 3) }; await ctx.close();
}
for (const id of ids) await run(id).catch(e => { log[id] = { fail: String(e).slice(0, 160) }; });
fs.writeFileSync(`${out}/log-${ids[0]}.json`, JSON.stringify(log)); console.log(JSON.stringify(log)); await b.close();
