// No-TV play: one phone hosts (the TV page runs unseen inside it), a second phone joins with the code, the host picks
// a game and starts it, both answer, and both phones show the board's picture above their controls.
import { chromium, devices } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errs = [], out = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const phone = async n => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(n + ' ' + e.message)); await p.goto(base + 'play.html?local=1'); return p; };
const ana = await phone('Ana'); await ana.fill('#name', 'Ana'); await ana.click('#hosthere');
await ana.waitForSelector('.notvcode .code', { timeout: 20000 }); const code = (await ana.textContent('.notvcode .code')).trim();
const raj = await phone('Raj'); await raj.fill('#code', code); await raj.fill('#name', 'Raj'); await raj.click('#join');
await raj.waitForSelector('.notvcode'); const rajNoPicker = !(await raj.$('#pickgame')), anaPicker = !!(await ana.$('#pickgame'));
await ana.selectOption('#pickgame', 'survive'); await ana.waitForTimeout(600); await ana.selectOption('#pickgame', 'fib'); await ana.waitForTimeout(800);
const rajSees = await raj.evaluate(() => document.body.innerText.includes('Fact or Fib'));
if (out) await ana.screenshot({ path: out + '-lobby.png' });
await ana.waitForSelector('[data-rm=start]:not([disabled])'); await ana.click('[data-rm=start]');
for (const p of [ana, raj]) { await p.waitForSelector('#rdy, [data-v]', { timeout: 15000 }); const r = await p.$('#rdy'); if (r) await r.click(); }
await ana.waitForSelector('[data-v]', { timeout: 30000 }); await raj.waitForSelector('[data-v]');
const boards = []; for (const p of [ana, raj]) boards.push(await p.waitForFunction(() => { const f = document.querySelector('#tvbox iframe'); try { return !!f && /statement 1/i.test(f.contentDocument.body.innerText); } catch { return false; } }, null, { timeout: 15000 }).then(() => true, () => false));
if (out) await ana.screenshot({ path: out + '-play.png' });
await ana.click('[data-v="1"]'); await raj.click('[data-v="0"]');
await ana.waitForFunction(() => /Right!|Wrong/.test(document.body.innerText), null, { timeout: 20000 });
if (out) await raj.screenshot({ path: out + '-result.png' });
const texts = [await ana.evaluate(() => document.body.innerText), await raj.evaluate(() => document.body.innerText)];
const oneRight = texts.filter(t => /Right!/.test(t)).length === 1 && texts.filter(t => /Wrong/.test(t)).length === 1;
// the host reloads their phone: the game carries on from where it was
await ana.reload(); await ana.waitForFunction(() => /Fact or Fib|Statement|TRUE|Right!|Wrong|Watch/.test(document.body.innerText), null, { timeout: 20000 }); const resumed = !(await ana.$('#f'));
const ok = /^[A-Z]{4}$/.test(code) && rajNoPicker && anaPicker && rajSees && boards[0] === true && boards[1] === true && oneRight && resumed && !errs.length;
console.log(ok ? 'ok notv-e2e' : 'FAIL', JSON.stringify({ code, rajNoPicker, anaPicker, rajSees, boards, oneRight, resumed, errs }));
await b.close(); process.exit(ok ? 0 : 1);
