// Shared opening for the new-game browser tests: a TV, three phones, pick a game, start it.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
export async function open(game, names = ['Ana', 'Raj', 'Mia']) {
  const base = 'http://localhost:8765/', errs = [];
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push('tv ' + e.message));
  await tv.goto(base + 'tv.html?local=1&lite=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
  const phones = {};
  for (const n of names) { const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 800 }); p.on('pageerror', e => errs.push(n + ' ' + e.message)); await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join'); phones[n] = p; }
  await tv.waitForTimeout(500);
  await tv.evaluate(g => document.querySelector(`.gcard[data-game=${g}]`).click(), game); await tv.waitForTimeout(700);
  await tv.click('[data-host=start]'); await tv.waitForTimeout(500); if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');
  for (const p of Object.values(phones)) { await p.waitForTimeout(300); const r = await p.$('#rdy'); if (r) await r.click(); }
  const state = fn => tv.evaluate(f => { const h = JSON.parse(localStorage.getItem('pg-host')); if (!h.state) return null; const by = o => Object.fromEntries(h.players.map(p => [p.name, o[p.pid]])); return new Function('s', 'by', 'return (' + f + ')(s, by)')(h.state, by); }, fn.toString());
  const until = async (fn, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await fn(); if (v) return v; await tv.waitForTimeout(100); } return null; };
  await until(() => state(s => 1));
  return { b, tv, phones, errs, state, until };
}
