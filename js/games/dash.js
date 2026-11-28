// Doodle Dash: one player draws a word on their phone and the drawing appears live on the TV. Everyone else races to
// type what it is. The faster you get it, the more you score, and the artist scores for every player who gets it.
import { esc } from '../ui.js';
import { isRude } from '../names.js';
import { svgFor, cleanStrokes, botDoodle, mountPad } from './sketch.js';

export const meta = {
  id: 'dash',
  name: 'Doodle Dash',
  min: 3,
  max: 12,
  blurb: 'One draws, live on the TV. Everyone else races to guess the word.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const WORDS = [
  'cat', 'dog', 'fish', 'bird', 'snake', 'spider', 'elephant', 'giraffe', 'penguin', 'butterfly', 'turtle', 'octopus', 'shark', 'rabbit', 'snail', 'bee', 'owl', 'frog', 'whale', 'dinosaur',
  'pizza', 'banana', 'ice cream', 'hamburger', 'hot dog', 'cupcake', 'donut', 'apple', 'carrot', 'cheese', 'egg', 'popcorn', 'taco', 'cookie', 'watermelon', 'pineapple', 'sandwich', 'pancakes', 'lollipop', 'spaghetti',
  'house', 'car', 'bicycle', 'airplane', 'rocket', 'boat', 'train', 'bus', 'helicopter', 'tractor', 'castle', 'bridge', 'lighthouse', 'tent', 'igloo', 'windmill', 'ladder', 'fence', 'door', 'chimney',
  'sun', 'moon', 'star', 'cloud', 'rainbow', 'lightning', 'tree', 'flower', 'mountain', 'volcano', 'island', 'waterfall', 'snowman', 'tornado', 'cactus', 'mushroom', 'leaf', 'river', 'beach', 'campfire',
  'hat', 'shoe', 'sock', 'glasses', 'crown', 'umbrella', 'backpack', 'watch', 'ring', 'scarf', 'glove', 'tie', 'belt', 'boot', 'dress', 'mask', 'necklace', 'helmet', 'pajamas', 'button',
  'chair', 'table', 'bed', 'lamp', 'clock', 'key', 'book', 'phone', 'television', 'guitar', 'drum', 'piano', 'scissors', 'pencil', 'toothbrush', 'candle', 'balloon', 'kite', 'robot', 'ghost',
  'pirate', 'mermaid', 'dragon', 'unicorn', 'wizard', 'vampire', 'astronaut', 'clown', 'king', 'ninja', 'cowboy', 'chef', 'baby', 'skeleton', 'alien', 'zombie', 'angel', 'knight', 'witch', 'superhero',
  'soccer ball', 'basketball', 'skateboard', 'trophy', 'swing', 'slide', 'fishing rod', 'treasure map', 'anchor', 'hammer', 'saw', 'bucket', 'broom', 'envelope', 'camera', 'magnet', 'flashlight', 'bathtub', 'toilet', 'fireworks',
];
export const TIMES = { pick: 12000, draw: 70000, settle: 2400, after: 6000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = t => String(t || '').toLowerCase().replace(/[^a-z]/g, '');
const stem = t => norm(t).replace(/(es|s)$/, '');
function near(a, b) {   // one letter out (added, missing or wrong), for words long enough that this means "close"
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 4) return false;
  let i = 0, j = 0, d = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++d > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return d + (a.length - i) + (b.length - j) <= 1;
}
// 'right', 'close' or 'wrong'
export function judge(guess, word) { const g = norm(guess), w = norm(word); if (!g) return 'wrong'; if (g === w || stem(g) === stem(w)) return 'right'; return near(g, w) || (g.length >= 4 && (w.includes(g) || g.includes(w))) ? 'close' : 'wrong'; }
// Points for a right guess: 300 at the start, falling to 100 as the time runs out.
export const pointsAt = (ms, total = TIMES.draw) => 100 + Math.round(200 * Math.max(0, 1 - ms / total) / 10) * 10;
export const ARTIST_EACH = 50;
// The word as blanks. A letter is filled in at half time and another at three quarters.
export function hint(word, frac) {
  const idx = [...word].map((ch, i) => (ch === ' ' ? -1 : i)).filter(i => i >= 0), show = new Set();
  const n = frac >= 0.75 ? 2 : frac >= 0.5 ? 1 : 0, len = idx.length;
  if (n >= 1 && len > 2) show.add(idx[Math.floor(len / 3)]);
  if (n >= 2 && len > 4) show.add(idx[len - 1]);
  return [...word].map((ch, i) => (ch === ' ' ? ' ' : show.has(i) ? ch : '_'));
}

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const order = shuffle(players.map(p => p.pid), rnd).slice(0, opts.short ? Math.min(players.length, 4) : Math.min(players.length, 8));
  let deck = (prev?.deck || []).slice(); if (deck.length < order.length * 3) deck = shuffle(WORDS.map((_, i) => i), rnd);
  const s = {
    game: 'dash', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    order, i: 0, deck, choices: [], word: null, strokes: [], feed: [], got: {}, startAt: 0, result: null, settled: false, settleAt: 0,
    phase: 'pick', deadline: 0,
  };
  toPick(s, Date.now());
  return s;
}
const artist = s => s.order[s.i];
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
function toPick(s, now) {
  s.choices = s.deck.splice(0, 3).map(i => WORDS[i]); s.word = null; s.strokes = []; s.feed = []; s.got = {}; s.result = null; s.settled = false;
  s.phase = 'pick'; s.round++; s.deadline = now + TIMES.pick;
}
function toDraw(s, now, word) { s.word = word; s.phase = 'draw'; s.round++; s.startAt = now; s.deadline = now + TIMES.draw; }
function result(s, now) {
  const before = { ...s.scores }, n = Object.keys(s.got).length;
  Object.entries(s.got).forEach(([pid, g]) => (s.scores[pid] += g.pts));
  s.scores[artist(s)] += n * ARTIST_EACH;
  s.result = { before, artistPts: n * ARTIST_EACH };
  s.settled = false; s.settleAt = now + TIMES.settle;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'pick' && a.type === 'word' && pid === artist(s)) { const w = s.choices[Number(a.i)]; if (w) toDraw(s, now, w); return s; }
  if (s.phase !== 'draw') return s;
  if (pid === artist(s)) { if (a.type === 'draft' || a.type === 'draw') s.strokes = cleanStrokes(a.strokes); return s; }
  if (a.type !== 'guess' || s.got[pid]) return s;
  const text = String(a.text || '').replace(/\s+/g, ' ').trim().slice(0, 24); if (!text || isRude(text)) return s;
  const j = judge(text, s.word);
  if (j === 'right') { s.got[pid] = { ms: now - s.startAt, pts: pointsAt(now - s.startAt) }; s.feed.push({ pid, ok: true }); }
  else s.feed.push({ pid, text: j === 'close' ? null : text, close: j === 'close' });   // a near miss is never shown, so it cannot give the word away
  if (s.feed.length > 40) s.feed = s.feed.slice(-40);
  if (s.players.every(p => p.pid === artist(s) || s.got[p.pid])) result(s, now);
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'pick') toDraw(s, now, s.choices[Math.floor(rnd() * s.choices.length)]);
  else if (s.phase === 'draw') result(s, now);
  else if (s.phase === 'result') { if (s.i + 1 >= s.order.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else { s.i++; toPick(s, now); } }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'pick' && s.i === 0) return 'Welcome to Doodle Dash! One of you draws, and everyone else races to guess the word.';
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'pick') return s.i === 0 ? { sound: 'fanfare', wait: 1500, title: 'Doodle Dash', sub: 'Draw it. Guess it. Fast.' } : { sound: 'join', wait: 600 };
  if (s.phase === 'draw') return { sound: 'scribble', wait: 0 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'stamp', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function cueEvent(s) { const f = s.feed[s.feed.length - 1]; return s.phase === 'draw' && f?.ok ? { id: 'g' + s.i + '.' + Object.keys(s.got).length, sound: 'points' } : null; }

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'pick' && v.choices) return { type: 'word', i: Math.floor(rnd() * 3) };
  if (v.phase === 'draw' && v.artist) return rnd() < 0.3 ? { type: 'draft', strokes: botDoodle(rnd) } : null;
  if (v.phase === 'draw' && !v.got && rnd() < 0.12) return { type: 'guess', text: rnd() < 0.5 ? v._a : ['potato', 'a blob', 'spaghetti?', 'my uncle'][Math.floor(rnd() * 4)] };
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, n: s.i + 1, of: s.order.length, artist: nameOf(s, artist(s)), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  if (s.phase === 'draw') {
    v.strokes = s.strokes; v.hint = hint(s.word, (now - s.startAt) / TIMES.draw);
    v.feed = s.feed.slice(-6).map(f => ({ name: nameOf(s, f.pid), ok: !!f.ok, close: !!f.close, text: f.text || '' }));
    v.got = Object.keys(s.got).length; v.guessers = s.players.length - 1; v.worth = pointsAt(now - s.startAt);
  }
  if (s.phase === 'result') {
    v.settled = !!s.settled; v.word = s.word; v.strokes = s.strokes; v.artistPts = s.result.artistPts;
    v.rows = Object.entries(s.got).sort((a, b) => a[1].ms - b[1].ms).map(([pid, g]) => ({ name: nameOf(s, pid), secs: Math.round(g.ms / 100) / 10, pts: g.pts }));
    v.missed = s.players.filter(p => p.pid !== artist(s) && !s.got[p.pid]).map(p => p.name);
    if (!s.settled) v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: s.result.before[p.pid] })).sort((a, b) => b.score - a.score);
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const mine = pid === artist(s), v = { phase: s.phase, n: s.i + 1, of: s.order.length, artist: mine, artistName: nameOf(s, artist(s)), score: s.scores[pid] };
  if (s.phase === 'pick' && mine) v.choices = s.choices;
  if (s.phase === 'draw') {
    if (mine) { v.word = s.word; v.gotN = Object.keys(s.got).length; }
    else { v.got = s.got[pid] ? s.got[pid].pts : 0; const last = [...s.feed].reverse().find(f => f.pid === pid); v.last = last ? (last.close ? 'close' : last.ok ? 'right' : 'wrong') : ''; v.tries = s.feed.filter(f => f.pid === pid).length; if (String(pid).startsWith('bot-')) v._a = s.word; }
  }
  if (s.phase === 'result') { v.settled = !!s.settled; if (s.settled) { v.word = s.word; v.pts = mine ? s.result.artistPts : s.got[pid]?.pts || 0; } else v.score = s.result.before[pid]; }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- renderers ----------
let resKey = '';
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'pick') h = `<p class="cat">Drawing ${v.n} of ${v.of}</p><div class="owbig"><b>${esc(v.artist)} is choosing a word…</b><span>Everyone else: get ready to guess on your phone.</span></div>`;
  if (v.phase === 'draw') h = `<p class="cat">Drawing ${v.n} of ${v.of} · ${esc(v.artist)} is drawing <span class="clock small ${v.left <= 10 ? 'hurry' : ''}">${v.left}</span></p>
    <div class="ddrow"><div class="ddpic">${svgFor(v.strokes)}</div><div class="ddside"><div class="ddhint">${v.hint.map(ch => (ch === ' ' ? '<i class="sp"></i>' : `<i>${ch === '_' ? '' : esc(ch.toUpperCase())}</i>`)).join('')}</div>
      <p class="ddmeta"><b>${v.got} of ${v.guessers}</b> got it · worth <b>${v.worth}</b> now</p>
      <div class="ddfeed">${v.feed.map(f => `<div class="${f.ok ? 'ok' : f.close ? 'close' : ''}"><b>${esc(f.name)}</b> ${f.ok ? 'got it! ✓' : f.close ? 'is so close…' : `“${esc(f.text)}”`}</div>`).join('')}</div></div></div>
    <button class="btn ghost" data-host="next">Show the word</button>`;
  if (v.phase === 'result') {
    const key = 'r' + v.n;
    if (resKey !== key) { resKey = key; import('../sfx.js').then(m => { v.rows.forEach((_, i) => setTimeout(() => m.play(i === 0 ? 'win' : 'points'), 700 + i * 350)); if (!v.rows.length) setTimeout(() => m.play('groan'), 700); }).catch(() => {}); }
    h = `<p class="cat">Drawing ${v.n} of ${v.of} · by ${esc(v.artist)}</p><div class="ddrow"><div class="ddpic">${svgFor(v.strokes)}</div><div class="ddside"><h2 class="ddword">${esc(v.word)}</h2>
      <div class="ddrows">${v.rows.map((r, i) => `<div class="pdrow ${i === 0 ? 'best' : ''}" style="animation-delay:${700 + i * 350}ms"><b>${esc(r.name)}</b><span>${r.secs}s</span><em>+${r.pts}</em></div>`).join('') || '<p class="tsrule"><b>Nobody got it!</b></p>'}
      ${v.artistPts ? `<div class="pdrow art" style="animation-delay:${700 + v.rows.length * 350}ms"><b>🎨 ${esc(v.artist)}</b><span>for drawing it</span><em>+${v.artistPts}</em></div>` : ''}</div>
      ${v.missed.length && v.rows.length ? `<p class="ddmeta">Stumped: ${v.missed.map(esc).join(', ')}</p>` : ''}</div></div><button class="btn" data-host="next">${v.n < v.of ? 'Next drawing' : 'Finish'}</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel dd">${h}</div>${scores}</div>`;
}

let typed = { key: '', text: '' };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won! 🏆' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} points.</p>`; return; }
  if (v.phase === 'result') { el.innerHTML = !v.settled ? '<h2>Watch the TV…</h2>' : `<h2 class="${v.pts ? 'win' : ''}">It was “${esc(v.word)}”</h2><p class="say">${v.pts ? `+${v.pts}` : v.artist ? 'Nobody got it this time.' : 'No points this time.'}</p><p class="muted">${v.score.toLocaleString()} points</p>`; return; }
  if (v.phase === 'pick') {
    if (!v.artist) { el.innerHTML = `<h2>${esc(v.artistName)} is choosing a word</h2><p class="say">Get ready to guess.</p>`; return; }
    el.innerHTML = `<h2>You're drawing! Pick a word</h2><div class="opts">${v.choices.map((w, i) => `<button class="opt" data-i="${i}">${esc(w)}</button>`).join('')}</div><p class="muted">No letters or numbers in your drawing.</p>`;
    el.querySelectorAll('[data-i]').forEach(b => (b.onclick = () => send({ type: 'word', i: +b.dataset.i })));
    return;
  }
  if (v.artist) {
    // The pad stays put while guesses come in; only the line above it changes.
    const key = 'dash' + v.n, note = `${v.gotN} got it so far`;
    if (el.querySelector('#skc') && el.dataset.pad === key) { const c = el.querySelector('#ddn'); if (c) c.textContent = note; return; }
    el.dataset.pad = key;
    mountPad(el, key, `<p class="muted">Draw this. It shows on the TV as you go. <span id="ddn">${note}</span></p><p class="tq small skwhat">${esc(v.word)}</p>`, send, { live: 350 });
    return;
  }
  delete el.dataset.pad;
  if (v.got) { el.innerHTML = `<h2 class="win">Got it! +${v.got}</h2><p class="say">Shh. Don't give it away.</p>`; return; }
  const key = 'g' + v.n; if (typed.key !== key) typed = { key, text: '', tries: -1 };
  // redraw only when a guess has come back, so typing is never interrupted
  if (el.querySelector('#ddf') && typed.tries === v.tries) return;
  typed.tries = v.tries;
  el.innerHTML = `<p class="muted">${esc(v.artistName)} is drawing. Watch the TV.</p><h2>What is it?</h2><form id="ddf"><input id="ddi" maxlength="24" autocomplete="off" autocapitalize="off" placeholder="Type a guess" value="${esc(typed.text)}"><button class="btn" type="submit">Guess</button></form><p class="${v.last === 'close' ? 'win' : 'lose'}" id="ddmsg">${v.last === 'close' ? 'So close! Check your spelling.' : v.last === 'wrong' ? 'Nope. Try again!' : ''}</p>`;
  const f = el.querySelector('#ddf'), inp = f.querySelector('#ddi'); inp.oninput = () => { typed.text = inp.value; }; inp.focus();
  f.onsubmit = e => { e.preventDefault(); const t = inp.value.trim(); if (!t) return; typed.text = ''; inp.value = ''; send({ type: 'guess', text: t }); };
}
