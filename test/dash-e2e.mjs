// Doodle Dash with three phones: the artist draws and the lines reach the TV while drawing; a wrong, a close and a right guess.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('dash');
await until(() => state(s => s.phase === 'pick')); await tv.waitForTimeout(3500);
const art = (await state((s, by) => { const n = {}; s.players.forEach(p => (n[p.pid] = p.name)); return { a: n[s.order[0]] }; })).a, artist = phones[art], guessers = Object.keys(phones).filter(n => n !== art);
await artist.waitForSelector('.opt[data-i]'); await artist.click('.opt[data-i="0"]');
await until(() => state(s => s.phase === 'draw')); const word = (await state(s => ({ w: s.word }))).w;
await artist.waitForSelector('#skc'); const box = await artist.locator('#skc').boundingBox();
await artist.mouse.move(box.x + 60, box.y + 60); await artist.mouse.down();
for (let i = 1; i <= 30; i++) { await artist.mouse.move(box.x + 60 + i * 7, box.y + 60 + Math.sin(i / 3) * 40 + i * 4); await artist.waitForTimeout(30); }
const midStroke = (await state(s => ({ n: s.strokes.length, pts: s.strokes[0]?.p.length || 0 })));   // still holding the pen down
await artist.mouse.up(); await tv.waitForTimeout(500);
const onTv = await tv.$$eval('.ddpic svg path', e => e.length), hintShown = await tv.$$eval('.ddhint i', e => e.map(x => x.textContent).join(''));
const g1 = phones[guessers[0]], g2 = phones[guessers[1]];
await g1.fill('#ddi', 'zzzebra'); await g1.click('#ddf button'); await tv.waitForTimeout(400);
await g1.fill('#ddi', word.slice(0, -1) + (word.endsWith('x') ? 'y' : 'x')); await g1.click('#ddf button'); await tv.waitForTimeout(400);
const closeMsg = await g1.textContent('#ddmsg'), feed = await tv.$$eval('.ddfeed div', e => e.map(x => x.textContent).join('|'));
if (out) { await tv.screenshot({ path: out + '-draw.png' }); await artist.screenshot({ path: out + '-phone.png' }); await g1.screenshot({ path: out + '-phone2.png' }); }
const padKept = await artist.evaluate(() => !!document.querySelector('#skc'));
await g2.fill('#ddi', word.toUpperCase()); await g2.click('#ddf button'); await tv.waitForTimeout(400);
await g1.fill('#ddi', word); await g1.click('#ddf button');
await until(() => state(s => s.settled)); await tv.waitForTimeout(1800); if (out) await tv.screenshot({ path: out + '-res.png' });
const end = await state((s, by) => ({ scores: by(s.scores), phase: s.phase }));
const ok = midStroke.n === 1 && midStroke.pts > 10 && onTv >= 1 && !hintShown.trim() && /close/i.test(closeMsg) && feed.includes('zzzebra') && !feed.includes(word.slice(0, -1)) && padKept && end.scores[art] === 100 && end.scores[guessers[1]] >= end.scores[guessers[0]] && end.scores[guessers[0]] >= 100 && !errs.length;
console.log(ok ? 'ok dash-e2e' : 'FAIL', JSON.stringify({ midStroke, onTv, hintShown, closeMsg, feed, padKept, end, errs }));
await b.close(); process.exit(ok ? 0 : 1);
