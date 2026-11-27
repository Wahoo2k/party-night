// Every game's final TV view: note which ones feed the shared winners' ceremony (a sorted list with names and a number).
import { GAMES } from '../js/games/index.js';
let bad = 0; const yes = [], no = [];
for (const G of Object.values(GAMES)) {
  const players = Array.from({ length: 6 }, (_, i) => ({ pid: 'bot-' + i, name: 'B' + i }));
  const s = G.setup(players, Math.random, null, { short: true }); let t = Date.now(), guard = 0, last = '', stuck = 0;
  while (s.phase !== 'over' && guard++ < 9000) {
    for (const p of players) { const a = G.botAct?.(G.phoneView(s, p.pid, t), Math.random); if (a) G.act(s, p.pid, a, t, Math.random); }
    t += 1500; G.tick?.(s, t, Math.random);
    const k = s.phase + (s.round ?? '') + (s.deadline ?? ''); stuck = k === last ? stuck + 1 : 0; last = k;
    if (stuck > 3 && G.hostAct) { G.hostAct(s, 'next', t, Math.random); stuck = 0; }
  }
  if (s.phase !== 'over') { no.push(G.meta.id + '(unfinished)'); continue; }
  const v = G.tvView(s, t);
  let list = Array.isArray(v.scores) && v.scores.length >= 2 && v.scores[0]?.name ? v.scores : null;
  if (!list && Array.isArray(v.teams) && typeof v.teams[0]?.score === 'number') list = v.teams;
  if (!list) { no.push(G.meta.id); continue; }
  const k = ['score', 'chips', 'hearts', 'books', 'burns'].find(x => typeof list[0][x] === 'number');
  if (!k) { console.log('no number', G.meta.id, Object.keys(list[0])); bad++; }
  else if (v.scores === list && list.some((p, i) => i && p[k] > list[i - 1][k])) { console.log('ascending or unsorted', G.meta.id, k, list.map(p => p[k]).join(',')); }
  yes.push(G.meta.id);
}
console.log('ceremony:', yes.join(' ')); console.log('own ending:', no.join(' '));
process.exit(bad ? 1 : 0);
