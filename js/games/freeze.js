// Freeze Dance: music plays on the TV and everyone dances. When it stops, FREEZE and tap your phone!
// Fastest freezers score. Tap while the music is still playing and you miss the round.
import { esc } from '../ui.js';

export const meta = {
  id: 'freeze',
  name: 'Freeze Dance',
  min: 1,
  max: 20,
  blurb: 'Dance while the music plays. When it stops, freeze and tap!',
  kids: true,
};

export const ROUNDS = 8;
export const TIMES = { ready: 3500, freeze: 6000 };
const DANCES = ['💃', '🕺', '🐸', '🐙', '🤖', '🦖', '🐧', '🦩'];

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const s = { game: 'freeze', players: players.map(p => ({ pid: p.pid, name: p.name })), r: 0, rounds: opts.short ? 5 : ROUNDS, round: 0, scores: {}, taps: [], early: [], seed: Math.floor(rnd() * 1000) };
  s.players.forEach(p => (s.scores[p.pid] = 0));
  ready(s, Date.now());
  return s;
}
function ready(s, now) { s.taps = []; s.early = []; s.phase = 'ready'; s.round++; s.deadline = now + TIMES.ready; }
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';

export function act(s, pid, a, now = Date.now()) {
  if (!a || a.type !== 'tap' || s.scores[pid] === undefined) return s;
  if (s.phase === 'dance' && !s.early.includes(pid)) { s.early.push(pid); s.eventId = (s.eventId || 0) + 1; }
  else if (s.phase === 'freeze' && !s.early.includes(pid) && !s.taps.includes(pid)) {
    s.taps.push(pid);
    s.scores[pid] += [3, 2, 1][s.taps.length - 1] || 1;
    if (s.players.every(p => s.taps.includes(p.pid) || s.early.includes(p.pid))) s.deadline = Math.min(s.deadline, now + 1500);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'ready') { s.phase = 'dance'; s.round++; s.deadline = now + 5000 + Math.floor(rnd() * 9000); }
  else if (s.phase === 'dance') { s.phase = 'freeze'; s.round++; s.deadline = now + TIMES.freeze; }
  else if (s.phase === 'freeze') { s.r++; if (s.r >= s.rounds) { s.phase = 'over'; s.round++; s.deadline = 0; } else ready(s, now); }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'ready') return s.r === 0 ? 'Freeze Dance! Dance while the music plays. When it stops, freeze like a statue and tap your phone! Don\'t tap too early!' : 'Get ready to dance!';
  if (s.phase === 'freeze') return 'FREEZE!';
  if (s.phase === 'over') return `${ranking(s)[0].name} is the freeze champion!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'ready') return { sound: 'join', wait: 300, title: s.r === 0 ? 'Freeze Dance' : `Round ${s.r + 1}`, sub: '💃 Get ready!' };
  if (s.phase === 'freeze') return { sound: 'stamp', wait: 100, flash: 'frost' };
  if (s.phase === 'over') return { sound: 'win', wait: 1200, title: 'Dance over!', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function cueEvent(s) { return s.eventId && s.phase === 'dance' ? { id: s.eventId, sound: 'tick', say: `Oops, ${nameOf(s, s.early[s.early.length - 1])} tapped too early!` } : null; }
export function botAct(v, rnd = Math.random) { if (v.phase === 'freeze' && !v.tapped && !v.early && rnd() < 0.4) return { type: 'tap' }; if (v.phase === 'dance' && !v.early && rnd() < 0.01) return { type: 'tap' }; return null; }

export function tvView(s) {
  return { phase: s.phase, r: s.r + 1, of: s.rounds, seed: s.seed + s.r, taps: s.taps.map(p => nameOf(s, p)), early: s.early.map(p => nameOf(s, p)), scores: ranking(s) };
}
export function phoneView(s, pid) {
  if (s.scores[pid] === undefined) return { phase: 'spectate' };
  return { phase: s.phase, round: s.round, score: s.scores[pid], tapped: s.taps.includes(pid), place: s.taps.indexOf(pid) + 1, early: s.early.includes(pid), final: s.phase === 'over' ? ranking(s).findIndex(x => x.pid === pid) + 1 : 0 };
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'dance' || v.phase === 'over');
  const scores = `<div class="scores"><h3>Stars</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Round ${Math.min(v.r, v.of)} of ${v.of}</p>`;
  if (v.phase === 'ready') h += '<div class="huntbig ready">🎵<b>Get ready…</b></div>';
  if (v.phase === 'dance') h += `<div class="dancefloor">${DANCES.map((d, i) => `<span style="animation-delay:${i * 0.12}s">${d}</span>`).join('')}</div><h2 class="center">DANCE! 🎶</h2>${v.early.length ? `<p class="lose center">Too early: ${v.early.map(esc).join(', ')}</p>` : ''}`;
  if (v.phase === 'freeze') h += `<div class="huntbig freezebig">🧊<b>FREEZE!</b></div><div class="huntfound">${v.taps.map((n, i) => `<span data-pop="t${v.r}-${i}">${['🥇', '🥈', '🥉'][i] || '✅'} ${esc(n)}</span>`).join('')}</div>`;
  if (v.phase === 'over') h = `<h2 class="win">🏆 ${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
  import('../sfx.js').then(m => (v.phase === 'dance' ? m.startMusic(v.seed) : m.stopMusic())).catch(() => {});
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="kidscore">⭐ ${v.score}</p>`;
  if (v.phase === 'ready') h += '<div class="huntbig ready">👀<b>Look at the TV!</b></div>';
  else if (v.phase === 'dance') h += v.early ? '<div class="huntbig">😅<b>Too early! Wait for next time.</b></div>' : '<div class="huntbig dancing">💃<b>Dance!</b></div><button class="kidbtn wait" data-tap>Wait for it…</button>';
  else if (v.phase === 'freeze') h += v.early ? '<div class="huntbig">😅</div>' : v.tapped ? `<div class="huntbig">${['🥇', '🥈', '🥉'][v.place - 1] || '✅'}<b>Frozen!</b></div>` : '<button class="kidbtn freeze" data-tap>🧊 FREEZE!</button>';
  else if (v.phase === 'over') h += `<h2 class="${v.final === 1 ? 'win' : ''}">${v.final === 1 ? '🏆 You won!' : '🎉 Great dancing!'}</h2>`;
  el.innerHTML = h;
  el.querySelector('[data-tap]')?.addEventListener('pointerdown', e => { e.preventDefault(); try { navigator.vibrate?.(60); } catch {} send({ type: 'tap' }); });
}
