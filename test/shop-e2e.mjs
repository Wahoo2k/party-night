// The shop switch (?shop=1): free games are open, any other game can be played once, then it shows the unlock screen.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/', errs = [];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const tv = await ctx.newPage(); tv.on('pageerror', e => errs.push(e.message));
await tv.goto(base + 'tv.html?local=1&shop=1'); await tv.waitForSelector('.code'); const code = (await tv.textContent('.code')).trim();
for (const n of ['Ana', 'Raj', 'Mia']) { const p = await ctx.newPage(); await p.goto(base + 'play.html?local=1'); await p.fill('#code', code); await p.fill('#name', n); await p.click('#join'); }
await tv.waitForTimeout(600);
const badge = id => tv.evaluate(g => { const c = document.querySelector(`.gcard[data-game=${g}]`); return c ? (c.querySelector('.glock') ? 'lock' : c.querySelector('.gtry') ? 'try' : 'open') : 'none'; }, id);
const before = { funny: await badge('funny'), ducks: await badge('ducks'), fib: await badge('fib') };
const pick = async id => { await tv.evaluate(g => document.querySelector(`.gcard[data-game=${g}]`).click(), id); await tv.waitForTimeout(600); };
const start = async () => { for (let i = 0; i < 3 && await tv.$('[data-host=start]:not([disabled])'); i++) { await tv.click('[data-host=start]'); await tv.waitForTimeout(600); } };
const playing = () => tv.evaluate(() => !!JSON.parse(localStorage.getItem('pg-host')).state);
await pick('fib'); await start();
const first = await playing();
await tv.evaluate(() => document.querySelector('[data-host=endgame]')?.click()); await tv.waitForTimeout(200); await tv.evaluate(() => document.querySelector('[data-host=endgame]')?.click()); await tv.waitForTimeout(800);
const after = await badge('fib');
await pick('fib'); await start(); await tv.waitForTimeout(500);
const second = await playing(), unlock = !!(await tv.$('.unlock'));
await tv.evaluate(() => document.querySelector('[data-host=menu]')?.click());
const ok = before.funny === 'open' && before.ducks === 'open' && before.fib === 'try' && first && after === 'lock' && !second && unlock && !errs.length;
console.log((ok ? 'ok' : 'FAIL') + ' shop-e2e ' + JSON.stringify({ before, first, after, second, unlock, errs })); await b.close(); process.exit(ok ? 0 : 1);
