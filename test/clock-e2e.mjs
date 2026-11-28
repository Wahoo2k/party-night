// Inner Clock with three phones: the TV clock runs then hides, phones stop at different moments, the closest wins.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('clock');
await until(() => state(s => s.phase === 'run'));
const { t: target, g: t0 } = await state(s => ({ t: s.rounds[0].target, g: s.goAt }));
await tv.waitForTimeout(1500); const shown = await tv.textContent('.ckface'); if (out) { await tv.screenshot({ path: out + '-run.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
await tv.waitForTimeout(2200); const hidden = await tv.textContent('.ckface'); if (out) await tv.screenshot({ path: out + '-hid.png' });
const noClockOnPhone = !/\d\d\.\d\d/.test(await phones.Ana.evaluate(() => document.body.innerText));
const stopAt = async (p, ms) => { await tv.waitForTimeout(Math.max(0, t0 + ms - Date.now())); await p.dispatchEvent('#ckstop', 'pointerdown'); };
await stopAt(phones.Ana, target * 1000); await stopAt(phones.Raj, target * 1000 + 1200); await stopAt(phones.Mia, target * 1000 + 2500);
await until(() => state(s => s.phase === 'result')); await tv.waitForTimeout(600);
const early = await tv.evaluate(() => [...document.querySelectorAll('.score b,.srow b')].map(e => e.textContent).join(','));
await until(() => state(s => s.settled)); await tv.waitForTimeout(2500);
if (out) { await tv.screenshot({ path: out + '-res.png' }); await phones.Ana.screenshot({ path: out + '-phone2.png' }); }
const end = await state((s, by) => ({ scores: by(s.scores), stops: by(s.stops) }));
const ok = /^0[01]\.\d\d$/.test(shown) && hidden === '??.??' && noClockOnPhone && early === '0,0,0' && end.scores.Ana >= 300 && end.scores.Raj === 200 && end.scores.Mia === 100 && Math.abs(end.stops.Ana - target * 1000) < 600 && !errs.length;
console.log(ok ? 'ok clock-e2e' : 'FAIL', JSON.stringify({ shown, hidden, noClockOnPhone, early, target, end, errs }));
await b.close(); process.exit(ok ? 0 : 1);
