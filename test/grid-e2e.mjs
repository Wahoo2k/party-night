// Word Storm with three phones: tap a word in, drag a word in, get told off for a non-word; a word only one player found pays double.
import { open } from './_open.mjs';
const out = process.argv[2], { b, tv, phones, errs, state, until } = await open('grid');
const noHeadStart = !(await phones.Ana.$('#wsg'));
await until(() => state(s => s.phase === 'play'), 40000); await tv.waitForTimeout(800);
const info = await tv.evaluate(async () => { const G = await import('./js/games/grid.js'); await G.ready(); const st = sessionStorage.getItem('pg-host') || localStorage.getItem('pg-host'); const s = JSON.parse(st).state; const all = G.allWords(s.grid).sort((a, b) => a.length - b.length); const pick = n => all.find(w => w.length === n); const w3 = pick(3), w4 = all.find(w => w.length === 4 && w !== w3); return { total: s.all.length, w3, w4, p3: G.trace(s.grid, w3), p4: G.trace(s.grid, w4), bad: [0, 1, 2].map(i => s.grid[i]).join('') }; });
const tap = async (p, path) => { for (const i of path) { const bx = await p.locator(`#wsg i[data-i="${i}"]`).boundingBox(); await p.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2); } await p.click('#wss'); await tv.waitForTimeout(300); };
const drag = async (p, path) => { const c = []; for (const i of path) { const bx = await p.locator(`#wsg i[data-i="${i}"]`).boundingBox(); c.push([bx.x + bx.width / 2, bx.y + bx.height / 2]); } await p.mouse.move(...c[0]); await p.mouse.down(); for (const xy of c.slice(1)) await p.mouse.move(...xy, { steps: 6 }); await p.mouse.up(); await tv.waitForTimeout(300); };
await tap(phones.Ana, info.p3); await tap(phones.Raj, info.p3); await drag(phones.Raj, info.p4);
const msgRaj = await phones.Raj.textContent('#wsm');
if (out) { await tv.screenshot({ path: out + '-play.png' }); await phones.Raj.screenshot({ path: out + '-phone.png' }); }
const mid = await state((s, by) => by(s.words));
await tv.click('[data-host=next]'); await until(() => state(s => s.settled)); await tv.waitForTimeout(2500); if (out) { await tv.screenshot({ path: out + '-res.png' }); await phones.Raj.screenshot({ path: out + '-phone2.png' }); }
const end = await state((s, by) => by(s.scores));
const ok = noHeadStart && info.total >= 40 && mid.Ana.join() === info.w3 && mid.Raj.join() === [info.w3, info.w4].join() && msgRaj.includes(info.w4.toUpperCase()) && end.Ana === 100 && end.Raj === 300 && end.Mia === 0 && !errs.length;
console.log(ok ? 'ok grid-e2e' : 'FAIL', JSON.stringify({ noHeadStart, info, mid, msgRaj, end, errs }));
await b.close(); process.exit(ok ? 0 : 1);
