// Caption This with three phones: the picture loads on the TV and the phones, captions are voted on, votes pay the writer.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('caption');
for (const [n, p] of Object.entries(phones)) { await p.waitForSelector('#cpt', { timeout: 30000 }); }
await tv.waitForTimeout(3500);
const picOk = await tv.evaluate(() => { const i = document.querySelector('.cppic img'); return !!i && i.complete && i.naturalWidth > 500; }), phonePic = await phones.Ana.evaluate(() => { const i = document.querySelector('.cpthumb'); return !!i && i.naturalWidth > 500; });
if (out) { await tv.screenshot({ path: out + '-write.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
for (const [n, p] of Object.entries(phones)) { await p.fill('#cpt', 'Caption from ' + n); await p.click('#cpf button'); }
await until(() => state(s => s.phase === 'vote')); await tv.waitForTimeout(1500); if (out) await tv.screenshot({ path: out + '-vote.png' });
const namesHidden = !/Ana|Raj|Mia/.test((await tv.evaluate(() => document.querySelector('.cpcaps').innerText)).replace(/Caption from \w+/g, ''));
const vote = async (p, who) => p.evaluate(w => [...document.querySelectorAll('.opt')].find(e => e.textContent === 'Caption from ' + w).click(), who);
const anaOwn = await phones.Ana.evaluate(() => [...document.querySelectorAll('.opt')].some(e => e.textContent === 'Caption from Ana'));
await vote(phones.Ana, 'Mia'); await vote(phones.Raj, 'Mia'); await vote(phones.Mia, 'Ana');
await until(() => state(s => s.settled)); await tv.waitForTimeout(2500); if (out) await tv.screenshot({ path: out + '-res.png' });
const end = await state((s, by) => by(s.scores));
const ok = picOk && phonePic && namesHidden && !anaOwn && end.Mia === 300 && end.Ana === 100 && end.Raj === 0 && !errs.length;
console.log(ok ? 'ok caption-e2e' : 'FAIL', JSON.stringify({ picOk, phonePic, namesHidden, anaOwn, end, errs }));
await b.close(); process.exit(ok ? 0 : 1);
