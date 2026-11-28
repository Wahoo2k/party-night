// Line Up: the TV shows five things and a rule ("oldest to newest"). Everyone puts them in order on their phone.
// Every pair you get the right way round scores; a perfect line scores a bonus.
import { esc } from '../ui.js';

export const meta = {
  id: 'lineup',
  name: 'Line Up',
  min: 2,
  max: 20,
  blurb: 'Five things, one rule. Put them in the right order before time runs out.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

// [rule, [[thing, what the reveal shows next to it], ...in the correct order]]
export const SETS = [
  ['Invented first to invented last', [['Printing press', 'about 1440'], ['Telephone', '1876'], ['Light bulb', '1879'], ['Airplane', '1903'], ['Television', '1927']]],
  ['Smallest planet to largest', [['Mercury', '3,000 miles wide'], ['Mars', '4,200 miles'], ['Earth', '7,900 miles'], ['Neptune', '30,600 miles'], ['Jupiter', '86,900 miles']]],
  ['Closest to the Sun to farthest', [['Mercury', '1st'], ['Venus', '2nd'], ['Earth', '3rd'], ['Jupiter', '5th'], ['Neptune', '8th']]],
  ['Shortest to tallest', [['Statue of Liberty', '305 feet'], ['Great Pyramid of Giza', '455 feet'], ['Eiffel Tower', '1,083 feet'], ['Empire State Building', '1,454 feet'], ['Burj Khalifa', '2,717 feet']]],
  ['Slowest to fastest', [['Snail', 'under 1 mph'], ['Giant tortoise', 'about 1 mph'], ['Elephant', 'about 25 mph'], ['Lion', 'about 50 mph'], ['Cheetah', 'about 65 mph']]],
  ['First president to latest', [['George Washington', '1789'], ['Thomas Jefferson', '1801'], ['Abraham Lincoln', '1861'], ['Theodore Roosevelt', '1901'], ['John F. Kennedy', '1961']]],
  ['Oldest movie to newest', [['Snow White and the Seven Dwarfs', '1937'], ['The Wizard of Oz', '1939'], ['Star Wars', '1977'], ['Jurassic Park', '1993'], ['Frozen', '2013']]],
  ['Smallest state to largest', [['Rhode Island', '1,500 sq miles'], ['New Jersey', '8,700'], ['Florida', '65,800'], ['California', '163,700'], ['Alaska', '665,400']]],
  ['Lightest to heaviest', [['Mouse', 'under an ounce'], ['House cat', 'about 10 pounds'], ['Labrador dog', 'about 70 pounds'], ['Horse', 'about 1,000 pounds'], ['Elephant', 'about 6 tons']]],
  ['Coldest to hottest', [['Ice', '32°F'], ['A comfy room', '70°F'], ['Your body', '98.6°F'], ['Boiling water', '212°F'], ['The surface of the Sun', '10,000°F']]],
  ['Shortest river to longest', [['Thames', '215 miles'], ['Rhine', '760 miles'], ['Danube', '1,770 miles'], ['Mississippi', '2,340 miles'], ['Nile', '4,130 miles']]],
  ['Earliest to latest in history', [['The pyramids are built', 'about 2500 BC'], ['Rome falls', '476'], ['Columbus sails', '1492'], ['American independence', '1776'], ['Moon landing', '1969']]],
  ['Fewest legs to most', [['Snake', '0'], ['Chicken', '2'], ['Dog', '4'], ['Ant', '6'], ['Spider', '8']]],
  ['Fewest people to most', [['Iceland', 'under half a million'], ['Canada', 'about 40 million'], ['Japan', 'about 124 million'], ['United States', 'about 335 million'], ['India', 'about 1.4 billion']]],
  ['Lowest mountain to highest', [['Mount Fuji', '12,389 feet'], ['Mont Blanc', '15,777 feet'], ['Kilimanjaro', '19,341 feet'], ['Denali', '20,310 feet'], ['Mount Everest', '29,032 feet']]],
  ['Smallest ocean to largest', [['Arctic', 'smallest'], ['Southern', '4th'], ['Indian', '3rd'], ['Atlantic', '2nd'], ['Pacific', 'largest']]],
  ['Worth the least to worth the most', [['Penny', '1¢'], ['Nickel', '5¢'], ['Dime', '10¢'], ['Quarter', '25¢'], ['Half dollar', '50¢']]],
  ['Nearest to Earth to farthest', [['The Space Station', '250 miles'], ['The Moon', '239,000 miles'], ['The Sun', '93 million miles'], ['Jupiter', 'about 400 million miles'], ['The next nearest star', '25 trillion miles']]],
  ['Invented first to invented last', [['The wheel', 'over 5,000 years ago'], ['Steam engine', '1712'], ['Car', '1886'], ['World Wide Web', '1989'], ['iPhone', '2007']]],
  ['Slowest to fastest', [['Walking', '3 mph'], ['Riding a bike', '15 mph'], ['Highway driving', '65 mph'], ['Bullet train', '200 mph'], ['Jet airliner', '550 mph']]],
  ['Smallest ball to biggest', [['Marble', 'half an inch'], ['Golf ball', '1.7 inches'], ['Baseball', '2.9 inches'], ['Soccer ball', '8.7 inches'], ['Basketball', '9.5 inches']]],
  ['Shortest life to longest', [['Mayfly', 'about a day'], ['Mouse', 'about 2 years'], ['Dog', 'about 12 years'], ['Human', 'about 79 years'], ['Giant tortoise', 'over 150 years']]],
  ['Oldest game console to newest', [['Atari 2600', '1977'], ['Nintendo Entertainment System', '1985'], ['PlayStation', '1995'], ['Wii', '2006'], ['Nintendo Switch', '2017']]],
  ['Earliest in the year to latest', [['Valentine\'s Day', 'February 14'], ['St. Patrick\'s Day', 'March 17'], ['Fourth of July', 'July 4'], ['Halloween', 'October 31'], ['Christmas', 'December 25']]],
  ['Smallest cat to biggest', [['House cat', '10 pounds'], ['Bobcat', '20 pounds'], ['Leopard', '130 pounds'], ['Lion', '400 pounds'], ['Tiger', '500 pounds']]],
  ['Lightest element to heaviest', [['Hydrogen', 'number 1'], ['Helium', 'number 2'], ['Carbon', 'number 6'], ['Oxygen', 'number 8'], ['Gold', 'number 79']]],
  ['Earliest in U.S. history to latest', [['Declaration of Independence', '1776'], ['Louisiana Purchase', '1803'], ['Civil War begins', '1861'], ['First airplane flight', '1903'], ['Moon landing', '1969']]],
  ['Smallest instrument to biggest', [['Piccolo', 'a foot long'], ['Violin', '2 feet'], ['Guitar', '3 feet'], ['Cello', '4 feet'], ['Double bass', '6 feet']]],
  ['Fewest players on the field to most', [['Tennis doubles', '2 a side'], ['Basketball', '5'], ['Baseball', '9'], ['Soccer', '11'], ['Rugby union', '15']]],
  ['Shortest animal to tallest', [['Mouse', 'an inch'], ['Dog', '2 feet'], ['Horse', '5 feet'], ['Elephant', '10 feet'], ['Giraffe', '18 feet']]],
  ['Smallest bill to biggest, by the face on it', [['George Washington', '$1'], ['Abraham Lincoln', '$5'], ['Alexander Hamilton', '$10'], ['Andrew Jackson', '$20'], ['Benjamin Franklin', '$100']]],
  ['Oldest animated movie to newest', [['Snow White and the Seven Dwarfs', '1937'], ['Cinderella', '1950'], ['The Lion King', '1994'], ['Toy Story', '1995'], ['Frozen', '2013']]],
  ['Shallowest to deepest', [['Kiddie pool', '1 foot'], ['Diving pool', '16 feet'], ['Scuba diver', '130 feet'], ['Wreck of the Titanic', '12,500 feet'], ['Mariana Trench', '36,000 feet']]],
  ['Smallest number to biggest', [['Thousand', '3 zeros'], ['Million', '6 zeros'], ['Billion', '9 zeros'], ['Trillion', '12 zeros'], ['Googol', '100 zeros']]],
  ['West to east', [['Honolulu', 'Hawaii'], ['Los Angeles', 'California'], ['Denver', 'Colorado'], ['Chicago', 'Illinois'], ['New York', 'New York']]],
  ['North to south', [['Oslo', 'Norway'], ['London', 'England'], ['Rome', 'Italy'], ['Cairo', 'Egypt'], ['Cape Town', 'South Africa']]],
  ['Shortest time to longest', [['Blink of an eye', 'a third of a second'], ['Microwave popcorn', '3 minutes'], ['A soccer game', '90 minutes'], ['A flight from New York to London', '7 hours'], ['A trip to the Moon', '3 days']]],
  ['Fewest in a group to most', [['Pair', '2'], ['Dozen', '12'], ['Baker\'s dozen', '13'], ['Score', '20'], ['Gross', '144']]],
  ['Smallest to biggest', [['Atom', ''], ['Grain of sand', ''], ['Marble', ''], ['The Moon', ''], ['The Sun', '']]],
  ['Youngest to oldest', [['Toddler', '2'], ['Kindergartner', '5'], ['Teenager', '15'], ['Grandparent', '65'], ['Giant sequoia tree', '2,000 years']]],
  ['Smallest country to largest', [['Vatican City', '0.2 square miles'], ['Singapore', 'about 280'], ['Ireland', 'about 27,000'], ['France', 'about 213,000'], ['Canada', '3.9 million']]],
  ['Fewest sides to most', [['Triangle', '3'], ['Square', '4'], ['Pentagon', '5'], ['Hexagon', '6'], ['Octagon', '8']]],
  ['Oldest building to newest', [['The Great Pyramid', 'about 2560 BC'], ['The Colosseum', 'AD 80'], ['The Taj Mahal', '1653'], ['The Eiffel Tower', '1889'], ['The Burj Khalifa', '2010']]],
  ['Smallest coin value to largest', [['Penny', '1 cent'], ['Nickel', '5 cents'], ['Dime', '10 cents'], ['Quarter', '25 cents'], ['Half dollar', '50 cents']]],
];

export const TIMES = { order: 40000, after: 7000 };
const ROUNDS = 5, N = 5;
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const set = s => SETS[s.order[s.i]];
// How many of the ten pairs are the right way round in a player's line (line = item numbers, 0 is first in truth).
export const pairsRight = line => { let n = 0; for (let a = 0; a < line.length; a++) for (let b = a + 1; b < line.length; b++) if (line[a] < line[b]) n++; return n; };
export const pointsFor = line => { const p = pairsRight(line); return p * 100 + (p === (N * (N - 1)) / 2 ? 250 : 0); };

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const used = new Set(prev?.usedSets || []);
  let pool = SETS.map((_, i) => i).filter(i => !used.has(i));
  const n = opts.short ? 3 : ROUNDS;
  if (pool.length < n) { used.clear(); pool = SETS.map((_, i) => i); }
  const order = shuffle(pool, rnd).slice(0, n);
  const s = {
    game: 'lineup', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    order, i: 0, usedSets: [...used, ...order], shown: [], lines: {}, result: null, settled: false, settleAt: 0,
    phase: 'order', deadline: Date.now() + TIMES.order,
  };
  deal(s, rnd);
  return s;
}
// The order the five things are shown in (never already correct).
function deal(s, rnd) { let o; do { o = shuffle([0, 1, 2, 3, 4], rnd); } while (o.every((x, i) => x === i)); s.shown = o; }

export const revealMs = () => 900 + N * 850 + 1300;
function reveal(s, now) {
  const before = { ...s.scores };
  const rows = s.players.map(p => { const line = s.lines[p.pid] || null; return { pid: p.pid, line, pairs: line ? pairsRight(line) : 0, pts: line ? pointsFor(line) : 0 }; });
  rows.forEach(r => (s.scores[r.pid] += r.pts));
  s.result = { rows, before };
  s.settled = false; s.settleAt = now + revealMs();
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
function next(s, now, rnd) {
  if (s.i + 1 >= s.order.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.i++; s.lines = {}; s.result = null; s.settled = false; deal(s, rnd); s.phase = 'order'; s.round++; s.deadline = now + TIMES.order;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || a.type !== 'line' || s.phase !== 'order' || s.lines[pid] || !s.players.some(p => p.pid === pid)) return s;
  // The phone sends the cards by where they sat on its screen (0 to 4); only here are they turned into true places.
  const seats = Array.isArray(a.line) ? a.line.map(Number) : [];
  if (seats.length !== N || [...seats].sort().join() !== '0,1,2,3,4') return s;
  s.lines[pid] = seats.map(k => s.shown[k]);
  if (s.players.every(p => s.lines[p.pid])) reveal(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'order') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now, rnd);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }   // the reveal has played: scores and phones catch up
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
const say = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every round

export function narration(s) {
  if (s.phase === 'order') return `${s.i === 0 ? 'Welcome to Line Up! Put the five things in order on your phone.' : say(['Next line-up.', 'Five more to sort.', 'Line them up.', 'Another one.'], s.i)} ${set(s)[0]}.`;
  if (s.phase === 'reveal') { const rows = s.result.rows.filter(r => r.line), perfect = rows.filter(r => r.pairs === 10).length; return !rows.length ? 'Nobody lined them up in time!' : perfect ? say(['A perfect line-up!', 'Somebody got every one right.'], s.i) : say(['Nobody got it perfect.', 'Here is how it should look.', 'So close, and yet.'], s.i); }
  if (s.phase === 'over') return 'Everything is in its place. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'order') return { sound: 'join', wait: 700, title: s.i === 0 ? 'Line Up' : `Round ${s.i + 1}`, sub: s.i === 0 ? 'Put them in order' : `of ${s.order.length}` };
  if (s.phase === 'reveal') return s.settled ? null : { sound: 'drumroll', wait: Math.max(0, s.settleAt - Date.now() - 400) };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} has it all lined up`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'order' || v.sent || !v._truth) return null;
  // Bots know the answer (they are for testing) and usually swap a neighbour or two.
  const line = [0, 1, 2, 3, 4].sort((a, b) => v._truth[a] - v._truth[b]);
  for (let k = 0; k < 2; k++) if (rnd() < 0.6) { const i = Math.floor(rnd() * 4); [line[i], line[i + 1]] = [line[i + 1], line[i]]; }
  return { type: 'line', line };
}

export function tvView(s, now = Date.now()) {
  const [rule, items] = set(s);
  const v = { phase: s.phase, n: s.i + 1, of: s.order.length, rule, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  if (s.phase === 'order') { v.items = s.shown.map(i => items[i][0]); v.players = s.players.map(p => ({ name: p.name, done: !!s.lines[p.pid] })); }
  if (s.phase === 'reveal') {
    v.settled = !!s.settled; v.items = items.map(([t, note]) => ({ t, note }));
    v.rows = s.result.rows.filter(r => r.line).sort((a, b) => b.pts - a.pts).map(r => ({ name: nameOf(s, r.pid), pairs: r.pairs, pts: r.pts, perfect: r.pairs === 10 }));
    v.missed = s.result.rows.filter(r => !r.line).map(r => nameOf(s, r.pid));
    if (!s.settled) v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: s.result.before[p.pid] })).sort((a, b) => b.score - a.score);
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const [rule, items] = set(s);
  const v = { phase: s.phase, n: s.i + 1, of: s.order.length, rule, score: s.scores[pid] };
  // Each thing is numbered by where it sits in the shuffled deal, which says nothing about where it belongs.
  if (s.phase === 'order') { v.sent = !!s.lines[pid]; v.items = s.shown.map((i, k) => ({ id: k, t: items[i][0] })); if (String(pid).startsWith('bot-')) v._truth = [...s.shown]; }
  if (s.phase === 'reveal') { v.settled = !!s.settled; if (s.settled) { const r = s.result.rows.find(x => x.pid === pid); v.pairs = r?.pairs || 0; v.pts = r?.pts || 0; v.answered = !!r?.line; v.truth = items.map(x => x[0]); v.mine = r?.line ? r.line.map(i => items[i][0]) : null; } }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- renderers ----------
const SLOT = ['#ff4d6d', '#ff9f1c', '#ffd60a', '#06d6a0', '#4cc9f0'];
let revealKey = '', revealAt = 0, revealTimers = [];
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  const head = `<div class="tshead"><span class="tsmode">Line up</span><b>${esc(v.rule)}</b>${v.phase === 'order' ? `<em class="clock ${v.left <= 8 ? 'hurry' : ''}">${v.left}</em>` : ''}</div>`;
  let h = '';
  if (v.phase === 'order') {
    h = `<p class="cat">Round ${v.n} of ${v.of}</p>${head}<div class="lupile">${v.items.map((t, i) => `<div class="lucard" style="--r:${[-3, 2, -1, 3, -2][i]}deg;animation-delay:${i * 0.1}s"><b>${esc(t)}</b></div>`).join('')}</div>
      <div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div><p class="tsrule"><b>Put them in order on your phone.</b><span>Every pair the right way round scores.</span></p><button class="btn ghost" data-host="next">Show the order</button>`;
  }
  if (v.phase === 'reveal') {
    const key = 'r' + v.n, first = key !== revealKey;
    if (first) { revealKey = key; revealAt = Date.now(); revealTimers.forEach(clearTimeout); revealTimers = []; }
    const el0 = Date.now() - revealAt, at = i => 900 + i * 850, end = 900 + N * 850;   // a redraw part-way through carries on from where the reveal is
    h = `<p class="cat">Round ${v.n} of ${v.of}</p>${head}<div class="lureveal"><div class="luline">${v.items.map((it, i) => `<div class="tstile flip" style="--c:${SLOT[i]};--d:${at(i) - el0}ms"><i>${i + 1}</i><b>${esc(it.t)}</b><em>${esc(it.note)}</em></div>`).join('')}</div>
      <div class="pdboard">${v.rows.slice(0, 6).map((r, k) => `<div class="pdrow ${r.perfect ? 'best' : ''}" style="animation-delay:${end + 300 + k * 150 - el0}ms"><b>${esc(r.name)}</b><span>${r.perfect ? 'Perfect line!' : `${r.pairs} of 10 pairs`}</span><em>+${r.pts.toLocaleString()}</em></div>`).join('')}${v.missed.length ? `<p class="pdmiss" style="animation-delay:${end + 900 - el0}ms">No answer: ${v.missed.map(esc).join(', ')}</p>` : ''}</div></div><button class="btn" data-host="next">Next</button>`;
    if (first) import('../sfx.js').then(m => {
      const later = (ms, fn) => revealTimers.push(setTimeout(fn, ms));
      v.items.forEach((_, i) => later(at(i), () => m.play(['pop', 'stamp', 'lockin', 'pop', 'stamp'][i])));
      later(end + 300, () => m.play(v.rows.some(r => r.perfect) ? 'win' : v.rows.some(r => r.pairs >= 8) ? 'safe' : 'groan'));
      if (v.rows.some(r => r.perfect)) later(end + 750, () => m.play('cheer'));
    }).catch(() => {});
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} has it all lined up!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel ts">${h}</div>${scores}</div>`;
}

// The phone keeps the line you are building across redraws.
let pad = { key: '', line: [] };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You lined it all up!' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  const top = `<p class="muted">Round ${v.n} of ${v.of}</p><p class="tq small">${esc(v.rule)}</p>`;
  if (v.phase === 'reveal') {
    el.innerHTML = !v.settled ? `${top}<h2>Watch the TV…</h2><p class="say">Here comes the right order.</p>`
      : `${top}<h2 class="${v.pairs === 10 ? 'win' : ''}">${!v.answered ? 'No answer' : v.pairs === 10 ? 'Perfect line! +' + v.pts.toLocaleString() : '+' + v.pts.toLocaleString()}</h2>${v.answered ? `<p class="say">${v.pairs} of 10 pairs the right way round.</p>` : ''}<ol class="lutruth">${v.truth.map(t => `<li>${esc(t)}</li>`).join('')}</ol><p class="muted">${v.score.toLocaleString()} point${v.score === 1 ? '' : 's'}</p>`;
    return;
  }
  if (v.sent) { el.innerHTML = `${top}<h2>Locked in 🔒</h2><p class="say">Waiting for everyone else…</p>`; return; }
  const key = 'o' + v.n + v.items.map(x => x.id).join('');
  if (pad.key !== key) pad = { key, line: v.items.map(x => x.id) };
  const draw = () => {
    const name = id => v.items.find(x => x.id === id).t;
    el.innerHTML = `${top}<div class="ahelp"><p><b>Put these in order, top to bottom.</b> Use the arrows to move one up or down.</p></div>
      <div class="lulist">${pad.line.map((id, i) => `<div class="luitem"><i>${i + 1}</i><b>${esc(name(id))}</b><span><button type="button" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">▲</button><button type="button" data-down="${i}" ${i === pad.line.length - 1 ? 'disabled' : ''} aria-label="Move down">▼</button></span></div>`).join('')}</div>
      <button class="btn" id="lulock">Lock it in</button>`;
    const swap = (a, b) => { [pad.line[a], pad.line[b]] = [pad.line[b], pad.line[a]]; draw(); };
    el.querySelectorAll('[data-up]').forEach(b => (b.onclick = () => swap(+b.dataset.up, +b.dataset.up - 1)));
    el.querySelectorAll('[data-down]').forEach(b => (b.onclick = () => swap(+b.dataset.down, +b.dataset.down + 1)));
    el.querySelector('#lulock').onclick = () => { el.querySelector('#lulock').disabled = true; send({ type: 'line', line: pad.line }); };
  };
  draw();
}
