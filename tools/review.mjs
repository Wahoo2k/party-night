import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const out = process.argv[2], ids = process.argv.slice(3), base = 'http://localhost:8765/', CAP = 330000;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const id of ids) {
  const r = { id, phases: [], shots: [], errs: [], over: false, secs: 0, issues: [], minFont: 99 };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  try {
    const tv = await ctx.newPage(); tv.on('pageerror', e => r.errs.push(e.message.slice(0, 160)));
    await tv.goto(base + 'tv.html?local=1&standgap=45'); await tv.waitForSelector('.code', { timeout: 15000 });
    await tv.evaluate(g => document.querySelector(`.gcard[data-game=${g}]`)?.click(), id); await tv.waitForTimeout(600);
    for (let i = 0; i < 5; i++) { const a = await tv.$('[data-host=addbot]'); if (a) await a.click().catch(() => {}); await tv.waitForTimeout(120); }
    for (let i = 0; i < 5 && await tv.$('[data-host=start][disabled]'); i++) { const a = await tv.$('[data-host=addbot]'); if (a) await a.click().catch(() => {}); await tv.waitForTimeout(150); }
    r.players = await tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host') || sessionStorage.getItem('pg-host') || '{}').players?.length);
    await tv.screenshot({ path: `${out}/${id}-00-lobby.png` }); r.shots.push('lobby');
    const t0 = Date.now(), seenAt = {}; let last = '', stuck = 0, lastChange = Date.now();
    while (Date.now() - t0 < CAP) {
      const st = await tv.evaluate(() => { const h = JSON.parse(sessionStorage.getItem('pg-host') || localStorage.getItem('pg-host') || '{}'); return { phase: h.state ? h.state.phase : h.intro ? '_intro' : '_lobby', key: h.state ? [h.state.phase, h.state.round, h.state.n, h.state.turn, h.state.i, h.state.q, h.state.k].join('|') : '' }; });
      if (st.key !== last) { last = st.key; lastChange = Date.now(); }
      if (st.phase === '_lobby' || st.phase === '_intro') { const s2 = await tv.$('[data-host=start]:not([disabled])'); if (s2) await s2.click().catch(() => {}); if (st.phase === '_intro' && !r.phases.includes('_intro')) { r.phases.push('_intro'); await tv.waitForTimeout(900); await tv.screenshot({ path: `${out}/${id}-01-intro.png` }); r.shots.push('intro'); } await tv.waitForTimeout(700); continue; }
      if (!r.phases.includes(st.phase) && !seenAt[st.phase]) seenAt[st.phase] = Date.now();
      if (!r.phases.includes(st.phase) && Date.now() - seenAt[st.phase] >= (st.phase === 'over' ? 5000 : 4300)) {
        r.phases.push(st.phase);
        if (r.shots.length < 15) { const n = String(r.shots.length + 1).padStart(2, '0'); await tv.screenshot({ path: `${out}/${id}-${n}-${st.phase}.png` }); r.shots.push(st.phase); }
        const m = await tv.evaluate(() => { const out = { clip: [], min: 99 }; const W = innerWidth, H = innerHeight; for (const el of document.querySelectorAll('.stage *, .panel *')) { if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) continue; const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue; const fs = parseFloat(cs.fontSize); if (fs < out.min) out.min = fs; if (b.right > W + 4 || b.bottom > H + 4 || b.left < -4 || b.top < -4) out.clip.push(el.textContent.trim().slice(0, 40)); if (el.scrollWidth > el.clientWidth + 6 && cs.overflow !== 'visible' && cs.textOverflow === 'ellipsis') out.clip.push('…' + el.textContent.trim().slice(0, 30)); } return out; });
        if (m.min < r.minFont) r.minFont = m.min; if (m.clip.length) r.issues.push(st.phase + ': ' + [...new Set(m.clip)].slice(0, 3).join(' / '));
        if (st.phase === 'over') { r.over = true; r.secs = Math.round((Date.now() - t0) / 1000); break; }
      }
      if (Date.now() - lastChange > 40000) { const nx = await tv.$('[data-host=next]'); if (nx) { await nx.click().catch(() => {}); stuck++; lastChange = Date.now(); } else if (Date.now() - lastChange > 70000) { r.issues.push('stalled in ' + st.phase); break; } }
      await tv.waitForTimeout(500);
    }
    if (!r.over) { r.secs = Math.round((Date.now() - t0) / 1000); await tv.screenshot({ path: `${out}/${id}-99-end.png` }); }
    r.nudged = stuck;
  } catch (e) { r.errs.push('harness: ' + e.message.slice(0, 160)); }
  await ctx.close();
  fs.writeFileSync(`${out}/${id}.json`, JSON.stringify(r));
  console.log(JSON.stringify({ id, over: r.over, secs: r.secs, phases: r.phases.length, shots: r.shots.length, errs: r.errs.length, issues: r.issues.length }));
}
await b.close();
