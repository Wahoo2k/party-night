// Secret Word Hunt: the Host knows a secret word and answers yes/no questions with taps on their phone.
// Everyone else asks questions out loud to find it before time runs out. But one player, the Insider,
// secretly knows the word too and steers the group. Find the word, then find the Insider. (Insider/Werewords-style.)
import { esc } from '../ui.js';
import { WORDS } from './imposter.js';

export const meta = {
  id: 'wordhunt',
  name: 'Secret Word Hunt',
  min: 4,
  max: 12,
  blurb: 'Yes-or-no questions to find the word. Someone already knows it…',
};

export const TOKENS = { yes: 'Yes', no: 'No', maybe: 'Maybe', close: 'So close!', off: 'Way off' };
export const TIMES = { pick: 30000, ask: 240000, vote: 45000, end: 10000 };
const POOL = Object.entries(WORDS).flatMap(([cat, w]) => Object.keys(w).map(word => ({ cat, word })));
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const s = { game: 'wordhunt', players: order, rounds: Math.min(order.length, 4), r: 0, round: 0, scores: Object.fromEntries(order.map(p => [p.pid, 0])) };
  start(s, Date.now(), rnd);
  return s;
}

function start(s, now, rnd) {
  s.host = s.players[s.r % s.players.length].pid;
  const others = s.players.filter(p => p.pid !== s.host);
  s.insider = others[Math.floor(rnd() * others.length)].pid;
  s.options = shuffle([...POOL], rnd).slice(0, 3);
  s.word = null; s.tokens = { yes: 0, no: 0, maybe: 0, close: 0, off: 0 }; s.log = [];
  s.found = null; s.votes = {}; s.result = null;
  s.phase = 'pick'; s.round++; s.deadline = now + TIMES.pick;
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const voters = s => s.players.map(p => p.pid);

function finish(s, now) {
  let caught = false;
  if (s.found) {
    const count = {};
    Object.values(s.votes).forEach(v => (count[v] = (count[v] || 0) + 1));
    const top = Math.max(0, ...Object.values(count));
    const most = Object.keys(count).filter(k => count[k] === top);
    caught = top > 0 && most.length === 1 && most[0] === s.insider;
    if (caught) s.players.forEach(p => { if (p.pid !== s.insider) s.scores[p.pid] += 1; });
    else s.scores[s.insider] += 3;
    if (s.found !== s.insider) s.scores[s.found] += 1;   // bonus for actually saying the word
  }
  s.result = { caught, found: !!s.found };
  s.phase = 'end'; s.round++; s.deadline = now + TIMES.end;
}

function next(s, now, rnd) {
  s.r++;
  if (s.r >= s.rounds) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  start(s, now, rnd);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.scores.hasOwnProperty(pid)) return s;
  if (s.phase === 'pick' && pid === s.host && a.type === 'word' && s.options[a.i]) {
    s.word = s.options[a.i]; s.phase = 'ask'; s.round++; s.deadline = now + TIMES.ask;
  } else if (s.phase === 'ask' && pid === s.host) {
    if (a.type === 'token' && TOKENS[a.t]) { s.tokens[a.t]++; s.log.push(a.t); s.log = s.log.slice(-12); s.eventId = (s.eventId || 0) + 1; }
    if (a.type === 'found' && a.by !== s.host && s.scores.hasOwnProperty(a.by)) { s.found = a.by; s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote; }
  } else if (s.phase === 'vote' && a.type === 'vote' && a.target !== pid && s.scores.hasOwnProperty(a.target)) {
    s.votes[pid] = a.target;
    if (voters(s).every(v => s.votes[v])) finish(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'pick') { s.word = s.options[0]; s.phase = 'ask'; s.round++; s.deadline = now + TIMES.ask; }
  else if (s.phase === 'ask') finish(s, now);   // time's up: the word wasn't found
  else if (s.phase === 'vote') finish(s, now);
  else if (s.phase === 'end') next(s, now, rnd);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'pick') return s.r === 0 ? `Welcome to Secret Word Hunt! ${nameOf(s, s.host)} is the Host and picks a secret word. Careful: one of you is the Insider and already knows it. Check your phones!` : `${nameOf(s, s.host)} is the Host this round. Check your phones.`;
  if (s.phase === 'ask') return `The category is ${s.word.cat}. Ask ${nameOf(s, s.host)} yes or no questions. You have four minutes!`;
  if (s.phase === 'vote') return `${nameOf(s, s.found)} found it! The word was ${s.word.word}. Now, who was the Insider? It was too easy... Vote!`;
  if (s.phase === 'end') return !s.result.found ? `Time's up! The word was ${s.word.word}. Everyone loses this round.` : s.result.caught ? `You caught the Insider, ${nameOf(s, s.insider)}!` : `The Insider was ${nameOf(s, s.insider)}, and they got away with it!`;
  if (s.phase === 'over') return `${ranking(s)[0].name} wins!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'pick') return { sound: 'join', wait: 700, title: s.r === 0 ? 'Secret Word Hunt' : `Round ${s.r + 1}`, sub: `${nameOf(s, s.host)} is the Host`, tone: 'night' };
  if (s.phase === 'ask') return { sound: 'vote', wait: 300 };
  if (s.phase === 'vote') return { sound: 'win', wait: 800, title: s.word.word, sub: 'Now find the Insider!', fx: 'confetti' };
  if (s.phase === 'end') return { sound: s.result.caught ? 'win' : 'death', wait: 900, title: s.result.found ? (s.result.caught ? 'Insider caught!' : 'Insider escaped!') : "Time's up!", sub: `It was ${nameOf(s, s.insider)}`, tone: s.result.caught ? 'dawn' : 'blood' };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function cueEvent(s) {
  if (s.phase !== 'ask' || !s.eventId) return null;
  const t = s.log[s.log.length - 1];
  return { id: s.eventId, sound: t === 'yes' || t === 'close' ? 'safe' : t === 'no' || t === 'off' ? 'tick' : 'vote', say: '' };
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'pick' && v.role === 'host') return { type: 'word', i: Math.floor(rnd() * 3) };
  if (v.phase === 'ask' && v.role === 'host') { if (v.asked > 6 && rnd() < 0.25) return { type: 'found', by: v.others[Math.floor(rnd() * v.others.length)].pid }; return { type: 'token', t: ['yes', 'no', 'no', 'maybe', 'close', 'off'][Math.floor(rnd() * 6)] }; }
  if (v.phase === 'vote' && !v.voted) { const c = v.others.filter(o => o.pid !== v.found || rnd() < 0.5); const pick = (c.length ? c : v.others)[Math.floor(rnd() * (c.length || v.others.length))]; return { type: 'vote', target: pick.pid }; }
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, r: s.r + 1, rounds: s.rounds, host: nameOf(s, s.host), scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), tokens: s.tokens, log: s.log };
  if (s.word) v.cat = s.word.cat;
  if (s.phase === 'vote' || s.phase === 'end') { v.word = s.word.word; v.found = s.found ? nameOf(s, s.found) : null; v.n = Object.keys(s.votes).length; v.total = s.players.length; }
  if (s.phase === 'end') { v.insider = nameOf(s, s.insider); v.result = s.result; v.tally = s.players.map(p => ({ name: p.name, n: Object.values(s.votes).filter(x => x === p.pid).length })).filter(x => x.n).sort((a, b) => b.n - a.n); }
  return v;
}
export function phoneView(s, pid) {
  if (!s.scores.hasOwnProperty(pid)) return { phase: 'spectate' };
  const role = pid === s.host ? 'host' : pid === s.insider ? 'insider' : 'player';
  const v = { phase: s.phase, round: s.round, role, host: nameOf(s, s.host), score: s.scores[pid], cat: s.word?.cat || null };
  if (s.phase === 'pick' && role === 'host') v.options = s.options;
  if ((s.phase === 'ask' && role !== 'player') || s.phase === 'vote' || s.phase === 'end') v.word = s.word?.word;
  if (s.phase === 'ask' && role === 'host') { v.others = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name })); v.tokens = s.tokens; v.asked = s.log.length; }
  if (s.phase === 'vote') { v.others = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name })); v.voted = s.votes[pid] || null; v.found = s.found; }
  if (s.phase === 'end') { v.caught = s.result.caught; v.foundIt = s.result.found; v.insider = nameOf(s, s.insider); }
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

const tokenRow = (t, log) => `<div class="whtokens">${Object.entries(TOKENS).map(([k, label]) => `<div class="wht ${k}"><b>${t[k]}</b><small>${label}</small></div>`).join('')}</div>${log.length ? `<div class="whlog">${log.map(k => `<span class="wht ${k}">${TOKENS[k]}</span>`).join('')}</div>` : ''}`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'vote' || v.phase === 'over' || (v.phase === 'end' && v.result?.caught));
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Round ${v.r} of ${v.rounds}</p>`;
  if (v.phase === 'pick') h += `<h2>${esc(v.host)} is the Host</h2><p class="say">Everyone, check your phone. One of you is secretly the <b>Insider</b> and will see the word too. Act natural!</p><button class="btn ghost" data-host="next">Pick a word for them</button><div class="how"><h3>How to play</h3><ol><li>The Host picks a secret word and answers your questions by tapping Yes, No, Maybe, So close, or Way off.</li><li>Ask yes-or-no questions out loud. Find the word before time runs out!</li><li>The Insider knows the word too. They want you to find it, without getting caught.</li><li>When someone says the word, vote on who the Insider was.</li></ol></div>`;
  if (v.phase === 'ask') h += `<p class="cat">Category</p><div class="cq">${esc(v.cat)}</div><p class="clock ${v.left <= 30 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><p class="say center">Ask <b>${esc(v.host)}</b> yes-or-no questions out loud!</p>${tokenRow(v.tokens, v.log)}<button class="btn ghost" data-host="next">Give up</button>`;
  if (v.phase === 'vote') h += `<h2 class="win">${esc(v.found)} found it: ${esc(v.word)}!</h2><p class="say">Who was the Insider? Who steered you there a little too well? Talk it over, then vote on your phone. <span class="clock">${v.left}</span></p><div class="meter"><span style="width:${(100 * v.n) / v.total}%"></span></div><button class="btn ghost" data-host="next">Close the vote</button>`;
  if (v.phase === 'end') h += `<h2 class="${v.result.caught ? 'win' : 'lose'}">${!v.result.found ? `Time's up! The word was ${esc(v.word)}` : v.result.caught ? `Caught! ${esc(v.insider)} was the Insider` : `${esc(v.insider)} was the Insider and got away!`}</h2>${v.tally.length ? `<div class="shres">${v.tally.map(t => `<span>${esc(t.name)}: ${t.n}</span>`).join('')}</div>` : ''}<button class="btn" data-host="next">Next round</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

let picking = false;
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (v.phase !== 'ask') picking = false;
  let h = `<p class="muted">${v.score} points</p>`;
  if (v.phase === 'pick') h += v.role === 'host' ? `<h2>You're the Host! Pick a secret word</h2><div class="opts">${v.options.map((o, i) => `<button class="opt" data-w="${i}"><b>${esc(o.word)}</b> <small class="muted">${esc(o.cat)}</small></button>`).join('')}</div>` : v.role === 'insider' ? '<div class="role insider"><h2>🤫 You are the Insider</h2><p>You\'ll see the secret word. Help the group find it, but don\'t get caught!</p></div>' : `<h2>${esc(v.host)} is picking a word…</h2><p class="say">You're a regular player. Get ready to ask questions.</p>`;
  else if (v.phase === 'ask' && v.role === 'host') h += picking ? `<h2>Who said it?</h2><div class="opts">${v.others.map(o => `<button class="opt" data-by="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}</div><button class="btn ghost" id="back">Back</button>` : `<p class="muted">Secret word</p><div class="tcard2"><div class="tword">${esc(v.word)}</div></div><div class="whbtns">${Object.entries(TOKENS).map(([k, label]) => `<button class="wht ${k}" data-t="${k}">${label}</button>`).join('')}</div><button class="btn" id="got">🎉 Someone said it!</button>`;
  else if (v.phase === 'ask' && v.role === 'insider') h += `<div class="role insider"><h2>🤫 Insider</h2><p>The word is <b>${esc(v.word)}</b>. Nudge the group toward it, but blend in!</p></div>`;
  else if (v.phase === 'ask') h += `<h2>Ask ${esc(v.host)} questions!</h2><p class="say">Category: <b>${esc(v.cat)}</b>. Yes-or-no questions, out loud.</p>`;
  else if (v.phase === 'vote') h += v.voted ? '<h2>Vote in!</h2>' : `<h2>Who was the Insider?</h2><div class="opts">${v.others.map(o => `<button class="opt" data-v="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}</div>`;
  else if (v.phase === 'end') h += `<h2>${v.role === 'insider' ? (v.caught ? 'You got caught!' : v.foundIt ? 'You got away with it!' : 'Nobody found it…') : v.caught ? 'Insider caught!' : v.foundIt ? `${esc(v.insider)} fooled you!` : "Time's up!"}</h2><p class="say">The word was <b>${esc(v.word)}</b>.</p>`;
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-w]').forEach(b => (b.onclick = () => send({ type: 'word', i: Number(b.dataset.w) })));
  el.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => { try { navigator.vibrate?.(15); } catch {} send({ type: 'token', t: b.dataset.t }); }));
  el.querySelector('#got')?.addEventListener('click', () => { picking = true; renderPhone(v, el, send); });
  el.querySelector('#back')?.addEventListener('click', () => { picking = false; renderPhone(v, el, send); });
  el.querySelectorAll('[data-by]').forEach(b => (b.onclick = () => { picking = false; send({ type: 'found', by: b.dataset.by }); }));
  el.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => send({ type: 'vote', target: b.dataset.v })));
}
