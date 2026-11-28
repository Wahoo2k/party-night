// Two Truths & a Lie: everyone secretly writes three things about themselves, one of them made up.
// Then the room votes on each person's lie. Spot lies to score; fool people to score more.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'truths',
  name: 'Two Truths & a Lie',
  min: 3,
  max: 12,
  blurb: 'Tell three things about yourself. Can the room spot the lie?',
};

export const TIMES = { write: 150000, vote: 35000, reveal: 9000 };
export const IDEAS = ['I have been to another country', 'I can juggle', 'I have never seen snow', 'I once met someone famous', 'I have broken a bone', 'I can whistle with my fingers', 'I was in a school play', 'I have ridden a horse', 'I hate chocolate', 'I have a hidden talent', 'I won a contest once', 'I have been on TV', 'I can say the alphabet backwards', 'I got lost at a theme park', 'I have eaten a bug'];
const BOT_FACTS = ['I was built in a lab', 'I have visited the Moon', 'I can beep in three languages', 'I love oil changes', 'I once beat a toaster at chess', 'I have never been unplugged', 'I dream in binary', 'I am afraid of magnets', 'I collect paper clips'];

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function cleanLine(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 70);
  if (x.length < 3) return { ok: false, why: 'Fill in all three.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: x };
}

export function setup(players, rnd = Math.random) {
  return {
    game: 'truths', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])), sets: {}, order: [], k: 0, votes: {}, result: null,
    phase: 'write', deadline: Date.now() + TIMES.write, rnd: Math.floor(rnd() * 1e9),
  };
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const cur = s => s.order[s.k];
const voters = s => s.players.filter(p => p.pid !== cur(s)).map(p => p.pid);

function startVoting(s, now, rnd) {
  s.order = shuffle(s.players.filter(p => s.sets[p.pid]).map(p => p.pid), rnd);
  s.k = 0;
  if (!s.order.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  vote(s, now);
}
function vote(s, now) { s.votes = {}; s.result = null; s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote; }

function reveal(s, now) {
  const before = { ...s.scores };
  const set = s.sets[cur(s)];
  const right = voters(s).filter(pid => s.votes[pid] === set.lie);
  const fooled = voters(s).filter(pid => s.votes[pid] !== undefined && s.votes[pid] !== set.lie);
  right.forEach(pid => (s.scores[pid] += 1));
  s.scores[cur(s)] += fooled.length;
  s.result = { lie: set.lie, right: right.map(p => nameOf(s, p)), fooled: fooled.map(p => nameOf(s, p)), before };
  // The TV turns the three cards over one by one (about 3.5 s); scores and phones show the outcome only after the lie is out.
  s.settled = false; s.settleAt = now + 4300;
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.reveal;
}

function next(s, now) {
  s.k++;
  if (s.k >= s.order.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  vote(s, now);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.scores.hasOwnProperty(pid)) return s;
  if (s.phase === 'write' && a.type === 'set' && !s.sets[pid] && Array.isArray(a.lines) && a.lines.length === 3 && [0, 1, 2].includes(a.lie)) {
    const r = a.lines.map(cleanLine);
    if (r.some(x => !x.ok)) return s;
    // Shuffle the order so the lie isn't always in the same spot.
    const idx = shuffle([0, 1, 2], rnd);
    s.sets[pid] = { lines: idx.map(i => r[i].text), lie: idx.indexOf(a.lie) };
    if (s.players.every(p => s.sets[p.pid])) startVoting(s, now, rnd);
  } else if (s.phase === 'vote' && pid !== cur(s) && [0, 1, 2].includes(a.i)) {
    s.votes[pid] = a.i;
    if (voters(s).every(v => s.votes[v] !== undefined)) reveal(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'write') startVoting(s, now, rnd);
  else if (s.phase === 'vote') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'write') return 'Welcome to Two Truths and a Lie! Write three things about yourself. Two true, one made up. Make the lie believable!';
  if (s.phase === 'vote') return `${nameOf(s, cur(s))}'s turn. Which one is the lie?`;
  if (s.phase === 'reveal' && !s.settled) return '';
  if (s.phase === 'reveal') return `The lie was: ${s.sets[cur(s)].lines[s.result.lie]}. ${nameOf(s, cur(s))}, tell us the stories!`;
  if (s.phase === 'over') return `${ranking(s)[0].name} wins!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'write') return { sound: 'join', wait: 700, title: 'Two Truths & a Lie', sub: 'Write about yourself' };
  if (s.phase === 'vote') return { sound: 'vote', wait: 500, title: nameOf(s, cur(s)), sub: 'Find the lie' };
  if (s.phase === 'reveal') return { sound: 'drumroll', wait: 1500 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'write' && !v.sent) return { type: 'set', lines: shuffle([...BOT_FACTS], rnd).slice(0, 3), lie: Math.floor(rnd() * 3) };
  if (v.phase === 'vote' && !v.mine && v.voted === null) return { type: 'vote', i: Math.floor(rnd() * 3) };
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'write') { v.done = s.players.filter(p => s.sets[p.pid]).map(p => p.name); v.waiting = s.players.filter(p => !s.sets[p.pid]).map(p => p.name); }
  if (s.phase === 'vote' || s.phase === 'reveal') { v.who = nameOf(s, cur(s)); v.k = s.k + 1; v.of = s.order.length; v.lines = s.sets[cur(s)].lines; v.n = Object.keys(s.votes).length; v.total = voters(s).length; }
  if (s.phase === 'reveal') { const { before, ...res } = s.result; v.result = res; v.tally = [0, 1, 2].map(i => Object.values(s.votes).filter(x => x === i).length); v.by = [0, 1, 2].map(i => Object.entries(s.votes).filter(([, x]) => x === i).map(([p]) => nameOf(s, p))); v.settled = !!s.settled; if (!s.settled) v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: before[p.pid] })).sort((a, b) => b.score - a.score); }
  return v;
}
export function phoneView(s, pid) {
  if (!s.scores.hasOwnProperty(pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, score: s.scores[pid] };
  if (s.phase === 'write') v.sent = !!s.sets[pid];
  if (s.phase === 'vote') { v.mine = cur(s) === pid; v.who = nameOf(s, cur(s)); v.lines = s.sets[cur(s)].lines; v.voted = s.votes[pid] ?? null; }
  if (s.phase === 'reveal') { v.mine = cur(s) === pid; v.settled = !!s.settled; if (!s.settled) return v; v.right = s.votes[pid] === s.result.lie; v.lie = s.sets[cur(s)].lines[s.result.lie]; v.fooled = s.result.fooled.length; }
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'reveal' || v.phase === 'over');
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'write') h = `<h2>Write two truths and a lie</h2><p class="say">On your phone, write three things about yourself. Two true, one made up. The best lies sound true, and the best truths sound fake!</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><div class="roster">${v.done.map(n => `<div class="chip skdone">✓ ${esc(n)}</div>`).join('')}${v.waiting.map(n => `<div class="chip">✏️ ${esc(n)}</div>`).join('')}</div><button class="btn ghost" data-host="next">Start with who's ready</button>`;
  if (v.phase === 'vote' || v.phase === 'reveal') h = `<p class="cat">${v.k} of ${v.of}</p><h2>${esc(v.who)}</h2><div class="ttlist">${v.lines.map((l, i) => `<div class="ttline" ${v.result ? `data-beat="${i === v.result.lie ? 3 : i < v.result.lie ? i + 1 : i}" data-beat-class="${i === v.result.lie ? 'lie' : 'true'}"` : ''} style="animation-delay:${i * 0.15}s"><span>${i + 1}</span><b>${esc(l)}</b>${v.result ? `<small>${i === v.result.lie ? 'LIE' : 'TRUE'}${v.by[i].length ? ` · picked by ${v.by[i].map(esc).join(', ')}` : ' · no votes'}</small>` : ''}</div>`).join('')}</div>${v.phase === 'vote' ? `<p class="muted center">${v.n} of ${v.total} voted <span class="clock">${v.left}</span> · Ask ${esc(v.who)} questions out loud!</p><button class="btn ghost" data-host="next">Reveal</button>` : `<p class="say center" data-beat="4">${v.result.fooled.length ? `${esc(v.who)} fooled ${v.result.fooled.map(esc).join(', ')}!` : 'Nobody was fooled!'} ${esc(v.who)}, tell us the stories!</p><button class="btn" data-host="next">Next</button>`}`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

let draft = { lines: ['', '', ''], lie: null };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">${v.score} point${v.score === 1 ? "" : "s"}</p>`;
  if (v.phase === 'write' && v.sent) h += '<h2>Sent!</h2><p class="say">Waiting for everyone else…</p>';
  else if (v.phase === 'write') {
    h += `<h2>Two truths and a lie</h2><p class="muted">Write three things about you. Then tap the 🤥 next to the lie.</p><form id="ttf">${[0, 1, 2].map(i => `<div class="ttrow"><input id="t${i}" maxlength="70" autocomplete="off" placeholder="${esc(IDEAS[(i * 5 + 3) % IDEAS.length])}…" value="${esc(draft.lines[i])}"><button type="button" class="ttlie ${draft.lie === i ? 'on' : ''}" data-lie="${i}">🤥</button></div>`).join('')}<p class="lose" id="err"></p><button class="btn" type="submit">Send</button></form>`;
  } else if (v.phase === 'vote' && v.mine) h += '<h2>They\'re voting on yours</h2><p class="say">Poker face. Answer questions, but don\'t give it away!</p>';
  else if (v.phase === 'vote') h += `<h2>Which is ${esc(v.who)}'s lie?</h2><div class="opts">${v.lines.map((l, i) => `<button class="opt ${v.voted === i ? 'on' : ''}" data-i="${i}">${esc(l)}</button>`).join('')}</div>`;
  else if (v.phase === 'reveal' && !v.settled) h += '<h2>Watch the TV…</h2><p class="say">Here it comes.</p>';
  else if (v.phase === 'reveal') h += v.mine ? `<h2>You fooled ${v.fooled}!</h2><p class="say">Tell the stories!</p>` : `<h2 class="${v.right ? 'win' : 'lose'}">${v.right ? 'You spotted it! +1' : 'Fooled you!'}</h2><p class="say">The lie: <b>${esc(v.lie)}</b></p>`;
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  const f = el.querySelector('#ttf');
  if (f) {
    const ins = [0, 1, 2].map(i => f.querySelector('#t' + i));
    ins.forEach((inp, i) => (inp.oninput = () => (draft.lines[i] = inp.value)));
    f.querySelectorAll('[data-lie]').forEach(b => (b.onclick = () => { draft.lie = Number(b.dataset.lie); f.querySelectorAll('[data-lie]').forEach(x => x.classList.toggle('on', x === b)); }));
    f.onsubmit = e => {
      e.preventDefault();
      const r = ins.map(i => cleanLine(i.value));
      const bad = r.find(x => !x.ok);
      if (bad) { f.querySelector('#err').textContent = bad.why; return; }
      if (draft.lie === null) { f.querySelector('#err').textContent = 'Tap 🤥 next to the one that\'s a lie.'; return; }
      f.querySelector('[type=submit]').disabled = true;
      send({ type: 'set', lines: r.map(x => x.text), lie: draft.lie });
      draft = { lines: ['', '', ''], lie: null };
    };
  }
  el.querySelectorAll('[data-i]').forEach(b => (b.onclick = () => send({ type: 'vote', i: Number(b.dataset.i) })));
}
