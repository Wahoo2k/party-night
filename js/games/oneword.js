// One Word: everyone is on the same side. One player has to guess a secret word. Everyone else sees the word and
// types a single one-word clue, but any two clues that match cancel each other out and vanish. Obvious clues die;
// clever ones get through. The whole room shares one score.
import { esc } from '../ui.js';
import { isRude } from '../names.js';
import { WORDS } from './agents.js';

export const meta = {
  id: 'oneword',
  name: 'One Word',
  min: 3,
  max: 12,
  blurb: 'All on one team. One-word clues for a secret word, but matching clues cancel out.',
  ownReveal: true,   // this game holds its result back itself until its reveal has played
};

export const TIMES = { clue: 40000, guess: 40000, after: 7000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
// Two clues are "the same" if they match once case, spaces, punctuation and a plural ending are ignored.
export const stem = t => String(t || '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z]/g, '').replace(/(es|s)$/, '');
export function cleanClue(t, word) {
  const x = String(t || '').trim();
  if (x.length < 2) return { ok: false, why: 'Type one word.' };
  if (/\s/.test(x) || x.length > 18) return { ok: false, why: 'One word only.' };
  if (/\d/.test(x)) return { ok: false, why: 'A word, not a number.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  const a = stem(x), w = stem(word);
  if (a === w || (a.length > 2 && (w.includes(a) || a.includes(w)))) return { ok: false, why: 'Too close to the secret word.' };
  return { ok: true, text: x[0].toUpperCase() + x.slice(1).toLowerCase() };
}
export const rightGuess = (g, word) => stem(g) === stem(word);

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const order = shuffle(players.map(p => p.pid), rnd);
  const rounds = opts.short ? Math.max(4, Math.min(6, players.length)) : Math.max(6, Math.min(10, players.length * 2));
  const used = new Set(prev?.usedWords || []);
  let pool = WORDS.filter(w => !used.has(w));
  if (pool.length < rounds) { used.clear(); pool = [...WORDS]; }
  const words = shuffle(pool, rnd).slice(0, rounds);
  return {
    game: 'oneword', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),   // a soft tally of who helped; the room's score is `hits`
    order, words, usedWords: [...used, ...words], i: 0, hits: 0,
    clues: {}, guess: null, result: null, settled: false, settleAt: 0,
    phase: 'clue', deadline: Date.now() + TIMES.clue,
  };
}
const guesser = s => s.order[s.i % s.order.length];
const givers = s => s.players.map(p => p.pid).filter(p => p !== guesser(s));
// Which clues survive: any clue whose stem was typed by two or more people is cancelled for all of them.
export function survivors(clues) {
  const count = {}; Object.values(clues).forEach(c => (count[stem(c)] = (count[stem(c)] || 0) + 1));
  return Object.fromEntries(Object.entries(clues).map(([pid, c]) => [pid, count[stem(c)] === 1]));
}

function toGuess(s, now) { s.kept = survivors(s.clues); s.phase = 'guess'; s.round++; s.deadline = now + TIMES.guess; }
function finish(s, now, text) {
  const word = s.words[s.i], right = !!text && rightGuess(text, word);
  if (right) { s.hits++; s.scores[guesser(s)] += 2; Object.entries(s.kept).forEach(([pid, ok]) => { if (ok) s.scores[pid] += 1; }); }
  s.result = { guess: text || null, right, before: { ...s.scores } };
  if (right) { s.result.before[guesser(s)] -= 2; Object.entries(s.kept).forEach(([pid, ok]) => { if (ok) s.result.before[pid] -= 1; }); }
  s.settled = false; s.settleAt = now + 900 + Object.keys(s.clues).length * 420 + 2300;
  s.phase = 'result'; s.round++; s.deadline = s.settleAt + TIMES.after;
}
function next(s, now) {
  if (s.i + 1 >= s.words.length) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.i++; s.clues = {}; s.kept = null; s.guess = null; s.result = null; s.settled = false; s.phase = 'clue'; s.round++; s.deadline = now + TIMES.clue;
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'clue' && a.type === 'clue' && pid !== guesser(s) && !s.clues[pid]) {
    const r = cleanClue(a.text, s.words[s.i]);
    if (!r.ok) return s;
    s.clues[pid] = r.text;
    if (givers(s).every(g => s.clues[g])) toGuess(s, now);
  } else if (s.phase === 'guess' && pid === guesser(s) && (a.type === 'guess' || a.type === 'pass')) {
    const t = a.type === 'pass' ? '' : String(a.text || '').replace(/\s+/g, ' ').trim().slice(0, 24);
    if (a.type === 'guess' && (t.length < 2 || isRude(t))) return s;
    finish(s, now, t);
  }
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'clue') toGuess(s, now);
  else if (s.phase === 'guess') finish(s, now, '');
  else if (s.phase === 'result') next(s, now);
  return s;
}
export function tick(s, now = Date.now()) {
  if (s.phase === 'result' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }   // the reveal has played: phones catch up
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export const verdict = (hits, of) => { const f = hits / of; return f >= 0.9 ? 'Mind readers!' : f >= 0.7 ? 'Great teamwork!' : f >= 0.5 ? 'Not bad at all.' : f >= 0.3 ? 'A bit rusty.' : 'Well… you had fun.'; };
const say = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every round

export function narration(s) {
  if (s.phase === 'clue') return s.i === 0 ? 'Welcome to One Word! Everyone is on the same team. Give one-word clues, but matching clues cancel out.' : say(['Next word.', 'New word, same team.', 'Clues, please.', 'One word each. Make it count.'], s.i);
  if (s.phase === 'guess') return s.kept && !s.kept.length ? 'Every clue cancelled out! Take a wild guess.' : say(['Here are your clues. What is the word?', 'Your team has spoken. One guess.', 'The clues are in. What is it?'], s.i);
  if (s.phase === 'result') { const r = s.result; return `${r.right ? say(['Got it!', 'Yes! Nice work, team.', 'Correct!'], s.i) : r.guess ? say(['Not quite.', 'So close.', 'Not this time.'], s.i) : 'A pass.'} The word was ${s.words[s.i]}.`; }
  if (s.phase === 'over') return 'That\'s the game. Nice work, team!';
  return '';
}
export function cue(s) {
  if (s.phase === 'clue') return { sound: 'join', wait: 700, title: s.i === 0 ? 'One Word' : `Word ${s.i + 1}`, sub: s.i === 0 ? 'All on one team' : `of ${s.words.length}` };
  if (s.phase === 'guess') return { sound: 'vote', wait: 300 };
  if (s.phase === 'result') return s.settled ? null : { sound: 'drumroll', wait: Math.max(0, s.settleAt - Date.now() - 400) };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: `${s.hits} of ${s.words.length}`, sub: verdict(s.hits, s.words.length), tone: 'dawn', fx: s.hits / s.words.length >= 0.5 ? 'confetti' : null };
  return null;
}

const BOT_CLUES = ['Thing', 'Stuff', 'Object', 'Item', 'Whatsit'];
export function botAct(v, rnd = Math.random) {
  // Bots cannot think of a clue, so they type filler (which often cancels out). A bot guesser, for testing, knows the word.
  if (v.phase === 'clue' && !v.guesser && !v.sent) return { type: 'clue', text: BOT_CLUES[Math.floor(rnd() * BOT_CLUES.length)] };
  if (v.phase === 'guess' && v.guesser && v._w) return rnd() < 0.6 ? { type: 'guess', text: v._w } : { type: 'guess', text: 'Banana' };
  return null;
}

export function tvView(s, now = Date.now()) {
  const g = guesser(s);
  const v = { phase: s.phase, n: s.i + 1, of: s.words.length, hits: s.hits, guesser: nameOf(s, g), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s) };
  // The TV never shows the secret word until the result: the guesser is sitting in front of it.
  if (s.phase === 'clue') v.players = givers(s).map(p => ({ name: nameOf(s, p), done: !!s.clues[p] }));
  if (s.phase === 'guess') { v.clues = Object.entries(s.clues).filter(([pid]) => s.kept[pid]).map(([pid, c]) => ({ name: nameOf(s, pid), text: c })); v.cancelled = Object.values(s.kept).filter(k => !k).length; }
  if (s.phase === 'result') {
    v.settled = !!s.settled; v.word = s.words[s.i]; v.guess = s.result.guess; v.right = s.result.right;
    v.clues = Object.entries(s.clues).map(([pid, c]) => ({ name: nameOf(s, pid), text: c, kept: !!s.kept[pid] }));
    if (!s.settled) { v.scores = s.players.map(p => ({ pid: p.pid, name: p.name, score: s.result.before[p.pid] })).sort((a, b) => b.score - a.score); v.hits = s.hits - (s.result.right ? 1 : 0); }
  }
  if (s.phase === 'over') v.verdict = verdict(s.hits, s.words.length);
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const g = guesser(s), me = pid === g, bot = String(pid).startsWith('bot-');
  const v = { phase: s.phase, n: s.i + 1, of: s.words.length, hits: s.hits, guesser: me, guesserName: nameOf(s, g) };
  if (s.phase === 'clue') { if (!me) { v.word = s.words[s.i]; v.sent = !!s.clues[pid]; v.mine = s.clues[pid] || null; } }
  if (s.phase === 'guess') { v.clues = Object.entries(s.clues).filter(([p]) => s.kept[p]).map(([, c]) => c); v.cancelled = Object.values(s.kept).filter(k => !k).length; if (!me) { v.word = s.words[s.i]; v.mine = s.clues[pid] || null; v.mineKept = !!s.kept[pid]; } else if (bot) v._w = s.words[s.i]; }
  if (s.phase === 'result') { v.settled = !!s.settled; if (!me || s.settled) v.word = s.words[s.i]; if (s.settled) { v.right = s.result.right; v.guess = s.result.guess; } else v.hits = s.hits - (s.result.right ? 1 : 0); }
  if (s.phase === 'over') v.verdict = verdict(s.hits, s.words.length);
  return v;
}

// ---------- renderers ----------
let revealKey = '', revealAt = 0, revealTimers = [];
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Helped most</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  const tally = `<div class="owtally"><b>${v.hits}</b><span>of ${v.of} guessed</span></div>`;
  let h = '';
  if (v.phase === 'clue') {
    h = `<p class="cat">Word ${v.n} of ${v.of} · everyone is on the same team</p><div class="tshead"><span class="tsmode">Guesser</span><b>${esc(v.guesser)}, no peeking at phones!</b><em class="clock ${v.left <= 8 ? 'hurry' : ''}">${v.left}</em></div>
      <div class="owbig"><b>Everyone else: type ONE word to help ${esc(v.guesser)} guess the secret word.</b><span>If two of you type the same word, both clues vanish. Obvious is risky.</span></div>${tally}
      <div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">Show the clues</button>`;
  }
  if (v.phase === 'guess') {
    h = `<p class="cat">Word ${v.n} of ${v.of}</p><div class="tshead"><span class="tsmode">Guesser</span><b>${esc(v.guesser)}: what is the word?</b><em class="clock ${v.left <= 8 ? 'hurry' : ''}">${v.left}</em></div>
      <div class="owclues">${v.clues.length ? v.clues.map((c, i) => `<div class="owclue" style="--r:${[-3, 2, -1, 3, -2, 1][i % 6]}deg;animation-delay:${i * 0.25}s"><b>${esc(c.text)}</b><small>${esc(c.name)}</small></div>`).join('') : '<div class="owclue none"><b>Every clue cancelled out!</b></div>'}</div>
      ${v.cancelled ? `<p class="tsrule"><b>✂ ${v.cancelled} clue${v.cancelled === 1 ? '' : 's'} cancelled out</b><span>They matched each other.</span></p>` : ''}${tally}<button class="btn ghost" data-host="next">Skip this word</button>`;
  }
  if (v.phase === 'result') {
    const key = 'r' + v.n, first = key !== revealKey;
    if (first) { revealKey = key; revealAt = Date.now(); revealTimers.forEach(clearTimeout); revealTimers = []; }
    const el0 = Date.now() - revealAt, n = v.clues.length, tGuess = 900 + n * 420, tWord = tGuess + 1300;   // a redraw part-way through carries on
    h = `<p class="cat">Word ${v.n} of ${v.of}</p>
      <div class="owclues small">${v.clues.map((c, i) => `<div class="owclue ${c.kept ? '' : 'cut'}" style="--r:${[-3, 2, -1, 3, -2, 1][i % 6]}deg;animation-delay:${900 + i * 420 - el0}ms"><b>${esc(c.text)}</b><small>${esc(c.name)}${c.kept ? '' : ' · cancelled'}</small></div>`).join('')}</div>
      <div class="owresult"><div class="owguess" style="animation-delay:${tGuess - el0}ms"><small>${esc(v.guesser)} said</small><b>${v.guess ? esc(v.guess) : '(passed)'}</b></div>
      <div class="owword ${v.right ? 'right' : 'wrong'}" style="animation-delay:${tWord - el0}ms"><small>The word was</small><b>${esc(v.word)}</b><em>${v.right ? '✓ Got it!' : '✗ Not this time'}</em></div></div>${tally}<button class="btn" data-host="next">Next word</button>`;
    if (first) import('../sfx.js').then(m => {
      const later = (ms, fn) => revealTimers.push(setTimeout(fn, ms));
      v.clues.forEach((c, i) => later(900 + i * 420, () => m.play(c.kept ? 'pop' : 'stamp')));
      later(tGuess, () => m.play('lockin'));
      later(tWord, () => m.play(v.right ? ['win', 'points', 'safe'][v.n % 3] : ['groan', 'lose', 'sting-comic'][v.n % 3]));
      if (v.right) later(tWord + 450, () => m.play('cheer'));
    }).catch(() => {});
  }
  if (v.phase === 'over') h = `<h2 class="win">${v.hits} of ${v.of} words guessed</h2><p class="say">${esc(v.verdict)}</p><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel ts">${h}</div>${scores}</div>`;
}

let typed = { key: '', text: '' };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="win">${v.hits} of ${v.of}</h2><p class="say">${esc(v.verdict)}</p>`; return; }
  const top = `<p class="muted">Word ${v.n} of ${v.of} · team score ${v.hits}</p>`;
  const key = v.phase + v.n; if (typed.key !== key) typed = { key, text: '' };
  const form = (ph, btn) => `<form id="owf"><input id="owi" maxlength="24" autocomplete="off" autocapitalize="off" placeholder="${ph}" value="${esc(typed.text)}"><p class="lose" id="err"></p><button class="btn" type="submit">${btn}</button></form>`;
  if (v.phase === 'result') {
    el.innerHTML = !v.settled ? `${top}<h2>Watch the TV…</h2>${v.word ? `<p class="say">The word was <b>${esc(v.word)}</b>.</p>` : '<p class="say">Did you get it?</p>'}`
      : `${top}<h2 class="${v.right ? 'win' : 'lose'}">${v.right ? '✓ Got it!' : '✗ Not this time'}</h2><p class="say">The word was <b>${esc(v.word)}</b>${v.guess ? `. The guess was “${esc(v.guess)}”.` : '.'}</p>`;
    return;
  }
  if (v.phase === 'clue' && v.guesser) { el.innerHTML = `${top}<h2>You are the guesser</h2><div class="ahelp"><p>The others are each typing a one-word clue for a secret word. <b>Don't look at their phones.</b></p><p>In a moment the clues that survive appear here and on the TV, and you type your guess.</p></div>`; return; }
  if (v.phase === 'clue' && v.sent) { el.innerHTML = `${top}<p class="tq small">Secret word: <b>${esc(v.word)}</b></p><h2>Clue sent 🤞</h2><p class="say">You said “${esc(v.mine)}”. If someone else said the same, both vanish.</p>`; return; }
  if (v.phase === 'clue') {
    el.innerHTML = `${top}<p class="muted">The secret word is</p><h2 class="owsecret">${esc(v.word)}</h2><div class="ahelp"><p>Type <b>ONE word</b> to help <b>${esc(v.guesserName)}</b> guess it. Keep your phone hidden from them.</p><p>If anyone else types the same word, <b>both clues vanish</b>. The obvious clue is risky.</p></div>${form('One word', 'Send clue')}`;
    const f = el.querySelector('#owf'), inp = f.querySelector('#owi'); inp.oninput = () => { typed.text = inp.value; };
    f.onsubmit = e => { e.preventDefault(); const r = cleanClue(inp.value, v.word); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'clue', text: r.text }); };
    return;
  }
  // guess
  const list = v.clues.length ? `<div class="owlist">${v.clues.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : '<p class="say">Every clue cancelled out. Take a wild guess!</p>';
  if (!v.guesser) { el.innerHTML = `${top}<p class="tq small">Secret word: <b>${esc(v.word)}</b></p><h2>${esc(v.guesserName)} is guessing…</h2><p class="say">${v.mineKept ? `Your clue “${esc(v.mine)}” got through.` : v.mine ? `Your clue “${esc(v.mine)}” was cancelled: someone else said it too.` : 'You did not send a clue.'}</p><p class="muted">No hints out loud!</p>`; return; }
  el.innerHTML = `${top}<h2>What is the word?</h2><p class="muted">These clues got through${v.cancelled ? ` (${v.cancelled} cancelled out)` : ''}:</p>${list}${form('Your guess', 'Guess')}<button class="btn ghost" id="owpass" type="button">Pass</button>`;
  const f = el.querySelector('#owf'), inp = f.querySelector('#owi'); inp.oninput = () => { typed.text = inp.value; };
  f.onsubmit = e => { e.preventDefault(); const t = inp.value.trim(); if (t.length < 2) { f.querySelector('#err').textContent = 'Type a guess.'; return; } f.querySelector('button').disabled = true; send({ type: 'guess', text: t }); };
  el.querySelector('#owpass').onclick = () => send({ type: 'pass' });
}
