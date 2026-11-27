// Haunted Quiz: answer trivia to stay alive. Get one wrong and you're dragged to the Basement for a spooky
// mini-game. Lose there and you become a ghost. Ghosts keep playing for a few points; the living score big.
// (A Trivia Murder Party-style game, with our own house, questions and basement games.)
import { esc } from '../ui.js';

export const meta = {
  id: 'haunted',
  name: 'Haunted Quiz',
  min: 2,
  max: 10,
  blurb: 'Trivia where wrong answers send you to the spooky basement.',
};

export const QUESTIONS = [
  ['Which planet is known as the Red Planet?', ['Mars', 'Venus', 'Jupiter', 'Mercury']], ['How many legs does an insect have?', ['6', '8', '4', '10']],
  ['What is the largest ocean on Earth?', ['Pacific', 'Atlantic', 'Indian', 'Arctic']], ['What do bees make?', ['Honey', 'Milk', 'Silk', 'Wax paper']],
  ['Which animal is the tallest in the world?', ['Giraffe', 'Elephant', 'Camel', 'Moose']], ['What gas do plants take in from the air?', ['Carbon dioxide', 'Oxygen', 'Helium', 'Nitrogen']],
  ['How many continents are there?', ['7', '5', '6', '8']], ['What is the freezing point of water in Celsius?', ['0°', '32°', '10°', '-10°']],
  ['Which is the smallest planet in our solar system?', ['Mercury', 'Mars', 'Pluto', 'Venus']], ['What color do you get by mixing blue and yellow?', ['Green', 'Purple', 'Orange', 'Brown']],
  ['Which bird is a symbol of the United States?', ['Bald eagle', 'Turkey', 'Robin', 'Hawk']], ['What is the hardest natural substance?', ['Diamond', 'Gold', 'Iron', 'Granite']],
  ['How many sides does a hexagon have?', ['6', '5', '7', '8']], ['Which instrument has 88 keys?', ['Piano', 'Organ', 'Accordion', 'Harp']],
  ['In which country are the ancient pyramids of Giza?', ['Egypt', 'Mexico', 'Peru', 'Greece']], ['What is the largest mammal?', ['Blue whale', 'Elephant', 'Giraffe', 'Hippo']],
  ['Which body part has the most bones?', ['Hands and wrists', 'Skull', 'Spine', 'Ribs']], ['What is the capital of Japan?', ['Tokyo', 'Kyoto', 'Osaka', 'Seoul']],
  ['How many hours are in two days?', ['48', '24', '36', '72']], ['Which is NOT a primary color of light?', ['Yellow', 'Red', 'Green', 'Blue']],
  ['What do caterpillars turn into?', ['Butterflies or moths', 'Beetles', 'Bees', 'Spiders']], ['What is the longest river in South America?', ['Amazon', 'Nile', 'Mississippi', 'Danube']],
  ['Which planet has the most famous rings?', ['Saturn', 'Earth', 'Mars', 'Neptune']], ['What is a baby kangaroo called?', ['Joey', 'Kit', 'Cub', 'Calf']],
  ['How many players are on a basketball court for one team?', ['5', '6', '7', '11']], ['Which ocean is between the U.S. and Europe?', ['Atlantic', 'Pacific', 'Indian', 'Southern']],
  ['What is the main ingredient in guacamole?', ['Avocado', 'Lime', 'Tomato', 'Pepper']], ['Which star is closest to Earth?', ['The Sun', 'Polaris', 'Sirius', 'Alpha Centauri']],
  ['What shape is a stop sign?', ['Octagon', 'Hexagon', 'Circle', 'Triangle']], ['Which animal is known for changing its color?', ['Chameleon', 'Iguana', 'Gecko', 'Frog']],
  ['How many minutes are in an hour and a half?', ['90', '60', '120', '100']], ['What is frozen water called?', ['Ice', 'Steam', 'Dew', 'Fog']],
  ['Which country is famous for the maple leaf flag?', ['Canada', 'USA', 'Sweden', 'Norway']], ['Who wrote "Romeo and Juliet"?', ['William Shakespeare', 'Charles Dickens', 'Mark Twain', 'Jane Austen']],
  ['Which is the largest desert in the world, counting cold deserts?', ['Antarctica', 'Sahara', 'Gobi', 'Kalahari']], ['How many strings does a standard guitar have?', ['6', '4', '5', '8']],
];
export const PER_GAME = 8;
export const TIMES = { question: 20000, reveal: 6000, basement: 15000, basementEnd: 6000 };
export const DOORS = 3;
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random) {
  const s = { game: 'haunted', players: players.map(p => ({ pid: p.pid, name: p.name })), qs: shuffle([...QUESTIONS.keys()], rnd).slice(0, PER_GAME), q: 0, round: 0, scores: {}, ghost: {}, answers: {}, basement: null };
  s.players.forEach(p => { s.scores[p.pid] = 0; s.ghost[p.pid] = false; });
  ask(s, Date.now(), rnd);
  return s;
}
function ask(s, now, rnd) {
  const [, opts] = QUESTIONS[s.qs[s.q]];
  s.order = shuffle([0, 1, 2, 3], rnd);   // option 0 is always the right one in the bank
  s.answers = {}; s.basement = null;
  s.phase = 'question'; s.round++; s.deadline = now + TIMES.question;
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const Q = s => QUESTIONS[s.qs[s.q]];

function reveal(s, now) {
  s.wrong = [];
  for (const p of s.players) {
    const a = s.answers[p.pid];
    const right = a !== undefined && s.order[a] === 0;
    if (s.ghost[p.pid]) { if (right) s.scores[p.pid] += 50; continue; }
    if (right) s.scores[p.pid] += 100 + (s.fast?.[p.pid] || 0);
    else s.wrong.push(p.pid);
  }
  s.phase = 'reveal'; s.round++; s.deadline = now + TIMES.reveal;
}

const GAMES = ['doors', 'math', 'doors', 'math'];
function toBasement(s, now, rnd) {
  const kind = GAMES[s.q % GAMES.length];
  const b = { kind, who: s.wrong, picks: {}, lost: [] };
  if (kind === 'doors') b.ghostDoor = Math.floor(rnd() * DOORS);
  else { const x = 2 + Math.floor(rnd() * 8), y = 2 + Math.floor(rnd() * 8); b.sum = { x, y, a: x + y, opts: shuffle([x + y, x + y + 1, x + y - 1, x + y + 2], rnd) }; }
  s.basement = b;
  s.phase = 'basement'; s.round++; s.deadline = now + TIMES.basement;
}
function endBasement(s, now) {
  const b = s.basement;
  b.lost = b.who.filter(pid => (b.kind === 'doors' ? (b.picks[pid] ?? b.ghostDoor) === b.ghostDoor : b.picks[pid] !== b.sum.a));
  b.lost.forEach(pid => (s.ghost[pid] = true));
  s.phase = 'basementEnd'; s.round++; s.deadline = now + TIMES.basementEnd;
}
function next(s, now, rnd) {
  s.q++;
  if (s.q >= s.qs.length) {
    s.players.forEach(p => { if (!s.ghost[p.pid]) s.scores[p.pid] += 300; });   // survivors' bonus
    s.phase = 'over'; s.round++; s.deadline = 0; return;
  }
  ask(s, now, rnd);
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.scores[pid] === undefined) return s;
  if (s.phase === 'question' && a.type === 'answer' && [0, 1, 2, 3].includes(a.i) && s.answers[pid] === undefined) {
    s.answers[pid] = a.i;
    s.fast = s.fast || {};
    s.fast[pid] = Math.max(0, Math.round((s.deadline - now) / 400));   // up to 50 bonus for speed
    if (s.players.every(p => s.answers[p.pid] !== undefined)) reveal(s, now);
  } else if (s.phase === 'basement' && s.basement.who.includes(pid) && s.basement.picks[pid] === undefined && a.type === 'pick') {
    s.basement.picks[pid] = Number(a.v);
    if (s.basement.who.every(w => s.basement.picks[w] !== undefined)) endBasement(s, now);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'question') reveal(s, now);
  else if (s.phase === 'reveal') { if (s.wrong.length) toBasement(s, now, rnd); else next(s, now, rnd); }
  else if (s.phase === 'basement') endBasement(s, now);
  else if (s.phase === 'basementEnd') next(s, now, rnd);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid], ghost: s.ghost[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'question') return `${s.q === 0 ? 'Welcome to the haunted house. Answer correctly to stay alive. Get one wrong, and you go to the basement. ' : ''}${Q(s)[0]}`;
  if (s.phase === 'reveal') return `The answer is ${Q(s)[1][0]}. ${s.wrong.length ? `${s.wrong.map(p => nameOf(s, p)).join(' and ')}, to the basement!` : 'Everyone survives!'}`;
  if (s.phase === 'basement') return s.basement.kind === 'doors' ? 'Pick a door. One of them has a ghost behind it…' : 'Quick! Solve the sum to escape!';
  if (s.phase === 'basementEnd') return s.basement.lost.length ? `${s.basement.lost.map(p => nameOf(s, p)).join(' and ')} ${s.basement.lost.length > 1 ? 'are' : 'is'} now a ghost. Wooo.` : 'Everyone escaped the basement!';
  if (s.phase === 'over') return `${ranking(s)[0].name} wins the Haunted Quiz!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'question') return { sound: 'join', wait: 500, title: s.q === 0 ? 'Haunted Quiz' : `Question ${s.q + 1}`, tone: 'night', ambient: s.q === 0 ? 'crickets' : null };
  if (s.phase === 'reveal') return { sound: s.wrong.length ? 'death' : 'safe', wait: 500 };
  if (s.phase === 'basement') return { sound: 'night', wait: 1500, title: 'The Basement', sub: s.basement.kind === 'doors' ? 'Pick a door…' : 'Solve it to escape!', tone: 'blood' };
  if (s.phase === 'basementEnd') return { sound: s.basement.lost.length ? 'death' : 'win', wait: 600, fx: s.basement.lost.length ? 'claws' : 'confetti' };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'You escaped!', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'question' && v.mine === null) return { type: 'answer', i: rnd() < 0.65 && v._r !== undefined ? v._r : Math.floor(rnd() * 4) };
  if (v.phase === 'basement' && v.inBasement && v.picked === null) return v.kind === 'doors' ? { type: 'pick', v: Math.floor(rnd() * DOORS) } : { type: 'pick', v: rnd() < 0.8 ? v.sum.x + v.sum.y : v.sum.opts[0] };
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, q: s.q + 1, of: s.qs.length, scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (['question', 'reveal'].includes(s.phase)) { v.question = Q(s)[0]; v.opts = s.order.map(i => Q(s)[1][i]); v.n = Object.keys(s.answers).length; v.total = s.players.length; }
  if (s.phase === 'reveal') { v.right = s.order.indexOf(0); v.wrong = s.wrong.map(p => nameOf(s, p)); v.picks = v.opts.map((_, i) => s.players.filter(p => s.answers[p.pid] === i).map(p => p.name)); }
  if (['basement', 'basementEnd'].includes(s.phase)) { const b = s.basement; v.kind = b.kind; v.who = b.who.map(p => nameOf(s, p)); v.sum = b.sum ? { x: b.sum.x, y: b.sum.y } : null; v.done = Object.keys(b.picks).length; }
  if (s.phase === 'basementEnd') { v.lost = s.basement.lost.map(p => nameOf(s, p)); v.ghostDoor = s.basement.ghostDoor; v.answer = s.basement.sum?.a; }
  return v;
}
export function phoneView(s, pid) {
  if (s.scores[pid] === undefined) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, ghost: s.ghost[pid], score: s.scores[pid] };
  if (s.phase === 'question') { v.opts = s.order.map(i => Q(s)[1][i]); v.mine = s.answers[pid] ?? null; if (String(pid).startsWith('bot-')) v._r = s.order.indexOf(0); }
  if (s.phase === 'reveal') { v.right = s.answers[pid] !== undefined && s.order[s.answers[pid]] === 0; v.toBasement = s.wrong.includes(pid); }
  if (s.phase === 'basement') { const b = s.basement; v.inBasement = b.who.includes(pid); v.kind = b.kind; v.picked = b.picks[pid] ?? null; if (b.sum) v.sum = { x: b.sum.x, y: b.sum.y, opts: b.sum.opts }; }
  if (s.phase === 'basementEnd') v.lost = s.basement.lost.includes(pid);
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

const LETTERS = ['A', 'B', 'C', 'D'];
export function renderTV(v, el) {
  document.body.classList.toggle('night', true);
  document.body.classList.toggle('day', false);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow ${p.ghost ? 'hqghost' : ''}"><span>${p.ghost ? '👻 ' : ''}${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Question ${Math.min(v.q, v.of)} of ${v.of}</p>`;
  if (v.phase === 'question' || v.phase === 'reveal') h += `<div class="cq">${esc(v.question)}</div><div class="hqopts">${v.opts.map((o, i) => `<div class="hqopt ${v.phase === 'reveal' ? (i === v.right ? 'right' : 'wrong') : ''}" style="animation-delay:${i * 0.1}s"><b>${LETTERS[i]}</b>${esc(o)}${v.picks ? `<small>${v.picks[i].map(esc).join(', ')}</small>` : ''}</div>`).join('')}</div>${v.phase === 'question' ? `<p class="muted center">${v.n} of ${v.total} answered <span class="clock">${v.left}</span></p>` : `<p class="say center">${v.wrong.length ? `🕯️ To the basement: <b>${v.wrong.map(esc).join(', ')}</b>` : 'Everyone survives this one!'}</p><button class="btn" data-host="next">Continue</button>`}`;
  if (v.phase === 'basement') h += `<h2 class="lose">🕯️ The Basement</h2><p class="say">${v.who.map(esc).join(', ')}: ${v.kind === 'doors' ? 'pick a door on your phone. A ghost waits behind one of them…' : `solve it to escape! <b class="hqsum">${v.sum.x} + ${v.sum.y}</b>`}</p>${v.kind === 'doors' ? `<div class="hqdoors">${Array.from({ length: DOORS }, (_, i) => `<div class="hqdoor">🚪<b>${i + 1}</b></div>`).join('')}</div>` : ''}<p class="muted center"><span class="clock">${v.left}</span></p>`;
  if (v.phase === 'basementEnd') h += `<h2 class="${v.lost.length ? 'lose' : 'win'}">${v.lost.length ? `👻 ${v.lost.map(esc).join(', ')} became ${v.lost.length > 1 ? 'ghosts' : 'a ghost'}!` : 'Everyone escaped!'}</h2>${v.kind === 'doors' ? `<div class="hqdoors">${Array.from({ length: DOORS }, (_, i) => `<div class="hqdoor ${i === v.ghostDoor ? 'haunt' : ''}">${i === v.ghostDoor ? '👻' : '🚪'}<b>${i + 1}</b></div>`).join('')}</div>` : `<p class="say center">${v.sum.x} + ${v.sum.y} = <b>${v.answer}</b></p>`}<p class="muted">Ghosts keep answering for 50 points a question. Survivors get 300 at the end.</p><button class="btn" data-host="next">Next question</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${p.ghost ? '👻 ' : ''}${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel hqpanel">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">${v.ghost ? '👻 Ghost · ' : ''}${v.score} points</p>`;
  if (v.phase === 'question') h += v.mine !== null ? '<h2>Locked in!</h2>' : `<div class="hqbtns">${v.opts.map((o, i) => `<button class="hqbtn" data-i="${i}"><b>${LETTERS[i]}</b>${esc(o)}</button>`).join('')}</div>`;
  else if (v.phase === 'reveal') h += `<h2 class="${v.right ? 'win' : 'lose'}">${v.right ? 'Correct!' : v.ghost ? 'Wrong, but you\'re already a ghost 👻' : 'Wrong! To the basement…'}</h2>`;
  else if (v.phase === 'basement' && v.inBasement && v.picked === null) h += v.kind === 'doors' ? `<h2>Pick a door…</h2><div class="hqdoors">${Array.from({ length: DOORS }, (_, i) => `<button class="hqdoor" data-v="${i}">🚪<b>${i + 1}</b></button>`).join('')}</div>` : `<h2>${v.sum.x} + ${v.sum.y} = ?</h2><div class="hqbtns">${v.sum.opts.map(o => `<button class="hqbtn" data-v="${o}">${o}</button>`).join('')}</div>`;
  else if (v.phase === 'basement') h += `<h2>${v.inBasement ? 'Waiting in the dark…' : 'Someone is in the basement…'}</h2>`;
  else if (v.phase === 'basementEnd') h += `<h2 class="${v.lost ? 'lose' : ''}">${v.lost ? '👻 You are a ghost now!' : 'Phew!'}</h2>`;
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-i]').forEach(b => (b.onclick = () => send({ type: 'answer', i: Number(b.dataset.i) })));
  el.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => send({ type: 'pick', v: Number(b.dataset.v) })));
}
