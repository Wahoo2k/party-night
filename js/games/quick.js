// Quick Games: a mixed pack of fast opinion rounds.
//   Hot Take:          pick your answer, then guess what most of the room picked.
//   Would You Rather:  pick a side, then guess which side wins.
//   Most Likely To:    vote for the player most likely to... and score for reading the room.
import { esc } from '../ui.js';

export const meta = {
  id: 'quick',
  name: 'Quick Games',
  min: 3,
  max: 20,
  blurb: 'Hot takes, Would You Rather and Most Likely To. Guess how the room votes.',
};

export const HOT = [
  { q: 'Best pizza topping?', o: ['Pepperoni', 'Plain cheese', 'Pineapple', 'Veggies'] },
  { q: 'Best season?', o: ['Spring', 'Summer', 'Fall', 'Winter'] },
  { q: 'Best way to eat a cookie?', o: ['Dunked in milk', 'Warm from the oven', 'Raw dough', 'Ice cream sandwich'] },
  { q: 'Best holiday?', o: ['Thanksgiving', 'Halloween', 'Christmas', 'Fourth of July'] },
  { q: 'Best pet?', o: ['Dog', 'Cat', 'Fish', 'No pets'] },
  { q: 'Best potato?', o: ['French fries', 'Mashed', 'Baked', 'Tater tots'] },
  { q: 'Best breakfast?', o: ['Pancakes', 'Eggs and bacon', 'Cereal', 'Skip it'] },
  { q: 'Best vacation?', o: ['Beach', 'Mountains', 'Big city', 'Theme park'] },
  { q: 'Best pie?', o: ['Pumpkin', 'Apple', 'Pecan', 'Pizza (it counts)'] },
  { q: 'Worst chore?', o: ['Dishes', 'Laundry', 'Bathrooms', 'Yard work'] },
  { q: 'Best ice cream flavor?', o: ['Chocolate', 'Vanilla', 'Cookie dough', 'Mint chip'] },
  { q: 'Best way to spend a rainy day?', o: ['Movie marathon', 'Board games', 'Nap', 'Splash in puddles'] },
  { q: 'Best superpower?', o: ['Flying', 'Invisibility', 'Teleporting', 'Super strength'] },
  { q: 'Best sandwich?', o: ['Grilled cheese', 'PB&J', 'Turkey club', 'BLT'] },
  { q: 'How do you squeeze the toothpaste?', o: ['From the bottom', 'From the middle', 'Whatever works', 'Someone else buys it'] },
  { q: 'Best Thanksgiving side?', o: ['Stuffing', 'Mashed potatoes', 'Mac and cheese', 'Cranberry sauce'] },
];

export const WYR = [
  ['Be able to fly', 'Be able to breathe underwater'],
  ['Have a pet dragon', 'Have a pet unicorn'],
  ['Only eat pizza forever', 'Never eat pizza again'],
  ['Live where it\'s always summer', 'Live where it\'s always winter'],
  ['Be really fast', 'Be really strong'],
  ['Talk to animals', 'Speak every language'],
  ['Have no homework ever', 'Have no chores ever'],
  ['Go to the past', 'Go to the future'],
  ['Be a famous singer', 'Be a famous athlete'],
  ['Live in a treehouse', 'Live in a castle'],
  ['Never use your phone again', 'Never watch TV again'],
  ['Eat a bug', 'Lick a doorknob'],
  ['Have a rewind button for life', 'Have a pause button for life'],
  ['Always be 10 minutes late', 'Always be 20 minutes early'],
  ['Have a personal chef', 'Have a personal driver'],
  ['Only whisper', 'Only shout'],
  ['Explore space', 'Explore the deep ocean'],
  ['Have spaghetti for hair', 'Sweat maple syrup'],
  ['Never be cold again', 'Never be hot again'],
  ['Be invisible', 'Read minds'],
];

export const MLT = [
  'Who is most likely to become famous?',
  'Who is most likely to survive a zombie apocalypse?',
  'Who is most likely to forget their own birthday?',
  'Who is most likely to laugh at the wrong moment?',
  'Who is most likely to win a reality TV show?',
  'Who is most likely to get lost in a grocery store?',
  'Who is most likely to adopt ten cats?',
  'Who is most likely to eat dessert first?',
  'Who is most likely to fall asleep during a movie?',
  'Who is most likely to become a millionaire?',
  'Who is most likely to start a dance party?',
  'Who is most likely to cry at a commercial?',
  'Who is most likely to be late to their own wedding?',
  'Who is most likely to talk their way out of trouble?',
  'Who is most likely to try the weirdest food?',
  'Who is most likely to break something by accident?',
  'Who is most likely to win at this game?',
  'Who is most likely to sing in the shower?',
];

const ROUNDS = 9;
const PTS = 100;
export const TIMES = { vote: 25000, reveal: 7500 };

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random, prev = null) {
  const used = new Set(prev?.used || []);
  const pick = (kind, n, list) => {
    let pool = list.map((_, i) => i).filter(i => !used.has(kind + i));
    if (pool.length < n) pool = list.map((_, i) => i);
    return shuffle(pool, rnd).slice(0, n).map(i => ({ kind, i }));
  };
  const per = ROUNDS / 3;
  const hot = pick('hot', per, HOT), wyr = pick('wyr', per, WYR), mlt = pick('mlt', per, MLT);
  const rounds = [];
  for (let k = 0; k < per; k++) rounds.push(hot[k], wyr[k], mlt[k]);
  const scores = {};
  players.forEach(p => (scores[p.pid] = prev?.scores?.[p.pid] || 0));
  return {
    game: 'quick',
    phase: 'vote',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    rounds, n: 0,
    picks: {}, guesses: {},
    scores, gained: {}, titles: {},
    used: [...used, ...rounds.map(r => r.kind + r.i)].slice(-40),
    deadline: Date.now() + TIMES.vote,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const round = s => s.rounds[s.n];
function prompt(s) {
  const r = round(s);
  if (r.kind === 'hot') return { kind: r.kind, label: 'Hot Take', q: HOT[r.i].q, options: HOT[r.i].o };
  if (r.kind === 'wyr') return { kind: r.kind, label: 'Would You Rather', q: 'Would you rather…', options: WYR[r.i] };
  return { kind: r.kind, label: 'Most Likely To', q: MLT[r.i], options: s.players.map(p => p.name), pids: s.players.map(p => p.pid) };
}
const needsGuess = s => round(s).kind !== 'mlt';
const doneFor = (s, pid) => s.picks[pid] !== undefined && (!needsGuess(s) || s.guesses[pid] !== undefined);

function counts(s) {
  const n = prompt(s).options.length;
  const c = new Array(n).fill(0);
  Object.values(s.picks).forEach(i => c[i]++);
  return c;
}

function reveal(s, now) {
  const c = counts(s);
  const top = Math.max(...c);
  const winners = c.map((x, i) => (x === top && top > 0 ? i : -1)).filter(i => i >= 0);
  const g = {};
  s.players.forEach(p => (g[p.pid] = 0));
  if (needsGuess(s)) Object.entries(s.guesses).forEach(([pid, i]) => { if (winners.includes(i)) g[pid] += PTS; });
  else {
    Object.entries(s.picks).forEach(([pid, i]) => { if (winners.includes(i)) g[pid] += PTS; });
    const pr = prompt(s);
    winners.forEach(i => { const pid = pr.pids[i]; s.titles[pid] = [...(s.titles[pid] || []), pr.q.replace(/^Who is /, '').replace(/\?$/, '')]; });
  }
  Object.entries(g).forEach(([pid, n]) => (s.scores[pid] = (s.scores[pid] || 0) + n));
  s.gained = g;
  s.winners = winners;
  s.phase = 'reveal';
  s.deadline = now + TIMES.reveal;
}

function next(s, now) {
  if (s.n + 1 >= s.rounds.length) { s.phase = 'over'; return; }
  s.n++;
  s.picks = {}; s.guesses = {}; s.gained = {}; s.winners = [];
  s.phase = 'vote';
  s.deadline = now + TIMES.vote;
}

export function act(s, pid, a, now = Date.now()) {
  if (s.phase !== 'vote' || !P(s, pid) || !a) return s;
  const n = prompt(s).options.length;
  const i = Number(a.i);
  if (!(i >= 0 && i < n)) return s;
  if (a.type === 'pick') {
    if (round(s).kind === 'mlt' && prompt(s).pids[i] === pid && s.players.length > 2) return s;   // no voting for yourself
    s.picks[pid] = i;
  } else if (a.type === 'guess' && needsGuess(s)) s.guesses[pid] = i;
  if (s.players.every(p => doneFor(s, p.pid))) reveal(s, now);
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'vote') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now);
  return s;
}

export function tick(s, now = Date.now()) {
  if (now < s.deadline) return s;
  return hostAct(s, 'next', now);
}

export function narration(s) {
  const pr = prompt(s);
  if (s.phase === 'vote') return pr.kind === 'wyr' ? `Would you rather ${pr.options[0].toLowerCase()}, or ${pr.options[1].toLowerCase()}?` : pr.q;
  if (s.phase === 'reveal') {
    const w = s.winners.map(i => pr.options[i]);
    if (!w.length) return 'Nobody voted!';
    return pr.kind === 'mlt' ? `The room says: ${w.join(' and ')}!` : `Most of you picked ${w.join(' and ')}!`;
  }
  if (s.phase === 'over') return 'That\'s the pack! Here\'s who read the room best.';
  return '';
}

export function cue(s) {
  const pr = prompt(s);
  if (s.phase === 'vote') return { sound: s.n === 0 ? 'join' : 'vote', wait: 900, title: pr.label, sub: `Round ${s.n + 1} of ${s.rounds.length}` };
  if (s.phase === 'reveal') return { sound: 'drumroll', after: 'safe', wait: 2000 };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'Who read the room best?', tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'vote') return null;
  const choices = v.options.map((_, i) => i).filter(i => !(v.kind === 'mlt' && v.self === i));
  // Bots lean toward the first options, so there's usually a clear majority.
  const lean = () => choices[Math.min(choices.length - 1, Math.floor(rnd() * rnd() * choices.length))];
  if (v.picked === null) return { type: 'pick', i: lean() };
  if (v.kind !== 'mlt' && v.guessed === null) return { type: 'guess', i: lean() };
  return null;
}

// ---------- views ----------
const board = s => s.players.map(p => ({ name: p.name, score: s.scores[p.pid] || 0, gained: s.gained[p.pid] || 0 })).sort((a, b) => b.score - a.score);

export function tvView(s, now = Date.now()) {
  const pr = prompt(s);
  const v = { phase: s.phase, n: s.n + 1, total: s.rounds.length, kind: pr.kind, label: pr.label, q: pr.q, options: pr.options, scores: board(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'vote') { v.done = s.players.filter(p => doneFor(s, p.pid)).length; v.need = s.players.length; }
  if (s.phase === 'reveal') { v.counts = counts(s); v.winners = s.winners; v.voters = pr.options.map((_, i) => Object.entries(s.picks).filter(([, x]) => x === i).map(([pid]) => nameOf(s, pid))); }
  if (s.phase === 'over') v.titles = Object.entries(s.titles).map(([pid, t]) => ({ name: nameOf(s, pid), title: t[t.length - 1], count: t.length })).sort((a, b) => b.count - a.count).slice(0, 4);
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const pr = prompt(s);
  const v = { phase: s.phase, kind: pr.kind, label: pr.label, q: pr.q, options: pr.options, picked: s.picks[pid] ?? null, guessed: s.guesses[pid] ?? null, score: s.scores[pid] || 0 };
  if (pr.kind === 'mlt') v.self = pr.pids.indexOf(pid);
  if (s.phase === 'reveal') { v.gained = s.gained[pid] || 0; v.winners = s.winners; }
  if (s.phase === 'over') { const r = board(s); v.rank = r.findIndex(x => x.name === nameOf(s, pid)) + 1; v.of = r.length; v.titles = s.titles[pid] || []; }
  return v;
}

// ---------- renderers ----------
const COLORS = ['#e2483d', '#7fc8a9', '#a9b8ff', '#ffcf6b'];
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase !== 'vote');
  const scores = `<div class="scores"><h3>Reading the room</h3>${v.scores.slice(0, 12).map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}${p.gained && v.phase === 'reveal' ? `<small> +${p.gained}</small>` : ''}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">${esc(v.label)} · Round ${v.n} of ${v.total}</p>`;
  if (v.phase === 'vote') {
    h += v.kind === 'wyr'
      ? `<div class="wyr"><div style="--c:${COLORS[0]}">${esc(v.options[0])}</div><b>or</b><div style="--c:${COLORS[1]}">${esc(v.options[1])}</div></div>`
      : `<div class="cq">${esc(v.q)}</div>${v.kind === 'hot' ? `<div class="answers">${v.options.map((o, i) => `<div class="ans" style="border-left:6px solid ${COLORS[i]}">${esc(o)}</div>`).join('')}</div>` : ''}`;
    h += `<p class="say">${v.kind === 'mlt' ? 'Vote on your phone. Score if you pick who the room picks!' : 'Pick yours, then guess what most people picked.'}</p><p class="clock ${v.left <= 5 ? 'hurry' : ''}">${v.left}</p><div class="meter"><span style="width:${(100 * v.done) / v.need}%"></span></div><button class="btn ghost" data-host="next">Reveal now</button>`;
  }
  if (v.phase === 'reveal') {
    const max = Math.max(1, ...v.counts);
    h += `<div class="cq">${esc(v.kind === 'wyr' ? 'Would you rather…' : v.q)}</div><div class="bars">${v.options.map((o, i) => v.kind === 'mlt' && !v.counts[i] ? '' : `<div class="barrow ${v.winners.includes(i) ? 'top' : ''}"><span class="bl">${esc(o)}</span><div class="bt"><span style="width:${(100 * v.counts[i]) / max}%;background:${v.kind === 'mlt' ? '#ffcf6b' : COLORS[i % 4]}"></span></div><b>${v.counts[i]}</b>${v.kind === 'mlt' ? '' : `<small class="muted">${v.voters[i].map(esc).join(', ')}</small>`}</div>`).join('')}</div><button class="btn" data-host="next">Next</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0]?.name || '')} read the room best!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div>${v.titles.length ? `<div class="awards">${v.titles.map(t => `<div><small>Most likely ${esc(t.title.replace(/^most likely /, ''))}</small><b>${esc(t.name)}</b></div>`).join('')}</div>` : ''}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  const opts = (type, chosen, hide) => `<div class="opts">${v.options.map((o, i) => (hide === i ? '' : `<button class="opt ${chosen === i ? 'on' : ''}" data-${type}="${i}" style="border-left:6px solid ${v.kind === 'mlt' ? '#ffcf6b' : COLORS[i % 4]}">${esc(o)}</button>`)).join('')}</div>`;
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2>';
  else if (v.phase === 'vote') {
    h = `<p class="muted">${esc(v.label)}</p><p class="tq small">${esc(v.q)}</p>`;
    if (v.kind === 'mlt') h += v.picked === null ? opts('pick', null, v.options.length > 2 ? v.self : -1) : `<h2>Voted!</h2><p class="say">${esc(v.options[v.picked])}</p>`;
    else if (v.picked === null) h += `<h2>Your pick</h2>${opts('pick', null)}`;
    else if (v.guessed === null) h += `<p class="muted">You picked <b>${esc(v.options[v.picked])}</b></p><h2>What did most people pick?</h2>${opts('guess', null)}`;
    else h += `<h2>Locked in</h2><p class="muted">You: <b>${esc(v.options[v.picked])}</b> · Room: <b>${esc(v.options[v.guessed])}</b></p>`;
  } else if (v.phase === 'reveal') h = `<p class="tq small">${esc(v.q)}</p><h2 class="${v.gained ? 'win' : ''}">${v.gained ? `+${v.gained}! You read the room.` : 'Not this time'}</h2><p class="say">${v.winners.map(i => esc(v.options[i])).join(' & ') || 'No votes'}</p><p class="muted">${v.score} points</p>`;
  else if (v.phase === 'over') h = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You read the room best!' : `You came ${v.rank} of ${v.of}`}</h2>${v.titles.length ? `<p class="say">The room says you're most likely ${esc(v.titles[v.titles.length - 1].replace(/^most likely /, ''))}.</p>` : ''}`;
  el.innerHTML = h;
  el.querySelectorAll('[data-pick]').forEach(b => (b.onclick = () => send({ type: 'pick', i: Number(b.dataset.pick) })));
  el.querySelectorAll('[data-guess]').forEach(b => (b.onclick = () => send({ type: 'guess', i: Number(b.dataset.guess) })));
}
