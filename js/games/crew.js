// Clue Crew: a co-op word game. One player guesses; everyone else secretly writes a one-word clue.
// Matching clues cancel each other out, so be original! (Just One-style.)
import { esc } from '../ui.js';
import { isRude } from '../names.js';
import { isRight } from './trivia.js';
import { WORDS } from './imposter.js';

export const meta = {
  id: 'crew',
  name: 'Clue Crew',
  min: 3,
  max: 12,
  blurb: 'Everyone gives one-word clues. Matching clues cancel out!',
};

export const CARDS = 10;
export const TIMES = { clue: 50000, guess: 45000, reveal: 8000 };
const POOL = Object.entries(WORDS).flatMap(([cat, words]) => Object.entries(words).map(([word, hints]) => ({ cat, word, hints })));

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const stem = t => String(t || '').toLowerCase().normalize('NFKD').replace(/[^a-z]/g, '').replace(/ies$/, 'y').replace(/(ch|sh|x|ss)es$/, '$1').replace(/s$/, '');

export function cleanClue(text, word) {
  const w = String(text || '').trim();
  if (!w) return { ok: false, why: 'Type one word.' };
  if (/\s/.test(w)) return { ok: false, why: 'Just ONE word.' };
  if (!/^[A-Za-z'-]{1,20}$/.test(w)) return { ok: false, why: 'Letters only.' };
  if (isRude(w)) return { ok: false, why: 'Keep it family-friendly.' };
  const a = stem(w), b = stem(word);
  if (a && b && (a.includes(b) || b.includes(a))) return { ok: false, why: 'Too close to the word itself!' };
  return { ok: true, text: w };
}

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const s = {
    game: 'crew', players: order,
    deck: shuffle([...POOL.keys()], rnd).slice(0, opts.short ? 6 : CARDS),
    card: 0, played: 0, score: 0, lost: 0, round: 0, best: Math.max(prev?.best || 0, prev?.phase === 'over' && prev.deck?.length === (opts.short ? 6 : CARDS) ? prev.score : 0),
    guesser: null, clues: {}, guess: null, result: null, phase: 'clue', deadline: 0, history: [],
  };
  start(s, Date.now());
  return s;
}

function start(s, now) {
  s.guesser = s.players[s.played % s.players.length].pid;
  s.clues = {}; s.guess = null; s.result = null;
  s.phase = 'clue'; s.round++;
  s.deadline = now + TIMES.clue;
}

const cur = s => POOL[s.deck[s.card]];
const givers = s => s.players.filter(p => p.pid !== s.guesser).map(p => p.pid);
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';

// Clues that match another clue are cancelled.
export function survivors(clues) {
  const count = {};
  Object.values(clues).forEach(c => { const k = stem(c); count[k] = (count[k] || 0) + 1; });
  return Object.fromEntries(Object.entries(clues).map(([pid, c]) => [pid, count[stem(c)] === 1]));
}

function toGuess(s, now) {
  s.alive = survivors(s.clues);
  s.phase = 'guess'; s.round++;
  s.deadline = now + TIMES.guess;
}

function finish(s, kind, text, now) {
  const c = cur(s);
  s.guess = text || null;
  if (kind === 'guess' && isRight(text, [c.word])) { s.result = 'right'; s.score++; }
  else if (kind === 'guess') { s.result = 'wrong'; s.lost++; }   // a wrong guess also costs the next card
  else s.result = 'pass';
  s.history.push({ word: c.word, result: s.result });
  s.phase = 'reveal'; s.round++;
  s.deadline = now + TIMES.reveal;
}

function next(s, now) {
  s.played++;
  if (s.result === 'wrong' && s.card + 1 < s.deck.length) s.history.push({ word: POOL[s.deck[s.card + 1]].word, result: 'lost' });
  s.card += s.result === 'wrong' ? 2 : 1;
  if (s.card >= s.deck.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  start(s, now);
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'clue' && a.type === 'clue' && pid !== s.guesser && !s.clues[pid]) {
    const r = cleanClue(a.text, cur(s).word);
    if (!r.ok) return s;
    s.clues[pid] = r.text;
    if (givers(s).every(g => s.clues[g])) toGuess(s, now);
  } else if (s.phase === 'guess' && pid === s.guesser) {
    if (a.type === 'guess' && String(a.text || '').trim()) finish(s, 'guess', String(a.text).trim().slice(0, 30), now);
    if (a.type === 'pass') finish(s, 'pass', null, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'clue') toGuess(s, now);
  else if (s.phase === 'guess') finish(s, 'pass', null, now);
  else if (s.phase === 'reveal') next(s, now);
  return s;
}

export function tick(s, now = Date.now()) {
  if (!s.deadline || now < s.deadline) return s;
  return hostAct(s, 'next', now);
}

const RATING = [[10, 'Perfect! Mind readers, every one of you.'], [8, 'Amazing teamwork!'], [6, 'Solid crew!'], [4, 'Not bad. Try again?'], [0, 'Well… that happened.']];
const rating = n => RATING.find(([k]) => n >= k)[1];
const aliveList = s => Object.entries(s.clues).filter(([pid]) => s.alive?.[pid]).map(([pid, text]) => ({ text, name: nameOf(s, pid) }));

export function narration(s) {
  if (s.phase === 'clue') return s.played === 0 ? `Welcome to Clue Crew! We're all on the same team. ${nameOf(s, s.guesser)}, don't look at the TV or anyone's phone! Everyone else, write a one-word clue. Matching clues cancel out.` : `${nameOf(s, s.guesser)} is guessing. Write your clues!`;
  if (s.phase === 'guess') { const n = aliveList(s).length; return n ? `${n} clue${n === 1 ? '' : 's'} made it. ${nameOf(s, s.guesser)}, what's the word?` : `Oh no, every clue cancelled out! ${nameOf(s, s.guesser)}, take a wild guess.`; }
  if (s.phase === 'reveal') return s.result === 'right' ? `Yes! It was ${cur(s).word}!` : s.result === 'wrong' ? `Nope, it was ${cur(s).word}. That costs us an extra card.` : `Passed. It was ${cur(s).word}.`;
  if (s.phase === 'over') return `You got ${s.score} out of ${s.deck.length}. ${rating(s.score)}`;
  return '';
}

export function cue(s) {
  if (s.phase === 'clue') return { sound: 'join', wait: 700, title: s.played === 0 ? 'Clue Crew' : `Card ${s.card + 1}`, sub: `${nameOf(s, s.guesser)}, look away!` };
  if (s.phase === 'guess') return { sound: 'vote', wait: 300 };
  if (s.phase === 'reveal' && s.result === 'wrong') return { sound: 'lose', wait: 500, flash: 'buzz' };
  if (s.phase === 'reveal') return { sound: s.result === 'right' ? 'win' : s.result === 'wrong' ? 'lose' : 'tick', wait: 500, fx: s.result === 'right' ? 'confetti' : null };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: `${s.score} / ${s.deck.length}`, sub: rating(s.score), tone: 'dawn', fx: s.score >= 6 ? 'confetti' : null };
  return null;
}

// Bots know the word (they're for testing). They use the built-in hints, so they sometimes collide.
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'clue' && !v.isGuesser && !v.sent && v._hints) return { type: 'clue', text: v._hints[Math.floor(rnd() * v._hints.length)] };
  if (v.phase === 'guess' && v.isGuesser && v._word) { const r = rnd(); return r < 0.7 ? { type: 'guess', text: v._word } : r < 0.85 ? { type: 'pass' } : { type: 'guess', text: 'Banana' }; }
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, card: Math.min(s.card + 1, s.deck.length), cards: s.deck.length, score: s.score, lost: s.lost, played: s.played, guesser: nameOf(s, s.guesser), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), history: s.history };
  if (s.phase === 'clue') { v.cat = cur(s).cat; v.sent = Object.keys(s.clues).length; v.total = givers(s).length; }
  if (s.phase === 'guess') { v.cat = cur(s).cat; v.alive = aliveList(s); v.cancelled = Object.keys(s.clues).length - v.alive.length; }
  if (s.phase === 'reveal') { v.word = cur(s).word; v.guess = s.guess; v.result = s.result; v.clues = Object.entries(s.clues).map(([pid, text]) => ({ text, name: nameOf(s, pid), alive: s.alive[pid] })); }
  v.best = s.best || 0;
  if (s.phase === 'over') v.rating = rating(s.score);
  return v;
}

export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const bot = String(pid).startsWith('bot-');
  const v = { phase: s.phase, round: s.round, isGuesser: pid === s.guesser, guesser: nameOf(s, s.guesser), score: s.score, card: s.card + 1, cards: s.deck.length };
  if (s.phase === 'clue' && !v.isGuesser) { v.word = cur(s).word; v.cat = cur(s).cat; v.sent = !!s.clues[pid]; if (bot) v._hints = cur(s).hints; }
  if (s.phase === 'clue' && v.isGuesser) v.cat = cur(s).cat;
  if (s.phase === 'guess') {
    v.cat = cur(s).cat;
    v.alive = aliveList(s).map(c => c.text);
    if (!v.isGuesser) { v.word = cur(s).word; v.mine = s.clues[pid] || null; v.mineAlive = !!s.alive[pid]; }
    if (bot && v.isGuesser) v._word = cur(s).word;
  }
  if (s.phase === 'reveal') { v.word = cur(s).word; v.result = s.result; }
  if (s.phase === 'over') v.rating = rating(s.score);
  return v;
}

// ---------- renderers ----------
const track = v => `<div class="crewtrack">${Array.from({ length: v.cards }, (_, i) => { const h = v.history[i]; return `<span class="${h ? h.result : ''}">${h ? (h.result === 'right' ? '✓' : h.result === 'wrong' ? '✕' : h.result === 'lost' ? '🗑' : '–') : ''}</span>`; }).join('')}</div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'reveal' || v.phase === 'over');
  const side = `<div class="scores"><h3>Team score</h3><div class="tscore">${v.score}<small> / ${v.cards}</small></div>${v.best ? `<p class="muted small">Score to beat: ${v.best}</p>` : ''}${track(v)}${v.lost ? `<p class="muted small">${v.lost} card${v.lost === 1 ? '' : 's'} lost to wrong guesses</p>` : ''}</div>`;
  let h = '';
  if (v.phase === 'clue') h = `<p class="cat">Card ${v.card} of ${v.cards} · ${esc(v.cat)}</p><h2><b>${esc(v.guesser)}</b>, look away from everyone's phones!</h2><p class="say">Everyone else: write a one-word clue for the secret word. If two of you write the same clue, both get cancelled. Be original!</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><div class="meter"><span style="width:${v.total ? (100 * v.sent) / v.total : 0}%"></span></div><p class="muted center">${v.sent} of ${v.total} clues in</p><button class="btn ghost" data-host="next">Show the clues</button>
    <div class="how"><h3>How to play</h3><ol><li>We're all one team. One person guesses each card.</li><li>Everyone else secretly writes ONE word to help.</li><li>Matching clues cancel out, so try something different from what others might write.</li><li>A wrong guess costs an extra card, so pass if you're stuck.</li></ol></div>`;
  if (v.phase === 'guess') h = `<p class="cat">Card ${v.card} of ${v.cards} · ${esc(v.cat)}</p><h2>${esc(v.guesser)}, what's the word?</h2><div class="crewclues">${v.alive.map((c, i) => `<div class="cclue" style="animation-delay:${i * 0.12}s">${esc(c.text)}</div>`).join('') || '<p class="say">Every clue cancelled out!</p>'}</div>${v.cancelled ? `<p class="muted center">${v.cancelled} clue${v.cancelled === 1 ? '' : 's'} cancelled out</p>` : ''}<p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><button class="btn ghost" data-host="next">Pass</button>`;
  if (v.phase === 'reveal') h = `<p class="cat">The word was</p><div class="cq ${v.result === 'right' ? 'win' : ''}">${esc(v.word)}</div><h2 class="${v.result === 'right' ? 'win' : 'lose'}">${v.result === 'right' ? 'Got it!' : v.result === 'wrong' ? `“${esc(v.guess)}”: nope! −1 extra card` : 'Passed'}</h2><div class="crewclues">${v.clues.map(c => `<div class="cclue ${c.alive ? '' : 'dead'}">${esc(c.text)}<small>${esc(c.name)}</small></div>`).join('')}</div><button class="btn" data-host="next">Next card</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${v.score} out of ${v.cards}</h2><p class="say">${esc(v.rating)}</p>${v.best ? `<p class="say ${v.score > v.best ? 'win' : ''}">${v.score > v.best ? `New best! You beat ${v.best}.` : `Score to beat: ${v.best}`}</p>` : ''}${track(v)}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${side}</div>`;
}

let draft = { round: -1, text: '' };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  const head = `<p class="muted">Card ${Math.min(v.card, v.cards)} of ${v.cards} · team score ${v.score}</p>`;
  if (v.phase === 'clue' && v.isGuesser) { el.innerHTML = `${head}<h2>You're guessing!</h2><p class="say">Don't look at the TV or anyone's phone until the clues are in. Category: <b>${esc(v.cat)}</b></p>`; return; }
  if (v.phase === 'clue' && v.sent) { el.innerHTML = `${head}<h2>Clue sent!</h2><p class="say">Shh. Don't say it out loud.</p>`; return; }
  if (v.phase === 'clue') {
    if (draft.round !== v.round) draft = { round: v.round, text: '' };
    el.innerHTML = `${head}<p class="muted">The secret word (${esc(v.cat)}):</p><div class="tcard2"><div class="tword">${esc(v.word)}</div></div><form id="cf"><input id="cc" maxlength="20" autocomplete="off" autocapitalize="none" placeholder="One-word clue" value="${esc(draft.text)}"><p class="lose" id="err"></p><button class="btn" type="submit">Send clue</button></form><p class="muted small">Matching clues cancel out. Be original!</p>`;
    const f = el.querySelector('#cf'), inp = f.querySelector('#cc');
    inp.oninput = () => (draft.text = inp.value);
    f.onsubmit = e => { e.preventDefault(); const r = cleanClue(inp.value, v.word); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'clue', text: r.text }); };
    return;
  }
  if (v.phase === 'guess' && v.isGuesser) {
    if (draft.round !== v.round) draft = { round: v.round, text: '' };
    el.innerHTML = `${head}<p class="muted">${esc(v.cat)}</p><div class="crewclues small">${v.alive.map(c => `<div class="cclue">${esc(c)}</div>`).join('') || '<p class="say">All the clues cancelled out!</p>'}</div><form id="gf"><input id="gg" maxlength="30" autocomplete="off" placeholder="Your guess" value="${esc(draft.text)}"><button class="btn" type="submit">Guess</button></form><button class="btn ghost" id="pass">Pass (no penalty)</button>`;
    const f = el.querySelector('#gf'), inp = f.querySelector('#gg');
    inp.oninput = () => (draft.text = inp.value);
    f.onsubmit = e => { e.preventDefault(); if (!inp.value.trim()) return; f.querySelector('button').disabled = true; send({ type: 'guess', text: inp.value }); };
    el.querySelector('#pass').onclick = () => send({ type: 'pass' });
    return;
  }
  if (v.phase === 'guess') { el.innerHTML = `${head}<h2>${esc(v.guesser)} is guessing</h2><p class="say">The word: <b>${esc(v.word)}</b>. Your clue ${v.mine ? `“${esc(v.mine)}” ${v.mineAlive ? 'made it!' : 'got cancelled.'}` : "didn't get in."}</p><p class="muted">No hints now!</p>`; return; }
  if (v.phase === 'reveal') { el.innerHTML = `${head}<h2 class="${v.result === 'right' ? 'win' : 'lose'}">${v.result === 'right' ? 'Got it!' : v.result === 'wrong' ? 'Nope!' : 'Passed'}</h2><p class="say">It was <b>${esc(v.word)}</b>.</p>`; return; }
  if (v.phase === 'over') el.innerHTML = `<h2 class="win">${v.score} out of ${v.cards}</h2><p class="say">${esc(v.rating)}</p>`;
}
