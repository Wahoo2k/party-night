// Silly Story: everyone is asked for a few words (an animal, a food, a describing word…) without knowing what they
// are for. The TV then tells a story with those words dropped into the blanks. Afterwards everyone votes for the
// funniest word, and its writer scores.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'story',
  name: 'Silly Story',
  min: 2,
  max: 10,
  blurb: 'Give a few words without knowing why. Then watch the TV tell the story they ruined.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

// What each kind of blank asks for, with an example, and what is used if nobody answers in time.
export const KINDS = {
  adjective: ['A describing word', 'slimy', ['wobbly', 'sparkly', 'grumpy', 'enormous']],
  noun: ['A thing', 'toaster', ['bucket', 'umbrella', 'trampoline', 'sock']],
  plural: ['Things (more than one)', 'socks', ['pancakes', 'spoons', 'pigeons', 'shoelaces']],
  animal: ['An animal', 'llama', ['penguin', 'goat', 'walrus', 'hamster']],
  food: ['A food', 'spaghetti', ['pickles', 'waffles', 'nachos', 'broccoli']],
  place: ['A place', 'the dentist', ['the moon', 'the mall', 'a swamp', 'the attic']],
  body: ['A body part', 'elbow', ['knee', 'ear', 'big toe', 'eyebrow']],
  verb: ['An action word', 'wiggle', ['dance', 'sneeze', 'yodel', 'tiptoe']],
  ing: ['An action word ending in -ing', 'juggling', ['hopping', 'snoring', 'giggling', 'moonwalking']],
  number: ['A number', '17', ['3', '42', '900', '7']],
  color: ['A color', 'purple', ['orange', 'green', 'pink', 'gold']],
  job: ['A job', 'plumber', ['clown', 'dentist', 'pirate', 'astronaut']],
  sound: ['A silly sound', 'boing', ['honk', 'splat', 'whoosh', 'meep']],
  person: ['Someone in this room', '', ['the tallest person here', 'whoever is holding the remote']],
};

// Each story: a title and its text. {kind} marks a blank; the same kind can appear more than once (each is its own blank).
export const STORIES = [
  ['The Worst Sleepover', 'Last night {person} had a sleepover at {place}. For dinner everyone ate {adjective} {food} with a side of {plural}. At midnight a {color} {animal} knocked on the door and said "{sound}!" Nobody slept, because {person} kept {ing} until sunrise. In the morning we counted {number} missing {plural}.'],
  ['My New Pet', 'For my birthday I got a {adjective} {animal} named {person}. It only eats {food} and sleeps in a {noun}. Every morning it likes {ing} on my {body}. The vet, who is also a {job}, says it will grow to be {number} feet tall. I am going to need a bigger {noun}.'],
  ['The Big Game', 'It was the final minute and the score was {number} to {number}. {person} grabbed the {noun} and started {ing} down the field. The crowd yelled "{sound}!" and threw {plural} in the air. Then a {adjective} {animal} ran onto the grass and stole the {food} from the coach. We still won, thanks to {person}\'s lucky {body}.'],
  ['Field Trip', 'Our class took a bus to {place}. The bus driver, a retired {job}, made everyone sing about {plural}. At the gift shop {person} bought a {color} {noun} for {number} dollars. Then we had to {verb} past a very {adjective} {animal}. Best field trip ever, even though my {body} still smells like {food}.'],
  ['The Recipe', 'To make my famous {food}, start with {number} cups of {plural}. Stir with your {body} until it looks {adjective}. Add one {color} {noun} and {verb} for ten minutes. Serve it to {person} while {ing}. If it goes "{sound}", it is ready. If the {animal} will not eat it, order pizza.'],
  ['Breaking News', 'Good evening. Tonight a {adjective} {noun} was spotted {ing} above {place}. Witnesses say it was {color} and smelled like {food}. Local {job} {person} tried to catch it with {number} {plural}. "It just went {sound} and flew away," said a nearby {animal}. More at eleven.'],
  ['First Day at Work', 'Today I started my new job as a {job}. My boss, {person}, gave me a {adjective} {noun} and told me to {verb}. By lunch I had spilled {food} on {number} customers. Then the office {animal} started {ing} on my desk. I was sent home with a {color} {body} and a box of {plural}.'],
  ['The Haunted House', 'Nobody goes near the old house at {place}. They say a {adjective} {job} lives there with {number} {plural}. One night {person} went in holding only a {noun}. From the basement came a loud "{sound}!" It turned out to be a {color} {animal} {ing} in a bowl of {food}.'],
  ['Vacation Postcard', 'Dear {person}, greetings from {place}! The weather is {adjective} and the hotel pool is full of {plural}. Yesterday we went {ing} with a {job} and saw a {color} {animal}. I hurt my {body} trying to {verb}. Wish you were here. P.S. I am bringing you {number} pounds of {food}.'],
  ['The Science Fair', 'For the science fair I built a {adjective} robot out of a {noun} and {number} {plural}. When you press its {body}, it says "{sound}" and starts {ing}. The judge, a famous {job}, fed it {food} by mistake. It turned {color} and chased {person} all the way to {place}. I got second place, behind a {animal}.'],
  ['Superhero Origin', 'By day, {person} is a mild-mannered {job}. But after being bitten by a {adjective} {animal}, everything changed. Now they can {verb} faster than a speeding {noun} and shoot {plural} from their {body}. Their only weakness is {color} {food}. Their catchphrase? "{sound}!" The city of {place} is safe, {number} percent of the time.'],
  ['The Wedding', 'It was a beautiful wedding at {place}. The bride wore a {color} {noun} and the groom wore {plural}. The cake was {number} layers of {food}. During the first dance, {person} started {ing} and knocked over the {adjective} {job}. A {animal} caught the bouquet and everyone shouted "{sound}!"'],
  ['The School Play', 'This year\'s school play was about a {adjective} {animal} who wanted to be a {job}. Our star, {person}, forgot every line and just said "{sound}" instead. The scenery was made of {number} {plural} and a {color} {noun}. In the big finale everyone started {ing}, and the principal fainted into a bowl of {food}.'],
  ['Camping Trip', 'We pitched our tent near {place}. {person} packed only {plural} and one {adjective} {noun}. At night we heard a "{sound}" outside. It was a {color} {animal} {ing} in our cooler. We survived on {food} for {number} days, and my {body} has never been the same.'],
  ['The Talent Show', 'First up was {person}, who can {verb} while balancing a {noun} on their {body}. Next, a {adjective} {job} juggled {number} {plural}. The crowd shouted "{sound}!" when a {color} {animal} started {ing} on stage. The winner got a lifetime supply of {food}.'],
  ['Lost at the Mall', 'I only looked away for a second at {place}. When I turned back, {person} was {ing} in the fountain with a {adjective} {animal}. A {job} ran over waving a {color} {noun}. We were banned for {number} years, but we did get free {food} and a bag of {plural}.'],
  ['The Road Trip', 'We drove {number} miles in a {color} van that smelled like {food}. {person} would not stop {ing}. Every hour we stopped so the {animal} could {verb}. The radio only played "{sound}". When we finally reached {place}, we had lost the {noun} and gained {plural}.'],
  ['My Invention', 'I have invented a {adjective} machine that turns {plural} into {food}. You pull the {noun}, it goes "{sound}", and out comes dinner. {person} tested it and their {body} turned {color}. A {job} offered me {number} dollars for it. I said no. It is {ing} in my garage right now.'],
  ['The Birthday Party', 'For my birthday we went to {place}. The clown was really a {adjective} {job} who kept {ing}. The cake had {number} candles and tasted like {food}. {person} gave me a {color} {noun} wrapped in {plural}. Then a {animal} popped out of the piñata and yelled "{sound}!"'],
  ['Space Mission', 'Mission control, this is {person}. We have landed on a {adjective} planet made of {food}. The locals look like {color} {plural} and greet us by {ing}. Our {noun} is broken, so we will {verb} home. Tell the {job} I left {number} sandwiches in the fridge. Over and "{sound}".'],
];

export const TIMES = { fill: 70000, perLine: 3200, vote: 22000, after: 9000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
// A story's text cut into plain pieces and blanks, in order.
export function parse(text) { const out = []; let k = 0; text.split(/(\{[a-z]+\})/).forEach(p => { const m = p.match(/^\{([a-z]+)\}$/); if (m) out.push({ blank: k++, kind: m[1] }); else if (p) out.push({ text: p }); }); return out; }
const blanksOf = text => parse(text).filter(p => p.blank !== undefined);
// The story split into sentences (so the TV can tell it one line at a time), each a list of pieces.
export function lines(text) { const out = [[]]; for (const p of parse(text)) { if (p.text === undefined) { out[out.length - 1].push(p); continue; } const bits = p.text.split(/(?<=[.!?]"?)\s+(?=[A-Z"])/); bits.forEach((b, i) => { if (i) out.push([]); if (b) out[out.length - 1].push({ text: b + (i < bits.length - 1 ? ' ' : '') }); }); } return out.filter(l => l.length); }

export function cleanWord(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 24);
  if (!x) return { ok: false, why: 'Type something.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: x };
}

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const used = new Set(prev?.usedStories || []);
  let pool = STORIES.map((_, i) => i).filter(i => !used.has(i));
  const n = opts.short ? 1 : 2;
  if (pool.length < n) { used.clear(); pool = STORIES.map((_, i) => i); }
  const order = shuffle(pool, rnd).slice(0, n);
  const s = {
    game: 'story', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    order, i: 0, usedStories: [...used, ...order],
    owner: [], words: [], votes: {}, result: null, settled: false, settleAt: 0,
    phase: 'fill', deadline: Date.now() + TIMES.fill,
  };
  deal(s, rnd);
  return s;
}
const story = s => STORIES[s.order[s.i]];
// Blanks are handed round the table in turn, so everyone gets about the same number.
function deal(s, rnd) {
  const b = blanksOf(story(s)[1]), seats = shuffle(s.players.map(p => p.pid), rnd);
  s.owner = shuffle(b.map((_, k) => k), rnd).reduce((o, blank, k) => { o[blank] = seats[k % seats.length]; return o; }, []);
  s.words = b.map(() => null); s.votes = {}; s.result = null; s.settled = false;
}
const mine = (s, pid) => s.owner.map((o, k) => (o === pid ? k : -1)).filter(k => k >= 0);
const allIn = s => s.words.every(w => w !== null);

function toStory(s, now, rnd) {
  const b = blanksOf(story(s)[1]);
  s.words = s.words.map((w, k) => w ?? { text: KINDS[b[k].kind][2][Math.floor(rnd() * KINDS[b[k].kind][2].length)], auto: true });
  s.phase = 'story'; s.round++; s.deadline = now + 1500 + lines(story(s)[1]).length * TIMES.perLine + 1500;
}
function toVote(s, now) { s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote; }
function result(s, now) {
  const before = { ...s.scores }, tally = s.words.map(() => 0);
  Object.values(s.votes).forEach(k => tally[k]++);
  tally.forEach((n, k) => { if (n && !s.words[k].auto) s.scores[s.owner[k]] += n * 100; });
  s.result = { tally, before };
  s.settled = false; s.settleAt = now + 3200;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
function next(s, now, rnd) {
  if (s.i + 1 >= s.order.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.i++; deal(s, rnd); s.phase = 'fill'; s.round++; s.deadline = now + TIMES.fill;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'fill' && a.type === 'word') {
    const k = Number(a.blank);
    if (s.owner[k] !== pid || s.words[k]) return s;
    const r = cleanWord(a.text); if (!r.ok) return s;
    s.words[k] = { text: r.text };
    if (allIn(s)) toStory(s, now, rnd);
  } else if (s.phase === 'vote' && a.type === 'vote' && s.votes[pid] === undefined) {
    const k = Number(a.blank);
    if (!Number.isInteger(k) || !s.words[k] || s.owner[k] === pid) return s;
    s.votes[pid] = k;
    if (s.players.every(p => s.votes[p.pid] !== undefined)) result(s, now);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'fill') toStory(s, now, rnd);
  else if (s.phase === 'story') toVote(s, now);
  else if (s.phase === 'vote') result(s, now);
  else if (s.phase === 'result') next(s, now, rnd);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
const say = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every round

export function narration(s) {
  if (s.phase === 'fill') return s.i === 0 ? 'Welcome to Silly Story! Your phone wants a few words. Don\'t ask why.' : say(['Another story. More words, please.', 'Round two. Be even sillier.', 'New story. Same nonsense.'], s.i);
  if (s.phase === 'story') return say(['Here is the story you wrote. Read along!', 'And now, the masterpiece.', 'Settle in. Story time.'], s.i);
  if (s.phase === 'vote') return say(['Which word was the funniest? Vote on your phone.', 'Tap the word that made the story.', 'Pick your favorite word.'], s.i);
  if (s.phase === 'result') return say(['And the best words were…', 'The room has voted.', 'Those words did the heavy lifting.'], s.i);
  if (s.phase === 'over') return 'The end. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'fill') return { sound: 'join', wait: 700, title: s.i === 0 ? 'Silly Story' : 'Another Story', sub: 'Your phone wants some words' };
  if (s.phase === 'story') return { sound: 'fanfare', wait: 900, title: story(s)[0], sub: 'A story by all of you' };
  if (s.phase === 'vote') return { sound: 'vote', wait: 300 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'drumroll', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'The End', sub: `${ranking(s)[0].name} had the best words`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'fill' && v.ask) return { type: 'word', blank: v.ask.blank, text: v.ask.fill[Math.floor(rnd() * v.ask.fill.length)] };
  if (v.phase === 'vote' && v.voted === null && v.options?.length) return { type: 'vote', blank: v.options[Math.floor(rnd() * v.options.length)].blank };
  return null;
}

export function tvView(s, now = Date.now()) {
  const [title, text] = story(s);
  const v = { phase: s.phase, n: s.i + 1, of: s.order.length, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  if (s.phase === 'fill') v.players = s.players.map(p => ({ name: p.name, done: mine(s, p.pid).every(k => s.words[k]) }));
  if (['story', 'vote', 'result'].includes(s.phase)) {
    v.title = title;
    v.lines = lines(text).map(l => l.map(p => (p.text !== undefined ? { text: p.text } : { blank: p.blank, word: s.words[p.blank].text })));
  }
  if (s.phase === 'vote') { v.voted = Object.keys(s.votes).length; v.total = s.players.length; }
  if (s.phase === 'result') {
    v.settled = !!s.settled;
    v.top = s.result.tally.map((n, k) => ({ n, k })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 4).map(x => ({ blank: x.k, word: s.words[x.k].text, votes: x.n, by: s.words[x.k].auto ? null : nameOf(s, s.owner[x.k]), pts: s.words[x.k].auto ? 0 : x.n * 100 }));
    v.authors = s.words.map((w, k) => (w.auto ? null : nameOf(s, s.owner[k])));
    if (!s.settled) v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: s.result.before[p.pid] })).sort((a, b) => b.score - a.score);
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const b = blanksOf(story(s)[1]);
  const v = { phase: s.phase, n: s.i + 1, of: s.order.length, score: s.scores[pid] };
  if (s.phase === 'fill') {
    const todo = mine(s, pid).filter(k => !s.words[k]), all = mine(s, pid).length;
    v.done = all - todo.length; v.all = all;
    // One request at a time, and never the story it is for.
    if (todo.length) { const k = todo[0], kind = b[k].kind; v.ask = { blank: k, label: KINDS[kind][0], eg: KINDS[kind][1], kind }; if (String(pid).startsWith('bot-')) v.ask.fill = KINDS[kind][2]; }
  }
  if (s.phase === 'vote') { v.voted = s.votes[pid] ?? null; v.options = s.words.map((w, k) => ({ blank: k, word: w.text, mine: s.owner[k] === pid })).filter(o => !o.mine); }
  if (s.phase === 'result') { v.settled = !!s.settled; if (s.settled) { v.got = mine(s, pid).reduce((a, k) => a + (s.words[k].auto ? 0 : s.result.tally[k]), 0); v.best = mine(s, pid).filter(k => !s.words[k].auto).sort((a, c) => s.result.tally[c] - s.result.tally[a]).map(k => s.words[k].text)[0] || null; } }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- renderers ----------
let storyKey = '', storyAt = 0, storyTimers = [];
const WORDC = ['#ff4d6d', '#ff9f1c', '#06d6a0', '#4cc9f0', '#b5179e', '#4361ee'];
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'fill') {
    h = `<p class="cat">Story ${v.n} of ${v.of}</p><div class="tshead"><span class="tsmode">Silly Story</span><b>Your phone wants a few words.</b><em class="clock ${v.left <= 10 ? 'hurry' : ''}">${v.left}</em></div>
      <div class="owbig"><b>Don't ask what they are for. Just make them good.</b><span>The story comes after.</span></div>
      <div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">Tell the story</button>`;
  }
  if (v.phase === 'story' || v.phase === 'vote' || v.phase === 'result') {
    const key = 's' + v.n, first = v.phase === 'story' && key !== storyKey;
    if (first) { storyKey = key; storyAt = Date.now(); storyTimers.forEach(clearTimeout); storyTimers = []; }
    const playing = v.phase === 'story' && storyKey === key, el0 = playing ? Date.now() - storyAt : 1e7;   // a redraw part-way through carries on
    const top = v.phase === 'result' ? Object.fromEntries(v.top.map(t => [t.blank, t])) : {};
    const word = (p, at) => `<mark class="sw ${top[p.blank] ? 'top' : ''}" style="--c:${WORDC[p.blank % WORDC.length]};animation-delay:${at - el0}ms">${esc(p.word)}${v.phase === 'result' && v.settled && v.authors[p.blank] ? `<small>${esc(v.authors[p.blank])}</small>` : ''}${top[p.blank] ? `<em>❤️ ${top[p.blank].votes}</em>` : ''}</mark>`;
    const body = v.lines.map((l, i) => { const t0 = 1500 + i * 3200; let w = 0; return `<p class="sline" style="animation-delay:${t0 - el0}ms">${l.map(p => (p.text !== undefined ? esc(p.text) : word(p, t0 + 500 + (w++) * 450))).join('')}</p>`; }).join('');
    const foot = v.phase === 'story' ? '<button class="btn ghost" data-host="next">Skip to the vote</button>'
      : v.phase === 'vote' ? `<p class="tsrule"><b>Tap the funniest word on your phone.</b><span>${v.voted} of ${v.total} voted · <span class="clock">${v.left}</span></span></p><button class="btn ghost" data-host="next">Close voting</button>`
        : `<div class="stop">${v.top.map((t, k) => `<div class="pdrow ${k === 0 ? 'best' : ''}" style="animation-delay:${600 + k * 500}ms"><b>“${esc(t.word)}”</b><span>${t.by ? esc(t.by) : 'nobody (time ran out)'} · ❤️ ${t.votes}</span><em>${t.pts ? '+' + t.pts : ''}</em></div>`).join('')}</div><button class="btn" data-host="next">${v.n < v.of ? 'Next story' : 'Finish'}</button>`;
    h = `<p class="cat">Story ${v.n} of ${v.of}</p><h2 class="stitle">${esc(v.title)}</h2><div class="sbody ${playing ? 'play' : ''} n${Math.min(8, v.lines.length)}">${body}</div>${foot}`;
    if (first) import('../sfx.js').then(m => {
      const later = (ms, fn) => storyTimers.push(setTimeout(fn, ms));
      v.lines.forEach((l, i) => { let w = 0; l.forEach(p => { if (p.blank !== undefined) later(1500 + i * 3200 + 500 + (w++) * 450, () => m.play(['pop', 'stamp', 'lockin'][p.blank % 3])); }); });
      v.lines.forEach((_, i) => { if (i % 2 === 1) later(1500 + i * 3200 + 2300, () => m.play(['laugh', 'gasp', 'sting-comic'][i % 3])); });
    }).catch(() => {});
    if (v.phase === 'result' && storyKey !== key + 'r') { storyKey = key + 'r'; import('../sfx.js').then(m => { v.top.forEach((_, k) => setTimeout(() => m.play(k === 0 ? 'win' : 'points'), 600 + k * 500)); if (v.top.length) setTimeout(() => m.play('cheer'), 1100); }).catch(() => {}); }
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} had the best words!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel ts">${h}</div>${scores}</div>`;
}

let typed = { key: '', text: '' };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You had the best words!' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  if (v.phase === 'story') { el.innerHTML = '<h2>Story time 📖</h2><p class="say">Watch the TV and listen for your words.</p>'; return; }
  if (v.phase === 'result') { el.innerHTML = !v.settled ? '<h2>Watch the TV…</h2><p class="say">Whose word was the funniest?</p>' : `<h2 class="${v.got ? 'win' : ''}">${v.got ? `❤️ ${v.got} · +${v.got * 100}` : 'No votes this time'}</h2>${v.best && v.got ? `<p class="say">They loved “${esc(v.best)}”.</p>` : ''}<p class="muted">${v.score.toLocaleString()} point${v.score === 1 ? '' : 's'}</p>`; return; }
  if (v.phase === 'vote') {
    el.innerHTML = v.voted !== null ? '<h2>Vote in ❤️</h2><p class="say">Waiting for everyone else…</p>' : `<h2>Which word was funniest?</h2><p class="muted">Not your own.</p><div class="opts swopts">${v.options.map(o => `<button class="opt" data-b="${o.blank}">${esc(o.word)}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-b]').forEach(b => (b.onclick = () => send({ type: 'vote', blank: +b.dataset.b })));
    return;
  }
  if (!v.ask) { el.innerHTML = '<h2>All done 🤐</h2><p class="say">Waiting for everyone else. No hints about your words!</p>'; return; }
  const key = 'f' + v.n + '.' + v.ask.blank; if (typed.key !== key) typed = { key, text: '' };
  el.innerHTML = `<p class="muted">Word ${v.done + 1} of ${v.all}</p><h2>${esc(v.ask.label)}</h2>${v.ask.eg ? `<p class="muted">Like “${esc(v.ask.eg)}”. Anything goes, keep it clean.</p>` : '<p class="muted">Type their name.</p>'}
    <form id="swf"><input id="swi" maxlength="24" autocomplete="off" placeholder="${esc(v.ask.label)}" value="${esc(typed.text)}"><p class="lose" id="err"></p><button class="btn" type="submit">Send</button></form>`;
  const f = el.querySelector('#swf'), inp = f.querySelector('#swi'); inp.oninput = () => { typed.text = inp.value; }; inp.focus();
  f.onsubmit = e => { e.preventDefault(); const r = cleanWord(inp.value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'word', blank: v.ask.blank, text: r.text }); };
}
