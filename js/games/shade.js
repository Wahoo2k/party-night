// Spot the Shade: a wall of colors on the TV. The clue-giver sees a secret shade and gives a one- or two-word
// clue (no basic color names!). Everyone taps the shade they think it is. (Hues and Cues-style.)
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'shade',
  name: 'Spot the Shade',
  min: 2,
  max: 20,
  blurb: 'One-word clues, a wall of colors. Tap the exact shade.',
};

export const COLS = 24, ROWS = 10;
export const TIMES = { pick: 60000, guess: 40000, reveal: 9000 };
export const BANNED = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey', 'violet', 'indigo', 'cyan', 'magenta', 'teal', 'turquoise', 'maroon', 'navy', 'beige', 'tan', 'gold', 'silver', 'lime', 'aqua'];
const ROWNAMES = 'ABCDEFGHIJ';

export const colorAt = (x, y) => `hsl(${Math.round((x / COLS) * 360)} ${y < 2 ? 55 : 80}% ${Math.round(88 - y * 7)}%)`;
export const cellName = (x, y) => `${ROWNAMES[y]}${x + 1}`;
export const dist = (a, b) => Math.max(Math.min(Math.abs(a.x - b.x), COLS - Math.abs(a.x - b.x)), Math.abs(a.y - b.y));   // hues wrap around
export const pointsFor = d => (d === 0 ? 3 : d === 1 ? 2 : d === 2 ? 1 : 0);

export function cleanClue(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim();
  if (!x) return { ok: false, why: 'Give a clue.' };
  if (x.split(' ').length > 2) return { ok: false, why: 'One or two words only.' };
  if (!/^[A-Za-z' -]{2,30}$/.test(x)) return { ok: false, why: 'Letters only.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  const bad = x.toLowerCase().split(/[\s-]+/).find(w => BANNED.includes(w.replace(/(dish|ish|y|s)$/, '')) || w === 'bluish' || BANNED.includes(w));
  if (bad) return { ok: false, why: `No color names like "${bad}"! Name a thing instead.` };
  return { ok: true, text: x };
}

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const randCell = rnd => ({ x: Math.floor(rnd() * COLS), y: 1 + Math.floor(rnd() * (ROWS - 2)) });

export function setup(players, rnd = Math.random) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const s = { game: 'shade', players: order, turns: Math.min(order.length <= 3 ? order.length * 2 : order.length, 8), turn: 0, round: 0, scores: Object.fromEntries(order.map(p => [p.pid, 0])) };
  start(s, Date.now(), rnd);
  return s;
}

function start(s, now, rnd) {
  s.giver = s.players[s.turn % s.players.length].pid;
  s.options = [randCell(rnd), randCell(rnd), randCell(rnd)];
  s.target = null; s.clue = null; s.guesses = {}; s.result = null;
  s.phase = 'pick'; s.round++;
  s.deadline = now + TIMES.pick;
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const guessers = s => s.players.filter(p => p.pid !== s.giver).map(p => p.pid);

function reveal(s, now) {
  const list = guessers(s).filter(pid => s.guesses[pid]).map(pid => { const d = dist(s.guesses[pid], s.target); return { pid, name: nameOf(s, pid), ...s.guesses[pid], pts: pointsFor(d) }; });
  list.forEach(x => (s.scores[x.pid] += x.pts));
  const giverPts = list.filter(x => x.pts >= 2).length;
  s.scores[s.giver] += giverPts;
  s.result = { list, giverPts };
  s.phase = 'reveal'; s.round++;
  s.deadline = now + TIMES.reveal;
}

function next(s, now, rnd) {
  s.turn++;
  if (s.turn >= s.turns) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  start(s, now, rnd);
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.scores.hasOwnProperty(pid)) return s;
  if (s.phase === 'pick' && pid === s.giver && a.type === 'clue') {
    const opt = s.options[a.i];
    const r = cleanClue(a.text);
    if (!opt || !r.ok) return s;
    s.target = opt; s.clue = r.text;
    s.phase = 'guess'; s.round++; s.deadline = now + TIMES.guess;
  } else if (s.phase === 'guess' && pid !== s.giver && a.type === 'guess' && !s.guesses[pid]) {
    const x = Math.round(Number(a.x)), y = Math.round(Number(a.y));
    if (!(x >= 0 && x < COLS && y >= 0 && y < ROWS)) return s;
    s.guesses[pid] = { x, y };
    if (guessers(s).every(g => s.guesses[g])) reveal(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'pick') next(s, now, rnd);
  else if (s.phase === 'guess') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now, rnd);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'pick') return s.turn === 0 ? `Welcome to Spot the Shade! One of you sees a secret color and gives a clue. No color names allowed! ${nameOf(s, s.giver)} is up first.` : `${['A new secret shade.', 'Next color.', 'Someone new picks a color.'][s.turn % 3]} ${nameOf(s, s.giver)} is picking.`;
  if (s.phase === 'guess') return `The clue is in. Find that shade! The clue is: ${s.clue}.`;
  if (s.phase === 'reveal') { const best = s.result.list.filter(x => x.pts === 3); return best.length ? `Bullseye! Well spotted, ${best.map(x => x.name).join(' and ')}.` : ['So close!', 'Nobody hit it exactly.', 'Near enough to argue about.'][s.turn % 3]; }
  if (s.phase === 'over') return `${ranking(s)[0].name} has the best eye for color!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'pick') return { sound: 'join', wait: 700, title: s.turn === 0 ? 'Spot the Shade' : nameOf(s, s.giver), sub: s.turn === 0 ? 'No color names!' : 'is giving the clue' };
  if (s.phase === 'guess') return { sound: 'vote', wait: 300 };
  if (s.phase === 'reveal') return { sound: s.result.list.some(x => x.pts === 3) ? 'win' : 'drumroll', wait: 900, fx: s.result.list.some(x => x.pts === 3) ? 'confetti' : null };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}

const BOT_CLUES = ['Cherry', 'Ketchup', 'Pumpkin', 'Tangerine', 'Banana', 'Lemon', 'Pickle', 'Grass', 'Forest', 'Mint', 'Pool', 'Sky', 'Ocean', 'Denim', 'Grape', 'Plum', 'Lilac', 'Bubblegum', 'Rose', 'Raspberry'];
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'pick' && v.isGiver) { const i = Math.floor(rnd() * 3); return { type: 'clue', i, text: BOT_CLUES[Math.floor((v.options[i].x / COLS) * BOT_CLUES.length)] }; }
  if (v.phase === 'guess' && !v.isGiver && !v.guessed && v._t) { const j = () => Math.round((rnd() - 0.5) * 4); return { type: 'guess', x: (v._t.x + j() + COLS) % COLS, y: Math.max(0, Math.min(ROWS - 1, v._t.y + j())) }; }
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, turn: s.turn + 1, turns: s.turns, giver: nameOf(s, s.giver), clue: s.clue, scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'guess') { v.n = Object.keys(s.guesses).length; v.total = guessers(s).length; }
  if (s.phase === 'reveal') { v.target = s.target; v.result = s.result; }
  return v;
}
export function phoneView(s, pid) {
  if (!s.scores.hasOwnProperty(pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, isGiver: pid === s.giver, giver: nameOf(s, s.giver), clue: s.clue, score: s.scores[pid] };
  if (s.phase === 'pick' && v.isGiver) v.options = s.options;
  if (s.phase === 'guess') { v.guessed = !!s.guesses[pid]; if (String(pid).startsWith('bot-')) v._t = s.target; }
  if (s.phase === 'reveal') { v.target = s.target; v.mine = s.result.list.find(x => x.pid === pid) || null; v.giverPts = s.result.giverPts; }
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

function grid({ target, marks = [], pickable = false, zoom = null } = {}) {
  const xs = zoom ? Array.from({ length: 7 }, (_, i) => (zoom.x - 3 + i + COLS) % COLS) : Array.from({ length: COLS }, (_, i) => i);
  const ys = zoom ? Array.from({ length: 5 }, (_, i) => zoom.y - 2 + i).filter(y => y >= 0 && y < ROWS) : Array.from({ length: ROWS }, (_, i) => i);
  const cells = ys.map(y => xs.map(x => {
    const here = marks.filter(m => m.x === x && m.y === y);
    const isT = target && target.x === x && target.y === y;
    const near = target && dist({ x, y }, target) === 1;
    return `<div class="shc ${isT ? 'target' : ''} ${near ? 'near' : ''}" style="background:${colorAt(x, y)}" ${pickable ? `data-x="${x}" data-y="${y}"` : ''}>${zoom ? `<small>${cellName(x, y)}</small>` : ''}${here.map(m => `<b class="shm" title="${esc(m.label)}">${esc(m.label.length <= 8 ? m.label : m.label.slice(0, 7) + '…')}</b>`).join('')}</div>`;
  }).join('')).join('');
  return `<div class="shgrid ${zoom ? 'zoom' : ''}" style="--cols:${xs.length}">${cells}</div>`;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'reveal' || v.phase === 'over');
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Turn ${v.turn} of ${v.turns}</p>`;
  if (v.phase === 'pick') h += `<h2>${esc(v.giver)} is choosing a secret shade…</h2>${grid()}<button class="btn ghost" data-host="next">Skip turn</button><div class="how"><h3>How to play</h3><ol><li>The clue-giver secretly picks one of these colors.</li><li>They give a clue of one or two words. No basic color names like "blue" or "green". Try "swimming pool" or "ketchup".</li><li>Everyone taps the shade they think it is.</li><li>Exact = 3 points, one away = 2, two away = 1. The clue-giver scores for every close guess.</li></ol></div>`;
  if (v.phase === 'guess') h += `<div class="cq">“${esc(v.clue)}”</div>${grid()}<p class="muted center">${v.n} of ${v.total} guessed <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Reveal now</button>`;
  if (v.phase === 'reveal') h += `<div class="cq">“${esc(v.clue)}”</div>${grid({ target: v.target, marks: v.result.list.map(x => ({ x: x.x, y: x.y, label: x.name })) })}<p class="say center">The shade was <b>${cellName(v.target.x, v.target.y)}</b>. ${esc(v.giver)} gets ${v.result.giverPts}.</p><div class="shres">${v.result.list.map(x => `<span class="${x.pts ? 'win' : 'muted'}">${esc(x.name)} +${x.pts}</span>`).join('')}</div><button class="btn" data-host="next">Next</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} has the best eye!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

let ui = { round: -1, opt: 0, zoom: null };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (ui.round !== v.round) ui = { round: v.round, opt: 0, zoom: null };
  let h = `<p class="muted">${v.score} point${v.score === 1 ? "" : "s"}</p>`;
  if (v.phase === 'pick' && v.isGiver) {
    const o = v.options[ui.opt];
    h += `<h2>Pick a secret shade</h2><div class="shopts">${v.options.map((c, i) => `<button class="shopt ${ui.opt === i ? 'on' : ''}" data-o="${i}" style="background:${colorAt(c.x, c.y)}"></button>`).join('')}</div><p class="muted">Your shade: <b>${cellName(o.x, o.y)}</b></p><form id="shf"><input id="shc" maxlength="30" autocomplete="off" placeholder="A thing that's this color"><p class="lose" id="err"></p><button class="btn" type="submit">Send clue</button></form><p class="muted small">One or two words. No color names!</p>`;
  } else if (v.phase === 'pick') h += `<h2>${esc(v.giver)} is choosing…</h2>`;
  else if (v.phase === 'guess' && v.isGiver) h += `<h2>Your clue: “${esc(v.clue)}”</h2><p class="say">No hints now!</p>`;
  else if (v.phase === 'guess' && v.guessed) h += '<h2>Locked in!</h2><p class="say">Watch the TV.</p>';
  else if (v.phase === 'guess') h += `<div class="cq small">“${esc(v.clue)}”</div>${ui.zoom ? `<p class="muted">Tap the exact shade</p>${grid({ pickable: true, zoom: ui.zoom })}<button class="btn ghost" id="back">← Whole wall</button>` : `<p class="muted">Tap near the color, then pick the exact shade</p>${grid({ pickable: true })}`}`;
  else if (v.phase === 'reveal') h += `<h2 class="${v.mine?.pts ? 'win' : ''}">${v.isGiver ? `+${v.giverPts}` : v.mine ? `+${v.mine.pts}` : 'No guess'}</h2><div class="shswatch" style="background:${colorAt(v.target.x, v.target.y)}"></div><p class="muted">It was ${cellName(v.target.x, v.target.y)}.</p>`;
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'Best eye in the room!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-o]').forEach(b => (b.onclick = () => { ui.opt = Number(b.dataset.o); const t = el.querySelector('#shc')?.value || ''; renderPhone(v, el, send); el.querySelector('#shc').value = t; }));
  const f = el.querySelector('#shf');
  if (f) f.onsubmit = e => { e.preventDefault(); const r = cleanClue(f.querySelector('#shc').value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'clue', i: ui.opt, text: r.text }); };
  el.querySelectorAll('[data-x]').forEach(b => (b.onclick = () => {
    const x = Number(b.dataset.x), y = Number(b.dataset.y);
    if (!ui.zoom) { ui.zoom = { x, y: Math.max(2, Math.min(ROWS - 3, y)) }; renderPhone(v, el, send); return; }
    el.querySelectorAll('[data-x]').forEach(c => c.removeAttribute('data-x'));
    send({ type: 'guess', x, y });
  }));
  el.querySelector('#back')?.addEventListener('click', () => { ui.zoom = null; renderPhone(v, el, send); });
}
