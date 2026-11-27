import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = 'http://localhost:8765/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const errors = [];
const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push('tv ' + e.message));
await tv.goto(base + 'tv.html?local=1'); await tv.waitForSelector('.code');
await tv.evaluate(() => localStorage.clear()); await tv.reload(); await tv.waitForSelector('.code');
const code = (await tv.textContent('.code')).trim();
const me = await ctx.newPage(); me.on('pageerror', e => errors.push('me ' + e.message));
await me.setViewportSize({ width: 390, height: 844 });
await me.goto(base + 'play.html?local=1'); await me.fill('#code', code); await me.fill('#name', 'Tom'); await me.click('#join');
await me.waitForSelector("text=You're in");
for (let i = 0; i < 3; i++) await tv.click('[data-host=addbot]');
await tv.click('[data-shelf=all]'); await tv.click('[data-game=sketch]'); await tv.click('[data-host=start]');
const st = () => tv.evaluate(() => JSON.parse(localStorage.getItem('pg-host')).state);
const shots = {};
for (let i = 0; i < 400; i++) {
  const s = await st();
  if (s.phase === 'over') break;
  try {
    if (await me.$('#help')) { await me.click('#help'); await me.click('#skf [type=submit]'); }
    else if (await me.$('#skt')) { if (!shots.g) { await me.screenshot({ path: 'test/sk-guess.png' }); shots.g = 1; } await me.fill('#skt', 'A blob with a face'); await me.click('#skf [type=submit]'); }
    else if (await me.$('#skc')) {
      const box = await (await me.$('#skc')).boundingBox();
      await me.click('[data-c="3"]');
      await me.mouse.move(box.x + 60, box.y + 60); await me.mouse.down();
      for (let j = 0; j < 30; j++) await me.mouse.move(box.x + 60 + j * 8, box.y + 60 + Math.sin(j / 3) * 60);
      await me.mouse.up();
      await me.click('[data-c="6"]'); await me.click('[data-w="2"]');
      await me.mouse.move(box.x + 200, box.y + 250); await me.mouse.down(); await me.mouse.move(box.x + 250, box.y + 300); await me.mouse.up();
      await me.mouse.move(box.x + 100, box.y + 300); await me.mouse.down(); await me.mouse.move(box.x + 120, box.y + 320); await me.mouse.up();
      await me.click('#undo');
      if (!shots.d) { await me.screenshot({ path: 'test/sk-draw.png' }); shots.d = 1; }
      await me.click('#skdone');
    } else if (await me.$('[data-k]:not([disabled])')) { await me.click('[data-k]:not([disabled])'); if (!shots.h) { await me.screenshot({ path: 'test/sk-heart.png' }); shots.h = 1; } }
  } catch (e) { }
  if (s.phase === 'draw' && !shots.td) { await tv.waitForTimeout(1500); await tv.screenshot({ path: 'test/sk-tv-draw.png' }); shots.td = 1; }
  if (s.phase === 'reveal' && s.show.k >= 2 && !shots.tr) { await tv.waitForTimeout(800); await tv.screenshot({ path: 'test/sk-tv-reveal.png' }); shots.tr = 1; }
  if (s.phase === 'reveal' && i % 3 === 0) await tv.click('[data-host=next]').catch(() => {});
  await tv.waitForTimeout(500);
}
await tv.waitForTimeout(2500); await tv.screenshot({ path: 'test/sk-tv-over.png' });
const s = await st();
const mine = s.chains.flat().find(e => e.by === s.players.find(p => p.name === 'Tom').pid && e.kind === 'draw');
console.log(s.phase, Object.keys(shots), 'my strokes', mine?.strokes?.length, 'late', mine?.late, 'errors', errors);
await b.close();
