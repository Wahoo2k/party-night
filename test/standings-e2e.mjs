// The standings screen comes up between results in a points game, holds the game, and a press skips it.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errs = [], shotDir = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push(e.message));
await tv.goto(base + 'tv.html?local=1&standgap=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
const phones = [];
for (const n of ['Ana', 'Raj', 'Mia']) { const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 800 }); await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join'); phones.push(p); }
await tv.waitForTimeout(500);
await tv.evaluate(() => document.querySelector('.gcard[data-game=fib]').click()); await tv.waitForTimeout(700);
await tv.click('[data-host=start]'); await tv.waitForTimeout(500); if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');
for (const p of phones) { await p.waitForTimeout(300); const r = await p.$('#rdy'); if (r) await r.click(); }
const st = () => tv.evaluate(() => { const s = JSON.parse(localStorage.getItem('pg-host')).state; return s && { phase: s.phase, n: s.n ?? s.i ?? s.q, truth: s.cur?.truth ?? s.truth, s: JSON.stringify(s).length }; });
let seen = 0, held = false, skipped = false, t0 = Date.now();
while (Date.now() - t0 < 100000 && seen < 2) {
  const s = await st(); if (!s || s.phase === 'over') break;
  for (const [i, p] of phones.entries()) { const bt = await p.$$('[data-v]:not([disabled])'); if (bt.length) await bt[i === 0 ? 0 : bt.length - 1].click().catch(() => {}); }
  const nx = await tv.$('.stage [data-host=next]');
  if (nx && !(await tv.$(".standings")) && (s.phase !== "reveal" || await tv.evaluate(() => { const h = JSON.parse(localStorage.getItem("pg-host")).state; return Date.now() > h.settleAt + 300; }))) { const before = JSON.stringify(await st()); await nx.click().catch(() => {}); await tv.waitForTimeout(700);
    if (await tv.$('.standings')) { seen++; held = JSON.stringify(await st()) === before; if (seen === 1 && shotDir) { await tv.waitForTimeout(1500); await tv.screenshot({ path: shotDir + '/standings.png' }); }
      if (seen === 2) { await tv.keyboard.press('Enter').catch(() => {}); await tv.evaluate(() => document.querySelector('.standings')?.click()); await tv.waitForTimeout(300); skipped = JSON.stringify(await st()) !== before; } else await tv.waitForTimeout(5200); } }
  await tv.waitForTimeout(200);
}
const ok = seen >= 2 && held && skipped && !errs.length;
console.log((ok ? 'ok' : 'FAIL') + ' standings-e2e ' + JSON.stringify({ seen, held, skipped, errs })); await b.close(); process.exit(ok ? 0 : 1);
