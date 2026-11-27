// Act Natural: every phone shows the same instruction except one. On "GO!" everyone does it at once, for real,
// in the room: hands up, point at someone, hold up fingers. The faker has to guess and blend in. Then vote.
import { esc } from '../ui.js';

export const meta = { id: 'faker', name: 'Act Natural', min: 3, max: 12, blurb: 'Everyone gets an instruction except one. Hands up, point, hold up fingers. Spot the faker!' };

// kind, what the TV calls it, what the faker is told, and the real instructions.
export const TASKS = {
  hands: { name: 'Hands Up', icon: '🙋', faker: 'Raise your hand… or don\'t. Guess!', list: ['Raise your hand if you have ever fallen asleep in a movie theater', 'Raise your hand if you have eaten dessert before dinner this week', 'Raise your hand if you can whistle', 'Raise your hand if you have ever broken a bone', 'Raise your hand if you sing in the shower', 'Raise your hand if you have been on TV', 'Raise your hand if you are a morning person', 'Raise your hand if you have ever locked yourself out', 'Raise your hand if you can touch your toes', 'Raise your hand if you have re-gifted a present', 'Raise your hand if you talk to your pets', 'Raise your hand if you have cried at a cartoon', 'Raise your hand if you like pineapple on pizza', 'Raise your hand if you have ever forgotten your own phone number'] },
  point: { name: 'Point', icon: '👉', faker: 'Point at somebody. Anybody. Look sure about it.', list: ['Point at the person most likely to survive in the wild', 'Point at the person who would be the worst spy', 'Point at the person with the best laugh', 'Point at the person most likely to talk their way out of a ticket', 'Point at the person who takes the longest to get ready', 'Point at the person most likely to win a game show', 'Point at the person who would last longest without their phone', 'Point at the best cook in the room', 'Point at the person most likely to get lost', 'Point at the person who gives the best advice', 'Point at the person most likely to adopt ten cats', 'Point at the loudest person in the room', 'Point at the person most likely to become famous', 'Point at the best dancer in the room'] },
  number: { name: 'Fingers', icon: '🖐️', faker: 'Hold up some fingers, 1 to 5. Pick a number that feels safe.', list: ['Hold up 1 to 5 fingers: how many hours of sleep you got last night (5 means 5 or more)', 'Hold up 1 to 5 fingers: how spicy you like your food', 'Hold up 1 to 5 fingers: how many cups of coffee or tea you have a day', 'Hold up 1 to 5 fingers: how much you like scary movies', 'Hold up 1 to 5 fingers: how many countries you have visited (5 means 5 or more)', 'Hold up 1 to 5 fingers: how good a driver you are', 'Hold up 1 to 5 fingers: how many siblings you have', 'Hold up 1 to 5 fingers: how much you like camping', 'Hold up 1 to 5 fingers: how messy your room is right now', 'Hold up 1 to 5 fingers: how many times you hit snooze', 'Hold up 1 to 5 fingers: how good you are at keeping secrets', 'Hold up 1 to 5 fingers: how much you like karaoke'] },
};
const KINDS = Object.keys(TASKS);
export const TIMES = { read: 9000, go: 5000, talk: 45000, vote: 30000, result: 8000 };
export const MAX_TASKS = 3;
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const s = { game: 'faker', players: players.map(p => ({ pid: p.pid, name: p.name })), rounds: Math.min(players.length, opts.short ? 3 : 5), r: 0, round: 0, scores: {}, seen: (prev?.seen || []).slice(-40), fakers: shuffle(players.map(p => p.pid), rnd) };
  s.players.forEach(p => (s.scores[p.pid] = 0));
  newRound(s, Date.now(), rnd);
  return s;
}
function newRound(s, now, rnd) { s.faker = s.fakers[s.r % s.fakers.length]; s.t = 0; s.caught = false; task(s, now, rnd); }
function task(s, now, rnd) {
  const kind = KINDS[Math.floor(rnd() * KINDS.length)], list = TASKS[kind].list;
  let i = 0; for (let n = 0; n < 30; n++) { i = Math.floor(rnd() * list.length); if (!s.seen.includes(kind + i)) break; }
  s.seen.push(kind + i); s.kind = kind; s.text = list[i]; s.votes = {}; s.result = null;
  s.phase = 'read'; s.round++; s.deadline = now + TIMES.read;
}
function tally(s, now) {
  const n = {}; Object.values(s.votes).forEach(v => (n[v] = (n[v] || 0) + 1));
  const top = Math.max(0, ...Object.values(n)), leaders = Object.keys(n).filter(k => n[k] === top);
  const caught = leaders.length === 1 && leaders[0] === s.faker;
  const right = Object.entries(s.votes).filter(([, v]) => v === s.faker).map(([p]) => p);
  right.forEach(p => (s.scores[p] += 1));
  if (caught) right.forEach(p => (s.scores[p] += 1));
  else s.scores[s.faker] += 2 + (s.t === MAX_TASKS - 1 ? 3 : 0);
  s.caught = caught;
  s.result = { caught, counts: s.players.map(p => ({ name: p.name, n: n[p.pid] || 0 })).filter(x => x.n).sort((a, b) => b.n - a.n), right: right.map(p => nameOf(s, p)), last: caught || s.t === MAX_TASKS - 1 };
  s.phase = 'result'; s.round++; s.deadline = now + TIMES.result;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.scores[pid] === undefined) return s;
  if (s.phase === 'vote' && a.type === 'vote' && a.pick !== pid && s.scores[a.pick] !== undefined) {
    s.votes[pid] = a.pick;
    if (s.players.every(p => s.votes[p.pid])) tally(s, now);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'read') { s.phase = 'go'; s.round++; s.deadline = now + TIMES.go; }
  else if (s.phase === 'go') { s.phase = 'talk'; s.round++; s.deadline = now + TIMES.talk; }
  else if (s.phase === 'talk') { s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote; }
  else if (s.phase === 'vote') tally(s, now);
  else if (s.phase === 'result') {
    if (!s.result.last) { s.t++; task(s, now, rnd); }
    else { s.r++; if (s.r >= s.rounds) { s.phase = 'over'; s.round++; s.deadline = 0; } else newRound(s, now, rnd); }
  }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  const T = TASKS[s.kind];
  if (s.phase === 'read') return `${s.r === 0 && s.t === 0 ? 'Act Natural! One of you is faking. ' : s.t === 0 ? 'New round, new faker. ' : 'Same faker. Try again. '}${T.name}. Read your phone, and keep it secret.`;
  if (s.phase === 'go') return 'Three. Two. One. Go!';
  if (s.phase === 'talk') return `Hold it! The instruction was: ${s.text}. Who looked unsure?`;
  if (s.phase === 'vote') return 'Vote for the faker.';
  if (s.phase === 'result') return s.result.caught ? `Caught! ${nameOf(s, s.faker)} was faking it.` : s.result.last ? `The faker got away with it all round. It was ${nameOf(s, s.faker)}!` : 'The faker is still hiding. One more try.';
  if (s.phase === 'over') return `${ranking(s)[0].name} wins!`;
  return '';
}
export function cue(s) {
  const T = TASKS[s.kind];
  if (s.phase === 'read') return { sound: 'join', wait: 700, title: s.r === 0 && s.t === 0 ? 'Act Natural' : T.name, sub: s.t === 0 ? `Round ${s.r + 1}: a new faker` : 'Same faker, new task' };
  if (s.phase === 'go') return { sound: 'drumroll', after: 'stamp', wait: 3000, flash: 'gold', flashAt: 3000 };
  if (s.phase === 'talk') return { sound: 'vote', wait: 500 };
  if (s.phase === 'vote') return { sound: 'vote', wait: 400, title: 'Vote!', sub: 'Who is faking?' };
  if (s.phase === 'result') return s.result.caught ? { sound: 'win', wait: 900, fx: 'confetti', flash: 'gold' } : { sound: 'lose', wait: 900, react: 'gasp' };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) { return v.phase === 'vote' && !v.voted && rnd() < 0.4 ? { type: 'vote', pick: v.others[Math.floor(rnd() * v.others.length)].pid } : null; }

export function tvView(s, now = Date.now()) {
  const T = TASKS[s.kind];
  const v = { phase: s.phase, r: s.r + 1, of: s.rounds, t: s.t + 1, tasks: MAX_TASKS, kind: T.name, icon: T.icon, scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (['talk', 'vote', 'result'].includes(s.phase)) v.text = s.text;
  if (s.phase === 'vote') { v.n = Object.keys(s.votes).length; v.total = s.players.length; }
  if (s.phase === 'result') { v.result = s.result; if (s.result.last) v.faker = nameOf(s, s.faker); }
  return v;
}
export function phoneView(s, pid) {
  if (s.scores[pid] === undefined) return { phase: 'spectate' };
  const T = TASKS[s.kind], fake = pid === s.faker;
  const v = { phase: s.phase, round: s.round, kind: T.name, icon: T.icon, fake, score: s.scores[pid] };
  if (['read', 'go'].includes(s.phase)) v.text = fake ? T.faker : s.text;
  if (s.phase === 'vote') { v.voted = s.votes[pid] || null; v.others = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name })); }
  if (s.phase === 'result') { v.caught = s.result.caught; v.last = s.result.last; }
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', ['talk', 'vote', 'result', 'over'].includes(v.phase));
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Round ${v.r} of ${v.of} · try ${v.t} of ${v.tasks}</p>`;
  if (v.phase === 'read') h += `<div class="huntbig ready"><span>${v.icon}</span><b>${esc(v.kind)}</b></div><p class="say center">Read your phone. Keep it hidden. Do NOT do it yet!</p><p class="center"><span class="clock">${v.left}</span></p>
    <div class="how"><h3>How to play</h3><ol><li>Every phone shows the same instruction, except the faker's.</li><li>On GO, everyone does it at the same time, out in the open.</li><li>The faker has to guess what to do and blend in.</li><li>Then the TV shows the instruction. Talk it over and vote. The faker gets up to three tries to stay hidden.</li></ol></div>`;
  if (v.phase === 'go') h += `<div class="huntbig fkgo"><span>${v.icon}</span><b>${v.left > 2 ? 'Ready…' : 'GO! Hold it!'}</b></div>`;
  if (v.phase === 'talk') h += `<div class="cq">${esc(v.text)}</div><p class="say">Keep holding! Look around. Who hesitated? Who copied?</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${v.left}</p><button class="btn ghost" data-host="next">Vote now</button>`;
  if (v.phase === 'vote') h += `<div class="cq">${esc(v.text)}</div><p class="say">Vote for the faker on your phone. <span class="clock">${v.left}</span></p><div class="meter"><span style="width:${(100 * v.n) / v.total}%"></span></div><button class="btn ghost" data-host="next">Close the vote</button>`;
  if (v.phase === 'result') h += `<h2 class="${v.result.caught ? 'win' : 'lose'}">${v.result.caught ? `Caught! It was ${esc(v.faker)}` : v.result.last ? `Got away! It was ${esc(v.faker)}` : 'The faker is still hiding…'}</h2><div class="tally">${v.result.counts.map(c => `<div><b>${c.n}</b> ${esc(c.name)}</div>`).join('') || '<div>No votes</div>'}</div>${v.result.right.length && v.result.last ? `<p class="say">Spotted by: <b class="win">${v.result.right.map(esc).join(', ')}</b></p>` : ''}<button class="btn" data-host="next">Next</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = '';
  if (v.phase === 'read' || v.phase === 'go') h = `<p class="muted">${v.icon} ${esc(v.kind)}</p><div class="fkcard ${v.fake ? 'fake' : ''}">${v.fake ? '<b>🤫 You are the faker</b>' : ''}<p>${esc(v.text)}</p></div><p class="muted">${v.phase === 'go' ? 'Do it NOW and hold it!' : 'Wait for GO on the TV.'}</p>`;
  else if (v.phase === 'talk') h = `<h2>Hold it!</h2><p class="say">${v.fake ? 'Stay calm. Blame someone else.' : 'Look around. Who is faking?'}</p>`;
  else if (v.phase === 'vote') h = v.voted ? '<h2>Voted ✓</h2>' : `<h2>Who is the faker?</h2>${v.others.map(o => `<button class="btn ghost" data-v="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}`;
  else if (v.phase === 'result') h = `<h2 class="${v.fake ? (v.caught ? 'lose' : 'win') : v.caught ? 'win' : ''}">${v.fake ? (v.caught ? 'You got caught!' : 'Still hidden…') : v.caught ? 'Faker caught!' : v.last ? 'The faker escaped' : 'Not yet…'}</h2>`;
  else if (v.phase === 'over') h = '<h2>Thanks for playing!</h2>';
  el.innerHTML = h + `<p class="muted small">Score: ${v.score}</p>`;
  el.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => send({ type: 'vote', pick: b.dataset.v })));
}
