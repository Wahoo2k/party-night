// Split the Room: finish a what-if question so the room splits as close to 50/50 as possible.
// "You can fly, but ____. Do you take the power?" Everyone votes; the closer to a tie, the more you score.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

import { freshOrder } from './cards.js';
export const meta = {
  id: 'split',
  name: 'Split the Room',
  min: 3,
  max: 16,
  blurb: 'Finish the what-if so the room splits right down the middle.',
};

export const PROMPTS = [
  'You can fly, but ____. Do you take the power?', 'You win a free vacation, but ____. Do you go?', 'You can eat any food without gaining weight, but ____. Deal?',
  'You get a pet dragon, but ____. Do you keep it?', 'You can read minds, but ____. Do you want it?', 'You get $10,000 right now, but ____. Do you take it?',
  'You can talk to animals, but ____. Do you accept?', 'You never have to sleep again, but ____. Do you sign up?', 'You can be invisible whenever you want, but ____. Yes or no?',
  'You get the best seats at any game, forever, but ____. Do you take them?', 'You can live in a castle for free, but ____. Do you move in?', 'You get to meet your hero, but ____. Do you go?',
  'You can time travel once, but ____. Do you do it?', 'You get unlimited pizza for life, but ____. Deal?', 'You become famous overnight, but ____. Do you want it?',
  'You can teleport anywhere, but ____. Do you use it?', 'You get a robot that does all your chores, but ____. Do you buy it?', 'You can speak every language, but ____. Yes or no?',
  'You can retire tomorrow with plenty of money, but ____. Do you do it?', 'You get to be a kid again for a week, but ____. Do you go back?', 'You can breathe underwater, but ____. Do you take it?',
  'You get a lifetime supply of your favorite candy, but ____. Deal?', 'You can control the weather, but ____. Do you want the job?', 'You get to live on the Moon for a year, but ____. Do you go?',
  'You get a personal chef, but ____. Do you hire them?', 'You can pause time whenever you like, but ____. Do you take it?', 'You never get stuck in traffic again, but ____. Deal?', 'You get a free house, but ____. Do you move in?', 'You can eat dessert for every meal, but ____. Deal?', 'You win front-row concert tickets for life, but ____. Do you take them?', 'You never have to do chores again, but ____. Do you accept?', 'You get a robot that does your work, but ____. Do you keep it?', 'You can teleport anywhere, but ____. Do you want it?', 'You always find a parking spot, but ____. Deal?', 'You get to be on your favorite TV show, but ____. Do you go?', 'You can breathe underwater, but ____. Yes or no?', 'You get an extra hour every day, but ____. Do you take it?', 'You never lose your keys or phone again, but ____. Deal?', 'You get free flights forever, but ____. Do you sign up?', 'You can remember everything you read, but ____. Do you want it?', 'You get to be the boss tomorrow, but ____. Do you accept?', 'You win a year off work, paid, but ____. Do you take it?', 'You get a puppy that never grows up, but ____. Do you keep it?', 'You can always tell when someone is lying, but ____. Do you want it?', 'You get the perfect singing voice, but ____. Deal?', 'You never feel cold again, but ____. Yes or no?', 'You get a treehouse mansion, but ____. Do you move in?',
];
const FILL = ['you have to wear a clown nose every day', 'you can only eat soup', 'you must sing everything you say', 'a goose follows you everywhere', 'you lose your sense of taste', 'you have to move to Antarctica', 'your phone only plays polka music', 'you sneeze glitter', 'you have to wear socks on your hands', 'every Tuesday you turn into a frog', 'you can never use the internet again', 'your hair turns bright green'];
export const TIMES = { write: 70000, vote: 20000, result: 6500 };
const ROUNDS = 2;
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const splitScore = (yes, no) => (yes + no ? Math.round((2000 * Math.min(yes, no)) / (yes + no)) : 0);
export function cleanFill(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 70);
  if (x.length < 2) return { ok: false, why: 'Fill in the blank.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: x };
}

export function setup(players, rnd = Math.random, prev = null) {
  const fo = freshOrder(PROMPTS.length, prev, 8, rnd);
  const s = { seenIdx: fo.seenIdx, game: 'split', players: players.map(p => ({ pid: p.pid, name: p.name })), scores: Object.fromEntries(players.map(p => [p.pid, 0])), r: 0, round: 0, deck: fo.order.slice().reverse() };
  startRound(s, Date.now(), rnd);
  return s;
}
function startRound(s, now, rnd) {
  s.items = s.players.map(p => { if (!s.deck.length) s.deck = shuffle([...PROMPTS.keys()], rnd); return { pid: p.pid, prompt: s.deck.pop(), fill: null }; });
  s.k = 0; s.votes = {}; s.result = null;
  s.phase = 'write'; s.round++; s.deadline = now + TIMES.write;
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const item = s => s.items[s.k];
const full = (s, it) => PROMPTS[it.prompt].replace('____', it.fill);

function toVote(s, now, rnd) {
  s.items.forEach(it => { if (!it.fill) { it.fill = FILL[Math.floor(rnd() * FILL.length)]; it.auto = true; } });
  s.items = shuffle(s.items, rnd); s.k = 0;
  vote(s, now);
}
function vote(s, now) { s.votes = {}; s.result = null; s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote; }
function result(s, now) {
  const yes = Object.values(s.votes).filter(Boolean).length, no = Object.values(s.votes).filter(v => v === false).length;
  const pts = splitScore(yes, no);
  s.scores[item(s).pid] += pts;
  s.result = { yes, no, pts };
  s.phase = 'result'; s.round++; s.deadline = now + TIMES.result;
}
function next(s, now, rnd) {
  s.k++;
  if (s.k < s.items.length) return vote(s, now);
  s.r++;
  if (s.r >= ROUNDS) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  startRound(s, now, rnd);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.scores.hasOwnProperty(pid)) return s;
  if (s.phase === 'write' && a.type === 'fill') {
    const it = s.items.find(x => x.pid === pid);
    const r = cleanFill(a.text);
    if (!it || it.fill || !r.ok) return s;
    it.fill = r.text;
    if (s.items.every(x => x.fill)) toVote(s, now, rnd);
  } else if (s.phase === 'vote' && pid !== item(s).pid && typeof a.yes === 'boolean') {
    s.votes[pid] = a.yes;
    if (s.players.every(p => p.pid === item(s).pid || s.votes[p.pid] !== undefined)) result(s, now);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'write') toVote(s, now, rnd);
  else if (s.phase === 'vote') result(s, now);
  else if (s.phase === 'result') next(s, now, rnd);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'write') return s.r === 0 ? 'Welcome to Split the Room! Finish your what-if question so the room splits right down the middle. A perfect fifty-fifty scores the most!' : 'Round two! Points count double. Just kidding. Same rules.';
  if (s.phase === 'vote') return full(s, item(s));
  if (s.phase === 'result') return s.result.yes === s.result.no && s.result.yes ? 'A perfect split!' : s.result.yes && s.result.no ? '' : 'Everyone agreed. No points!';
  if (s.phase === 'over') return `${ranking(s)[0].name} splits the room best!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'write') return { sound: 'join', wait: 700, title: s.r === 0 ? 'Split the Room' : 'Round 2', sub: 'Aim for 50/50' };
  if (s.phase === 'vote') return { sound: 'vote', wait: 400 };
  if (s.phase === 'result') return { sound: s.result.pts >= 1600 ? 'win' : s.result.pts ? 'safe' : 'lose', wait: 500, fx: s.result.yes && s.result.yes === s.result.no ? 'confetti' : null };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'write' && !v.sent) return { type: 'fill', text: FILL[Math.floor(rnd() * FILL.length)] };
  if (v.phase === 'vote' && !v.mine && v.voted === null) return { type: 'vote', yes: rnd() < 0.5 };
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, r: s.r + 1, scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'write') { v.done = s.items.filter(i => i.fill).map(i => nameOf(s, i.pid)); v.waiting = s.items.filter(i => !i.fill).map(i => nameOf(s, i.pid)); }
  if (s.phase === 'vote' || s.phase === 'result') { const it = item(s); v.parts = PROMPTS[it.prompt].split('____'); v.fill = it.fill; v.by = nameOf(s, it.pid); v.k = s.k + 1; v.of = s.items.length; v.n = Object.keys(s.votes).length; v.total = s.players.length - 1; }
  if (s.phase === 'result') v.result = s.result;
  return v;
}
export function phoneView(s, pid) {
  if (!s.scores.hasOwnProperty(pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, score: s.scores[pid] };
  if (s.phase === 'write') { const it = s.items.find(x => x.pid === pid); v.parts = PROMPTS[it.prompt].split('____'); v.sent = !!it.fill; }
  if (s.phase === 'vote') { v.mine = item(s).pid === pid; v.text = full(s, item(s)); v.voted = s.votes[pid] ?? null; }
  if (s.phase === 'result') { v.mine = item(s).pid === pid; v.result = s.result; }
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'result' || v.phase === 'over');
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Round ${Math.min(v.r, ROUNDS)} of ${ROUNDS}</p>`;
  if (v.phase === 'write') h += `<h2>Finish your what-if</h2><p class="say">Make it a tough call! A perfect 50/50 split of the room scores 1,000.</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><div class="roster">${v.done.map(n => `<div class="chip skdone">✓ ${esc(n)}</div>`).join('')}${v.waiting.map(n => `<div class="chip">✏️ ${esc(n)}</div>`).join('')}</div><button class="btn ghost" data-host="next">Start voting</button>`;
  if (v.phase === 'vote' || v.phase === 'result') {
    h += `<p class="muted">${v.k} of ${v.of} · by ${esc(v.by)}</p><div class="cq">${esc(v.parts[0])}<span class="spfill">${esc(v.fill)}</span>${esc(v.parts[1] || '')}</div>`;
    if (v.phase === 'vote') h += `<p class="say center">Vote on your phone! <span class="clock">${v.left}</span></p><div class="meter"><span style="width:${v.total ? (100 * v.n) / v.total : 0}%"></span></div><button class="btn ghost" data-host="next">Close voting</button>`;
    else { const t = v.result.yes + v.result.no || 1; h += `<div class="spbar" data-beat="1"><div class="yes" style="flex:${v.result.yes || 0.001}">YES ${v.result.yes}</div><div class="no" style="flex:${v.result.no || 0.001}">NO ${v.result.no}</div></div><h2 class="center ${v.result.pts ? 'win' : 'lose'}" data-beat="2">${esc(v.by)} +${v.result.pts.toLocaleString()}${v.result.yes === v.result.no && v.result.yes ? ' · Perfect split!' : ''}</h2><p class="muted center">${Math.round((100 * v.result.yes) / t)}% yes</p><button class="btn" data-host="next">Next</button>`; }
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} splits the room best!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

let draft = { round: -1, text: '' };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">${v.score.toLocaleString()} points</p>`;
  if (v.phase === 'write') {
    if (v.sent) h += '<h2>Sent!</h2><p class="say">Waiting for the others…</p>';
    else {
      if (draft.round !== v.round) draft = { round: v.round, text: '' };
      h += `<h2>Make it a tough call</h2><p class="tq small">${esc(v.parts[0])}<b>______</b>${esc(v.parts[1] || '')}</p><form id="spf"><input id="spt" maxlength="70" autocomplete="off" placeholder="…the catch" value="${esc(draft.text)}"><p class="lose" id="err"></p><button class="btn" type="submit">Send</button></form><button class="btn ghost" id="safety" type="button">🛟 Stuck? Give me one</button><p class="muted small">Aim for half the room saying yes and half saying no.</p>`;
    }
  }
  if (v.phase === 'vote') h += v.mine ? '<h2>That\'s yours!</h2><p class="say">Fingers crossed for 50/50.</p>' : `<p class="tq small">${esc(v.text)}</p><div class="row"><button class="btn ${v.voted === true ? '' : 'ghost'}" data-y="1">YES</button><button class="btn ${v.voted === false ? '' : 'ghost'}" data-y="0">NO</button></div>`;
  if (v.phase === 'result') h += `<h2>${v.result.yes} yes · ${v.result.no} no</h2>${v.mine ? `<p class="say win">+${v.result.pts.toLocaleString()}</p>` : ''}`;
  if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  const f = el.querySelector('#spf');
  if (f) { const inp = f.querySelector('#spt'); inp.oninput = () => (draft.text = inp.value); el.querySelector('#safety').onclick = () => { inp.value = FILL[Math.floor(Math.random() * FILL.length)]; draft.text = inp.value; }; f.onsubmit = e => { e.preventDefault(); const r = cleanFill(inp.value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'fill', text: r.text }); }; }
  el.querySelectorAll('[data-y]').forEach(b => (b.onclick = () => send({ type: 'vote', yes: b.dataset.y === '1' })));
}
