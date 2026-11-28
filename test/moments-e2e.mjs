// Game moments: in Last One Standing, a player who answers wrong loses a life and their character turns sad.
import { open } from './_open.mjs';
const { b, tv, phones, errs, state, until } = await open('survive');
const ans = await state(s => s.q.answer);
await phones.Ana.click(`[data-i="${ans}"]`).catch(() => {}); await phones.Raj.click(`[data-i="${(ans + 1) % 4}"]`).catch(() => {}); await phones.Mia.click(`[data-i="${ans}"]`).catch(() => {});
await until(() => state(s => s.phase === 'reveal' && s.settled), 20000);
const sad = await until(() => tv.evaluate(() => { const i = [...document.querySelectorAll('[data-who]')].find(x => x.dataset.who === 'Raj'); return !!i && /avpop|avhop/.test(i.className) && decodeURIComponent(i.querySelector('img').src).includes('avatar sad'); }), 6000);
const ok = !!sad && !errs.length;
if (process.argv[2]) await tv.screenshot({ path: process.argv[2] + '/moment.png' });
console.log((ok ? 'ok' : 'FAIL') + ' moments-e2e ' + JSON.stringify({ sad: !!sad, picked: await state(s => Object.keys(s.result?.picks || {}).length), errs })); await b.close(); process.exit(ok ? 0 : 1);
