// Rock Paper Showdown with three phones: rock beats two scissors.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('rps');
await tv.waitForTimeout(4000); if (out) { await tv.screenshot({ path: out + '-throw.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
await phones.Ana.click('[data-t=rock]'); await phones.Raj.click('[data-t=scissors]'); const secret = !/rock|scissors/i.test(await tv.evaluate(() => document.querySelector('.panel').innerText)); await phones.Mia.click('[data-t=scissors]');
await until(() => state(s => s.phase === 'result')); await tv.waitForTimeout(500);
const early = await tv.evaluate(() => [...document.querySelectorAll('.score b,.srow b')].map(e => e.textContent).join(','));
await until(() => state(s => s.settled)); await tv.waitForTimeout(1500); if (out) { await tv.screenshot({ path: out + '-res.png' }); await phones.Ana.screenshot({ path: out + '-phone2.png' }); }
const end = await state((s, by) => by(s.scores)), win = await tv.$$eval('.rpcol.win h3', e => e.map(x => x.textContent.trim()).join());
const ok = secret && early === '0,0,0' && end.Ana === 200 && end.Raj === 0 && /Rock/.test(win) && !/Scissors/.test(win) && !errs.length;
console.log(ok ? 'ok rps-e2e' : 'FAIL', JSON.stringify({ secret, early, end, win, errs }));
await b.close(); process.exit(ok ? 0 : 1);
