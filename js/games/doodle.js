// Doodle Bluff: everyone secretly draws a weird title. Then for each drawing, the others write fake titles,
// and everyone tries to pick the real one. Fool people with your fake to score. (Drawful-style.)
import { esc } from '../ui.js';
import { isRude } from '../names.js';
import { svgFor, cleanStrokes, botDoodle, mountPad } from './sketch.js';
import { botArt } from './bot-art.js';

export const meta = {
  id: 'doodle',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
  name: 'Doodle Bluff',
  min: 3,
  max: 10,
  blurb: 'Draw a weird title, everyone fakes one. Find the real one.',
};

export const TITLES = [
  'A sad hot dog', 'Grandma\'s secret robot', 'The world\'s tallest sandwich', 'A cat who is late for work', 'Dinner with a dinosaur', 'A very nervous cloud',
  'The tooth fairy on vacation', 'A haunted bicycle', 'A snail winning a race', 'Breakfast on Mars', 'A wizard\'s messy bedroom', 'The angriest cupcake',
  'A shark learning to knit', 'A potato\'s birthday party', 'A dog\'s dream job', 'The moon eating cheese', 'A banana in disguise', 'A superhero who is afraid of mice',
  'A volcano taking a bath', 'Penguins at the beach', 'A tree with a secret', 'Spaghetti weather', 'A shy ghost', 'The last slice of pizza',
  'A frog king\'s crown', 'An alien\'s first pancake', 'A worm with big plans', 'The laziest dragon', 'A sock\'s great escape', 'A pirate\'s rubber duck',
  'A penguin at the beach', 'A robot learning to dance', 'The loneliest sock', 'A giraffe in an elevator', 'A ghost who is scared of people', 'Pizza delivery by dragon',
  'A cow on a skateboard', 'The world\'s worst haircut', 'A snowman on vacation', 'A pirate who gets seasick', 'An octopus playing the drums', 'A very fancy pigeon',
  'A T. rex making the bed', 'An alien\'s first day at school', 'A mermaid stuck in traffic', 'A bear ordering coffee', 'The slowest race car', 'A vampire at the dentist',
  'A cactus giving a hug', 'A fish walking a dog', 'A wedding for two spoons', 'A mountain with a cold', 'A sloth running late', 'A knight afraid of his horse',
  'A toaster in love', 'A squirrel robbing a bank', 'The moon wearing sunglasses', 'A duck doing taxes', 'A sandwich running away', 'A wizard stuck in a revolving door',
  'A zombie on a diet', 'A whale in a bathtub', 'A grumpy rainbow', 'A turtle with a jetpack', 'A scarecrow on a date', 'A bored frog king',
  'A yeti at a pool party', 'A lighthouse that is afraid of the dark', 'A unicorn stuck in a sweater', 'A chicken crossing the road, finally',
  'A dentist for sharks', 'The world\'s smallest giant', 'A sheep counting people', 'A haunted sandwich shop', 'A raccoon running for mayor', 'Two snowmen arguing', 'A kangaroo with too many groceries', 'The sun forgetting to rise', 'A robot\'s first sneeze', 'A mouse lifting an elephant', 'A spooky birthday cake', 'A camel at a water park', 'An owl who hates nights', 'A goldfish with big dreams', 'A dragon afraid of candles', 'A flamingo on roller skates', 'The slowest superhero', 'A pumpkin\'s bad day', 'A moose in a canoe', 'A lobster giving a haircut', 'A piano on a diet', 'An astronaut who lost the keys', 'A llama at a fancy dinner', 'A crab directing traffic', 'The tooth that got away', 'A hedgehog blowing up balloons', 'A castle made of waffles', 'A parrot keeping a secret', 'A walrus at the opera', 'A broom on its day off',
];
export const TIMES = { draw: 75000, fake: 45000, pick: 30000, reveal: 9000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = t => String(t || '').toLowerCase().replace(/^(a|an|the)\s+/, '').replace(/[^a-z0-9]/g, '');
export function cleanTitle(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 45);
  if (x.length < 2) return { ok: false, why: 'Write a title.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: x };
}

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const titles = shuffle([...TITLES.keys()], rnd);
  return {
    game: 'doodle', maxShows: opts.short ? 4 : 10, players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    art: Object.fromEntries(players.map((p, i) => [p.pid, { title: TITLES[titles[i % titles.length]], strokes: null }])), drafts: {},
    order: [], k: 0, fakes: {}, picks: {}, options: [], result: null, phase: 'draw', deadline: Date.now() + TIMES.draw,
  };
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const artist = s => s.order[s.k];
const others = s => s.players.filter(p => p.pid !== artist(s)).map(p => p.pid);

function startShows(s, now, rnd) {
  s.players.forEach(p => { if (!s.art[p.pid].strokes) s.art[p.pid].strokes = s.drafts[p.pid] || []; });
  s.order = shuffle(s.players.map(p => p.pid).filter(pid => s.art[pid].strokes.length), rnd).slice(0, s.maxShows);
  s.k = 0;
  if (!s.order.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  toFake(s, now);
}
function toFake(s, now) { s.fakes = {}; s.picks = {}; s.options = []; s.result = null; s.phase = 'fake'; s.round++; s.deadline = now + TIMES.fake; }
function toPick(s, now, rnd) {
  const real = s.art[artist(s)].title;
  const seen = new Set([norm(real)]);
  s.lucky = [];
  const opts = [{ id: 'real', text: real, by: null }];
  for (const [pid, text] of Object.entries(s.fakes)) {
    if (norm(text) === norm(real)) { s.lucky.push(pid); s.scores[pid] += 500; continue; }   // guessed the real title!
    if (seen.has(norm(text))) { opts.find(o => norm(o.text) === norm(text))?.also?.push(pid); continue; }
    seen.add(norm(text)); opts.push({ id: pid, text, by: pid, also: [] });
  }
  s.options = shuffle(opts, rnd);
  s.phase = 'pick'; s.round++; s.deadline = now + TIMES.pick;
}
function reveal(s, now) {
  const a = artist(s), before = { ...s.scores };
  const right = Object.entries(s.picks).filter(([, id]) => id === 'real').map(([pid]) => pid);
  right.forEach(pid => (s.scores[pid] += 1000));
  s.scores[a] += 500 * right.length;
  const fooled = {};
  Object.entries(s.picks).forEach(([pid, id]) => { if (id !== 'real') { const o = s.options.find(x => x.id === id); [o.by, ...(o.also || [])].forEach(f => { s.scores[f] += 500; fooled[f] = (fooled[f] || 0) + 1; }); } });
  s.result = { right: right.map(p => nameOf(s, p)), fooled, picks: { ...s.picks }, before };
  // The TV plays the reveal in beats (see beats()); scores and phones only show the outcome once it has finished.
  s.settled = false; s.settleAt = now + beats(revealOptions(s)).total;
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.reveal;
}
function next(s, now) {
  s.k++;
  if (s.k >= s.order.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  toFake(s, now);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.scores.hasOwnProperty(pid)) return s;
  if (s.phase === 'draw' && !s.art[pid].strokes) {
    if (a.type === 'draft') s.drafts[pid] = cleanStrokes(a.strokes);
    if (a.type === 'draw') { s.art[pid].strokes = cleanStrokes(a.strokes); if (s.players.every(p => s.art[p.pid].strokes)) startShows(s, now, rnd); }
  } else if (s.phase === 'fake' && pid !== artist(s) && a.type === 'fake' && !s.fakes[pid]) {
    const r = cleanTitle(a.text);
    if (!r.ok) return s;
    s.fakes[pid] = r.text;
    if (others(s).every(o => s.fakes[o])) toPick(s, now, rnd);
  } else if (s.phase === 'pick' && pid !== artist(s) && a.type === 'pick') {
    const o = s.options[+a.id];
    if (!o || o.by === pid || o.also?.includes(pid)) return s;
    s.picks[pid] = o.id;
    if (others(s).every(x => s.picks[x] || s.lucky.includes(x))) reveal(s, now);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'draw') startShows(s, now, rnd);
  else if (s.phase === 'fake') toPick(s, now, rnd);
  else if (s.phase === 'pick') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }   // the reveal has played: scores and phones catch up
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
const rot = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every time
export function narration(s) {
  if (s.phase === 'draw') return 'Welcome to Doodle Bluff! Draw the title on your phone. Keep it secret!';
  if (s.phase === 'fake') return `${s.k === 0 ? 'Here is the first masterpiece. ' : ''}${rot(["What's this drawing called? Write a fake title to fool everyone.", 'Next drawing. Give it a fake title.', 'What on earth is this one? Write a title that could be real.', 'Another masterpiece. Make up a title for it.'], s.k)}`;
  if (s.phase === 'pick') return rot(['Which one is the real title?', 'One of these is the real title. Which one?', 'Find the real title.', 'Pick the real one. Do not get fooled.'], s.k);
  if (s.phase === 'reveal') return rot(["Let's see who got fooled.", 'Here come the votes.', 'Who fell for a fake?', 'And the real title is coming up.'], s.k);   // no title here: the reveal plays out on screen; saying the title here would give it away
  if (s.phase === 'over') return `${ranking(s)[0].name} wins Doodle Bluff!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'draw') return { sound: 'join', wait: 700, title: 'Doodle Bluff', sub: 'Draw your secret title' };
  if (s.phase === 'fake') return { sound: 'vote', wait: 400 };
  if (s.phase === 'pick') return { sound: 'vote', wait: 300 };
  if (s.phase === 'reveal') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'draw' && !v.done) return { type: 'draw', strokes: botArt(v.title, rnd) || botDoodle(rnd) };
  if (v.phase === 'fake' && !v.mine && !v.sent) return { type: 'fake', text: TITLES[Math.floor(rnd() * TITLES.length)] };
  if (v.phase === 'pick' && !v.mine && !v.picked) { const ok = v.options.filter(o => !o.own); const o = ok[Math.floor(rnd() * ok.length)]; return o ? { type: 'pick', id: o.id } : null; }
  return null;
}

// The reveal, option by option: fakes that fooled someone first (fewest picks first), the real title last.
// For each: the people who picked it pop in one at a time, then the stamp. Times are ms from the start of the reveal.
const revealOptions = s => s.options.map(o => ({ text: o.text, real: o.id === 'real', by: o.by ? [o.by, ...(o.also || [])].map(p => nameOf(s, p)) : [], pickers: Object.entries(s.result.picks).filter(([, id]) => id === o.id).map(([p]) => nameOf(s, p)) }));
export function beats(options) {
  const order = options.map((o, i) => i).filter(i => options[i].real || options[i].pickers.length).sort((a, b) => options[a].real - options[b].real || options[a].pickers.length - options[b].pickers.length);
  let t = 900; const at = {};
  for (const i of order) { const n = options[i].pickers.length, gap = Math.min(380, 2000 / Math.max(1, n)); at[i] = { start: t, gap, stamp: t + 500 + n * gap + 800 }; t = at[i].stamp + 1500; }
  const last = at[order[order.length - 1]].stamp;
  options.forEach((o, i) => { if (!at[i]) at[i] = { start: last, gap: 0, stamp: last + 300 }; });
  return { at, order, total: t + 400 };
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'draw') { v.done = s.players.filter(p => s.art[p.pid].strokes).map(p => p.name); v.waiting = s.players.filter(p => !s.art[p.pid].strokes).map(p => p.name); }
  if (['fake', 'pick', 'reveal'].includes(s.phase)) { v.strokes = s.art[artist(s)].strokes; v.k = s.k + 1; v.of = s.order.length; v.n = Object.keys(s.phase === 'fake' ? s.fakes : s.picks).length; v.total = others(s).length; }
  if (s.phase === 'pick') v.options = s.options.map(o => o.text);
  if (s.phase === 'reveal') {
    v.artist = nameOf(s, artist(s)); v.title = s.art[artist(s)].title;
    v.options = revealOptions(s); v.settled = !!s.settled; v.artistGain = 500 * s.result.right.length;
    if (!s.settled) v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: s.result.before[p.pid] })).sort((a, b) => b.score - a.score);
    v.lucky = s.lucky.map(p => nameOf(s, p));
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.scores.hasOwnProperty(pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, score: s.scores[pid] };
  if (s.phase === 'draw') { v.done = !!s.art[pid].strokes; if (!v.done) v.title = s.art[pid].title; }
  if (['fake', 'pick', 'reveal'].includes(s.phase)) v.mine = artist(s) === pid;
  if (s.phase === 'fake') v.sent = !!s.fakes[pid];
  if (s.phase === 'pick') { v.lucky = s.lucky.includes(pid); v.picked = s.picks[pid] ? s.options.findIndex(o => o.id === s.picks[pid]) : null; v.options = s.options.map((o, i) => ({ id: i, text: o.text, own: o.by === pid || !!o.also?.includes(pid) })); }
  if (s.phase === 'reveal') { v.settled = !!s.settled; if (!s.settled) return v; v.title = s.art[artist(s)].title; v.right = s.result.picks[pid] === 'real'; v.fooled = s.result.fooled[pid] || 0; }
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

let shownKey = '', revealKey = '', revealAt = 0, revealTimers = [], fooledTurn = 0;
const FOOLED_SOUNDS = ['laugh', 'gasp', 'groan', 'sting-comic'];
export function renderTV(v, el) {
  const key = ['fake', 'pick', 'reveal'].includes(v.phase) ? 'd' + v.k : '';
  const replay = v.phase === 'fake' && key !== shownKey;
  if (v.phase === 'fake' || !key) shownKey = key;
  document.body.classList.toggle('day', v.phase === 'reveal' || v.phase === 'over');
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'draw') h = `<h2>Draw your secret title</h2><p class="say">Everyone has a different weird title. Draw it as well as you can. No words!</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><div class="roster">${v.done.map(n => `<div class="chip skdone">✓ ${esc(n)}</div>`).join('')}${v.waiting.map(n => `<div class="chip">✏️ ${esc(n)}</div>`).join('')}</div><button class="btn ghost" data-host="next">Move on</button><div class="how"><h3>How to play</h3><ol><li>Draw your secret title.</li><li>For each drawing, everyone else writes a fake title.</li><li>Then pick which title is real. 1,000 for finding it.</li><li>Every player you fool with your fake earns you 500.</li></ol></div>`;
  if (['fake', 'pick', 'reveal'].includes(v.phase)) {
    const art = `<div class="dbart">${svgFor(v.strokes, '', replay)}</div>`;
    let side = '';
    if (v.phase === 'fake') side = `<h2>What's this called?</h2><p class="say">Write a fake title on your phone that sounds real.</p><div class="meter"><span style="width:${(100 * v.n) / v.total}%"></span></div><p class="muted">${v.n} of ${v.total} <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Show the titles</button>`;
    if (v.phase === 'pick') side = `<h2>Which is real?</h2><div class="dbopts">${v.options.map((o, i) => `<div class="dbopt" style="animation-delay:${i * 0.08}s">${esc(o)}</div>`).join('')}</div><p class="muted">Pick on your phone <span class="clock">${v.left}</span></p>`;
    if (v.phase === 'reveal') {
      const rk = 'r' + v.k, first = rk !== revealKey;
      if (first) { revealKey = rk; revealAt = Date.now(); revealTimers.forEach(clearTimeout); revealTimers = []; }
      const el = Date.now() - revealAt, b = beats(v.options);   // a redraw part-way through picks up where the reveal is
      side = `<p class="cat">by ${esc(v.artist)}</p><div class="dbopts">${v.options.map((o, i) => { const a = b.at[i], pts = o.real ? (o.pickers.length ? 1000 : 0) : 500 * o.pickers.length; return `<div class="dbopt beat ${o.real ? 'real' : ''}" style="--stamp:${a.stamp - el}ms">${esc(o.text)}${o.pickers.length ? `<span class="dbpick">${o.pickers.map((n, k) => `<span class="chip" style="animation-delay:${a.start + 500 + k * a.gap - el}ms">${esc(n)}</span>`).join('')}</span>` : ''}<small class="dbtag">${o.real ? 'THE REAL TITLE' : `Fake by ${o.by.map(esc).join(' & ')}`}${pts ? `<b>+${pts.toLocaleString()}${o.real && o.pickers.length > 1 ? ' each' : ''}</b>` : ''}</small></div>`; }).join('')}</div>${v.artistGain ? `<p class="dbartist" style="animation-delay:${b.total - 900 - el}ms">${esc(v.artist)}'s drawing earns <b>+${v.artistGain.toLocaleString()}</b></p>` : ''}${v.lucky.length ? `<p class="win">${v.lucky.map(esc).join(', ')} guessed the exact title!</p>` : ''}<button class="btn" data-host="next">Next drawing</button>`;
      if (first) import('../sfx.js').then(m => {
        const at = (ms, fn) => revealTimers.push(setTimeout(fn, ms));
        b.order.forEach(i => { const o = v.options[i], a = b.at[i];
          o.pickers.forEach((_, k) => at(a.start + 500 + k * a.gap, () => m.play('pop')));
          at(a.stamp, () => m.play('stamp'));
          if (o.real) { at(a.stamp + 250, () => m.play(o.pickers.length ? 'win' : 'groan')); if (o.pickers.length) at(a.stamp + 700, () => m.play('cheer')); }
          else at(a.stamp + 250, () => m.play(FOOLED_SOUNDS[fooledTurn++ % FOOLED_SOUNDS.length]));
          if (o.pickers.length) at(a.stamp + 900, () => m.play('points'));
        });
      }).catch(() => {});
    }
    h = `<p class="cat">Drawing ${v.k} of ${v.of}</p><div class="dbrow">${art}<div>${side}</div></div>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

let draft = { round: -1, text: '' };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (v.phase === 'draw' && !v.done) { mountPad(el, 'doodle:' + v.title, `<p class="muted">Draw this (shh!):</p><p class="tq small skwhat">${esc(v.title)}</p>`, send); return; }
  let h = `<p class="muted">${v.score.toLocaleString()} points</p>`;
  if (v.phase === 'draw') h += '<h2>Nice art!</h2><p class="say">Waiting for the other artists…</p>';
  else if (v.mine && v.phase !== 'reveal') h += '<h2>That\'s your drawing!</h2><p class="say">Sit back and watch them guess.</p>';
  else if (v.phase === 'fake' && v.sent) h += '<h2>Sent!</h2>';
  else if (v.phase === 'fake') { if (draft.round !== v.round) draft = { round: v.round, text: '' }; h += `<h2>Write a fake title</h2><p class="muted">Look at the TV. Make it sound like the real one!</p><form id="dbf"><input id="dbt" maxlength="45" autocomplete="off" value="${esc(draft.text)}" placeholder="A very nervous…"><p class="lose" id="err"></p><button class="btn" type="submit">Send</button></form>`; }
  else if (v.phase === 'pick' && v.lucky) h += '<h2>You wrote the real title! +500</h2><p class="say">Sit this one out.</p>';
  else if (v.phase === 'pick') h += `<h2>Which is the real title?</h2><div class="opts">${v.options.map(o => `<button class="opt ${v.picked === o.id ? 'on' : ''}" ${o.own ? 'disabled' : `data-o="${o.id}"`}>${esc(o.text)}${o.own ? ' <small class="muted">(yours)</small>' : ''}</button>`).join('')}</div>`;
  else if (v.phase === 'reveal' && !v.settled) h += '<h2>Watch the TV…</h2><p class="say">Who fooled who?</p>';
  else if (v.phase === 'reveal') h += `<h2 class="${v.right ? 'win' : ''}">${v.mine ? 'Your drawing!' : v.right ? 'You found it! +1000' : 'Fooled!'}</h2><p class="say">Real title: <b>${esc(v.title)}</b>${v.fooled ? `. You fooled ${v.fooled}! +${v.fooled * 500}` : ''}</p>`;
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  const f = el.querySelector('#dbf');
  if (f) { const inp = f.querySelector('#dbt'); inp.oninput = () => (draft.text = inp.value); f.onsubmit = e => { e.preventDefault(); const r = cleanTitle(inp.value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'fake', text: r.text }); }; }
  el.querySelectorAll('[data-o]').forEach(b => (b.onclick = () => send({ type: 'pick', id: +b.dataset.o })));
}
