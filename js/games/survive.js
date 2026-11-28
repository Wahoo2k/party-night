// Last One Standing: trivia survival. Everyone starts with three lives. A wrong answer (or none) costs a life; at
// zero you are out, but you keep answering as a ghost for half points. Questions get harder. If nobody still standing
// gets one right, nobody loses a life. The last one standing takes a big bonus.
import { esc } from '../ui.js';
import { EASY, MEDIUM, HARD } from './ladder-bank.js';

export const meta = {
  id: 'survive',
  name: 'Last One Standing',
  min: 2,
  max: 12,
  blurb: 'Three lives each. Miss a question, lose a life. Be the last one standing.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const LIVES = 3, SURVIVOR = 1000, SHARED = 400;
export const TIMES = { question: 20000, settle: 3400, after: 6000 };
const BANK = [EASY, MEDIUM, HARD], LEVELS = ['Warm-up', 'Getting harder', 'Sudden trouble'], L = ['A', 'B', 'C', 'D'];
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Questions 1 to 3 are easy, 4 to 6 medium, the rest hard.
export const levelOf = n => (n <= 3 ? 0 : n <= 6 ? 1 : 2);
export const pointsFor = (n, alive) => (levelOf(n) + 1) * (alive ? 100 : 50);

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const s = {
    game: 'survive', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    lives: Object.fromEntries(players.map(p => [p.pid, LIVES])),
    decks: prev?.decks || BANK.map(b => shuffle(b.map((_, i) => i), rnd)),
    max: opts.short ? 8 : 12, n: 0, q: null, picks: {}, result: null, settled: false, settleAt: 0, bonus: null,
    phase: 'question', deadline: 0,
  };
  ask(s, Date.now(), rnd);
  return s;
}
const alive = s => s.players.filter(p => s.lives[p.pid] > 0).map(p => p.pid);
function ask(s, now, rnd) {
  s.n++; const lv = levelOf(s.n);
  if (!s.decks[lv].length) s.decks[lv] = shuffle(BANK[lv].map((_, i) => i), rnd);
  const [q, right, ...wrong] = BANK[lv][s.decks[lv].shift()];
  const options = shuffle([right, ...wrong.slice(0, 3)], rnd);
  s.q = { q, options, answer: options.indexOf(right) };
  s.picks = {}; s.result = null; s.settled = false;
  s.phase = 'question'; s.round++; s.deadline = now + TIMES.question;
}
function reveal(s, now) {
  const before = { ...s.scores }, livesBefore = { ...s.lives }, up = alive(s);
  const right = pid => s.picks[pid] === s.q.answer;
  const mercy = up.length > 0 && !up.some(right);   // nobody standing got it: nobody is hurt
  const lost = [], out = [];
  s.players.forEach(({ pid }) => {
    const was = livesBefore[pid] > 0;
    if (right(pid)) s.scores[pid] += pointsFor(s.n, was);
    else if (was && !mercy) { s.lives[pid]--; lost.push(pid); if (!s.lives[pid]) out.push(pid); }
  });
  s.result = { before, livesBefore, lost, out, mercy, picks: { ...s.picks } };
  const left = alive(s);
  s.last = left.length <= 1 || s.n >= s.max;
  if (s.last) {
    // One survivor takes the big bonus. If the questions run out first, whoever has the most lives shares a smaller one.
    const most = Math.max(...left.map(p => s.lives[p]));
    const winners = left.length === 1 ? left : left.filter(p => s.lives[p] === most);
    const each = left.length === 1 ? SURVIVOR : SHARED;
    winners.forEach(p => (s.scores[p] += each));
    s.bonus = { winners, each };
  }
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.after;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'question' || a.type !== 'pick' || !s.players.some(p => p.pid === pid) || s.picks[pid] !== undefined) return s;
  const i = Number(a.i); if (!Number.isInteger(i) || i < 0 || i > 3) return s;
  s.picks[pid] = i;
  if (s.players.every(p => s.picks[p.pid] !== undefined)) reveal(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'question') reveal(s, now);
  else if (s.phase === 'reveal') { if (s.last) { s.phase = 'over'; s.round++; s.deadline = 0; } else ask(s, now, rnd); }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'question' && s.n === 1) return 'Welcome to Last One Standing! Three lives each. Miss a question and you lose one.';
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'question') {
    if (s.n === 1) return { sound: 'fanfare', wait: 1500, title: 'Last One Standing', sub: 'Three lives each' };
    if (s.n === 4 || s.n === 7) return { sound: 'sting-show', wait: 1300, title: LEVELS[levelOf(s.n)], sub: 'The questions just got harder' };
    return { sound: 'vote', wait: 300 };
  }
  if (s.phase === 'reveal') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') { const w = s.bonus?.winners || []; return { sound: 'win', wait: 1500, title: w.length === 1 ? 'Last One Standing' : 'Survivors', sub: w.map(p => nameOf(s, p)).join(' & '), tone: 'dawn', fx: 'confetti' }; }
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'question' || v.pick !== null) return null;
  // bots know a bit less as the questions get harder
  return { type: 'pick', i: rnd() < [0.75, 0.55, 0.4][v.level] ? v.hint : Math.floor(rnd() * 4) };
}

export function tvView(s, now = Date.now()) {
  const shown = s.phase === 'reveal' && !s.settled;   // the reveal is still playing: hold the old lives and scores
  const lives = shown ? s.result.livesBefore : s.lives, sc = shown ? s.result.before : s.scores;
  const v = {
    phase: s.phase, n: s.n, max: s.max, level: levelOf(s.n), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
    scores: s.players.map(p => ({ pid: p.pid, name: p.name, score: sc[p.pid] })).sort((a, b) => b.score - a.score),
    players: s.players.map(p => ({ name: p.name, lives: lives[p.pid], done: s.picks[p.pid] !== undefined })),
    standing: s.players.filter(p => lives[p.pid] > 0).length,
  };
  if (s.phase !== 'over') { v.q = s.q.q; v.options = s.q.options; v.worth = pointsFor(s.n, true); }
  if (s.phase === 'reveal') {
    const r = s.result;
    v.answer = s.q.answer; v.settled = !!s.settled; v.mercy = r.mercy; v.last = !!s.last;
    v.counts = [0, 1, 2, 3].map(i => Object.values(r.picks).filter(x => x === i).length);
    v.players = s.players.map(p => ({ name: p.name, lives: r.livesBefore[p.pid], now: s.lives[p.pid], right: r.picks[p.pid] === s.q.answer, lost: r.lost.includes(p.pid), out: r.out.includes(p.pid), ghost: r.livesBefore[p.pid] === 0 }));
    if (s.last && s.settled) v.bonus = { names: s.bonus.winners.map(p => nameOf(s, p)), each: s.bonus.each };
  }
  if (s.phase === 'over') v.winners = (s.bonus?.winners || []).map(p => nameOf(s, p));
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, n: s.n, level: levelOf(s.n), score: s.scores[pid], lives: s.lives[pid] };
  if (s.phase === 'question') { v.q = s.q.q; v.options = s.q.options; v.pick = s.picks[pid] ?? null; v.worth = pointsFor(s.n, s.lives[pid] > 0); if (String(pid).startsWith('bot-')) v.hint = s.q.answer; }
  if (s.phase === 'reveal') {
    v.settled = !!s.settled; v.q = s.q.q; v.options = s.q.options; v.pick = s.result.picks[pid] ?? null;
    if (!s.settled) { v.lives = s.result.livesBefore[pid]; v.score = s.result.before[pid]; }
    else { v.answer = s.q.answer; v.right = v.pick === s.q.answer; v.lost = s.result.lost.includes(pid); v.out = s.result.out.includes(pid); v.mercy = s.result.mercy; v.got = s.scores[pid] - s.result.before[pid]; }
  }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = (s.bonus?.winners || []).includes(pid); v.winners = (s.bonus?.winners || []).map(p => nameOf(s, p)); }
  return v;
}

// ---------- renderers ----------
let revKey = '', revAt = 0;
const hearts = (n, lostOne) => `<span class="lohearts">${[0, 1, 2].map(i => `<i class="${i < n ? '' : 'gone'} ${lostOne && i === n - 1 ? 'break' : ''}">❤️</i>`).join('')}</span>`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'over') {
    h = `<h2 class="win">${v.winners.length === 1 ? `${esc(v.winners[0])} is the last one standing!` : `${v.winners.map(esc).join(' & ')} survived!`}</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  } else {
    const rev = v.phase === 'reveal', key = 'q' + v.n;
    if (rev && revKey !== key) {
      revKey = key; revAt = Date.now();
      // sounds are booked once, when the reveal first appears
      import('../sfx.js').then(m => {
        setTimeout(() => m.play('safe'), 900);
        if (v.mercy) setTimeout(() => m.play('laugh'), 2000);
        else { v.players.filter(p => p.lost).forEach((p, i) => setTimeout(() => m.play(p.out ? 'death' : 'groan'), 2000 + i * 350)); if (!v.players.some(p => p.lost)) setTimeout(() => m.play('cheer'), 2000); }
      }).catch(() => {});
    }
    const el0 = rev ? Date.now() - revAt : 0;   // a redraw part-way through carries on where it was
    const opt = i => `<div class="loopt ${rev && i === v.answer ? 'right' : ''} ${rev && i !== v.answer ? 'dim' : ''}" style="animation-delay:${900 - el0}ms"><b>${L[i]}</b><span>${esc(v.options[i])}</span>${rev ? `<small style="animation-delay:${400 - el0}ms">${v.counts[i]} 👥</small>` : ''}</div>`;
    const card = (p, i) => {
      const at = 2000 + i * 350 - el0, st = !rev ? (p.lives ? '' : 'ghost') : p.ghost ? 'ghost' : p.lost ? (p.out ? 'hit dead' : 'hit') : p.right ? 'safe' : '';
      return `<div class="locard ${st} ${!rev && p.done ? 'done' : ''}" style="--at:${at}ms"><b>${esc(p.name)}</b>${(rev ? p.ghost : !p.lives) ? '<span class="loghost">👻 out</span>' : hearts(p.lives, rev && p.lost)}${rev && p.out ? '<em class="loout">OUT</em>' : ''}${rev && p.right ? '<em class="loyes">✓</em>' : ''}</div>`;
    };
    const line = !rev ? `<p class="tsrule"><b>Answer on your phone.</b><span>${v.standing} still standing · worth ${v.worth}</span></p>`
      : v.bonus ? `<p class="lobonus">${v.bonus.names.map(esc).join(' & ')} ${v.bonus.names.length === 1 ? 'is the last one standing' : 'survived to the end'}! <b>+${v.bonus.each}</b></p>`
        : v.mercy ? '<p class="tsrule"><b>Nobody standing got it. Nobody loses a life.</b></p>' : `<p class="tsrule"><b>${v.players.some(p => p.lost) ? 'Wrong answers lose a life.' : 'Everyone standing got it!'}</b></p>`;
    h = `<p class="cat">Question ${v.n} · ${LEVELS[v.level]} ${!rev ? `<span class="clock small ${v.left <= 5 ? 'hurry' : ''}">${v.left}</span>` : ''}</p>
      <div class="loq">${esc(v.q)}</div><div class="loopts ${rev ? 'rev' : ''}">${[0, 1, 2, 3].map(opt).join('')}</div>${line}
      <div class="locards ${rev ? 'rev' : ''} ${v.players.length > 8 ? 'many' : ''}">${v.players.map(card).join('')}</div>
      <button class="btn ghost" data-host="next">${rev ? (v.last ? 'Finish' : 'Next question') : 'Show the answer'}</button>`;
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel lo">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.winner ? 'win' : ''}">${v.winner ? (v.winners.length === 1 ? 'Last one standing! 🏆' : 'You survived! 🏆') : `${v.winners.map(esc).join(' & ')} survived`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  const status = v.lives ? `<p class="lomine">${hearts(v.lives, false)} <span>${v.lives} ${v.lives === 1 ? 'life' : 'lives'} left</span></p>` : '<p class="lomine"><span>👻 You are out, but right answers still score half.</span></p>';
  if (v.phase === 'question') {
    el.innerHTML = `${status}<p class="tq small">${esc(v.q)}</p><div class="opts">${v.options.map((o, i) => `<button class="opt ${v.pick === i ? 'on' : ''}" data-i="${i}" ${v.pick !== null ? 'disabled' : ''}><b>${L[i]}</b> ${esc(o)}</button>`).join('')}</div>${v.pick !== null ? '<p class="say center">Locked in. Watch the TV.</p>' : `<p class="muted">Worth ${v.worth}. One tap, no changing.</p>`}`;
    el.querySelectorAll('[data-i]').forEach(b => (b.onclick = () => send({ type: 'pick', i: +b.dataset.i })));
    return;
  }
  if (!v.settled) { el.innerHTML = `${status}<h2>Watch the TV…</h2><p class="say">${v.pick === null ? 'You did not answer in time.' : `You said ${L[v.pick]}: ${esc(v.options[v.pick])}`}</p>`; return; }
  const head = v.right ? `<h2 class="win">Correct! +${v.got}</h2>` : v.out ? '<h2 class="lose">Out! 👻</h2>' : v.lost ? '<h2 class="lose">Wrong. You lose a life.</h2>' : v.mercy ? '<h2>Wrong, but nobody got it. Phew.</h2>' : '<h2>Wrong</h2>';
  el.innerHTML = `${status}${head}<p class="say">The answer was ${L[v.answer]}: ${esc(v.options[v.answer])}</p><p class="muted">${v.score.toLocaleString()} points</p>`;
}
