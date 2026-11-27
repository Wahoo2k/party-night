// Collects every narrator line the games can say, by playing each game many times with bots.
// Output: audio/lines.json ({ shared, games: { id: { fixed: [...], withNames: [...], open: n } } }).
import { GAMES } from '../js/games/index.js';
import fs from 'node:fs';
const NAMES = ['Zorb', 'Quix', 'Vlad', 'Mirp', 'Jeff', 'Wynn', 'Oleg', 'Pask'];
const out = {};
for (const [id, G] of Object.entries(GAMES)) {
  const seen = new Map();
  const add = line => {
    if (!line || typeof line !== 'string') return;
    let t = line.trim(); if (!t) return;
    for (const n of NAMES) t = t.split(n).join('{name}');
    t = t.replace(/\d[\d,.]*/g, '{n}');
    seen.set(t, (seen.get(t) || 0) + 1);
  };
  const n = Math.min(G.meta.max, Math.max(G.meta.min, 6));
  for (let g = 0; g < 25; g++) {
    try {
      const players = NAMES.slice(0, n).map((name, i) => ({ pid: 'bot-' + i, name }));
      const s = G.setup(players, Math.random, null, {}); let t = Date.now(), guard = 0, last = '', stuck = 0, ev = 0;
      while (s.phase !== 'over' && guard++ < 3000) {
        const key = s.phase + s.round;
        if (key !== last) { last = key; stuck = 0; add(G.narration?.(s)); } else stuck++;
        const ce = G.cueEvent?.(s); if (ce && ce.id !== ev) { ev = ce.id; add(ce.say); }
        for (const p of players) { const a = G.botAct?.(G.phoneView(s, p.pid, t)); if (a) G.act(s, p.pid, a, t); }
        t += 1500; G.tick(s, t);
        if (stuck > 40) { G.hostAct?.(s, 'next', t); stuck = 0; }
      }
      add(G.narration?.(s));
    } catch (e) { /* a game that can't be driven this way just yields fewer lines */ }
  }
  const all = [...seen.keys()];
  // Lines that still vary a lot after names and numbers are taken out carry typed answers, prompts or question text.
  // A line heard in at least a third of the games is part of the game's structure (intro, instructions, phase calls).
  // Rare lines are content being read out: a question, a prompt, a typed answer.
  const often = l => seen.get(l) >= 8, named = l => l.includes('{name}') || l.includes('{n}');
  out[id] = { name: G.meta.name, fixed: all.filter(l => often(l) && !named(l)), withNames: all.filter(l => often(l) && named(l)), content: all.filter(l => !often(l)).length, contentChars: all.filter(l => !often(l)).join('').length, sample: all.filter(l => !often(l)).slice(0, 3) };
}
// Lines with a player's name or a number can't be recorded as they are. Keep the sentences that stand on their own,
// turn "Name, do this" into "Do this", and drop the rest (the screen shows who, and a host quip or a sound covers the beat).
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
function reword(line) {
  const parts = line.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g) || [line];
  const keep = [];
  for (let raw of parts) {
    let t = raw.trim();
    if (!/\{name\}|\{n\}/.test(t)) { keep.push(t); continue; }
    const voc = t.match(/^(?:\{name\}(?:,| and \{name\},))\s+(.*)$/);           // "Tom, you're up!" -> "You're up!"
    if (voc && !/\{name\}|\{n\}/.test(voc[1])) { keep.push(cap(voc[1])); continue; }
    const tail = t.match(/^(.*?),\s*\{name\}([.!?])$/);                           // "Go again, Tom!" -> "Go again!"
    if (tail && !/\{name\}|\{n\}/.test(tail[1])) { keep.push(tail[1] + tail[2]); continue; }
  }
  const out = keep.join(' ').replace(/\s+/g, ' ').trim();
  return out.length >= 4 ? out : null;
}
for (const g of Object.values(out)) {
  g.reworded = g.withNames.map(from => ({ from, record: reword(from) }));
  const have = new Set(g.fixed);
  g.extra = [...new Set(g.reworded.map(r => r.record).filter(r => r && !have.has(r)))];
}
const shared = ['Final round!', 'Thirty seconds left.', 'Good evening, villagers.', 'Night falls on the village. Somewhere in the dark, the wolves are hungry.', '{name} jumps in!'];
fs.writeFileSync('audio/lines.json', JSON.stringify({ shared, games: out }, null, 1));
let f = 0, w = 0, fc = 0, wc = 0, c = 0;
for (const g of Object.values(out)) { f += g.fixed.length; w += g.withNames.length; fc += g.fixed.join('').length; wc += g.withNames.join('').length; c += g.content; }
const ex = Object.values(out).flatMap(g => g.extra), silent = Object.values(out).flatMap(g => g.reworded.filter(r => !r.record)).length;
console.log(JSON.stringify({ extraLines: ex.length, extraChars: ex.join('').length, silent }));
console.log(JSON.stringify({ games: Object.keys(out).length, fixedLines: f, fixedChars: fc, nameLines: w, nameChars: wc, contentLinesSeen: c }));
// A readable script beside the data file.
const NIGHT = ['werewolf', 'midnight', 'haunted'];
let md = '# Narration script\n\nMade by `node test/narration-script.mjs` (bots play each game 25 times; lines heard in at least a third of games are listed).\n\n- **Host voice:** every game except the night games.\n- **Night narrator voice:** ' + NIGHT.join(', ') + '.\n- `{name}` is a player name and `{n}` a number. Those lines are recorded without the name where a sentence still stands on its own, and get no voice otherwise.\n- Shared host lines by moment are in QUIPS.md.\n- Questions, prompts and typed answers that are read out are not listed (they change every game).\n\n## Shared lines (host)\n' + shared.filter(l => !/village/.test(l)).map(l => '- ' + l).join('\n') + '\n- Time\'s up!\n- And the winner is…\n- It\'s a tie!\n- Tonight\'s awards.\n\n## Shared lines (night narrator)\n' + shared.filter(l => /village/.test(l)).map(l => '- ' + l).join('\n') + '\n';
for (const [id, g] of Object.entries(out)) md += `\n## ${g.name} (${id}) · ${NIGHT.includes(id) ? 'night narrator' : 'host'}\n` + (g.fixed.length ? g.fixed.map(l => '- ' + l).join('\n') + '\n' : '') + (g.extra.length ? '\nRecorded in place of lines that carry a name or number:\n' + g.extra.map(l => '- ' + l).join('\n') + '\n' : '') + (g.reworded.some(r => !r.record) ? '\nNo voice (the screen, a sound or a host line covers it):\n' + g.reworded.filter(r => !r.record).map(r => '- ' + r.from).join('\n') + '\n' : '') + (g.content ? `\nAlso reads out changing content (about ${g.content} different lines seen), e.g. “${(g.sample[0] || '').slice(0, 90)}”.\n` : '');
fs.writeFileSync('audio/SCRIPT.md', md);
