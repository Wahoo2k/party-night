// Builds the recording list: every sentence the narrator can say that doesn't depend on a player's name or on
// something a player typed. Bots play each game many times; a second set of runs marks everything the bots type, so
// sentences carrying typed text can be told apart from the game's own questions and words.
// Outputs: audio/record-list.csv (id, voice, game, text), audio/SCRIPT.md (readable), audio/manifest.json (clips that exist).
import { GAMES } from '../js/games/index.js';
import { QUIPS } from '../js/quips.js';
import { sentences, clipId, voiceFor } from '../js/recorded.js';
import fs from 'node:fs';
const NAMES = ['Zorb', 'Quix', 'Vlux', 'Mirp', 'Jexx', 'Wynq', 'Olux', 'Pazk'];   // made-up names that are not part of any real word: 'Vlad' used to hide every line about Vladivostok, 'Jeff' every Jefferson
const RUNS = +process.env.RUNS || 2000, MARK = 'zqx';
const mark = a => { if (!a || typeof a !== 'object') return a; for (const k of ['text', 'word', 'title', 'clue', 'answer', 'guess']) if (typeof a[k] === 'string' && a[k]) a[k] = MARK + ' ' + a[k]; for (const k of ['list', 'lines', 'items']) if (Array.isArray(a[k])) a[k] = a[k].map(x => (typeof x === 'string' && x ? MARK + ' ' + x : x)); return a; };
const clips = new Map();   // id -> { voice, text, games:Set }
const add = (voice, text, game) => { const id = clipId(voice, text); if (!clips.has(id)) clips.set(id, { voice, text, games: new Set() }); clips.get(id).games.add(game); };
const perGame = {};
for (const [id, G] of Object.entries(GAMES)) {
  const seen = new Map(), typedPrefix = new Set(), typedExact = new Set();
  const n = Math.min(G.meta.max, Math.max(G.meta.min, 6));
  const run = marked => {
    const hear = line => { if (!line || typeof line !== 'string') return; for (const s of sentences(line, NAMES)) {
      if (marked) { const i = s.indexOf(MARK); if (i < 0) continue; const pre = s.slice(0, i).trim(); if (pre.length >= 8) typedPrefix.add(pre); typedExact.add(s.split(MARK + ' ').join('').split(MARK).join('')); }
      else seen.set(s, (seen.get(s) || 0) + 1);
    } };
    try {
      const players = NAMES.slice(0, n).map((name, i) => ({ pid: 'bot-' + i, name }));
      const s = G.setup(players, Math.random, null, {}); let t = Date.now(), guard = 0, last = '', stuck = 0, ev = 0;
      while (s.phase !== 'over' && guard++ < 3000) {
        const key = s.phase + s.round;
        if (key !== last) { last = key; stuck = 0; hear(G.narration?.(s)); } else stuck++;
        const ce = G.cueEvent?.(s); if (ce && ce.id !== ev) { ev = ce.id; hear(ce.say); }
        for (const p of players) { let a = G.botAct?.(G.phoneView(s, p.pid, t)); if (a) G.act(s, p.pid, marked ? mark(a) : a, t); }
        t += 1500; G.tick(s, t);
        if (stuck > 40) { G.hostAct?.(s, 'next', t); stuck = 0; }
      }
      hear(G.narration?.(s));
    } catch {}
  };
  for (let g = 0; g < RUNS; g++) { run(false); run(true); }
  const voice = voiceFor(id);
  const all = [...seen.keys()];
  const named = all.filter(s => s.includes('{name}'));
  const typed = all.filter(s => !s.includes('{name}') && (typedExact.has(s) || [...typedPrefix].some(p => s.startsWith(p))));
  const good = all.filter(s => !s.includes('{name}') && !typed.includes(s));
  good.forEach(s => add(voice, s, id));
  // "Core" sentences turn up in most games; the rest are the game's bank of questions, words and answers.
  perGame[id] = { name: G.meta.name, voice, core: good.filter(s => seen.get(s) >= RUNS / 3), bank: good.filter(s => seen.get(s) < RUNS / 3), named: named.length, typed: typed.length, typedSample: typed.slice(0, 2), namedSample: named.slice(0, 3) };
}
// Host banter and the platform's own lines.
for (const [set, moments] of Object.entries(QUIPS)) for (const pool of Object.values(moments)) for (const line of pool) for (const s of sentences(line, [])) add(set === 'night' ? 'night' : 'host', s, 'quips');
for (const line of ["Time's up!", 'And the winner is…', "It's a tie!", "Tonight's awards."]) for (const s of sentences(line, [])) add('host', s, 'shared');
for (const line of ['Good evening, villagers.', 'Night falls on the village. Somewhere in the dark, the wolves are hungry.']) for (const s of sentences(line, [])) add('night', s, 'shared');

const have = fs.existsSync('audio/voice') ? fs.readdirSync('audio/voice').filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).filter(id => clips.has(id)) : [];
const sfx = fs.existsSync('audio/sfx') ? fs.readdirSync('audio/sfx').filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)) : [];
fs.writeFileSync('audio/manifest.json', JSON.stringify({ have, sfx }));
const csv = v => '"' + String(v).replace(/"/g, '""') + '"';
const rows = [...clips.entries()].sort((a, b) => a[1].voice.localeCompare(b[1].voice) || [...a[1].games][0].localeCompare([...b[1].games][0]) || a[1].text.localeCompare(b[1].text));
fs.writeFileSync('audio/record-list.csv', 'id,voice,game,recorded,text\n' + rows.map(([id, c]) => [id, c.voice, [...c.games].join(' '), have.includes(id) ? 'yes' : '', csv(c.text)].join(',')).join('\n') + '\n');
const tot = { host: [0, 0], night: [0, 0] };
for (const c of clips.values()) { tot[c.voice][0]++; tot[c.voice][1] += c.text.length; }
let md = `# Narration script\n\nBuilt by \`node test/narration-script.mjs\` from ${RUNS} bot-played games of each title. One clip per sentence; the full list with clip ids is \`record-list.csv\`.\n\n- **Host voice:** ${tot.host[0]} clips, ${tot.host[1].toLocaleString()} characters.\n- **Night narrator** (Werewolf, Midnight Wolves, Haunted Quiz): ${tot.night[0]} clips, ${tot.night[1].toLocaleString()} characters.\n- Sentences that carry a player's name or text a player typed have no clip and are not spoken.\n- Host banter by moment is in QUIPS.md.\n`;
for (const [id, g] of Object.entries(perGame)) md += `\n## ${g.name} (${id}) · ${g.voice === 'night' ? 'night narrator' : 'host'}\n\nEvery game (${g.core.length}):\n${g.core.map(s => '- ' + s).join('\n')}\n` + (g.bank.length ? `\nQuestions, words and answers (${g.bank.length}, ${g.bank.join('').length.toLocaleString()} characters), for example:\n${g.bank.slice(0, 5).map(s => '- ' + s).join('\n')}\n` : '') + (g.named || g.typed ? `\nNot spoken: ${g.named} sentence${g.named === 1 ? '' : 's'} with a player's name${g.namedSample[0] ? ` (e.g. “${g.namedSample[0]}”)` : ''}${g.typed ? `, ${g.typed} with typed text (e.g. “${g.typedSample[0]}”)` : ''}.\n` : '');
fs.writeFileSync('audio/SCRIPT.md', md);
fs.rmSync('audio/lines.json', { force: true });
const summary = Object.entries(perGame).map(([id, g]) => [id, g.core.length, g.bank.length, g.bank.join('').length, g.named, g.typed]);
if (process.env.SUMMARY) fs.writeFileSync(process.env.SUMMARY, JSON.stringify(summary));
console.log(JSON.stringify({ runs: RUNS, clips: clips.size, host: tot.host, night: tot.night, core: summary.reduce((a, r) => a + r[1], 0), bank: summary.reduce((a, r) => a + r[2], 0), bankChars: summary.reduce((a, r) => a + r[3], 0), have: have.length }));
