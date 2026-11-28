// Team games: players choose sides on the join screen, can switch, and the game starts with those teams.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errors = [];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push(e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const phones = [];
for (const n of ['Ana', 'Raj', 'Mia', 'Lee']) { const p = await ctx.newPage(); p.setViewportSize({ width: 390, height: 780 }); p.on('pageerror', e => errors.push(e.message)); await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join'); phones.push(p); }
await tv.waitForTimeout(600);
await tv.evaluate(() => document.querySelector('.gcard[data-game=taboo]').click());
await tv.waitForSelector('.teamline');
await phones[0].waitForSelector('[data-team]');
// Everyone starts on a side (alternating). Ana, Raj and Mia choose Sun; Lee is left on Moon alone, then Mia switches to Moon.
for (const i of [0, 1, 2]) { await phones[i].click('[data-team="0"]'); await tv.waitForTimeout(250); }
await phones[3].click('[data-team="1"]'); await tv.waitForTimeout(250);
await phones[2].click('[data-team="1"]'); await tv.waitForTimeout(400);
const pick = await tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')); return h.players.map(p => p.name + ':' + h.teamPick[p.pid]).join(' '); });
const seats = await tv.evaluate(() => [...document.querySelectorAll('.seat.taken')].map(s => (s.className.match(/tm\d/) || [''])[0]).join(' '));
const phoneShows = await phones[2].evaluate(() => document.querySelector('.teambtn.on b')?.textContent);
await tv.screenshot({ path: process.argv[2] || '/dev/null' }).catch(() => {});
await phones[2].screenshot({ path: process.argv[3] || '/dev/null' }).catch(() => {});
await tv.click('[data-host=start]'); await tv.waitForTimeout(600);
if (await tv.$('[data-host=start]')) await tv.click('[data-host=start]');   // skip the how-to screen
await tv.waitForTimeout(1200);
const teams = await tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')); return h.state ? h.players.map(p => p.name + ':' + h.state.teamOf[p.pid]).join(' ') : 'no game'; });
const ok = pick === 'Ana:0 Raj:0 Mia:1 Lee:1' && teams === pick && seats === 'tm0 tm0 tm1 tm1' && /Moon/.test(phoneShows || '');
console.log(ok ? 'ok teams-e2e' : 'FAIL', JSON.stringify({ pick, seats, phoneShows, teams }), 'errors', JSON.stringify(errors));
await b.close(); process.exit(ok && !errors.length ? 0 : 1);
