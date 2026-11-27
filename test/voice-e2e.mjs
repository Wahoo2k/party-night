// Recorded narrator: with clips available the TV plays them sentence by sentence and never uses the browser voice;
// sentences with a player's name are skipped; with no clips at all the browser voice stands in.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const rows = fs.readFileSync('audio/record-list.csv', 'utf8').split('\n').slice(1).filter(Boolean).map(l => { const m = l.match(/^([^,]+),([^,]+),([^,]*),([^,]*),"(.*)"$/); return m && { id: m[1], voice: m[2], game: m[3], text: m[5].replace(/""/g, '"') }; }).filter(Boolean);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = []; const ok = (c, m) => { if (!c) errors.push(m); };
async function run(have, gameId) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.route('**/audio/manifest.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ have, sfx: [] }) }));
  await ctx.addInitScript(() => {
    window.__clips = []; window.__tts = 0;
    window.Audio = function (src) { window.__clips.push(src); const a = { play() { setTimeout(() => a.onended?.(), 30); return Promise.resolve(); }, pause() {} }; return a; };
    try { const sp = window.speechSynthesis; const orig = sp.speak.bind(sp); sp.speak = u => { window.__tts++; }; } catch {}
  });
  const tv = await ctx.newPage(); tv.on('pageerror', e => errors.push(e.message));
  await tv.goto('http://localhost:8765/tv.html?local=1'); await tv.waitForSelector('.code');
  for (let i = 0; i < 5; i++) await tv.click('[data-host=addbot]');
  await tv.click('[data-shelf=all]'); await tv.click(`[data-game=${gameId}]`); await tv.click('[data-host=start]');
  await tv.waitForTimeout(9000);
  const r = await tv.evaluate(() => ({ clips: window.__clips, tts: window.__tts }));
  await ctx.close(); return r;
}
const all = rows.map(r => r.id);
const a = await run(all, 'potato');
const texts = a.clips.map(c => rows.find(r => c.endsWith(r.id + '.mp3'))?.text);
ok(a.clips.length >= 2, 'clips played: ' + JSON.stringify(texts));
ok(a.tts === 0, 'browser voice must stay silent when recordings exist, spoke ' + a.tts);
ok(texts.every(t => t && !/Bot /.test(t)), 'no clip carries a player name: ' + JSON.stringify(texts));
ok(texts.some(t => /^Name /.test(t)), 'the category is voiced: ' + JSON.stringify(texts));
const n = await run(all, 'werewolf');
ok(n.clips.length && n.clips.every(c => rows.find(r => c.endsWith(r.id + '.mp3'))?.voice === 'night'), 'night games use the night narrator clips');
const z = await run([], 'potato');
ok(z.clips.length === 0 && z.tts > 0, 'with nothing recorded yet the browser voice stands in: ' + JSON.stringify(z));
console.log(errors.length ? 'FAIL\n' + errors.join('\n') : 'ok voice-e2e ' + JSON.stringify(texts)); await b.close(); process.exit(errors.length ? 1 : 0);
