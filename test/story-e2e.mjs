// Silly Story with three real phones: everyone types their words, the TV tells the story with them, a vote pays the writer.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errs = [], out = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1&lite=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
const phones = {};
for (const n of ['Ana', 'Raj', 'Mia']) { const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 800 }); p.on('pageerror', e => errs.push(n + ' ' + e.message)); await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join'); phones[n] = p; }
await tv.waitForTimeout(500);
await tv.evaluate(() => document.querySelector('.gcard[data-game=story]').click()); await tv.waitForTimeout(700);
await tv.click('[data-host=start]'); await tv.waitForTimeout(500); if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');
for (const p of Object.values(phones)) { await p.waitForTimeout(300); const r = await p.$('#rdy'); if (r) await r.click(); }
const st = () => tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')), s = h.state; return s ? { ph: s.phase, words: s.words, owner: s.owner.map(o => h.players.find(p => p.pid === o).name), scores: Object.fromEntries(h.players.map(p => [p.name, s.scores[p.pid]])), settled: s.settled } : null; });
let t0 = Date.now(); while (!(await st()) && Date.now() - t0 < 30000) await tv.waitForTimeout(200);
await tv.waitForTimeout(3500); if (out) { await tv.screenshot({ path: out + '-fill.png' }); await phones.Ana.screenshot({ path: out + '-phone.png' }); }
let typed = 0;
for (let round = 0; round < 8; round++) for (const [n, p] of Object.entries(phones)) { if (await p.$('#swi')) { await p.fill('#swi', n + 'word' + (++typed)); await p.click('#swf button'); await p.waitForTimeout(250); } }
t0 = Date.now(); while ((await st()).ph !== 'story' && Date.now() - t0 < 10000) await tv.waitForTimeout(100);
const s1 = await st(); await tv.waitForTimeout(6000); if (out) await tv.screenshot({ path: out + '-story.png' });
const shown = await tv.$$eval('.sw', els => els.map(e => e.firstChild.textContent));
await tv.click('[data-host=next]'); await tv.waitForTimeout(2500); if (out) await tv.screenshot({ path: out + '-vote.png' });
// everyone votes for a word that is not theirs; Ana and Raj both pick Mia's first word
const miaWord = s1.words[s1.owner.indexOf('Mia')].text, anaWord = s1.words[s1.owner.indexOf('Ana')].text;
const own = await phones.Mia.$$eval('.swopts .opt', (els, w) => els.some(e => e.textContent === w), miaWord);
for (const [n, p] of Object.entries(phones)) { await p.waitForSelector('.swopts .opt'); await p.evaluate(w => [...document.querySelectorAll('.swopts .opt')].find(e => e.textContent === w).click(), n === 'Mia' ? anaWord : miaWord); }
if (out) { await phones.Raj.screenshot({ path: out + '-phone3.png' }); }
t0 = Date.now(); while (!(await st()).settled && Date.now() - t0 < 20000) await tv.waitForTimeout(100);
await tv.waitForTimeout(2500); if (out) { await tv.screenshot({ path: out + '-result.png' }); await phones.Mia.screenshot({ path: out + '-phone2.png' }); }
const end = await st();
const ok = typed === s1.words.length && shown.length === s1.words.length && shown.every((w, k) => w === s1.words[k].text) && !own && end.scores.Mia === 200 && end.scores.Ana === 100 && end.scores.Raj === 0 && !errs.length;
console.log(ok ? 'ok story-e2e' : 'FAIL', JSON.stringify({ typed, n: s1.words.length, shown: shown.length, own, scores: end.scores, errs }));
await b.close(); process.exit(ok ? 0 : 1);
