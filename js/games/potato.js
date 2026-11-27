// Hot Potato: a category goes up on the TV ("Name a fruit!"). Whoever holds the potato says an answer out loud,
// then taps to toss it to someone else. A hidden timer is ticking. Holding it when it blows? That's a burn.
import { esc } from '../ui.js';

export const meta = {
  id: 'potato',
  name: 'Hot Potato',
  min: 3,
  max: 16,
  blurb: 'Say an answer, toss the potato. Don\'t be holding it when it blows!',
};

export const CATEGORIES = [
  'Name a fruit', 'Name an animal', 'Name a color', 'Name a sport', 'Name a cartoon character', 'Name something in a kitchen', 'Name a pizza topping',
  'Name a country', 'Name a vegetable', 'Name something you wear', 'Name a breakfast food', 'Name a song', 'Name an ocean animal', 'Name a superhero',
  'Name a board game', 'Name a dessert', 'Name a job', 'Name something with wheels', 'Name a holiday', 'Name a bird', 'Name something cold',
  'Name a city', 'Name a candy', 'Name a musical instrument', 'Name a body part', 'Name something at the beach', 'Name a movie', 'Name a drink',
];
export const ROUNDS = 8;
export const MIN_HOLD = 1200;   // you have to hold it long enough to say something
export const TIMES = { ready: 4000, boom: 6000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const s = { game: 'potato', players: players.map(p => ({ pid: p.pid, name: p.name })), cats: shuffle([...CATEGORIES.keys()], rnd).slice(0, opts.short ? 5 : ROUNDS), r: 0, round: 0, burns: {}, holder: null, passes: 0, eventId: 0 };
  s.players.forEach(p => (s.burns[p.pid] = 0));
  ready(s, Date.now(), rnd);
  return s;
}
function ready(s, now, rnd) {
  s.holder = s.players[Math.floor(rnd() * s.players.length)].pid;
  s.passes = 0; s.phase = 'ready'; s.round++; s.deadline = now + TIMES.ready;
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || s.phase !== 'live' || pid !== s.holder || a.type !== 'toss') return s;
  if (now - s.since < MIN_HOLD) return s;
  const others = s.players.filter(p => p.pid !== pid);
  const to = others.some(p => p.pid === a.to) ? a.to : others[Math.floor(rnd() * others.length)].pid;
  s.holder = to; s.since = now; s.passes++; s.eventId++;
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'ready') { s.phase = 'live'; s.round++; s.since = now; s.boomAt = now + 12000 + Math.floor(rnd() * 18000); s.deadline = s.boomAt; }
  else if (s.phase === 'live') { s.burns[s.holder]++; s.burned = s.holder; s.phase = 'boom'; s.round++; s.deadline = now + TIMES.boom; }
  else if (s.phase === 'boom') { s.r++; if (s.r >= s.cats.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else ready(s, now, rnd); }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, burns: s.burns[p.pid] })).sort((a, b) => a.burns - b.burns);
export function narration(s) {
  if (s.phase === 'ready') return `${s.r === 0 ? 'Hot Potato! Say an answer out loud, then toss the potato on your phone. ' : ''}${CATEGORIES[s.cats[s.r]]}! ${nameOf(s, s.holder)} starts.`;
  if (s.phase === 'boom') return `Boom! ${nameOf(s, s.burned)} got burned!`;
  if (s.phase === 'over') { const r = ranking(s); return `${r[0].name} kept the coolest hands!`; }
  return '';
}
export function cue(s) {
  if (s.phase === 'ready') return { sound: 'join', wait: 400, title: CATEGORIES[s.cats[s.r]] + '!', sub: `${nameOf(s, s.holder)} starts` };
  if (s.phase === 'live') return { sound: 'drumroll', wait: 200, ambient: 'buzz' };
  if (s.phase === 'boom') return { sound: 'death', wait: 200, title: '💥 BOOM!', sub: `${nameOf(s, s.burned)} got burned`, tone: 'blood', fx: 'claws' };
  if (s.phase === 'over') return { sound: 'win', wait: 1200, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function cueEvent(s) { return s.phase === 'live' && s.eventId ? { id: s.eventId, sound: 'tick', say: '' } : null; }
export function botAct(v, rnd = Math.random) { return v.phase === 'live' && v.holding && v.held > 1.5 && rnd() < 0.5 ? { type: 'toss', to: v.others[Math.floor(rnd() * v.others.length)].pid } : null; }

export function tvView(s, now = Date.now()) {
  return { phase: s.phase, r: s.r + 1, of: s.cats.length, cat: s.cats[s.r] !== undefined ? CATEGORIES[s.cats[s.r]] : '', holder: nameOf(s, s.holder), passes: s.passes, burned: s.burned ? nameOf(s, s.burned) : null, scores: ranking(s), eventId: s.eventId };
}
export function phoneView(s, pid, now = Date.now()) {
  if (s.burns[pid] === undefined) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, cat: s.cats[s.r] !== undefined ? CATEGORIES[s.cats[s.r]] : '', holding: s.holder === pid && s.phase === 'live', holder: nameOf(s, s.holder), burns: s.burns[pid], burned: s.phase === 'boom' && s.burned === pid, others: s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name })), place: s.phase === 'over' ? ranking(s).findIndex(x => x.pid === pid) + 1 : 0 };
  if (String(pid).startsWith('bot-') && v.holding) v.held = (now - s.since) / 1000;
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase !== 'boom');
  const scores = `<div class="scores"><h3>Burns</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${'🔥'.repeat(p.burns) || '—'}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Round ${Math.min(v.r, v.of)} of ${v.of}</p>`;
  if (v.phase === 'ready' || v.phase === 'live') h += `<div class="cq">${esc(v.cat)}!</div><div class="potato ${v.phase === 'live' ? 'live' : ''}" key="${v.eventId}">🥔</div><h2 class="center">${esc(v.holder)}</h2><p class="muted center">${v.phase === 'live' ? `Say one out loud, then toss it! · ${v.passes} tosses` : 'Get ready…'}</p>`;
  if (v.phase === 'boom') h += `<div class="potato boom">💥</div><h2 class="center lose">${esc(v.burned)} got burned!</h2><button class="btn" data-host="next">Next round</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} has the coolest hands!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.burns} 🔥</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}
let heldSince = 0;
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">${'🔥'.repeat(v.burns) || 'No burns yet'}</p>`;
  if (v.phase === 'ready') h += `<div class="cq small">${esc(v.cat)}!</div><h2>${esc(v.holder)} starts…</h2>`;
  else if (v.phase === 'live' && v.holding) {
    heldSince = heldSince || Date.now();
    h += `<div class="cq small">${esc(v.cat)}!</div><div class="potato live small">🥔</div><p class="say center">Say one out loud, then toss it!</p><div class="ptoss">${v.others.map(o => `<button class="btn" data-to="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}</div><button class="kidbtn ptbtn" data-to="">🥔 TOSS!</button>`;
  } else if (v.phase === 'live') { heldSince = 0; h += `<div class="cq small">${esc(v.cat)}!</div><h2>🥔 ${esc(v.holder)} has it</h2><p class="say">Think of your answer!</p>`; }
  else if (v.phase === 'boom') h += `<h2 class="${v.burned ? 'lose' : 'win'}">${v.burned ? '💥 You got burned!' : `💥 ${esc(v.holder)} got burned!`}</h2>`;
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'Coolest hands! You won!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  if (v.holding) { try { navigator.vibrate?.([60, 40, 60]); } catch {} }
  el.querySelectorAll('[data-to]').forEach(b => (b.onpointerdown = e => {
    e.preventDefault();
    if (Date.now() - heldSince < 1200) { b.textContent = 'Say an answer first!'; return; }
    heldSince = 0; el.querySelectorAll('[data-to]').forEach(x => (x.disabled = true));
    send({ type: 'toss', to: b.dataset.to || null });
  }));
}
