#!/usr/bin/env node
// Generates Party Night's recorded audio with ElevenLabs: narration clips, sound effects and music.
//
//   node tools/eleven.mjs estimate                 what is left to make and roughly what it costs in credits
//   node tools/eleven.mjs voices                   the voices this account can use (name, id, description)
//   node tools/eleven.mjs audition "Name A,Name B" a few sample lines in each voice, plus a page to listen to them
//   node tools/eleven.mjs voice [--game funny] [--limit 50]   narration clips into audio/voice/
//   node tools/eleven.mjs sfx [--only join,win] [--redo]      sound effects and short stings into audio/sfx/
//   node tools/eleven.mjs music [--only music-lobby] [--redo] the longer music pieces into audio/sfx/
//
// The API key is read from the ELEVENLABS_API_KEY environment variable and is never written anywhere.
// Which voice reads what is set in audio/voices.json. Every command skips files that already exist, so a run that
// stops (out of credits, lost connection) picks up where it left off. The clip list is audio/record-list.csv.
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.ELEVEN_BASE || 'https://api.elevenlabs.io';
const KEY = process.env.ELEVENLABS_API_KEY || '';
const [cmd = 'estimate', ...rest] = process.argv.slice(2);
const flag = n => { const i = rest.indexOf('--' + n); return i < 0 ? null : rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true; };
const args = rest.filter((a, i) => !a.startsWith('--') && !(rest[i - 1]?.startsWith('--') && rest[i - 1] !== '--redo'));
const CFG = JSON.parse(fs.readFileSync('audio/voices.json', 'utf8'));
const SFX_CREDITS = 200, MUSIC_CREDITS_PER_MIN = 900;   // third-party figures; the account's own usage page is the truth

// ---- lists ----
function clips() {
  const out = [];
  for (const line of fs.readFileSync('audio/record-list.csv', 'utf8').split('\n').slice(1)) {
    const m = line.match(/^([^,]+),([^,]+),([^,]*),([^,]*),"(.*)"$/);
    if (m) out.push({ id: m[1], voice: m[2], games: m[3].split(' '), text: m[5].replace(/""/g, '"') });
  }
  return out;
}
// Sound effects and music come from the two tables in audio/SFX.md: the first column is the file name, the last the prompt.
function sounds() {
  const out = [];
  let music = false;
  for (const line of fs.readFileSync('audio/SFX.md', 'utf8').split('\n')) {
    if (/^## Music/.test(line)) music = true;
    const cells = line.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
    if (cells.length < 3 || /^-+$/.test(cells[0]) || /^(Name|File name)$/.test(cells[0])) continue;
    const prompt = cells[cells.length - 1], name = cells[0].replace(/`/g, '');
    const sec = /under (half a|1) second/.test(prompt) ? (RegExp.$1 === '1' ? 0.8 : 0.5) : +(prompt.match(/([\d.]+) seconds?/)?.[1] || 0) || (/very short|single/.test(prompt) ? 0.5 : 1.5);
    out.push({ name, prompt, sec, loop: /seamless loop/.test(prompt), long: music && sec > 30 || name === 'music-win' });
  }
  return out;
}
const have = (dir, id) => fs.existsSync(path.join('audio', dir, id + '.mp3'));

// ---- API ----
async function api(pathname, body, { json = false, method = body ? 'POST' : 'GET' } = {}) {
  if (!KEY) throw new Error('ELEVENLABS_API_KEY is not set.');
  for (let attempt = 0; ; attempt++) {
    let res;
    try { res = await fetch(BASE + pathname, { method, headers: { 'xi-api-key': KEY, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { if (attempt < 4) { await sleep(2000 * (attempt + 1)); continue; } throw e; }
    if (res.ok) return json ? res.json() : Buffer.from(await res.arrayBuffer());
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 5 && !/quota/i.test(text)) { await sleep(3000 * (attempt + 1)); continue; }
    const err = new Error(`${res.status} ${text.slice(0, 300)}`); err.status = res.status; err.fatal = res.status === 401 || /quota|credits/i.test(text); throw err;
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function credits() {
  try { const s = await api('/v1/user/subscription', null, { json: true }); return { tier: s.tier, used: s.character_count, limit: s.character_limit, left: s.character_limit - s.character_count }; } catch (e) { return { error: e.message }; }
}
let voiceList = null;
async function voiceId(nameOrId) {
  if (/^[A-Za-z0-9]{20}$/.test(nameOrId)) return nameOrId;
  voiceList = voiceList || (await api('/v1/voices', null, { json: true })).voices;
  const want = nameOrId.toLowerCase();
  const v = voiceList.find(x => x.name.toLowerCase() === want) || voiceList.find(x => x.name.toLowerCase().startsWith(want));
  if (!v) throw new Error(`No voice called "${nameOrId}" on this account. Run "voices" to see the names, or add it to My Voices in ElevenLabs first.`);
  return v.voice_id;
}
const speak = (id, text, c) => api(`/v1/text-to-speech/${id}?output_format=${CFG.format || 'mp3_44100_128'}`, { text, model_id: c.model || CFG.model, ...(c.settings ? { voice_settings: c.settings } : {}) });
// Run jobs a few at a time; stop everything on an error that won't fix itself (bad key, out of credits).
async function pool(jobs, n, fn) {
  let i = 0, done = 0, failed = 0, stop = null;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < jobs.length && !stop) {
      const job = jobs[i++];
      try { await fn(job); done++; if (done % 50 === 0) console.log(`  ${done} of ${jobs.length}`); }
      catch (e) { failed++; console.log(`  failed: ${job.id || job.name}: ${e.message}`); if (e.fatal || failed > 20) stop = e; }
    }
  }));
  return { done, failed, stopped: stop?.message || null };
}
// The app only plays what audio/manifest.json lists.
function manifest() {
  const ids = new Set(clips().map(c => c.id)), ls = d => (fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)) : []);
  const m = { have: ls('audio/voice').filter(id => ids.has(id)), sfx: ls('audio/sfx') };
  fs.writeFileSync('audio/manifest.json', JSON.stringify(m));
  return m;
}

// ---- commands ----
const todo = () => { const g = flag('game'); return clips().filter(c => !have('voice', c.id) && (!g || c.games.includes(g))); };
if (cmd === 'estimate') {
  const all = clips(), left = todo(), snd = sounds(), sLeft = snd.filter(s => !have('sfx', s.name));
  const chars = left.reduce((a, c) => a + c.text.length, 0), perChar = CFG.creditsPerChar ?? 1;
  const sfxC = sLeft.filter(s => !s.long).length * SFX_CREDITS, musC = Math.round(sLeft.filter(s => s.long).reduce((a, s) => a + s.sec, 0) / 60 * MUSIC_CREDITS_PER_MIN);
  console.log(`Narration: ${left.length} of ${all.length} clips still to make, ${chars.toLocaleString()} characters, about ${Math.round(chars * perChar).toLocaleString()} credits.`);
  for (const v of ['host', 'night']) console.log(`  ${v}: ${left.filter(c => c.voice === v).length} clips, ${left.filter(c => c.voice === v).reduce((a, c) => a + c.text.length, 0).toLocaleString()} characters`);
  console.log(`Sound effects and stings: ${sLeft.filter(s => !s.long).length} still to make, about ${sfxC.toLocaleString()} credits for one take each.`);
  console.log(`Music: ${sLeft.filter(s => s.long).length} pieces still to make, about ${musC.toLocaleString()} credits for one take each.`);
  console.log(`One clean pass: about ${(Math.round(chars * perChar) + sfxC + musC).toLocaleString()} credits. Allow a third more for retakes.`);
  if (KEY) console.log('Account:', JSON.stringify(await credits()));
} else if (cmd === 'voices') {
  const list = (await api('/v1/voices', null, { json: true })).voices;
  for (const v of list) console.log(`${v.name}\t${v.voice_id}\t${v.category || ''}\t${Object.values(v.labels || {}).join(', ')}`);
  console.log('Account:', JSON.stringify(await credits()));
} else if (cmd === 'library') {
  // Search the public Voice Library. A library voice has to be added to My Voices before it can be used.
  const q = new URLSearchParams({ page_size: flag('n') || '12', search: args[0] || 'game show host', language: 'en', ...(flag('gender') ? { gender: flag('gender') } : {}) });
  const r = await api('/v1/shared-voices?' + q, null, { json: true });
  for (const v of r.voices || []) console.log([v.name, v.voice_id, v.public_owner_id, v.gender, v.age, v.accent, v.use_case, (v.descriptive || ''), 'used ' + (v.usage_character_count_1y || 0), (v.description || '').replace(/\s+/g, ' ').slice(0, 140)].join('\t'));
} else if (cmd === 'audition') {
  const names = (args[0] || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!names.length) throw new Error('Give the voices to try, separated by commas.');
  const models = String(flag('models') || CFG.model).split(',');
  const preset = flag('style') ? CFG.styles?.[flag('style')] : null, tag = flag('style') ? '-' + flag('style') : '';
  const lines = { host: CFG.audition.host, night: CFG.audition.night }, set = flag('set') === 'night' ? 'night' : flag('set') === 'host' ? 'host' : null;
  const store = 'audio/audition/rows.json', rows = fs.existsSync(store) ? JSON.parse(fs.readFileSync(store, 'utf8')) : [];   // earlier auditions stay on the page
  for (const spec of names) for (const model of models) {
    const [name, given] = spec.split('=');   // "Label=voiceid" tries a library voice by its id
    const id = await voiceId(given || name), slug = (name + '-' + model + tag).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const kind of set ? [set] : ['host', 'night']) for (const [i, text] of lines[kind].entries()) {
      const file = `audio/audition/${slug}-${kind}-${i + 1}.mp3`;
      if (!fs.existsSync(file) || flag('redo')) { fs.mkdirSync('audio/audition', { recursive: true }); fs.writeFileSync(file, await speak(id, text, { model, settings: preset || CFG[kind].settings })); }
      if (!rows.some(r => r.file === path.basename(file))) rows.push({ name: name + (flag('style') ? ' (' + flag('style') + ')' : ''), model, kind, text, file: path.basename(file) });
      fs.writeFileSync(store, JSON.stringify(rows));
    }
    console.log('auditioned', name, model);
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const groups = [...new Set(rows.map(r => r.name + ' · ' + r.model))];
  fs.writeFileSync('audio/audition/index.html', `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Party Night voice auditions</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;background:#0b0f2c;color:#f3f1ff}h2{margin:28px 0 8px;color:#ffd166}p{margin:10px 0 4px}small{color:#b9bfe6}audio{width:100%}</style><h1>Voice auditions</h1><p><small>Same lines in each voice. "host" is the game-show narrator; "night" is the storyteller for Werewolf, Midnight Wolves and Haunted Quiz.</small></p>${groups.map(g => `<h2>${esc(g)}</h2>${rows.filter(r => r.name + ' · ' + r.model === g).map(r => `<p><small>${r.kind}</small> ${esc(r.text)}</p><audio controls preload="none" src="${r.file}"></audio>`).join('')}`).join('')}`);
  console.log('Listen: audio/audition/index.html', JSON.stringify(await credits()));
} else if (cmd === 'voice') {
  let jobs = todo(); const lim = +flag('limit') || 0; if (lim) jobs = jobs.slice(0, lim);
  const before = await credits(); console.log('Account before:', JSON.stringify(before));
  const need = jobs.reduce((a, c) => a + c.text.length, 0) * (CFG.creditsPerChar ?? 1);
  console.log(`Making ${jobs.length} clips, ${need.toLocaleString()} credits.`);
  if (before.left !== undefined && before.left < need && !flag('force')) console.log(`Only ${before.left.toLocaleString()} credits left: this run will stop when they run out and can be continued later.`);
  const ids = {}; for (const v of ['host', 'night']) if (jobs.some(j => j.voice === v)) ids[v] = await voiceId(CFG[v].voice);
  fs.mkdirSync('audio/voice', { recursive: true });
  const r = await pool(jobs, +flag('parallel') || 3, async c => { fs.writeFileSync(`audio/voice/${c.id}.mp3`, await speak(ids[c.voice], c.text, CFG[c.voice])); });
  const m = manifest();
  console.log(JSON.stringify({ ...r, clipsOnDisk: m.have.length, after: await credits() }));
  if (r.stopped) process.exitCode = 2;
} else if (cmd === 'sfx' || cmd === 'music') {
  const only = flag('only') ? String(flag('only')).split(',') : null;
  let jobs = sounds().filter(s => (cmd === 'music') === !!s.long && (!only || only.includes(s.name)) && (flag('redo') || !have('sfx', s.name)));
  // Extra takes of a sound, so it isn't the same every time: --takes fanfare:3,win:3 makes fanfare-2, fanfare-3, win-2, win-3.
  if (flag('takes') && cmd === 'sfx') {
    jobs = [];
    for (const spec of String(flag('takes')).split(',')) {
      const [name, n] = spec.split(':'), base = sounds().find(x => x.name === name);
      if (!base) { console.log('no such sound: ' + name); continue; }
      for (let i = 2; i <= (+n || 3); i++) if (flag('redo') || !have('sfx', `${name}-${i}`)) jobs.push({ ...base, name: `${name}-${i}`, prompt: base.prompt + ' A different take from the usual one: change the melody, rhythm and instruments while keeping the same mood and length.' });
    }
  }
  console.log(`Making ${jobs.length}: ${jobs.map(j => j.name).join(', ')}`);
  fs.mkdirSync('audio/sfx', { recursive: true });
  const r = await pool(jobs, 2, async s => {
    const buf = s.long
      ? await api('/v1/music?output_format=mp3_44100_128', { prompt: s.prompt + ' Instrumental only, no vocals.', music_length_ms: Math.round(Math.max(10, s.sec) * 1000) })
      : await api('/v1/sound-generation?output_format=mp3_44100_128', { text: s.prompt, duration_seconds: Math.min(30, Math.max(0.5, s.sec)), prompt_influence: 0.5, ...(s.loop ? { loop: true } : {}) });
    fs.writeFileSync(`audio/sfx/${s.name}.mp3`, buf);
  });
  const m = manifest();
  console.log(JSON.stringify({ ...r, soundsOnDisk: m.sfx.length, after: await credits() }));
  if (r.stopped) process.exitCode = 2;
} else if (cmd === 'manifest') {
  const m = manifest(); console.log(`manifest: ${m.have.length} clips, ${m.sfx.length} sounds`);
} else { console.log('Unknown command. See the top of tools/eleven.mjs.'); process.exitCode = 1; }
