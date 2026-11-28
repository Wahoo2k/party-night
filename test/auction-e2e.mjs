// Going Once with three phones: only the insider's phone shows the worth; the highest bid buys; worth waits for the reveal.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('auction');
await tv.waitForTimeout(4000);
const info = await state((s, by) => { const n = {}; s.players.forEach(p => (n[p.pid] = p.name)); return { insider: n[s.lots[0].insider], value: s.lots[0].value }; });
const sees = {}; for (const [n, p] of Object.entries(phones)) sees[n] = !!(await p.$('.ausecret'));
if (out) { await tv.screenshot({ path: out + '-bid.png' }); await phones[info.insider].screenshot({ path: out + '-phone.png' }); }
const tvLeak = (await tv.evaluate(() => document.querySelector('.panel').innerText)).includes('$' + info.value.toLocaleString() + ' ') || !!(await tv.$('.ausecret'));
const bid = async (p, amount) => { await p.evaluate(a => { const r = document.querySelector('#aur'); r.value = a; r.dispatchEvent(new Event('input')); }, amount); await p.click('#aubid'); };
await bid(phones.Ana, 400); await bid(phones.Raj, 250); await phones.Mia.click('#aupass');
await until(() => state(s => s.phase === 'result')); await tv.waitForTimeout(500);
const early = await tv.evaluate(() => [...document.querySelectorAll('.score b,.srow b')].map(e => e.textContent).join(','));
await until(() => state(s => s.settled)); await tv.waitForTimeout(2500); if (out) { await tv.screenshot({ path: out + '-res.png' }); await phones.Ana.screenshot({ path: out + '-phone2.png' }); }
const end = await state((s, by) => ({ scores: by(s.scores), cash: by(s.cash) })), sold = await tv.textContent('.ausold');
const ok = Object.values(sees).filter(Boolean).length === 1 && sees[info.insider] && !tvLeak && early === '1,000,1,000,1,000' && end.cash.Ana === 600 && end.scores.Ana === 600 + info.value && end.scores.Raj === 1000 && /Ana/.test(sold) && !errs.length;
console.log(ok ? 'ok auction-e2e' : 'FAIL', JSON.stringify({ sees, info, tvLeak, early, end, sold, errs }));
await b.close(); process.exit(ok ? 0 : 1);
