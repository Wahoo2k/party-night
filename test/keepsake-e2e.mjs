// The keepsake: after a game has been played, a phone in the lobby can save tonight's results as a picture.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const base = 'http://localhost:8765/', out = process.argv[2] || 'test';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
const errors = [];
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const me = await ctx.newPage(); me.on('pageerror', e => errors.push('me ' + e.message));
await me.setViewportSize({ width: 390, height: 800 });
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
if (await me.locator('#keepsake').count()) errors.push('keepsake offered before any game was played');
// Give the room a night's worth of results, as if three games had been played, and reload the TV.
await tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')); const [a, b2, c, d] = h.players.map(p => p.name);
  h.tally = { games: [{ game: 'Funny Answers', winners: [a] }, { game: 'GOAT Toss', winners: [b2] }, { game: 'Taboo Talk', winners: [a, c] }], by: { [a]: { wins: 2, podiums: 3, games: 3, last: 0, pts: 8 }, [b2]: { wins: 1, podiums: 2, games: 3, last: 0, pts: 5 }, [c]: { wins: 1, podiums: 1, games: 3, last: 1, pts: 4 }, [d]: { wins: 0, podiums: 1, games: 3, last: 2, pts: 1 } } };
  localStorage.setItem('pg-host', JSON.stringify(h)); });
await tv.reload(); await tv.waitForSelector('.code');
await me.waitForSelector('#keepsake', { timeout: 15000 });
const [dl] = await Promise.all([me.waitForEvent('download', { timeout: 15000 }), me.click('#keepsake')]);
const file = `${out}/keepsake.png`; await dl.saveAs(file);
const size = fs.statSync(file).size;
if (size < 20000) errors.push('keepsake picture looks empty: ' + size + ' bytes');
console.log(errors.length ? 'FAIL\n' + errors.join('\n') : `keepsake ok (${size} bytes)`);
await b.close(); process.exit(errors.length ? 1 : 0);
