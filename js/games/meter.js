// Room Meter: everyone secretly answers a yes-or-no question about themselves. One player guesses what percent of
// the room said yes; everyone else bets whether the truth is higher or lower. The survey is the people in the room.
import { esc } from '../ui.js';

export const meta = { id: 'meter', name: 'Room Meter', min: 3, max: 16, blurb: 'What percent of this room has…? One guesses, the rest bet higher or lower.' };

export const QUESTIONS = [
  'have eaten cereal for dinner', 'have sent a text to the wrong person', 'still know their childhood phone number', 'have pretended to be on the phone to avoid someone', 'have fallen asleep in class or a meeting',
  'talk to themselves out loud', 'have sung karaoke in public', 'would eat a bug for $100', 'have binge-watched a whole season in one day', 'have cried at a commercial',
  'hit snooze at least twice this morning', 'have laughed so hard they snorted', 'check their phone before getting out of bed', 'have worn pajamas all day this month', 'have gotten lost using GPS',
  'can ride a bike with no hands', 'have named a car, plant or gadget', 'have waved at someone who was waving at somebody else', 'prefer the window seat', 'have eaten food off the floor this year',
  'are afraid of spiders', 'have walked into a glass door', 'like the smell of gasoline', 'have re-read the same book three times', 'would rather be too hot than too cold',
  'have gone a whole day without their phone this year', 'put ketchup on eggs', 'have stayed up past 2 a.m. this week', 'have a food they refuse to share', 'believe a hot dog is a sandwich',
];
export const TIMES = { poll: 22000, guess: 25000, bet: 20000, reveal: 9000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const MUCH = 20;   // "much higher / much lower" means at least this many points away

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const used = new Set(prev?.used || []);
  let pool = QUESTIONS.map((_, i) => i).filter(i => !used.has(i));
  const rounds = Math.min(Math.max(players.length, 5), opts.short ? 5 : 8);
  if (pool.length < rounds) pool = QUESTIONS.map((_, i) => i);
  const s = { game: 'meter', players: shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd), qs: shuffle(pool, rnd).slice(0, rounds), q: 0, round: 0, scores: {}, used: [...used].slice(-20) };
  s.players.forEach(p => (s.scores[p.pid] = 0));
  s.used.push(...s.qs);
  poll(s, Date.now());
  return s;
}
const spotter = s => s.players[s.q % s.players.length].pid;
function poll(s, now) { s.yes = {}; s.guess = null; s.bets = {}; s.result = null; s.phase = 'poll'; s.round++; s.deadline = now + TIMES.poll; }
function toGuess(s, now) { s.phase = 'guess'; s.round++; s.deadline = now + TIMES.guess; }
function toBet(s, now) { if (s.guess === null) s.guess = 50; s.phase = 'bet'; s.round++; s.deadline = now + TIMES.bet; }
function reveal(s, now) {
  const ans = Object.values(s.yes), truth = ans.length ? Math.round((100 * ans.filter(Boolean).length) / ans.length) : 0;
  const diff = Math.abs(truth - s.guess), g = {};
  g[spotter(s)] = diff === 0 ? 3000 : Math.max(0, 2000 - diff * 50);
  for (const [pid, b] of Object.entries(s.bets)) {
    const d = truth - s.guess;
    g[pid] = b === 'much-higher' ? (d >= MUCH ? 2000 : 0) : b === 'much-lower' ? (d <= -MUCH ? 2000 : 0) : b === 'higher' ? (d > 0 ? 1000 : 0) : (d < 0 ? 1000 : 0);
  }
  Object.entries(g).forEach(([pid, n]) => (s.scores[pid] += n));
  s.result = { truth, diff, yes: ans.filter(Boolean).length, of: ans.length, gained: g };
  s.phase = 'reveal'; s.round++; s.deadline = now + TIMES.reveal;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.scores[pid] === undefined) return s;
  if (s.phase === 'poll' && a.type === 'answer' && s.yes[pid] === undefined) {
    s.yes[pid] = !!a.yes;
    if (s.players.every(p => s.yes[p.pid] !== undefined)) toGuess(s, now);
  } else if (s.phase === 'guess' && pid === spotter(s) && Number.isFinite(Number(a.v))) {
    s.guess = Math.max(0, Math.min(100, Math.round(Number(a.v))));
    if (a.type === 'lock') toBet(s, now);
  } else if (s.phase === 'bet' && a.type === 'bet' && pid !== spotter(s) && ['higher', 'lower', 'much-higher', 'much-lower'].includes(a.bet)) {
    s.bets[pid] = a.bet;
    if (s.players.every(p => p.pid === spotter(s) || s.bets[p.pid])) reveal(s, now);
  }
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'poll') toGuess(s, now);
  else if (s.phase === 'guess') toBet(s, now);
  else if (s.phase === 'bet') reveal(s, now);
  else if (s.phase === 'reveal') { s.q++; if (s.q >= s.qs.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else poll(s, now); }
  return s;
}
export function tick(s, now = Date.now()) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
const Q = s => QUESTIONS[s.qs[Math.min(s.q, s.qs.length - 1)]];
export function narration(s) {
  if (s.phase === 'poll') return `${s.q === 0 ? 'Room Meter! Answer honestly. Nobody sees your answer. ' : ''}Is this you? People who ${Q(s)}. Yes or no.`;
  if (s.phase === 'guess') return `${nameOf(s, spotter(s))}, what percent of this room ${Q(s)}?`;
  if (s.phase === 'bet') return `${nameOf(s, spotter(s))} says ${s.guess} percent. Higher or lower?`;
  if (s.phase === 'reveal') return `The real answer: ${s.result.truth} percent. ${s.result.diff === 0 ? 'Exactly right!' : s.result.diff <= 10 ? 'So close!' : s.result.diff >= 40 ? 'Way off!' : ''}`;
  if (s.phase === 'over') return `${ranking(s)[0].name} knows this room best!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'poll') return { sound: 'join', wait: 700, title: s.q === 0 ? 'Room Meter' : `Question ${s.q + 1}`, sub: 'Answer honestly. It stays secret.' };
  if (s.phase === 'guess') return { sound: 'vote', wait: 400 };
  if (s.phase === 'bet') return { sound: 'stamp', wait: 400 };
  if (s.phase === 'reveal') return { sound: 'drumroll', after: s.result.diff <= 10 ? 'win' : 'safe', wait: 2200, react: s.result.diff <= 10 ? 'cheer' : s.result.diff >= 40 ? 'gasp' : null, fx: s.result.diff === 0 ? 'confetti' : null };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'poll' && v.mine === null) return rnd() < 0.5 ? { type: 'answer', yes: rnd() < 0.5 } : null;
  if (v.phase === 'guess' && v.spotter) return rnd() < 0.4 ? { type: 'lock', v: 20 + Math.floor(rnd() * 60) } : null;
  if (v.phase === 'bet' && !v.spotter && !v.bet) return rnd() < 0.5 ? { type: 'bet', bet: ['higher', 'lower', 'much-higher', 'much-lower'][Math.floor(rnd() * 4)] } : null;
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, q: s.q + 1, of: s.qs.length, text: Q(s), spotter: nameOf(s, spotter(s)), scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'poll') { v.n = Object.keys(s.yes).length; v.total = s.players.length; }
  if (s.phase === 'guess') v.guess = s.guess;
  if (s.phase === 'bet' || s.phase === 'reveal') { v.guess = s.guess; v.n = Object.keys(s.bets).length; v.total = s.players.length - 1; }
  if (s.phase === 'reveal') { v.result = { truth: s.result.truth, diff: s.result.diff, yes: s.result.yes, of: s.result.of }; v.bets = Object.entries(s.bets).map(([pid, b]) => ({ name: nameOf(s, pid), bet: b, won: s.result.gained[pid] > 0 })); v.spotGain = s.result.gained[spotter(s)]; }
  return v;
}
export function phoneView(s, pid) {
  if (s.scores[pid] === undefined) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, text: Q(s), spotter: pid === spotter(s), spotName: nameOf(s, spotter(s)), score: s.scores[pid] };
  if (s.phase === 'poll') v.mine = s.yes[pid] === undefined ? null : s.yes[pid];
  if (s.phase === 'guess' && v.spotter) v.guess = s.guess;
  if (s.phase === 'bet') { v.guess = s.guess; v.bet = s.bets[pid] || null; }
  if (s.phase === 'reveal') { v.gained = s.result.gained[pid] || 0; v.truth = s.result.truth; }
  return v;
}

const gauge = (pct, guess, shown) => `<div class="rmgauge"><div class="rmfill" style="width:${shown ? pct : 0}%"></div>${guess === null || guess === undefined ? '' : `<i class="rmguess" style="left:${guess}%"><b>${guess}%</b></i>`}${shown ? `<em style="left:${pct}%">${pct}%</em>` : ''}<span>0</span><span>50</span><span>100</span></div>`;
const BET = { higher: '▲ Higher', lower: '▼ Lower', 'much-higher': '⏫ Much higher', 'much-lower': '⏬ Much lower' };
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'reveal' || v.phase === 'over');
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Question ${v.q} of ${v.of}</p><div class="cq">What percent of this room ${esc(v.text)}?</div>`;
  if (v.phase === 'poll') h += `<p class="say">Answer yes or no on your phone. It stays secret.</p><p class="clock ${v.left <= 5 ? 'hurry' : ''}">${v.left}</p><div class="meter"><span style="width:${(100 * v.n) / v.total}%"></span></div><button class="btn ghost" data-host="next">Move on</button>
    <div class="how"><h3>How to play</h3><ol><li>Everyone secretly answers a yes-or-no question.</li><li>One player guesses what percent of the room said yes.</li><li>Everyone else bets: is the truth higher or lower? "Much" means 20 points or more, and pays double.</li><li>The closer the guess, the more the guesser scores.</li></ol></div>`;
  if (v.phase === 'guess') h += `<p class="say"><b>${esc(v.spotter)}</b> is setting the guess…</p>${gauge(0, v.guess, false)}<p class="center"><span class="clock">${v.left}</span></p>`;
  if (v.phase === 'bet') h += `<p class="say"><b>${esc(v.spotter)}</b> says <b>${v.guess}%</b>. Everyone else: higher or lower?</p>${gauge(0, v.guess, false)}<p class="center"><span class="clock">${v.left}</span></p><div class="meter"><span style="width:${v.total ? (100 * v.n) / v.total : 0}%"></span></div><button class="btn ghost" data-host="next">Reveal</button>`;
  if (v.phase === 'reveal') h += `${gauge(v.result.truth, v.guess, true)}<p class="say center">${v.result.yes} of ${v.result.of} said yes. ${esc(v.spotter)} was off by ${v.result.diff} and gets <b>${v.spotGain.toLocaleString()}</b>.</p><div class="tally">${v.bets.map(b => `<div class="${b.won ? 'win' : ''}">${esc(b.name)}: ${BET[b.bet]} ${b.won ? '✓' : ''}</div>`).join('')}</div><button class="btn" data-host="next">Next</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} knows this room best!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">…${esc(v.text)}</p>`;
  if (v.phase === 'poll') h += v.mine === null ? '<h2>Is this you?</h2><button class="btn" data-yes="1">Yes</button><button class="btn ghost" data-yes="0">No</button><p class="muted small">Nobody will see your answer.</p>' : '<h2>Got it 🤫</h2>';
  else if (v.phase === 'guess') h += v.spotter ? `<h2>What percent said yes?</h2><p class="rmnum"><span id="rv">${v.guess ?? 50}</span>%</p><input type="range" id="rs" min="0" max="100" step="5" value="${v.guess ?? 50}"><button class="btn" id="rl">Lock it in</button>` : `<h2>${esc(v.spotName)} is guessing…</h2>`;
  else if (v.phase === 'bet') h += v.spotter ? `<h2>You said ${v.guess}%</h2><p class="say">Now they bet against you.</p>` : v.bet ? `<h2>${BET[v.bet]} ✓</h2>` : `<h2>${esc(v.spotName)} says ${v.guess}%</h2><button class="btn" data-bet="higher">▲ Higher</button><button class="btn" data-bet="lower">▼ Lower</button><button class="btn ghost" data-bet="much-higher">⏫ Much higher (20+) · double</button><button class="btn ghost" data-bet="much-lower">⏬ Much lower (20+) · double</button>`;
  else if (v.phase === 'reveal') h += `<h2 class="${v.gained ? 'win' : ''}">${v.truth}%${v.gained ? ` · +${v.gained.toLocaleString()}` : ''}</h2>`;
  else if (v.phase === 'over') h += '<h2>Thanks for playing!</h2>';
  el.innerHTML = h + `<p class="muted small">Score: ${v.score.toLocaleString()}</p>`;
  el.querySelectorAll('[data-yes]').forEach(b => (b.onclick = () => send({ type: 'answer', yes: b.dataset.yes === '1' })));
  el.querySelectorAll('[data-bet]').forEach(b => (b.onclick = () => send({ type: 'bet', bet: b.dataset.bet })));
  const rs = el.querySelector('#rs');
  if (rs) { rs.oninput = () => { el.querySelector('#rv').textContent = rs.value; }; rs.onchange = () => send({ type: 'set', v: rs.value }); el.querySelector('#rl').onclick = () => send({ type: 'lock', v: rs.value }); }
}
