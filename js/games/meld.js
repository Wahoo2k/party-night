// Mind Meld: one player secretly sees a spot on a scale like "Cold ↔ Hot" and gives a one-line clue.
// Everyone else sets a dial on their phone at the same time. Closer = more points. (Wavelength-style.)
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'meld',
  name: 'Mind Meld',
  min: 2,
  max: 20,
  blurb: 'One clue, a secret spot on a scale. Can the room read your mind?',
};

export const SCALES = [
  ['Cold', 'Hot'], ['Boring', 'Exciting'], ['Easy', 'Hard'], ['Cheap', 'Expensive'], ['Tiny', 'Huge'], ['Quiet', 'Loud'],
  ['Healthy', 'Unhealthy'], ['Scary', 'Cute'], ['Useless', 'Useful'], ['Underrated', 'Overrated'], ['Old-fashioned', 'Modern'], ['Smells bad', 'Smells good'],
  ['Slow', 'Fast'], ['Soft', 'Hard'], ['Sad song', 'Happy song'], ['Bad pizza topping', 'Great pizza topping'], ['Snack', 'Meal'], ['Kid thing', 'Grown-up thing'],
  ['Calm', 'Chaotic'], ['Weak superpower', 'Strong superpower'], ['Bad pet', 'Great pet'], ['Indoor', 'Outdoor'], ['Normal', 'Weird'], ['Dangerous', 'Safe'],
  ['Forgettable', 'Unforgettable'], ['Bad gift', 'Great gift'], ['Easy to spell', 'Hard to spell'], ['Rough', 'Smooth'], ['Dirty', 'Clean'], ['Common', 'Rare'],
  ['Bad movie', 'Great movie'], ['Summer', 'Winter'], ['Light', 'Heavy'], ['Lazy', 'Hard-working'], ['Sweet', 'Sour'], ['Day', 'Night'],
  ['Feels short', 'Feels long'], ['Wet', 'Dry'], ['Villain', 'Hero'], ['Bad job', 'Dream job'], ['Fragile', 'Tough'], ['Mild', 'Spicy'],
  ['Silly', 'Serious'], ['Bad smell', 'Worst smell'], ['Ugly', 'Beautiful'], ['Overpriced', 'Bargain'], ['Easy chore', 'Worst chore'], ['Stinky cheese', 'Mild cheese'],
  ['Fake', 'Real'], ['Bad sport to watch', 'Great sport to watch'], ['Least fun at a party', 'Most fun at a party'], ['Bad superhero name', 'Great superhero name'],
];
export const TIMES = { clue: 75000, guess: 45000, reveal: 9000 };
const BANDS = [[4, 4], [9, 3], [15, 2]];   // within N points of the target -> points

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pointsFor = (g, t) => { const d = Math.abs(g - t); const b = BANDS.find(([n]) => d <= n); return b ? b[1] : 0; };

export function cleanClue(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (x.length < 2) return { ok: false, why: 'Give a clue.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  if (/\d/.test(x)) return { ok: false, why: 'No numbers! Name a thing instead.' };
  return { ok: true, text: x };
}

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const turns = Math.min(order.length <= 3 ? order.length * 2 : order.length, opts.short ? 4 : 8);
  const s = {
    game: 'meld', players: order, turns, turn: 0, round: 0,
    scales: shuffle([...SCALES.keys()], rnd).slice(0, turns),
    scores: Object.fromEntries(order.map(p => [p.pid, 0])),
    psychic: null, target: 0, clue: null, dial: {}, locked: {}, result: null, phase: 'clue', deadline: 0,
  };
  startTurn(s, Date.now(), rnd);
  return s;
}

function startTurn(s, now, rnd) {
  s.psychic = s.players[s.turn % s.players.length].pid;
  s.target = 5 + Math.floor(rnd() * 91);
  s.clue = null; s.dial = {}; s.locked = {}; s.result = null;
  s.phase = 'clue'; s.round++;
  s.deadline = now + TIMES.clue;
}

const guessers = s => s.players.filter(p => p.pid !== s.psychic).map(p => p.pid);
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const scale = s => SCALES[s.scales[s.turn]];

function reveal(s, now) {
  const list = guessers(s).map(pid => ({ pid, name: nameOf(s, pid), g: s.dial[pid], pts: s.dial[pid] === undefined ? 0 : pointsFor(s.dial[pid], s.target) }));
  list.forEach(x => (s.scores[x.pid] += x.pts));
  const avg = list.length ? list.reduce((a, x) => a + x.pts, 0) / list.length : 0;
  const psy = Math.round(avg);
  s.scores[s.psychic] += psy;
  const meld = list.length > 0 && list.every(x => x.pts >= 3);
  s.result = { list, psy, meld };
  s.phase = 'reveal'; s.round++;
  s.deadline = now + TIMES.reveal;
}

function next(s, now, rnd) {
  s.turn++;
  if (s.turn >= s.turns) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  startTurn(s, now, rnd);
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'clue' && a.type === 'clue' && pid === s.psychic) {
    const r = cleanClue(a.text);
    if (!r.ok) return s;
    s.clue = r.text; s.phase = 'guess'; s.round++; s.deadline = now + TIMES.guess;
  } else if (s.phase === 'guess' && pid !== s.psychic && !s.locked[pid]) {
    const v = Math.max(0, Math.min(100, Math.round(Number(a.v))));
    if (a.type === 'dial' && Number.isFinite(Number(a.v))) s.dial[pid] = v;
    if (a.type === 'lock' && Number.isFinite(Number(a.v))) { s.dial[pid] = v; s.locked[pid] = true; }
    if (guessers(s).every(g => s.locked[g])) reveal(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'clue') next(s, now, rnd);           // skip this psychic
  else if (s.phase === 'guess') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now, rnd);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (!s.deadline || now < s.deadline) return s;
  if (s.phase === 'clue') next(s, now, rnd);
  else if (s.phase === 'guess') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now, rnd);
  return s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);

export function narration(s) {
  const [L, R] = scale(s) || [];
  if (s.phase === 'clue') return s.turn === 0 ? `Welcome to Mind Meld! ${nameOf(s, s.psychic)} is the mind reader. They see a secret spot between ${L} and ${R}.` : `${nameOf(s, s.psychic)}, you're the mind reader. ${L} to ${R}.`;
  if (s.phase === 'guess') return `The clue is: ${s.clue}. Set your dials!`;
  if (s.phase === 'reveal') return s.result.meld ? 'Mind meld! Everyone was close!' : (s.result.list.find(x => x.pts === 4) ? `Bullseye for ${s.result.list.filter(x => x.pts === 4).map(x => x.name).join(' and ')}!` : '');
  if (s.phase === 'over') return `${ranking(s)[0].name} reads minds best!`;
  return '';
}

export function cue(s) {
  if (s.phase === 'clue') return { sound: 'join', wait: 700, title: s.turn === 0 ? 'Mind Meld' : nameOf(s, s.psychic), sub: s.turn === 0 ? 'Read the mind reader' : 'is the mind reader' };
  if (s.phase === 'guess') return { sound: 'vote', wait: 300 };
  if (s.phase === 'reveal') return { sound: s.result.meld ? 'win' : 'drumroll', wait: s.result.meld ? 900 : 1500, fx: s.result.meld ? 'confetti' : null };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}

// Bots know the target (they're for testing) and miss by a bit.
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'clue' && v.isPsychic) return { type: 'clue', text: ['Way over left', 'Pretty far left', 'A bit left', 'Right in the middle', 'A bit right', 'Pretty far right', 'Way over right'][Math.min(6, Math.floor(v.target / 14.3))] };
  if (v.phase === 'guess' && !v.isPsychic && !v.locked && v._t !== undefined) return { type: 'lock', v: Math.max(0, Math.min(100, v._t + Math.round((rnd() - 0.5) * 40))) };
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, scale: scale(s), turn: s.turn + 1, turns: s.turns, psychic: nameOf(s, s.psychic), clue: s.clue, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  if (s.phase === 'guess') { v.locked = guessers(s).filter(g => s.locked[g]).length; v.total = guessers(s).length; }
  if (s.phase === 'reveal') { v.target = s.target; v.result = s.result; }
  return v;
}

export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const bot = String(pid).startsWith('bot-');
  const v = { phase: s.phase, round: s.round, scale: scale(s), isPsychic: pid === s.psychic, psychic: nameOf(s, s.psychic), clue: s.clue, score: s.scores[pid] };
  if (s.phase === 'clue' && v.isPsychic) v.target = s.target;
  if (s.phase === 'guess') { v.locked = !!s.locked[pid]; if (bot) v._t = s.target; }
  if (s.phase === 'reveal') { const me = s.result.list.find(x => x.pid === pid); v.pts = v.isPsychic ? s.result.psy : me?.pts || 0; v.target = s.target; v.mine = me?.g; }
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

// ---------- the scale bar ----------
function bar(scaleLR, { target, marks = [], big = false } = {}) {
  const bands = target === undefined ? '' : BANDS.slice().reverse().map(([n, p]) => `<div class="mband b${p}" style="left:${Math.max(0, target - n)}%;width:${Math.min(100, target + n) - Math.max(0, target - n)}%"><span>${p}</span></div>`).join('') + `<div class="mtarget" style="left:${target}%"></div>`;
  const pins = [...marks].sort((x, y) => x.g - y.g).map((m, i) => `<div class="mpin ${m.cls || ''}" style="left:${m.g}%;--d:${i * 0.12}s;margin-top:${(i % 3) * 26}px"><b>${esc(m.label)}</b></div>`).join('');
  return `<div class="mscale ${big ? 'mbig' : ''}"><div class="mlabels"><span>${esc(scaleLR[0])}</span><span>${esc(scaleLR[1])}</span></div><div class="mbar">${bands}${pins}</div></div>`;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'reveal' || v.phase === 'over');
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'clue') h = `<p class="cat">Turn ${v.turn} of ${v.turns}</p><h2>${esc(v.psychic)} is the mind reader</h2>${bar(v.scale, { big: true })}<p class="say">${esc(v.psychic)} sees a secret spot on this scale and is thinking of a clue: something that belongs right there.</p><button class="btn ghost" data-host="next">Skip this turn</button>
    <div class="how"><h3>How to play</h3><ol><li>The mind reader sees a secret spot between the two ends.</li><li>They give a clue that fits that spot. For "Cold ↔ Hot", a spot near the middle might be "a warm bath".</li><li>Everyone else slides their dial on their phone. Talk it over out loud!</li><li>Closer to the spot = more points. The mind reader scores when the room gets close.</li></ol></div>`;
  if (v.phase === 'guess') h = `<p class="cat">Turn ${v.turn} of ${v.turns} · clue from ${esc(v.psychic)}</p><div class="cq">${esc(v.clue)}</div>${bar(v.scale, { big: true })}<p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><div class="meter"><span style="width:${v.total ? (100 * v.locked) / v.total : 0}%"></span></div><p class="muted center">${v.locked} of ${v.total} locked in · talk it over!</p><button class="btn ghost" data-host="next">Reveal now</button>`;
  if (v.phase === 'reveal') h = `<p class="cat">Clue from ${esc(v.psychic)}</p><div class="cq">${esc(v.clue)}</div>${bar(v.scale, { big: true, target: v.target, marks: v.result.list.filter(x => x.g !== undefined).map(x => ({ g: x.g, label: x.name, cls: 'p' + x.pts })) })}<p class="say center">${v.result.meld ? '<b class="win">Mind meld!</b> ' : ''}${esc(v.psychic)} gets <b>${v.result.psy}</b>.</p><button class="btn" data-host="next">Next</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} reads minds best!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

let dial = { round: -1, v: 50 };
let dialTimer = null;
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (v.phase === 'clue' && v.isPsychic) {
    el.innerHTML = `<h2>You're the mind reader</h2><p class="muted">Only you can see the spot. Give a clue that belongs right there.</p>${bar(v.scale, { target: v.target })}<form id="mf"><input id="mc" maxlength="40" autocomplete="off" placeholder="A thing, a place, a person…"><p class="lose" id="err"></p><button class="btn" type="submit">Send clue</button></form>`;
    const f = el.querySelector('#mf');
    f.onsubmit = e => { e.preventDefault(); const r = cleanClue(f.querySelector('#mc').value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'clue', text: r.text }); };
    return;
  }
  if (v.phase === 'clue') { el.innerHTML = `<h2>${esc(v.psychic)} is thinking…</h2>${bar(v.scale)}<p class="muted">Get ready to read their mind.</p>`; return; }
  if (v.phase === 'guess' && v.isPsychic) { el.innerHTML = `<h2>Your clue: “${esc(v.clue)}”</h2><p class="say">No hints! Poker face.</p>`; return; }
  if (v.phase === 'guess') {
    if (v.locked) { el.innerHTML = '<h2>Locked in!</h2><p class="say">Watch the TV.</p>'; return; }
    if (dial.round !== v.round) dial = { round: v.round, v: 50 };
    el.innerHTML = `<p class="muted">Clue</p><div class="clueline small"><b>${esc(v.clue)}</b></div><div class="mlabels"><span>${esc(v.scale[0])}</span><span>${esc(v.scale[1])}</span></div><input type="range" id="md" class="mdial" min="0" max="100" value="${dial.v}"><button class="btn" id="lock">Lock it in</button>`;
    const r = el.querySelector('#md');
    r.oninput = () => { dial.v = Number(r.value); clearTimeout(dialTimer); dialTimer = setTimeout(() => send({ type: 'dial', v: dial.v }), 400); };
    el.querySelector('#lock').onclick = e => { clearTimeout(dialTimer); e.target.disabled = true; send({ type: 'lock', v: dial.v }); };
    return;
  }
  if (v.phase === 'reveal') { el.innerHTML = `<h2 class="${v.pts ? 'win' : ''}">+${v.pts}</h2>${bar(v.scale, { target: v.target, marks: v.mine !== undefined ? [{ g: v.mine, label: 'You' }] : [] })}<p class="muted">${v.score} points</p>`; return; }
  if (v.phase === 'over') el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You read minds best!' : `You came #${v.place}`}</h2><p class="muted">${v.score} points</p>`;
}
