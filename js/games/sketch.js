// Sketch Telephone: everyone writes something weird, the next person draws it, the next guesses the drawing,
// the next draws that guess... Then the TV replays every chain so you can see how it fell apart.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

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

export function setup(players, rnd = Math.random) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const n = order.length;
  const steps = Math.max(3, Math.min(n, 8));
  return {
    game: 'sketch',
    players: order, steps,
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
const handler = (s, c, k) => s.players[(c + k) % n(s)].pid;
const chainFor = (s, pid, k) => { const i = s.players.findIndex(p => p.pid === pid); return ((i - k) % n(s) + n(s)) % n(s); };
const kindAt = k => (k % 2 === 1 ? 'draw' : 'text');
const phaseAt = k => (k === 0 ? 'write' : k % 2 === 1 ? 'draw' : 'guess');
const done = (s, pid) => !!s.chains[chainFor(s, pid, s.step)][s.step];

function submit(s, pid, entry) {
  const c = chainFor(s, pid, s.step);
  if (s.chains[c][s.step]) return;
  s.chains[c][s.step] = { kind: kindAt(s.step), by: pid, ...entry };
  delete s.drafts[pid];
}

function fillMissing(s, rnd) {
  s.players.forEach(p => {
    if (done(s, p.pid)) return;
    const d = s.drafts[p.pid];
    if (kindAt(s.step) === 'draw') submit(s, p.pid, { strokes: d?.strokes || [], late: !d });
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
  s.phase = phaseAt(s.step);
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

export function narration(s) {
  if (s.phase === 'write') return 'Welcome to Sketch Telephone! Write something weird for the next person to draw.';
  if (s.phase === 'draw') return s.step === 1 ? 'Now draw what you were given. No letters or numbers!' : 'Draw it!';
  if (s.phase === 'guess') return s.step === 2 ? 'What is that drawing? Describe it in a few words.' : 'Guess the drawing!';
  if (s.phase === 'reveal' && s.show.c === 0 && s.show.k === 0) return `Time for the big reveal! ${nameOf(s, s.chains[0][0].by)} started with: ${s.chains[0][0].text}`;
  if (s.phase === 'over') { const top = scores(s)[0]; return top.hearts ? `${top.name} got the most hearts!` : 'What a mess. Great job, everyone!'; }
  return '';
}

export function cue(s) {
  if (s.phase === 'write') return { sound: 'join', wait: 800, title: 'Sketch Telephone', sub: 'Write something weird' };
  if (s.phase === 'draw') return { sound: 'vote', wait: 500, title: 'Draw it!', sub: s.step === 1 ? 'No letters, no numbers' : '' };
  if (s.phase === 'guess') return { sound: 'vote', wait: 500, title: 'What is it?', sub: 'Describe the drawing' };
  if (s.phase === 'reveal') return s.show.k === 0 && s.show.c === 0 ? { sound: 'drumroll', wait: 1800, title: 'The Big Reveal', tone: 'night' } : null;
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Most Loved', sub: scores(s)[0].name, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function cueEvent(s) {
  if (s.phase !== 'reveal' || !s.show || (s.show.c === 0 && s.show.k === 0)) return null;
  const e = s.chains[s.show.c][s.show.k];
  if (s.show.k === 0) return { id: s.eventId, sound: 'join', say: `${nameOf(s, e.by)} started with: ${e.text}`, delay: 400 };
  if (e.kind === 'text') return { id: s.eventId, sound: 'safe', say: `${nameOf(s, e.by)} guessed: ${e.text}`, delay: 300 };
  return { id: s.eventId, sound: 'tick', say: '' };
}

// ---------- bots ----------
function botDoodle(rnd) {
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
  if (v.phase === 'draw') return { type: 'draw', strokes: botDoodle(rnd) };
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
  if (s.phase === 'reveal') { v.c = s.show.c; v.chains = n(s); v.owner = nameOf(s, s.chains[s.show.c][0].by); v.entries = showList(s).map(({ by, ...e }) => e); }
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
    if (s.phase === 'draw') v.task = prev.text;
    if (s.phase === 'guess') { v.strokes = prev.strokes; if (bot) v._a = s.chains[c][s.step - 2]?.text; }
  }
  if (s.phase === 'reveal') {
    v.c = s.show.c;
    v.owner = nameOf(s, s.chains[s.show.c][0].by);
    v.entries = showList(s).map(e => ({ k: e.k, kind: e.kind, name: e.name, text: e.text, mine: e.by === pid, hearted: (s.hearts[s.show.c + '.' + e.k] || []).includes(pid) }));
  }
  if (s.phase === 'over') { const sc = scores(s); v.place = sc.findIndex(x => x.pid === pid) + 1; v.hearts = sc.find(x => x.pid === pid).hearts; }
  return v;
}

// ---------- drawing ----------
export function svgFor(strokes, cls = '') {
  const paths = (strokes || []).map(st => {
    const p = st.p;
    let d = `M${p[0]} ${p[1]}`;
    for (let i = 2; i < p.length; i += 2) d += `L${p[i]} ${p[i + 1]}`;
    if (p.length === 2) d += `L${p[0] + 0.1} ${p[1]}`;
    return `<path d="${d}" stroke="${COLORS[st.c] || COLORS[1]}" stroke-width="${WIDTHS[st.w] || 7}"/>`;
  }).join('');
  return `<svg class="sk ${cls}" viewBox="0 0 256 256" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect width="256" height="256" fill="${COLORS[0]}"/>${paths}</svg>`;
}

// ---------- renderers ----------
const clock = left => `<p class="clock ${left <= 10 ? 'hurry' : ''}">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</p>`;
const TV_TITLES = { write: 'Write something weird', draw: 'Draw what you were given', guess: 'What is that drawing?' };
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'over');
  let h = '';
  if (['write', 'draw', 'guess'].includes(v.phase)) {
    h = `<p class="cat">Step ${v.step + 1} of ${v.steps}</p><h2>${TV_TITLES[v.phase]}</h2><p class="say">${v.phase === 'write' ? 'A thing, a scene, a silly idea. Stuck? Tap "Help me" for one.' : v.phase === 'draw' ? 'Check your phone. No letters or numbers in the picture!' : 'Describe the drawing on your phone in a few words.'}</p>${clock(v.left)}
      <div class="roster">${v.players.map(p => `<div class="chip ${p.done ? 'skdone' : ''}">${p.done ? '✓ ' : '✏️ '}${esc(p.name)}</div>`).join('')}</div><button class="btn ghost" data-host="next">Move on</button>`;
    h += `<div class="how"><h3>How it works</h3><ol><li>Everyone writes something.</li><li>The next person draws it.</li><li>The next person guesses the drawing.</li><li>Then it's drawn again… and again.</li><li>At the end, the TV replays how each one fell apart. Tap ❤️ for your favorites.</li></ol></div>`;
  }
  if (v.phase === 'reveal') {
    h = `<p class="cat">Chain ${v.c + 1} of ${v.chains} · started by ${esc(v.owner)}</p><div class="chainrow">${v.entries.map((e, i) => `<div class="link ${i === v.entries.length - 1 ? 'newest' : ''} ${e.kind}">${e.kind === 'draw' ? svgFor(e.strokes) : `<div class="sktext">${esc(e.text)}</div>`}<small>${e.kind === 'draw' ? 'drawn' : i === 0 ? 'written' : 'guessed'} by <b>${esc(e.name)}</b>${e.late ? ' (ran out of time)' : ''}${e.hearts ? ` · ❤️ ${e.hearts}` : ''}</small></div>`).join('<span class="arrow">→</span>')}</div><p class="muted center">Tap ❤️ on your phone for your favorites</p><button class="btn ghost" data-host="next">Next</button>`;
  }
  if (v.phase === 'over') {
    h = `<h2 class="win">${v.scores[0].hearts ? `${esc(v.scores[0].name)} is the most loved artist!` : 'What a masterpiece of chaos!'}</h2>${v.best ? `<div class="skbest">${svgFor(v.best.strokes)}<div><p class="cat">Most loved drawing</p><p class="say">${v.best.from ? `“${esc(v.best.from)}”` : ''}</p><p>by <b>${esc(v.best.name)}</b> · ❤️ ${v.best.hearts}</p></div></div>` : ''}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  }
  const side = v.scores ? `<div class="scores"><h3>Hearts</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>❤️ ${p.hearts}</b></div>`).join('')}</div>` : '';
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''} ${side ? '' : 'solo'}"><div class="panel">${h}</div>${side}</div>`;
}

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
    el.innerHTML = `<p class="muted">Step ${v.step + 1} of ${v.steps}</p>${v.phase === 'write' ? '<h2>Write something weird</h2><p class="muted">Someone will have to draw it!</p>' : `<h2>What is this?</h2>${svgFor(v.strokes, 'phone')}`}
      <form id="skf"><input id="skt" maxlength="50" autocomplete="off" placeholder="${v.phase === 'write' ? 'A cat in a tuxedo…' : 'Describe it in a few words'}" value="${esc(words.text)}"><p class="lose" id="err"></p><div class="row">${v.phase === 'write' ? '<button class="btn ghost" type="button" id="help">🎲 Help me</button>' : ''}<button class="btn" type="submit">Send</button></div></form>`;
    const f = el.querySelector('#skf'), inp = f.querySelector('#skt');
    const keep = () => { words.text = inp.value; clearTimeout(draftTimer); draftTimer = setTimeout(() => { if (inp.value.trim().length > 1) send({ type: 'draft', text: inp.value }); }, 1200); };
    inp.oninput = keep;
    const help = f.querySelector('#help');
    if (help) help.onclick = () => { inp.value = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]; keep(); };
    f.onsubmit = e => { e.preventDefault(); const r = cleanText(inp.value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } clearTimeout(draftTimer); f.querySelector('[type=submit]').disabled = true; send({ type: 'text', text: r.text }); };
    return;
  }
  if (v.phase === 'draw') {
    if (pad.key !== key) pad = { key, strokes: [], c: pad.c || 1, w: pad.w ?? 1 };
    el.innerHTML = `<p class="muted">Step ${v.step + 1} of ${v.steps} · draw this:</p><p class="tq small skwhat">${esc(v.task)}</p>
      <canvas id="skc" width="512" height="512"></canvas>
      <div class="sktools"><div class="skcolors">${COLORS.slice(1).map((c, i) => `<button class="skc ${pad.c === i + 1 ? 'on' : ''}" data-c="${i + 1}" style="--c:${c}" aria-label="color ${i + 1}"></button>`).join('')}<button class="skc eraser ${pad.c === 0 ? 'on' : ''}" data-c="0" aria-label="eraser">⌫</button></div>
      <div class="skwidths">${WIDTHS.map((w, i) => `<button class="skw ${pad.w === i ? 'on' : ''}" data-w="${i}" aria-label="size ${i + 1}"><span style="width:${w + 3}px;height:${w + 3}px"></span></button>`).join('')}<button class="btn ghost small" id="undo">↶ Undo</button><button class="btn ghost small" id="clear">Clear</button></div></div>
      <button class="btn" id="skdone">Done</button>`;
    const cv = el.querySelector('#skc'), ctx = cv.getContext('2d');
    const paint = () => {
      ctx.fillStyle = COLORS[0]; ctx.fillRect(0, 0, 512, 512);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const st of pad.strokes) {
        ctx.strokeStyle = COLORS[st.c]; ctx.lineWidth = WIDTHS[st.w] * 2;
        ctx.beginPath(); ctx.moveTo(st.p[0] * 2, st.p[1] * 2);
        for (let i = 2; i < st.p.length; i += 2) ctx.lineTo(st.p[i] * 2, st.p[i + 1] * 2);
        if (st.p.length === 2) ctx.lineTo(st.p[0] * 2 + 0.2, st.p[1] * 2);
        ctx.stroke();
      }
    };
    paint();
    const draft = () => { clearTimeout(draftTimer); draftTimer = setTimeout(() => send({ type: 'draft', strokes: pad.strokes }), 1500); };
    const pt = e => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(255, Math.round((e.clientX - r.left) / r.width * 256))), Math.max(0, Math.min(255, Math.round((e.clientY - r.top) / r.height * 256)))]; };
    let cur = null;
    cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = { c: pad.c, w: pad.c === 0 ? 2 : pad.w, p: pt(e) }; pad.strokes.push(cur); paint(); };
    cv.onpointermove = e => {
      if (!cur) return;
      const [x, y] = pt(e), n2 = cur.p.length;
      if (Math.hypot(x - cur.p[n2 - 2], y - cur.p[n2 - 1]) < 2) return;
      cur.p.push(x, y);
      ctx.strokeStyle = COLORS[cur.c]; ctx.lineWidth = WIDTHS[cur.w] * 2;
      ctx.beginPath(); ctx.moveTo(cur.p[n2 - 2] * 2, cur.p[n2 - 1] * 2); ctx.lineTo(x * 2, y * 2); ctx.stroke();
    };
    cv.onpointerup = cv.onpointercancel = () => { if (cur) { cur = null; draft(); } };
    el.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => { pad.c = Number(b.dataset.c); el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); }));
    el.querySelectorAll('[data-w]').forEach(b => (b.onclick = () => { pad.w = Number(b.dataset.w); if (pad.c === 0) pad.c = 1; el.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', x === b)); el.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', Number(x.dataset.c) === pad.c)); }));
    el.querySelector('#undo').onclick = () => { pad.strokes.pop(); paint(); draft(); };
    const clr = el.querySelector('#clear');
    clr.onclick = () => { if (clr.dataset.sure) { pad.strokes = []; paint(); draft(); clr.textContent = 'Clear'; delete clr.dataset.sure; } else { clr.dataset.sure = 1; clr.textContent = 'Sure?'; setTimeout(() => { clr.textContent = 'Clear'; delete clr.dataset.sure; }, 2500); } };
    el.querySelector('#skdone').onclick = e => { clearTimeout(draftTimer); e.target.disabled = true; send({ type: 'draw', strokes: pad.strokes }); };
    return;
  }
  if (v.phase === 'reveal') {
    el.innerHTML = `<p class="muted">Chain started by <b>${esc(v.owner)}</b></p><h2>Watch the TV!</h2><p class="muted">Tap ❤️ for the ones you love:</p><div class="opts">${v.entries.map(e => `<button class="opt ${e.hearted ? 'on' : ''}" data-k="${e.k}" ${e.mine ? 'disabled' : ''}>${e.kind === 'draw' ? `🎨 ${esc(e.name)}'s drawing` : `“${esc(e.text)}” <small class="muted">${esc(e.name)}</small>`} ${e.mine ? '<small class="muted">(yours)</small>' : e.hearted ? '❤️' : '🤍'}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-k]').forEach(b => (b.onclick = () => send({ type: 'heart', c: v.c, k: Number(b.dataset.k) })));
    return;
  }
  if (v.phase === 'over') el.innerHTML = `<h2 class="${v.place === 1 && v.hearts ? 'win' : ''}">${v.place === 1 && v.hearts ? 'Most loved!' : 'Thanks for playing!'}</h2><p class="say">You got ❤️ ${v.hearts}.</p>`;
}
