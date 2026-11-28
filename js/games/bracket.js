// Bracket Battle: everyone answers one prompt, the answers go into a knockout bracket, and the room votes match by
// match until one answer is champion. Before the first match, everyone predicts the winner.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = { id: 'bracket', name: 'Bracket Battle', min: 3, max: 16, blurb: 'Your answers fight it out in a knockout bracket. The room votes every match.' };

export const PROMPTS = [
  'The best thing to bring to a deserted island', 'The worst possible pizza topping', 'The best excuse for being late', 'The greatest snack of all time', 'The worst name for a boat',
  'The best superpower for a lazy person', 'The scariest thing in the kitchen', 'The best pet that is not a dog or cat', 'The worst thing to hear from a dentist', 'The best job for a dragon',
  'The most useless invention', 'The best thing about Mondays', 'The worst gift to get twice', 'The best name for a band of grandparents', 'The silliest thing to be afraid of',
  'The best way to wake someone up', 'The worst ice cream flavor', 'The best rule for a treehouse', 'The most annoying sound', 'The best thing to yell when you win',
  'The worst place to lose your phone', 'The best movie snack that is not popcorn', 'The weirdest thing to collect', 'The best secret talent', 'The worst theme for a wedding',
  'The worst thing to say on a first date', 'The best name for a pet rock', 'The worst superhero weakness', 'The best thing to find in your pocket', 'The worst song to get stuck in your head',
  'The best use for a cardboard box', 'The worst advice for a job interview', 'The best thing to put on toast', 'The worst place to fall asleep', 'The best excuse for not doing the dishes',
  'The worst flavor of toothpaste', 'The best title for your life story', 'The worst thing to forget on vacation', 'The best animal to ride to work', 'The worst slogan for an airline',
  'The best thing to say after a burp', 'The worst name for a restaurant', 'The best invention for lazy mornings', 'The worst thing to step on barefoot', 'The best reason to cancel plans',
  'The worst thing to hear from a pilot', 'The best snack at midnight', 'The worst mascot for a sports team', 'The best thing to do in an elevator', 'The worst item to bring to a potluck',
  'The best new rule for the office', 'The worst thing to say at a haircut', 'The best name for a grumpy cat', 'The worst smell to wake up to', 'The best thing to shout from a mountain top',
  'The worst costume for a wedding guest', 'The best cure for boredom', 'The worst thing to write on a birthday cake', 'The best thing to train a parrot to say', 'The worst thing to autocorrect',
  'The best dance move name', 'The worst prize on a game show', 'The best sandwich nobody has invented yet', 'The worst thing to whisper in a library', 'The best job title to put on a business card',
  'The worst thing a GPS could say', 'The best name for a boat owned by a dentist', 'The worst ride at a theme park', 'The best thing about being a grown-up', 'The worst thing about being a grown-up',
  'The best warning label', 'The worst New Year\'s resolution', 'The best thing to bury in a time capsule', 'The worst holiday to invent', 'The best last words in a movie',
];
export const TIMES = { write: 60000, predict: 30000, vote: 22000, result: 8000, champ: 9000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const clean = t => String(t || '').normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/[<>{}\[\]\\`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
const FILL = ['A very confused goose', 'Glitter', 'My uncle', 'Soup', 'The moon', 'A tiny hat', 'Regret', 'Seventeen bees'];

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const used = new Set(prev?.used || []);
  let pool = PROMPTS.map((_, i) => i).filter(i => !used.has(i));
  if (pool.length < 2) pool = PROMPTS.map((_, i) => i);
  const s = { game: 'bracket', players: players.map(p => ({ pid: p.pid, name: p.name })), prompts: shuffle(pool, rnd).slice(0, opts.short ? 1 : 2), r: 0, round: 0, scores: {}, used: [...used].slice(-12) };
  s.players.forEach(p => (s.scores[p.pid] = 0));
  s.used.push(...s.prompts);
  startRound(s, Date.now());
  return s;
}
function startRound(s, now) { s.answers = {}; s.picks = {}; s.bracket = null; s.m = 0; s.champ = null; s.phase = 'write'; s.round++; s.deadline = now + TIMES.write; }
function build(s, now, rnd) {
  // Everyone who didn't answer gets a stock one, so the bracket is always full.
  s.players.forEach((p, i) => { if (!s.answers[p.pid]) s.answers[p.pid] = FILL[(i + s.r * 3) % FILL.length]; });
  const ids = shuffle(s.players.map(p => p.pid), rnd).slice(0, 8);
  // Seeds: pair them off; with an odd count the last one gets a bye into the next round.
  s.entrants = ids;
  s.rounds = [ids.map(x => x)];
  s.matches = []; s.live = [...ids];
  nextMatches(s);
  s.phase = 'predict'; s.round++; s.deadline = now + TIMES.predict;
}
function nextMatches(s) {
  const a = s.live; s.queue = [];
  for (let i = 0; i + 1 < a.length; i += 2) s.queue.push({ a: a[i], b: a[i + 1], votes: {}, win: null });
  s.bye = a.length % 2 ? a[a.length - 1] : null;
  s.stage = a.length <= 2 ? 'Final' : a.length <= 4 ? 'Semi-final' : 'Round one';
  s.m = 0; s.winners = [];
}
const cur = s => s.queue?.[s.m];
const voters = (s, m) => s.players.map(p => p.pid).filter(p => p !== m.a && p !== m.b);
function openVote(s, now) { s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote; }
function closeVote(s, now, rnd) {
  const m = cur(s), n = { [m.a]: 0, [m.b]: 0 };
  Object.values(m.votes).forEach(v => n[v]++);
  m.count = n;
  m.win = n[m.a] === n[m.b] ? (rnd() < 0.5 ? m.a : m.b) : n[m.a] > n[m.b] ? m.a : m.b;
  m.tie = n[m.a] === n[m.b];
  s.scores[m.a] += n[m.a] * 100; s.scores[m.b] += n[m.b] * 100;
  s.winners.push(m.win);
  s.phase = 'result'; s.round++; s.deadline = now + TIMES.result;
}
function afterResult(s, now) {
  s.m++;
  if (s.m < s.queue.length) return openVote(s, now);
  s.live = s.bye ? [...s.winners, s.bye] : s.winners;
  if (s.live.length > 1) { nextMatches(s); return openVote(s, now); }
  s.champ = s.live[0];
  s.scores[s.champ] += 500;
  s.right = Object.entries(s.picks).filter(([, v]) => v === s.champ).map(([p]) => p);
  s.right.forEach(p => (s.scores[p] += 1000));
  s.phase = 'champ'; s.round++; s.deadline = now + TIMES.champ;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || s.scores[pid] === undefined) return s;
  if (s.phase === 'write' && a.type === 'answer') {
    const t = clean(a.text);
    if (!t || isRude(t)) return s;
    s.answers[pid] = t;
    if (s.players.every(p => s.answers[p.pid])) build(s, now, rnd);
  } else if (s.phase === 'predict' && a.type === 'pick' && s.entrants.includes(a.pick) && a.pick !== pid) {
    s.picks[pid] = a.pick;
    if (s.players.every(p => s.picks[p.pid] || s.entrants.every(e => e === p.pid))) openVote(s, now);
  } else if (s.phase === 'vote' && a.type === 'vote') {
    const m = cur(s);
    if (!voters(s, m).includes(pid) || (a.pick !== m.a && a.pick !== m.b)) return s;
    m.votes[pid] = a.pick;
    if (voters(s, m).every(v => m.votes[v])) closeVote(s, now, rnd);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'write') build(s, now, rnd);
  else if (s.phase === 'predict') openVote(s, now);
  else if (s.phase === 'vote') closeVote(s, now, rnd);
  else if (s.phase === 'result') afterResult(s, now);
  else if (s.phase === 'champ') { s.r++; if (s.r >= s.prompts.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else startRound(s, now); }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
const prompt = s => PROMPTS[s.prompts[Math.min(s.r, s.prompts.length - 1)]];
export function narration(s) {
  if (s.phase === 'write') return `${s.r === 0 ? 'Bracket Battle! ' : 'Next bracket. '}${prompt(s)}. Type your answer.`;
  if (s.phase === 'predict') return 'The bracket is set. Which answer will win it all? Pick one that is not yours.';
  if (s.phase === 'vote') { const m = cur(s); return `${s.stage}. ${s.answers[m.a]}, or ${s.answers[m.b]}?`; }
  if (s.phase === 'result') { const m = cur(s); return `${s.answers[m.win]} moves on${m.tie ? ', on a coin flip' : ''}.`; }
  if (s.phase === 'champ') return `The champion is ${s.answers[s.champ]}, by ${nameOf(s, s.champ)}!${s.right.length ? ` ${s.right.map(p => nameOf(s, p)).join(' and ')} called it.` : ' Nobody saw that coming.'}`;
  if (s.phase === 'over') return `${ranking(s)[0].name} wins Bracket Battle!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'write') return { sound: 'join', wait: 700, title: s.r === 0 ? 'Bracket Battle' : 'New Bracket', sub: prompt(s) };
  if (s.phase === 'predict') return { sound: 'vote', wait: 400 };
  if (s.phase === 'vote') return s.m === 0 ? { sound: 'stamp', wait: 600, title: s.stage, tone: s.stage === 'Final' ? 'dawn' : '' } : { sound: 'stamp', after: 'stamp', wait: 700 };
  if (s.phase === 'result') return { sound: 'drumroll', after: 'safe', wait: 1200, react: cur(s).tie ? 'gasp' : 'cheer' };
  if (s.phase === 'champ') return { sound: 'win', wait: 1400, title: 'Champion!', sub: s.answers[s.champ], tone: 'dawn', fx: 'confetti', flash: 'gold' };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'write' && !v.mine) return rnd() < 0.4 ? { type: 'answer', text: FILL[Math.floor(rnd() * FILL.length)] } : null;
  if (v.phase === 'predict' && !v.picked && v.options.length) return rnd() < 0.5 ? { type: 'pick', pick: v.options[Math.floor(rnd() * v.options.length)].id } : null;
  if (v.phase === 'vote' && v.canVote && !v.voted) return rnd() < 0.5 ? { type: 'vote', pick: rnd() < 0.5 ? v.a.id : v.b.id } : null;
  return null;
}

function tree(s) {
  // The bracket drawn as columns: entrants, then each finished or running round.
  return { entrants: (s.entrants || []).map(p => ({ text: s.answers[p], out: !s.live.includes(p) || (s.queue || []).some(m => m.win !== null && m.win !== p && (m.a === p || m.b === p)), champ: s.champ === p })) };
}
export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, r: s.r + 1, of: s.prompts.length, prompt: prompt(s), scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'write') { v.done = s.players.filter(p => s.answers[p.pid]).map(p => p.name); v.total = s.players.length; }
  if (s.entrants) { v.tree = tree(s); v.stage = s.stage; }
  if (s.phase === 'predict') { v.n = Object.keys(s.picks).length; v.total = s.players.length; }
  if (s.phase === 'vote' || s.phase === 'result') {
    const m = cur(s), done = s.phase === 'result';
    v.match = [m.a, m.b].map(p => ({ text: s.answers[p], name: done ? nameOf(s, p) : null, votes: done ? m.count[p] : null, won: done && m.win === p }));
    v.tie = done && m.tie; v.n = Object.keys(m.votes).length; v.total = voters(s, m).length; v.mi = s.m + 1; v.mof = s.queue.length;
  }
  if (s.phase === 'champ' || s.phase === 'over') { v.champ = s.champ ? { text: s.answers[s.champ], name: nameOf(s, s.champ) } : null; v.right = (s.right || []).map(p => nameOf(s, p)); }
  return v;
}
export function phoneView(s, pid) {
  if (s.scores[pid] === undefined) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, prompt: prompt(s), score: s.scores[pid] };
  if (s.phase === 'write') v.mine = s.answers[pid] || null;
  if (s.phase === 'predict') { v.options = s.entrants.filter(p => p !== pid).map(p => ({ id: p, text: s.answers[p] })); v.picked = s.picks[pid] || null; }
  if (s.phase === 'vote') { const m = cur(s); v.canVote = voters(s, m).includes(pid); v.voted = m.votes[pid] || null; v.a = { id: m.a, text: s.answers[m.a] }; v.b = { id: m.b, text: s.answers[m.b] }; }
  if (s.phase === 'champ') v.called = (s.right || []).includes(pid);
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', ['result', 'champ', 'over'].includes(v.phase));
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  const tree = v.tree ? `<div class="bktree">${v.tree.entrants.map((e, i) => `<span class="${e.out ? 'out' : ''} ${e.champ ? 'champ' : ''}" data-pop="bk${v.r}-${i}">${esc(e.text)}</span>`).join('')}</div>` : '';
  let h = `<p class="cat">Bracket ${v.r} of ${v.of}${v.stage && v.phase !== 'write' ? ` · ${esc(v.stage)}` : ''}</p><div class="cq">${esc(v.prompt)}</div>`;
  if (v.phase === 'write') h += `<p class="say">Type your answer on your phone. It goes into the bracket.</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${v.left}</p><div class="roster">${v.done.map(n => `<div class="chip skdone" data-pop="in-${v.r}-${esc(n)}">✓ ${esc(n)}</div>`).join('')}</div><button class="btn ghost" data-host="next">Build the bracket</button>
    <div class="how"><h3>How to play</h3><ol><li>Everyone answers the same prompt.</li><li>Predict which answer will win the whole bracket (not your own).</li><li>Answers face off two at a time and the room votes. Winners move on.</li><li>Points for every vote your answer gets, a bonus for the champion, and a big bonus for predicting it.</li></ol></div>`;
  if (v.phase === 'predict') h += `<p class="say">Which answer wins it all? Predict on your phone.</p>${tree}<p class="clock">${v.left}</p><div class="meter"><span style="width:${(100 * v.n) / v.total}%"></span></div><button class="btn ghost" data-host="next">Start the matches</button>`;
  if (v.phase === 'vote' || v.phase === 'result') h += `<div class="faceoff ${v.phase}">${v.match.map((a, i) => `<div class="fa" ${v.phase === 'result' ? `data-beat="3" data-beat-class="${a.won ? 'won' : 'lost'}"` : ''}><div class="fa-text">${esc(a.text)}</div>${v.phase === 'result' ? `<div class="fa-by" data-beat="1">${esc(a.name)}</div><div class="fa-votes" data-beat="2"><b>${a.votes}</b> vote${a.votes === 1 ? '' : 's'}</div>${a.won ? '<div class="fa-adv" data-beat="3"><b class="win">ADVANCES</b></div>' : ''}` : ''}</div>${i === 0 ? '<div class="vs">vs</div>' : ''}`).join('')}</div>${v.phase === 'vote' ? `<p class="say center">Match ${v.mi} of ${v.mof}: vote on your phone! <span class="clock">${v.left}</span></p><div class="meter"><span style="width:${v.total ? (100 * v.n) / v.total : 0}%"></span></div>` : v.tie ? '<p class="say center">A tie! Settled by a coin flip.</p>' : ''}${tree}<button class="btn ghost" data-host="next">${v.phase === 'vote' ? 'Close voting' : 'Next'}</button>`;
  if (v.phase === 'champ') h += `<div class="bkchamp"><small>Champion</small><b>${esc(v.champ.text)}</b><span>by ${esc(v.champ.name)}</span></div><p class="say center">${v.right.length ? `🔮 Called it: <b class="win">${v.right.map(esc).join(', ')}</b> (+1,000)` : 'Nobody predicted that one!'}</p><button class="btn" data-host="next">Next</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">${esc(v.prompt)}</p>`;
  if (v.phase === 'write') h += v.mine ? `<h2>In the bracket!</h2><p class="say">“${esc(v.mine)}”</p>` : '<form id="bf"><input id="ba" maxlength="40" autocomplete="off" placeholder="Your answer" required><button class="btn">Send it in</button></form>';
  else if (v.phase === 'predict') h += v.picked ? '<h2>Prediction locked 🔮</h2>' : `<h2>Who wins it all?</h2>${v.options.map(o => `<button class="btn ghost" data-pick="${esc(o.id)}">${esc(o.text)}</button>`).join('')}`;
  else if (v.phase === 'vote') h += !v.canVote ? '<h2>Your answer is up!</h2><p class="say">Fingers crossed.</p>' : v.voted ? '<h2>Voted ✓</h2>' : `<h2>Which is better?</h2><button class="btn" data-vote="${esc(v.a.id)}">${esc(v.a.text)}</button><button class="btn" data-vote="${esc(v.b.id)}">${esc(v.b.text)}</button>`;
  else if (v.phase === 'champ') h += `<h2 class="${v.called ? 'win' : ''}">${v.called ? 'You called it! +1,000' : 'We have a champion'}</h2>`;
  else if (v.phase === 'over') h += '<h2>Thanks for playing!</h2>';
  else h += '<h2>Watch the TV</h2>';
  el.innerHTML = h + `<p class="muted small">Score: ${v.score.toLocaleString()}</p>`;
  el.querySelector('#bf')?.addEventListener('submit', e => { e.preventDefault(); const t = el.querySelector('#ba').value.trim(); if (t) send({ type: 'answer', text: t }); });
  el.querySelectorAll('[data-pick]').forEach(b => (b.onclick = () => send({ type: 'pick', pick: b.dataset.pick })));
  el.querySelectorAll('[data-vote]').forEach(b => (b.onclick = () => send({ type: 'vote', pick: b.dataset.vote })));
}
