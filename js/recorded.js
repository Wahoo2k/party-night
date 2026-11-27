// Recorded audio. Every narrator line is spoken from recorded clips, one clip per sentence, looked up by the
// sentence's text and the voice (host or night narrator). A sentence with no clip (a player's name, something a
// player typed) is simply not spoken. audio/manifest.json lists the clips and sound effects that exist as files; it
// and the full recording list are built by test/narration-script.mjs.
export const rec = { have: new Set(), sfx: new Set(), names: [], voice: 'host', loaded: false };
export const NIGHT_GAMES = ['werewolf', 'midnight', 'haunted'];
export const voiceFor = game => (NIGHT_GAMES.includes(game) ? 'night' : 'host');
export const clipId = (voice, text) => { let h = 5381; for (const ch of voice + '|' + text) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0; return 'v' + h.toString(36); };
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
// A spoken line cut into sentences that could each be a clip. Player names become {name}; "Name, do this" becomes
// "Do this" and "Do this, Name!" becomes "Do this!" so the instruction can still be voiced.
export function sentences(line, names = rec.names) {
  let t = String(line || '').replace(/\s+/g, ' ').trim();
  for (const n of [...names].sort((a, b) => b.length - a.length)) if (n) t = t.split(n).join('{name}');
  t = t.replace(/\b((?:[A-Z]\.){2,}|Mr\.|Mrs\.|Ms\.|Dr\.|St\.|vs\.)/g, m => m.replace(/\./g, '․'));   // keep U.S., Dr. and the like in one piece
  const parts = t.match(/[^.!?…]+[.!?…]+["'”’)]*|[^.!?…]+$/g) || [];
  return parts.map(p => {
    let s = p.trim().replace(/․/g, '.');
    const voc = s.match(/^\{name\}(?: and \{name\})?,\s+(.+)$/); if (voc) s = cap(voc[1]);
    const tail = s.match(/^(.+?),\s*\{name\}([.!?…]+)$/); if (tail) s = tail[1] + tail[2];
    return s;
  }).filter(s => s.length > 1);
}
// The clip files to play, in order, for one spoken line.
export function clipsFor(line) {
  return sentences(line).filter(s => !s.includes('{name}')).map(s => clipId(rec.voice, s)).filter(id => rec.have.has(id)).map(id => `audio/voice/${id}.mp3`);
}
if (typeof document !== 'undefined' && typeof fetch === 'function') {
  fetch(new URL('../audio/manifest.json', import.meta.url)).then(r => (r.ok ? r.json() : null)).then(m => {
    if (m) { rec.have = new Set(m.have || []); rec.sfx = new Set(m.sfx || []); }
    rec.loaded = true;
  }).catch(() => { rec.loaded = true; });
}
