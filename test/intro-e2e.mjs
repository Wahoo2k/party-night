// The game intro: first play of a title shows the rules on the TV and phones, waits for Ready, then starts.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const out = process.env.SHOTS || 'test';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = []; const ok = (c, m) => { if (!c) errors.push(m); };
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto('http://localhost:8765/tv.html?local=1&intro=1'); await tv.waitForSelector('.gcard');
for (let i = 0; i < 4; i++) await tv.click('[data-host=addbot]');
const code = await tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).code);
const join = async name => { const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 780 }); p.on('pageerror', e => errors.push('phone ' + e.message)); await p.goto('http://localhost:8765/play.html?local=1'); await p.fill('#code', code); await p.fill('#name', name); await p.click('#join'); await p.waitForSelector("text=You're in"); return p; };
const a = await join('Ann'), c = await join('Cy');
await tv.click('[data-game=werewolf]'); await tv.click('[data-host=start]');
await tv.waitForSelector('.intro');
const st = () => tv.evaluate(() => { const h = JSON.parse(localStorage.getItem('pg-host')); return { state: !!h.state, intro: !!h.intro }; });
ok((await st()).intro && !(await st()).state, 'intro shows before the game starts');
ok(await tv.locator('.introsteps li').count() >= 3, 'rules are listed on the TV');
await a.waitForSelector('#rdy'); ok(await a.locator('.pintro li').count() >= 3, 'rules are listed on the phone');
await tv.waitForTimeout(4500); await tv.screenshot({ path: `${out}/intro-tv.png` }); await a.screenshot({ path: `${out}/intro-phone.png` });
await a.click('#rdy'); await tv.waitForTimeout(700);
ok(await tv.locator('.introchip.ok').count() === 1 && !(await st()).state, 'one ready is not enough');
await c.click('#rdy'); await tv.waitForTimeout(1200);
ok((await st()).state && !(await st()).intro, 'the game starts when everyone is ready');
// a second game of the same title skips the intro
await tv.mouse.move(40, 40); await tv.mouse.move(60, 60); await tv.click('[data-host=endgame]'); await tv.click('[data-host=endgame]'); await tv.waitForTimeout(600);
await tv.click('[data-game=werewolf]').catch(() => {}); await tv.click('[data-host=start]'); await tv.waitForTimeout(800);
ok((await st()).state, 'no intro the second time');
console.log(errors.length ? 'FAIL\n' + errors.join('\n') : 'ok intro-e2e'); await b.close(); process.exit(errors.length ? 1 : 0);
