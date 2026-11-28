// Name That Sound with three phones: the TV asks the sound to play (and again a few seconds later), one right, one wrong.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('sound');
await tv.evaluate(() => { window.__played = []; });
await phones.Ana.waitForSelector('.opt[data-i]', { timeout: 30000 }); await tv.waitForTimeout(3500);
const q = await state(s => ({ a: s.q.answer, f: s.q.file }));
if (out) { await tv.screenshot({ path: out + '-listen.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
const tvHides = (await tv.$$('.loopt.right')).length === 0;
await phones.Ana.click(`.opt[data-i="${q.a}"]`); await phones.Raj.click(`.opt[data-i="${(q.a + 1) % 4}"]`); await tv.waitForTimeout(500); await tv.click('[data-host=next]');
await until(() => state(s => s.settled)); await tv.waitForTimeout(1200); if (out) await tv.screenshot({ path: out + '-rev.png' });
const end = await state((s, by) => by(s.scores));
const ok = tvHides && /^guess-/.test(q.f) && end.Ana >= 100 && end.Raj === 0 && end.Mia === 0 && !errs.length;
console.log(ok ? 'ok sound-e2e' : 'FAIL', JSON.stringify({ tvHides, q, end, errs }));
await b.close(); process.exit(ok ? 0 : 1);
