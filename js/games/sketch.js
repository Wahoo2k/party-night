// Sketch Telephone: everyone writes something weird, the next person draws it, the next guesses the drawing,
// the next draws that guess... Then the TV replays every chain so you can see how it fell apart.
import { esc } from '../ui.js';
import { isRude } from '../names.js';
import { botArt } from './bot-art.js';

export const meta = {
  id: 'sketch',
  name: 'Sketch Telephone',
  min: 3,
  max: 10,
  blurb: 'Draw, guess, redraw. Watch the message fall apart.',
};

export const PROMPTS = [
  'A cat in a tuxedo', 'A snowman at the beach', 'A dog driving a car', 'A dragon eating spaghetti', 'Grandma on a skateboard', 'A shark at the dentist',
  'A haunted toaster', 'A cowboy riding a chicken', 'A robot falling in love', 'Pizza in outer space', 'A giraffe in a tiny car', 'A wizard doing laundry',
  'A penguin on vacation', 'A volcano sneezing', 'An octopus playing drums', 'A banana with a mustache', 'A pirate afraid of water', 'A cloud raining tacos',
  'A superhero stuck in traffic', 'A frog at a job interview', 'A ghost taking a selfie', 'A horse eating ice cream', 'The moon wearing sunglasses', 'A tree doing yoga',
  'A bear in a bubble bath', 'A worm with a jetpack', 'A cactus giving hugs', 'A knight fighting a vacuum', 'A sandwich running a marathon', 'An alien at a birthday party',
  'A snail in a race', 'A pig in a fancy hat', 'A burrito on a roller coaster', 'A mermaid at the gym', 'A dinosaur at the library', 'A monkey flying a plane',
  'A cow on the moon', 'A queen eating a hot dog', 'A spider knitting a sweater', 'A duck in a thunderstorm', 'A lighthouse at a party', 'A hamster lifting weights',
  'A cupcake with angry eyes', 'A whale in a bathtub', 'A sleepy sun', 'A chicken crossing a river', 'A unicorn stuck in a tree', 'A pumpkin with braces',
  'A fish riding a bicycle', 'A vampire at the beach', 'A baby running a meeting', 'A potato on a throne', 'A tornado of socks', 'A bee wearing boots',
  'A crocodile brushing its teeth', 'A rocket made of cheese', 'A cat stuck in a box', 'A mummy at the spa', 'A turtle in a hurry', 'A broccoli superhero',
  'A llama in a limousine', 'A dragon at the dentist', 'A squirrel on a surfboard', 'A ghost eating spaghetti', 'A penguin delivering pizza', 'A robot walking a dog', 'A flamingo playing soccer', 'A hot dog at the gym', 'A dinosaur on roller skates', 'A wizard at the grocery store', 'A cat conducting an orchestra', 'A shark in a swimming pool', 'A cow doing ballet', 'A snowman in a sauna', 'A raccoon in a business suit', 'A pirate at a water park', 'An owl drinking coffee', 'A moose on a trampoline', 'A zombie mowing the lawn', 'A goat on a rooftop', 'A crab getting a manicure', 'A bear at a picnic', 'A kangaroo boxing a pillow', 'A taco with sunglasses', 'A walrus on a waterslide', 'A mouse riding an elephant', 'A knight on a pogo stick', 'A parrot on a pirate\'s hat', 'An astronaut walking a cat', 'A camel in the snow',
];
export const COLORS = ['#fffdf6', '#1d1f2e', '#e2473b', '#f2a81d', '#3fa34d', '#2f6fd8', '#8a4fd1', '#8b5a2b'];
export const WIDTHS = [3, 7, 16];
export const TIMES = { write: 60000, draw: 80000, guess: 45000, text: 4500, pic: 6000, gap: 2500 };
const MAX_POINTS = 6000;
const MAX_STROKES = 400;

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function cleanText(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  if (x.length < 2) return { ok: false, why: 'Write a few words.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: x };
}

// Strokes are {c: color index, w: width index, p: [x, y, x, y, ...]} on a 0-255 square.
export function cleanStrokes(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  let total = 0;
  for (const st of list.slice(0, MAX_STROKES)) {
    if (!st || !Array.isArray(st.p)) continue;
    const c = Math.max(0, Math.min(COLORS.length - 1, st.c | 0));
    const w = Math.max(0, Math.min(WIDTHS.length - 1, st.w | 0));
    const p = st.p.slice(0, (MAX_POINTS - total) & ~1).map(n => Math.max(0, Math.min(255, Math.round(Number(n) || 0))));
    if (p.length < 2) continue;
    total += p.length;
    out.push({ c, w, p });
    if (total >= MAX_POINTS) break;
  }
  return out;
}

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const n = order.length;
  // Each player picks something and draws it themselves (two steps), then it passes along: guess, draw, guess…
  const steps = Math.max(4, Math.min(n + 1, opts.short ? 4 : 8));
  return {
    game: 'sketch',
    players: order, steps, mode: ['memory', 'ink', 'squiggle'].includes(opts.mode) ? opts.mode : 'normal',
    chains: order.map(() => []),   // chains[c][k] = {kind: 'text'|'draw', by, text | strokes}
    drafts: {},
    step: 0, phase: 'write', round: 0,
    hearts: {},                     // "c.k" -> [pids]
    show: null, showAt: 0,
    eventId: 0, last: null,
    deadline: Date.now() + TIMES.write,
  };
}

const n = s => s.players.length;
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
// Who handles chain c at step k, and which chain a player has at step k.
// The first two steps of a chain (pick it, draw it) belong to its owner; from the third step it moves one player along each step.
const hop = k => Math.max(0, k - 1);
const handler = (s, c, k) => s.players[(c + hop(k)) % n(s)].pid;
const chainFor = (s, pid, k) => { const i = s.players.findIndex(p => p.pid === pid); return ((i - hop(k)) % n(s) + n(s)) % n(s); };
// Usually it alternates: pick, draw, describe, draw… In "From memory" everything between the first drawing and the
// final guess is another drawing, copied from a few seconds' look at the one before.
const kindAt = (s, k) => (s.mode === 'memory' ? (k === 0 || k === s.steps - 1 ? 'text' : 'draw') : k % 2 === 1 ? 'draw' : 'text');
const phaseAt = (s, k) => (k === 0 ? 'write' : kindAt(s, k) === 'draw' ? 'draw' : 'guess');
const done = (s, pid) => !!s.chains[chainFor(s, pid, s.step)][s.step];

function submit(s, pid, entry) {
  const c = chainFor(s, pid, s.step);
  if (s.chains[c][s.step]) return;
  s.chains[c][s.step] = { kind: kindAt(s, s.step), by: pid, ...entry };
  delete s.drafts[pid];
}

function fillMissing(s, rnd) {
  s.players.forEach(p => {
    if (done(s, p.pid)) return;
    const d = s.drafts[p.pid];
    if (kindAt(s, s.step) === 'draw') submit(s, p.pid, { strokes: d?.strokes || [], late: !d });
    else submit(s, p.pid, { text: d?.text || (s.step === 0 ? PROMPTS[Math.floor(rnd() * PROMPTS.length)] : '(no idea!)'), late: !d });
  });
}

function advance(s, now, rnd = Math.random) {
  fillMissing(s, rnd);
  s.drafts = {};
  s.step++;
  s.round++;
  if (s.step >= s.steps) {
    s.phase = 'reveal';
    s.show = { c: 0, k: 0 };
    s.showAt = now + TIMES.text;
    s.deadline = 0;
    s.eventId++;
    return;
  }
  s.phase = phaseAt(s, s.step);
  s.deadline = now + TIMES[s.phase];
}

function nextShow(s, now) {
  const { c, k } = s.show;
  if (k + 1 < s.steps) s.show = { c, k: k + 1 };
  else if (c + 1 < n(s)) s.show = { c: c + 1, k: 0 };
  else { s.phase = 'over'; s.show = null; s.round++; return; }
  if (s.show.k === 0) s.round++;
  const e = s.chains[s.show.c][s.show.k];
  s.showAt = now + (e.kind === 'draw' ? TIMES.pic : TIMES.text) + (s.show.k === 0 ? TIMES.gap : 0);
  s.eventId++;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if ((s.phase === 'write' || s.phase === 'guess') && !done(s, pid)) {
    if (a.type === 'text') { const r = cleanText(a.text); if (r.ok) submit(s, pid, { text: r.text }); }
    if (a.type === 'draft') { const r = cleanText(a.text); if (r.ok) s.drafts[pid] = { text: r.text }; }
  }
  if (s.phase === 'draw' && !done(s, pid)) {
    if (a.type === 'draw') submit(s, pid, { strokes: cleanStrokes(a.strokes) });
    if (a.type === 'draft') s.drafts[pid] = { strokes: cleanStrokes(a.strokes) };
  }
  if (s.phase === 'reveal' && a.type === 'heart') {
    const { c, k } = a;
    if (c !== s.show.c || !(k >= 0 && k <= s.show.k)) return s;
    if (s.chains[c][k].by === pid) return s;
    const key = c + '.' + k;
    const list = s.hearts[key] || (s.hearts[key] = []);
    const i = list.indexOf(pid);
    if (i >= 0) list.splice(i, 1); else list.push(pid);
  }
  if (['write', 'draw', 'guess'].includes(s.phase) && s.players.every(p => done(s, p.pid))) advance(s, now, rnd);
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (['write', 'draw', 'guess'].includes(s.phase)) advance(s, now, rnd);
  else if (s.phase === 'reveal') nextShow(s, now);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (['write', 'draw', 'guess'].includes(s.phase) && now >= s.deadline) advance(s, now, rnd);
  else if (s.phase === 'reveal' && now >= s.showAt) nextShow(s, now);
  return s;
}

function scores(s) {
  const pts = Object.fromEntries(s.players.map(p => [p.pid, 0]));
  for (const [key, list] of Object.entries(s.hearts)) {
    const [c, k] = key.split('.').map(Number);
    const by = s.chains[c]?.[k]?.by;
    if (by in pts) pts[by] += list.length;
  }
  return s.players.map(p => ({ pid: p.pid, name: p.name, hearts: pts[p.pid] })).sort((a, b) => b.hearts - a.hearts);
}

const rot = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every time
export function narration(s) {
  if (s.phase === 'write') return 'Welcome to Sketch Telephone! Pick something to draw.';
  if (s.phase === 'draw') return s.step === 1 ? 'Now draw what you picked. No letters or numbers!' : rot(['Draw it!', 'New words. Draw what they say!', 'Draw what you see on your phone!'], s.step);
  if (s.phase === 'guess') return s.step === 2 ? 'What is that drawing? Describe it in a few words.' : rot(['Guess the drawing!', 'What is that supposed to be? Describe it.', 'Another drawing. What is it?'], s.step);
  if (s.phase === 'reveal' && s.show.c === 0 && s.show.k === 0) return `Time for the big reveal! ${nameOf(s, s.chains[0][0].by)} started with: ${s.chains[0][0].text}`;
  if (s.phase === 'over') { const top = scores(s)[0]; return top.hearts ? `${top.name} got the most hearts!` : 'What a mess. Great job, everyone!'; }
  return '';
}

export function cue(s) {
  if (s.phase === 'write') return { sound: 'join', wait: 800, title: 'Sketch Telephone', sub: 'Pick something to draw' };
  if (s.phase === 'draw') return { sound: 'vote', wait: 500, title: 'Draw it!', sub: s.step === 1 ? 'No letters, no numbers' : '' };
  if (s.phase === 'guess') return { sound: 'vote', wait: 500, title: 'What is it?', sub: 'Describe the drawing' };
  if (s.phase === 'reveal') return s.show.k === 0 && s.show.c === 0 ? { sound: 'drumroll', wait: 1800, title: 'The Big Reveal', tone: 'night' } : null;
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Most Loved', sub: scores(s)[0].name, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function cueEvent(s) {
  if (s.phase !== 'reveal' || !s.show || (s.show.c === 0 && s.show.k === 0)) return null;
  const e = s.chains[s.show.c][s.show.k];
  if (s.show.k === 0) return { id: s.eventId, sound: 'join', say: `${rot(['Next one! It started like this.', 'Here is another chain.', 'On to the next. It began like this.'], s.show.c)} ${nameOf(s, e.by)} started with: ${e.text}`, delay: 400 };
  if (e.kind === 'text') return { id: s.eventId, sound: 'safe', say: `${rot(['And somebody saw this in it.', 'Which turned into this.', 'And the guess was this.', 'Close? You decide.'], s.show.c + s.show.k)} ${nameOf(s, e.by)} guessed: ${e.text}`, delay: 300 };
  return { id: s.eventId, sound: 'tick', say: '' };
}

// ---------- bots ----------
// A starter squiggle for "Start from a squiggle": two or three loose lines, the same for everyone who gets that seed.
export function squiggle(seed) {
  let x = (seed * 9301 + 49297) % 233280; const r = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  return cleanStrokes(Array.from({ length: 2 + Math.floor(r() * 2) }, () => { const p = []; let px = 40 + r() * 176, py = 40 + r() * 176; for (let j = 0; j < 7; j++) { p.push(px, py); px = Math.max(12, Math.min(244, px + (r() - 0.5) * 90)); py = Math.max(12, Math.min(244, py + (r() - 0.5) * 90)); } return { c: 1, w: 1, p }; }));
}
export function botDoodle(rnd) {
  const strokes = [];
  const cx = 70 + rnd() * 110, cy = 70 + rnd() * 110, r = 30 + rnd() * 40;
  const ring = []; for (let a = 0; a <= 24; a++) ring.push(cx + r * Math.cos(a / 24 * Math.PI * 2), cy + r * Math.sin(a / 24 * Math.PI * 2));
  strokes.push({ c: 1 + Math.floor(rnd() * 7), w: 1, p: ring });
  strokes.push({ c: 1, w: 1, p: [cx - r / 3, cy - r / 4, cx - r / 3 + 1, cy - r / 4 + 1] }, { c: 1, w: 1, p: [cx + r / 3, cy - r / 4, cx + r / 3 + 1, cy - r / 4 + 1] });
  const smile = []; for (let a = 0; a <= 10; a++) smile.push(cx + r / 2 * Math.cos(Math.PI * (0.15 + 0.7 * a / 10)), cy + r / 2 * Math.sin(Math.PI * (0.15 + 0.7 * a / 10)));
  strokes.push({ c: 1, w: 0, p: smile });
  for (let i = 0; i < 2 + rnd() * 3; i++) { const p = []; let x = rnd() * 255, y = rnd() * 255; for (let j = 0; j < 8; j++) { x += (rnd() - 0.5) * 50; y += (rnd() - 0.5) * 50; p.push(x, y); } strokes.push({ c: Math.floor(1 + rnd() * 7), w: Math.floor(rnd() * 3), p }); }
  return cleanStrokes(strokes);
}
const twist = (t, rnd) => {
  const w = String(t || '').split(' ');
  const swap = PROMPTS[Math.floor(rnd() * PROMPTS.length)].split(' ');
  if (w.length > 2 && rnd() < 0.7) { w[w.length - 1] = swap[swap.length - 1]; return w.join(' '); }
  return swap.join(' ');
};
export function botAct(v, rnd = Math.random) {
  if (v.done) return null;
  if (v.phase === 'write') return { type: 'text', text: PROMPTS[Math.floor(rnd() * PROMPTS.length)] };
  if (v.phase === 'draw') return { type: 'draw', strokes: (v.look ? v.look : botArt(v.task, rnd)) || botDoodle(rnd) };   // from memory, a bot simply copies what it saw
  if (v.phase === 'guess') return { type: 'text', text: twist(v._a, rnd) };
  if (v.phase === 'reveal' && v.entries) {
    const e = v.entries[v.entries.length - 1];
    if (e && !e.mine && !e.hearted && rnd() < 0.3) return { type: 'heart', c: v.c, k: e.k };
  }
  return null;
}

// ---------- views ----------
function showList(s) {
  const { c, k } = s.show;
  return s.chains[c].slice(0, k + 1).map((e, i) => ({ k: i, kind: e.kind, name: nameOf(s, e.by), by: e.by, text: e.text, strokes: e.strokes, late: !!e.late, hearts: (s.hearts[c + '.' + i] || []).length }));
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, step: s.step, steps: s.steps, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (['write', 'draw', 'guess'].includes(s.phase)) v.players = s.players.map(p => ({ name: p.name, done: done(s, p.pid) }));
  if (s.phase === 'reveal') { v.c = s.show.c; v.chains = n(s); v.owner = nameOf(s, s.chains[s.show.c][0].by); v.entries = showList(s).map(({ by, ...e }) => e); v.len = s.chains[s.show.c].length; }
  if (s.phase === 'over') {
    v.scores = scores(s);
    let best = null;
    for (const [key, list] of Object.entries(s.hearts)) { const [c, k] = key.split('.').map(Number); const e = s.chains[c][k]; if (list.length && (!best || list.length > best.hearts) && e.kind === 'draw') best = { hearts: list.length, strokes: e.strokes, name: nameOf(s, e.by), from: s.chains[c][k - 1]?.text }; }
    v.best = best;
  }
  return v;
}

export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const bot = String(pid).startsWith('bot-');
  const v = { phase: s.phase, step: s.step, steps: s.steps };
  if (['write', 'draw', 'guess'].includes(s.phase)) {
    v.done = done(s, pid);
    if (v.done) return v;   // keep the view still while others finish
    const c = chainFor(s, pid, s.step);
    const prev = s.chains[c][s.step - 1];
    if (s.phase === 'draw') {
      if (prev.kind === 'draw') v.look = prev.strokes; else v.task = prev.text;   // from memory: a short look at the last drawing instead of words
      if (s.mode === 'ink') v.ink = true;
      if (s.mode === 'squiggle') v.start = squiggle(c * 31 + s.step);
    }
    if (s.phase === 'guess') { v.strokes = prev.strokes; if (bot) v._a = s.chains[c].find(e => e?.kind === 'text')?.text; }
  }
  if (s.phase === 'reveal') {
    v.c = s.show.c;
    v.owner = nameOf(s, s.chains[s.show.c][0].by);
    v.entries = showList(s).map(e => ({ k: e.k, kind: e.kind, name: e.name, text: e.text, mine: e.by === pid, hearted: (s.hearts[s.show.c + '.' + e.k] || []).includes(pid) }));
  }
  if (s.phase === 'over') { const sc = scores(s); v.place = sc.findIndex(x => x.pid === pid) + 1; v.hearts = sc.find(x => x.pid === pid).hearts; v.mine = s.chains.flat().find(e => e && e.kind === 'draw' && e.by === pid)?.strokes || null; v.chain = (s.chains.find(c => c[0]?.by === pid) || []).filter(Boolean).map(e => ({ kind: e.kind, text: e.text || '', strokes: e.strokes || null, name: nameOf(s, e.by) })); }
  return v;
}

// ---------- drawing ----------
// animate = true redraws the picture stroke by stroke, in the order it was drawn (about 4 seconds at most).
export function svgFor(strokes, cls = '', animate = false) {
  const list = strokes || [];
  const per = Math.min(0.4, 4 / Math.max(1, list.length));
  const paths = list.map((st, i) => {
    const p = st.p;
    let d = `M${p[0]} ${p[1]}`;
    for (let i = 2; i < p.length; i += 2) d += `L${p[i]} ${p[i + 1]}`;
    if (p.length === 2) d += `L${p[0] + 0.1} ${p[1]}`;
    return `<path d="${d}" stroke="${COLORS[st.c] || COLORS[1]}" stroke-width="${WIDTHS[st.w] || 7}"${animate ? ` pathLength="1" style="animation-duration:${per.toFixed(2)}s;animation-delay:${(i * per).toFixed(2)}s"` : ''}/>`;
  }).join('');
  return `<svg class="sk ${cls} ${animate ? 'anim' : ''}" viewBox="0 0 256 256" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect width="256" height="256" fill="${COLORS[0]}"/>${paths}</svg>`;
}

// ---------- renderers ----------
const clock = left => `<p class="clock ${left <= 10 ? 'hurry' : ''}">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</p>`;
// The ideas offered on a phone stay the same while that screen is up (a redraw must not reshuffle them).
let ideas = { key: '', list: [] };
function ideasFor(key) { if (ideas.key !== key || !ideas.list.length) { const pool = [...PROMPTS]; ideas = { key, list: Array.from({ length: 3 }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]) }; } return ideas.list; }
const TV_TITLES = { write: 'Pick something to draw', draw: 'Draw it!', guess: 'What is that drawing?' };
let drawnKey = '';   // which drawing has already had its stroke-by-stroke replay
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'over');
  const nowKey = v.phase === 'reveal' ? `${v.c}.${v.entries.length}` : '';
  const replay = nowKey !== drawnKey;
  drawnKey = nowKey;
  let h = '';
  if (['write', 'draw', 'guess'].includes(v.phase)) {
    h = `<p class="cat">Step ${v.step + 1} of ${v.steps}</p><h2>${TV_TITLES[v.phase]}</h2><p class="say">${v.phase === 'write' ? 'Choose one of the ideas on your phone, or write your own. You draw it next.' : v.phase === 'draw' ? 'Check your phone. No letters or numbers in the picture!' : 'Describe the drawing on your phone in a few words.'}</p>${clock(v.left)}
      <div class="roster">${v.players.map(p => `<div class="chip ${p.done ? 'skdone' : ''}">${p.done ? '✓ ' : '✏️ '}${esc(p.name)}</div>`).join('')}</div><button class="btn ghost" data-host="next">Move on</button>`;
    h += `<div class="how"><h3>How it works</h3><ol><li>Everyone picks something and draws it.</li><li>The next person guesses what the drawing is.</li><li>The next person draws that guess… and so on.</li><li>At the end, the TV replays how each one fell apart. Tap ❤️ for your favorites.</li></ol></div>`;
  }
  if (v.phase === 'reveal') {
    h = `<p class="cat">Chain ${v.c + 1} of ${v.chains} · started by ${esc(v.owner)}</p><div class="chainrow">${v.entries.map((e, i) => `<div class="link ${i === v.entries.length - 1 ? 'newest' : ''} ${e.kind}">${e.kind === 'draw' ? svgFor(e.strokes, '', replay && i === v.entries.length - 1) : `<div class="sktext">${esc(e.text)}</div>`}<small>${e.kind === 'draw' ? 'drawn' : i === 0 ? 'picked' : 'guessed'} by <b>${esc(e.name)}</b>${e.late ? ' (ran out of time)' : ''}${e.hearts ? ` · ❤️ ${e.hearts}` : ''}</small></div>`).concat(Array.from({ length: Math.max(0, (v.len || 0) - v.entries.length) }, () => '<div class="link slot"><div class="sktext">&nbsp;</div><small>&nbsp;</small></div>')).join('<span class="arrow">→</span>')}</div><p class="muted center">Tap ❤️ on your phone for your favorites</p><button class="btn ghost" data-host="next">Next</button>`;
  }
  if (v.phase === 'over') {
    h = `<h2 class="win">${v.scores[0].hearts ? `${esc(v.scores[0].name)} is the most loved artist!` : 'What a masterpiece of chaos!'}</h2>${v.best ? `<div class="skbest">${svgFor(v.best.strokes)}<div><p class="cat">Most loved drawing</p><p class="say">${v.best.from ? `“${esc(v.best.from)}”` : ''}</p><p>by <b>${esc(v.best.name)}</b> · ❤️ ${v.best.hearts}</p></div></div>` : ''}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  }
  const side = v.scores ? `<div class="scores"><h3>Hearts</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>❤️ ${p.hearts}</b></div>`).join('')}</div>` : '';
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''} ${side ? '' : 'solo'}"><div class="panel">${h}</div>${side}</div>`;
}

const LOOK_MS = 7000;
let look = { key: '', until: 0, timer: 0 };
// The canvas keeps its strokes across redraws, keyed to the step.
let pad = { key: '', strokes: [], c: 1, w: 1 };
let words = { key: '', text: '' };
let draftTimer = null;

export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (['write', 'draw', 'guess'].includes(v.phase) && v.done) { el.innerHTML = `<p class="muted">Step ${v.step + 1} of ${v.steps}</p><h2>Sent!</h2><p class="say">Waiting for everyone else…</p>`; return; }
  const key = v.step + ':' + (v.task || '') + (v.strokes ? v.strokes.length : '');
  if (v.phase === 'write' || v.phase === 'guess') {
    if (words.key !== key) words = { key, text: '' };
    el.innerHTML = `<p class="muted">Step ${v.step + 1} of ${v.steps}</p>${v.phase === 'write' ? `<h2>Pick something to draw</h2><p class="muted">You draw it next. Then it gets passed along.</p><div class="opts" id="ideas">${ideasFor(key).map(t => `<button class="opt" type="button" data-idea="${esc(t)}">${esc(t)}</button>`).join('')}</div><p class="muted small">Or write your own:</p>` : `<h2>What is this?</h2>${svgFor(v.strokes, 'phone')}`}
      <form id="skf"><input id="skt" maxlength="50" autocomplete="off" placeholder="${v.phase === 'write' ? 'A cat in a tuxedo…' : 'Describe it in a few words'}" value="${esc(words.text)}"><p class="lose" id="err"></p><div class="row">${v.phase === 'write' ? '<button class="btn ghost" type="button" id="help">🎲 Other ideas</button>' : ''}<button class="btn" type="submit">Send</button></div></form>`;
    const f = el.querySelector('#skf'), inp = f.querySelector('#skt');
    const keep = () => { words.text = inp.value; clearTimeout(draftTimer); draftTimer = setTimeout(() => { if (inp.value.trim().length > 1) send({ type: 'draft', text: inp.value }); }, 1200); };
    inp.oninput = keep;
    const help = f.querySelector('#help');
    // Three ideas to tap; "Other ideas" deals three more. Tapping one sends it straight away.
    const wire = () => el.querySelectorAll('[data-idea]').forEach(b => (b.onclick = () => { clearTimeout(draftTimer); el.querySelectorAll('[data-idea]').forEach(x => (x.disabled = true)); send({ type: 'text', text: b.dataset.idea }); }));
    wire();
    if (help) help.onclick = () => { ideas = { key: '', list: [] }; const box = el.querySelector('#ideas'); if (box) { box.innerHTML = ideasFor(key).map(t => `<button class="opt" type="button" data-idea="${esc(t)}">${esc(t)}</button>`).join(''); wire(); } };
    f.onsubmit = e => { e.preventDefault(); const r = cleanText(inp.value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } clearTimeout(draftTimer); f.querySelector('[type=submit]').disabled = true; send({ type: 'text', text: r.text }); };
    return;
  }
  if (v.phase === 'draw') {
    // From memory: a few seconds to study the last drawing, then it is gone.
    if (v.look) {
      if (look.key !== key) look = { key, until: Date.now() + LOOK_MS };
      const left = look.until - Date.now();
      if (left > 0) { el.innerHTML = `<p class="muted">Step ${v.step + 1} of ${v.steps}</p><h2>Study this. It disappears in a moment.</h2><div class="mydraw">${svgFor(v.look)}</div>`; clearTimeout(look.timer); look.timer = setTimeout(() => renderPhone(v, el, send), left + 30); return; }
    }
    const what = v.look ? '<p class="tq small skwhat">Draw what you just saw, from memory</p>' : `<p class="tq small skwhat">${esc(v.task)}</p>`;
    mountPad(el, key, `<p class="muted">Step ${v.step + 1} of ${v.steps} · ${v.look ? 'no peeking' : 'draw this'}${v.ink ? ' · invisible ink: your lines vanish!' : ''}${v.start ? ' · use the squiggle in your drawing' : ''}:</p>${what}`, send, { ink: v.ink, start: v.start });
    return;
  }
  if (v.phase === 'reveal') {
    el.innerHTML = `<p class="muted">Chain started by <b>${esc(v.owner)}</b></p><h2>Watch the TV!</h2><p class="muted">Tap ❤️ for the ones you love:</p><div class="opts">${v.entries.map(e => `<button class="opt ${e.hearted ? 'on' : ''}" data-k="${e.k}" ${e.mine ? 'disabled' : ''}>${e.kind === 'draw' ? `🎨 ${esc(e.name)}'s drawing` : `“${esc(e.text)}” <small class="muted">${esc(e.name)}</small>`} ${e.mine ? '<small class="muted">(yours)</small>' : e.hearted ? '❤️' : '🤍'}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-k]').forEach(b => (b.onclick = () => send({ type: 'heart', c: v.c, k: Number(b.dataset.k) })));
    return;
  }
  if (v.phase === 'over') el.innerHTML = `<h2 class="${v.place === 1 && v.hearts ? 'win' : ''}">${v.place === 1 && v.hearts ? 'Most loved!' : 'Thanks for playing!'}</h2><p class="say">You got ❤️ ${v.hearts}.</p>${v.mine ? `<div class="mydraw">${svgFor(v.mine)}</div><button class="btn ghost" id="savedraw">Save my drawing</button>` : ''}${v.chain?.length > 1 ? '<button class="btn ghost" id="savechain">Save my whole chain</button>' : ''}`;
  el.querySelector('#savechain')?.addEventListener('click', () => saveChain(v.chain));
  el.querySelector('#savedraw')?.addEventListener('click', () => savePng(el.querySelector('.mydraw svg')));
}

// A drawing pad on the phone: colors, eraser, sizes, undo, clear. Sends 'draft' while drawing and 'draw' on Done.
// Strokes survive redraws as long as the key stays the same.
// opts: live (ms: send the drawing this often while drawing, and no Done button), ink (lines vanish once drawn),
// start (strokes already on the page).
export function mountPad(el, key, header, send, opts = {}) {
  if (pad.key !== key) pad = { key, strokes: (opts.start || []).map(st => ({ ...st, p: [...st.p] })), c: pad.c || 1, w: pad.w ?? 1 };
  el.innerHTML = `${header}
    <canvas id="skc" width="512" height="512"></canvas>
    <div class="sktools"><div class="skcolors">${COLORS.slice(1).map((c, i) => `<button class="skc ${pad.c === i + 1 ? 'on' : ''}" data-c="${i + 1}" style="--c:${c}" aria-label="color ${i + 1}"></button>`).join('')}<button class="skc eraser ${pad.c === 0 ? 'on' : ''}" data-c="0" aria-label="eraser">⌫</button></div>
    <div class="skwidths">${WIDTHS.map((w, i) => `<button class="skw ${pad.w === i ? 'on' : ''}" data-w="${i}" aria-label="size ${i + 1}"><span style="width:${w + 3}px;height:${w + 3}px"></span></button>`).join('')}<button class="btn ghost small" id="undo">↶ Undo</button><button class="btn ghost small" id="clear">Clear</button></div></div>
    ${opts.live ? '' : '<button class="btn" id="skdone">Done</button>'}`;
  const cv = el.querySelector('#skc'), ctx = cv.getContext('2d');
  const paint = () => {
    ctx.fillStyle = COLORS[0]; ctx.fillRect(0, 0, 512, 512);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const fixed = opts.start?.length || 0;
    for (const [i, st] of pad.strokes.entries()) {
      if (opts.ink && i >= fixed && st !== cur) continue;   // invisible ink: only the line under your finger shows
      ctx.strokeStyle = COLORS[st.c]; ctx.lineWidth = WIDTHS[st.w] * 2;
      ctx.beginPath(); ctx.moveTo(st.p[0] * 2, st.p[1] * 2);
      for (let i = 2; i < st.p.length; i += 2) ctx.lineTo(st.p[i] * 2, st.p[i + 1] * 2);
      if (st.p.length === 2) ctx.lineTo(st.p[0] * 2 + 0.2, st.p[1] * 2);
      ctx.stroke();
    }
  };
  let cur = null;
  paint();
  let lastLive = 0;
  const draft = () => { clearTimeout(draftTimer); draftTimer = setTimeout(() => send({ type: 'draft', strokes: pad.strokes }), opts.live ? 60 : 1500); };
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(255, Math.round((e.clientX - r.left) / r.width * 256))), Math.max(0, Math.min(255, Math.round((e.clientY - r.top) / r.height * 256)))]; };
  cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = { c: pad.c, w: pad.c === 0 ? 2 : pad.w, p: pt(e) }; pad.strokes.push(cur); paint(); };
  cv.onpointermove = e => {
    if (!cur) return;
    const [x, y] = pt(e), n2 = cur.p.length;
    if (Math.hypot(x - cur.p[n2 - 2], y - cur.p[n2 - 1]) < 2) return;
    cur.p.push(x, y);
    ctx.strokeStyle = COLORS[cur.c]; ctx.lineWidth = WIDTHS[cur.w] * 2;
    ctx.beginPath(); ctx.moveTo(cur.p[n2 - 2] * 2, cur.p[n2 - 1] * 2); ctx.lineTo(x * 2, y * 2); ctx.stroke();
    if (opts.live && Date.now() - lastLive > opts.live) { lastLive = Date.now(); send({ type: 'draft', strokes: pad.strokes }); }
  };
  cv.onpointerup = cv.onpointercancel = () => { if (cur) { cur = null; if (opts.ink) paint(); draft(); } };
  el.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => { pad.c = Number(b.dataset.c); el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); }));
  el.querySelectorAll('[data-w]').forEach(b => (b.onclick = () => { pad.w = Number(b.dataset.w); if (pad.c === 0) pad.c = 1; el.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', x === b)); el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', Number(x.dataset.c) === pad.c)); }));
  el.querySelector('#undo').onclick = () => { if (pad.strokes.length > (opts.start?.length || 0)) pad.strokes.pop(); paint(); draft(); };
  const clr = el.querySelector('#clear');
  clr.onclick = () => { if (clr.dataset.sure) { pad.strokes = pad.strokes.slice(0, opts.start?.length || 0); paint(); draft(); clr.textContent = 'Clear'; delete clr.dataset.sure; } else { clr.dataset.sure = 1; clr.textContent = 'Sure?'; setTimeout(() => { clr.textContent = 'Clear'; delete clr.dataset.sure; }, 2500); } };
  if (!opts.live) el.querySelector('#skdone').onclick = e => { clearTimeout(draftTimer); e.target.disabled = true; send({ type: 'draw', strokes: pad.strokes }); };
}

// Turn a drawing into a PNG the player can keep.
function savePng(svg) {
  if (!svg) return;
  const xml = new XMLSerializer().serializeToString(svg), img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 900;
    const g = c.getContext('2d'); g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 900, 900); g.drawImage(img, 0, 0, 900, 900);
    const a = document.createElement('a'); a.download = 'party-night-drawing.png'; a.href = c.toDataURL('image/png'); document.body.append(a); a.click(); a.remove();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml.includes('xmlns=') ? xml : xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
}

// The whole chain as one tall picture: what was written, how it was drawn, what it was guessed as, and so on.
async function saveChain(chain) {
  const W = 700, ROW = { text: 110, draw: 560 };
  const H = 90 + chain.reduce((n, e) => n + ROW[e.kind === 'draw' ? 'draw' : 'text'], 0);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = '#0e1230'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#f4e9c1'; g.font = 'bold 34px sans-serif'; g.fillText('Party Night · Sketch Telephone', 30, 56);
  let y = 90;
  for (const e of chain) {
    g.fillStyle = '#aab'; g.font = '20px sans-serif'; g.fillText(`${e.kind === 'draw' ? 'drawn' : 'written'} by ${e.name}`, 30, y + 26);
    if (e.kind === 'draw') {
      const holder = document.createElement('div'); holder.innerHTML = svgFor(e.strokes);
      const xml = new XMLSerializer().serializeToString(holder.firstElementChild);
      await new Promise(done => { const img = new Image(); img.onload = () => { g.drawImage(img, 100, y + 40, 500, 500); done(); }; img.onerror = done; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml.includes('xmlns=') ? xml : xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')); });
    } else { g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(`“${e.text.slice(0, 40)}”`, 30, y + 70); }
    y += ROW[e.kind === 'draw' ? 'draw' : 'text'];
  }
  const a = document.createElement('a'); a.download = 'party-night-chain.png'; a.href = c.toDataURL('image/png'); document.body.append(a); a.click(); a.remove();
}

meta.options = [{ id: 'mode', name: 'Twist', choices: [['normal', 'none'], ['memory', 'redraw from memory'], ['ink', 'invisible ink'], ['squiggle', 'start from a squiggle']] }];
