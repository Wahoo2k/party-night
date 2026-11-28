// Fact or Fib with three phones: one right, one wrong, one silent. The answer and the points wait for the reveal.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('fib');
await tv.waitForTimeout(4000);
const q = await state(s => ({ q: s.q }));
const truth = await tv.evaluate(async i => (await import('./js/games/fib-bank.js')).STATEMENTS[i][1], q.q);
if (out) { await tv.screenshot({ path: out + '-ask.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
await phones.Ana.click(`[data-v="${truth ? 1 : 0}"]`); await phones.Raj.click(`[data-v="${truth ? 0 : 1}"]`);
await tv.waitForTimeout(500); await tv.click('[data-host=next]'); await tv.waitForTimeout(700);
const early = await tv.evaluate(() => [...document.querySelectorAll('.score b,.srow b')].map(e => e.textContent).join(','));
await until(() => state(s => s.settled)); await tv.waitForTimeout(1500);
if (out) { await tv.screenshot({ path: out + '-rev.png' }); await phones.Raj.screenshot({ path: out + '-phone2.png' }); }
const end = await state((s, by) => ({ scores: by(s.scores), streak: by(s.streak) })), right = await tv.$$eval('.fbtile.right .fbnames span', e => e.map(x => x.firstChild.textContent.trim()));
const raj = await phones.Raj.evaluate(() => document.body.innerText);
const ok = !/100/.test(early) && end.scores.Ana === 100 && end.scores.Raj === 0 && end.streak.Ana === 1 && right.join() === 'Ana' && /Wrong/.test(raj) && !errs.length;
console.log(ok ? 'ok fib-e2e' : 'FAIL', JSON.stringify({ early, end, right, errs }));
await b.close(); process.exit(ok ? 0 : 1);
