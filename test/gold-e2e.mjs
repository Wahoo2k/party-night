// Gold Rush with three phones: one right answer opens a chest, a wrong answer gets none, and gold waits for the reveal.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('gold');
await tv.waitForTimeout(4000); const a = (await state(s => ({ a: s.q.answer }))).a;
await phones.Ana.click(`.opt[data-i="${a}"]`); await phones.Raj.click(`.opt[data-i="${(a + 1) % 4}"]`); await phones.Mia.click(`.opt[data-i="${a}"]`);
await until(() => state(s => s.phase === 'chest')); await tv.waitForTimeout(600);
if (out) { await tv.screenshot({ path: out + '-chest.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
const rajNoChest = !(await phones.Raj.$('[data-c]'));
await phones.Ana.click('[data-c="1"]'); await phones.Mia.click('[data-c="0"]'); await tv.waitForTimeout(500);
for (const n of ['Ana', 'Mia']) { const t = await phones[n].$('[data-t]'); if (t) { if (out) await phones[n].screenshot({ path: out + '-phone2.png' }); await t.click(); await tv.waitForTimeout(300); } }
await until(() => state(s => s.phase === 'reveal')); await tv.waitForTimeout(500);
const early = await tv.evaluate(() => [...document.querySelectorAll('.score b,.srow b')].map(e => e.textContent).join(','));
await until(() => state(s => s.settled)); await tv.waitForTimeout(1500); if (out) await tv.screenshot({ path: out + '-rev.png' });
const end = await state((s, by) => ({ scores: by(s.scores), ev: s.events.map(e => e.kind) })), shown = await tv.$$eval('.grev', e => e.length);
const ok = rajNoChest && early === '0,0,0' && end.ev.length === 2 && shown === 2 && Object.values(end.scores).every(x => x >= 0) && Object.values(end.scores).some(x => x > 0) && !errs.length;
console.log(ok ? 'ok gold-e2e' : 'FAIL', JSON.stringify({ rajNoChest, early, end, shown, errs }));
await b.close(); process.exit(ok ? 0 : 1);
