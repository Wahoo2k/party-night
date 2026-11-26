// Letter Lists: one letter, six categories, ninety seconds. Answers must start with the letter;
// matching answers cancel out; the room can veto answers that don't fit. (Scattergories-style.)
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'letters',
  name: 'Letter Lists',
  min: 2,
  max: 12,
  blurb: 'One letter, six categories. Matching answers don\'t count!',
};

export const CATEGORIES = [
  'A fruit', 'A vegetable', 'An animal', 'A country', 'A U.S. state', 'A city', 'A boy\'s name', 'A girl\'s name',
  'Something in a kitchen', 'A sport', 'A color', 'A TV show', 'A movie', 'A food', 'A dessert', 'Something you wear',
  'A job', 'A school subject', 'A musical instrument', 'A cartoon character', 'Something cold', 'Something hot',
  'Something in a park', 'A breakfast food', 'A body part', 'A famous person', 'A board game', 'A drink',
  'Something with wheels', 'A bird', 'A sea creature', 'A holiday', 'A hobby', 'Something in a toolbox', 'A snack', 'Something at the beach',
];
const LETTERS = 'ABCDEFGHIJKLMNOPRSTW';
const PER_ROUND = 6;
const ROUNDS = 3;
export const TIMES = { write: 90000, review: 14000, scores: 7000 };

// A few common words per letter, only so bots have something to type.
const BOT_WORDS = {
  A: ['Apple', 'Alligator', 'Arizona', 'Anna'], B: ['Banana', 'Bear', 'Boston', 'Ben'], C: ['Carrot', 'Cat', 'Canada', 'Chloe'], D: ['Dog', 'Denver', 'Donut', 'Drum'],
  E: ['Eagle', 'Egypt', 'Eggplant', 'Emma'], F: ['Fox', 'France', 'Fig', 'Flute'], G: ['Grape', 'Goat', 'Georgia', 'Guitar'], H: ['Horse', 'Hawaii', 'Hat', 'Harp'],
  I: ['Iguana', 'Idaho', 'Ice cream', 'Iris'], J: ['Jaguar', 'Japan', 'Jam', 'Jack'], K: ['Kiwi', 'Kangaroo', 'Kansas', 'Kite'], L: ['Lemon', 'Lion', 'London', 'Lily'],
  M: ['Mango', 'Moose', 'Mexico', 'Max'], N: ['Nectarine', 'Newt', 'Nevada', 'Noah'], O: ['Orange', 'Owl', 'Ohio', 'Oboe'], P: ['Peach', 'Panda', 'Peru', 'Piano'],
  R: ['Radish', 'Rabbit', 'Rome', 'Ruby'], S: ['Strawberry', 'Snake', 'Spain', 'Sam'], T: ['Tomato', 'Tiger', 'Texas', 'Tuba'], W: ['Watermelon', 'Wolf', 'Wyoming', 'Will'],
};

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const norm = t => String(t || '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/^(a|an|the)\s+/, '').replace(/[^a-z0-9]/g, '').replace(/ies$/, 'y').replace(/s$/, '').replace(/e$/, '');
const startsWith = (t, L) => String(t || '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/^\s*(a|an|the)\s+/, '').trim().startsWith(L.toLowerCase());

export function setup(players, rnd = Math.random, prev = null) {
  const scores = {};
  players.forEach(p => (scores[p.pid] = 0));
  const s = {
    game: 'letters',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    letters: shuffle(LETTERS.split(''), rnd).slice(0, ROUNDS),
    round: 0, scores, gained: {},
  };
  startRound(s, Date.now(), rnd);
  return s;
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const letter = s => s.letters[s.round];

function startRound(s, now, rnd) {
  s.cats = shuffle(CATEGORIES.map((_, i) => i), rnd).slice(0, PER_ROUND);
  s.answers = {};          // pid -> [text x6]
  s.vetoes = {};           // `${c}|${pid}` -> [voter pids]
  s.c = 0;
  s.done = {};
  s.phase = 'write';
  s.deadline = now + TIMES.write;
}

// Status of one answer: 'ok', 'blank', 'letter' (wrong letter), 'dupe', 'veto'.
export function judge(s, c, pid) {
  const t = (s.answers[pid] || [])[c] || '';
  if (!t.trim()) return 'blank';
  if (!startsWith(t, letter(s))) return 'letter';
  const n = norm(t);
  const others = s.players.filter(p => p.pid !== pid).map(p => (s.answers[p.pid] || [])[c]).filter(Boolean).map(norm);
  if (others.includes(n)) return 'dupe';
  const vetoes = (s.vetoes[`${c}|${pid}`] || []).length;
  const judges = s.players.length - 1;
  if (judges >= 2 ? vetoes > judges / 2 : vetoes >= 1) return 'veto';
  return 'ok';
}

function scoreRound(s, now) {
  const g = {};
  s.players.forEach(p => { g[p.pid] = 0; s.cats.forEach((_, c) => { if (judge(s, c, p.pid) === 'ok') g[p.pid]++; }); });
  Object.entries(g).forEach(([pid, n]) => (s.scores[pid] += n));
  s.gained = g;
  s.phase = 'scores';
  s.deadline = now + TIMES.scores;
}

export function act(s, pid, a, now = Date.now()) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'write' && a.type === 'answers' && Array.isArray(a.list)) {
    s.answers[pid] = s.cats.map((_, c) => {
      const t = String(a.list[c] || '').normalize('NFKC').replace(/[\p{Cc}\p{Cf}<>{}\[\]\\`]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30);
      return isRude(t) ? '' : t;
    });
    if (a.final) s.done[pid] = true;
    if (s.players.every(p => s.done[p.pid])) { s.phase = 'review'; s.c = 0; s.deadline = now + TIMES.review; }
  } else if (s.phase === 'review' && a.type === 'veto' && a.who !== pid && P(s, a.who)) {
    const k = `${s.c}|${a.who}`;
    const list = s.vetoes[k] || [];
    s.vetoes[k] = list.includes(pid) ? list.filter(x => x !== pid) : [...list, pid];
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'write') { s.phase = 'review'; s.c = 0; s.deadline = now + TIMES.review; }
  else if (s.phase === 'review') { if (s.c + 1 < s.cats.length) { s.c++; s.deadline = now + TIMES.review; } else scoreRound(s, now); }
  else if (s.phase === 'scores') { if (s.round + 1 < s.letters.length) { s.round++; startRound(s, now, rnd); } else s.phase = 'over'; }
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (now < s.deadline) return s;
  return hostAct(s, 'next', now, rnd);
}

export function narration(s) {
  if (s.phase === 'write') return `${s.round === 0 ? 'Welcome to Letter Lists! ' : ''}Your letter is ${letter(s)}. Six categories, ninety seconds. Go!`;
  if (s.phase === 'review') return `${CATEGORIES[s.cats[s.c]]}.`;
  if (s.phase === 'over') return 'That\'s the game!';
  return '';
}

export function cue(s) {
  if (s.phase === 'write') return { sound: 'join', wait: 800, title: `Letter ${letter(s)}`, sub: `Round ${s.round + 1} of ${s.letters.length}` };
  if (s.phase === 'review') return { sound: 'vote', wait: 300 };
  if (s.phase === 'scores') return { sound: 'safe', wait: 300 };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'Quickest thinker wins', tone: 'dawn', fx: 'confetti' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'write' && !v.done) {
    const words = shuffle([...(BOT_WORDS[v.letter] || ['?'])], rnd);
    return { type: 'answers', final: true, list: v.categories.map((_, i) => (rnd() < 0.8 ? words[i % words.length] : '')) };
  }
  if (v.phase === 'review' && v.others?.length && rnd() < 0.15 && !v.vetoed) return { type: 'veto', who: v.others[Math.floor(rnd() * v.others.length)].pid };
  return null;
}

// ---------- views ----------
const board = s => s.players.map(p => ({ name: p.name, score: s.scores[p.pid], gained: s.gained[p.pid] || 0 })).sort((a, b) => b.score - a.score);
const STATUS = { ok: '', blank: 'blank', letter: 'wrong letter', dupe: 'match', veto: 'vetoed' };

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, letter: letter(s), round: s.round + 1, rounds: s.letters.length, categories: s.cats.map(i => CATEGORIES[i]), scores: board(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)) };
  if (s.phase === 'write') { v.doneCount = Object.keys(s.done).length; v.total = s.players.length; }
  if (s.phase === 'review') {
    v.c = s.c; v.cat = CATEGORIES[s.cats[s.c]];
    v.rows = s.players.map(p => ({ name: p.name, text: (s.answers[p.pid] || [])[s.c] || '', status: judge(s, s.c, p.pid), vetoes: (s.vetoes[`${s.c}|${p.pid}`] || []).length }));
  }
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, letter: letter(s), categories: s.cats.map(i => CATEGORIES[i]), score: s.scores[pid], done: !!s.done[pid], mine: s.phase === 'write' ? [] : s.answers[pid] || [] };
  if (s.phase === 'review') {
    v.cat = CATEGORIES[s.cats[s.c]];
    v.myStatus = judge(s, s.c, pid);
    v.others = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name, text: (s.answers[p.pid] || [])[s.c] || '', status: judge(s, s.c, p.pid), vetoed: (s.vetoes[`${s.c}|${p.pid}`] || []).includes(pid) })).filter(o => o.text);
    v.vetoed = v.others.some(o => o.vetoed);
  }
  if (s.phase === 'scores') v.gained = s.gained[pid] || 0;
  if (s.phase === 'over') { const r = board(s); v.rank = r.findIndex(x => x.name === nameOf(s, pid)) + 1; v.of = r.length; }
  return v;
}

// ---------- renderers ----------
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase !== 'write');
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}${v.phase === 'scores' && p.gained ? `<small> +${p.gained}</small>` : ''}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'write') h = `<p class="cat">Round ${v.round} of ${v.rounds}</p><div class="bigletter">${esc(v.letter)}</div><ol class="catlist">${v.categories.map(c => `<li>${esc(c)}</li>`).join('')}</ol><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><p class="muted">${v.doneCount} of ${v.total} finished · Answers that match someone else's don't count!</p><button class="btn ghost" data-host="next">Pencils down</button>`;
  if (v.phase === 'review') h = `<p class="cat">Letter <b>${esc(v.letter)}</b> · category ${v.c + 1} of ${v.categories.length}</p><div class="cq">${esc(v.cat)}</div><div class="lrows">${v.rows.map(r => `<div class="lrow ${r.status}"><span>${esc(r.name)}</span><b>${esc(r.text || '—')}</b><small>${STATUS[r.status]}${r.vetoes && r.status !== 'veto' ? ` · ${r.vetoes} 👎` : ''}</small></div>`).join('')}</div><p class="muted">Doesn't fit? Tap 👎 on your phone.</p><button class="btn" data-host="next">Next category</button>`;
  if (v.phase === 'scores') h = `<h2>Round ${v.round} scores</h2><p class="say">One point for every answer nobody else had.</p><button class="btn" data-host="next">${v.round >= v.rounds ? 'Finish' : 'Next letter'}</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0]?.name || '')} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

// Keep what the player has typed if the screen redraws mid-round.
let draft = { key: '', list: [] };
export function renderPhone(v, el, send) {
  let h = '';
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (v.phase === 'write' && !v.done) {
    const key = v.letter + v.categories.join('|');
    if (draft.key !== key) draft = { key, list: v.mine.length ? [...v.mine] : v.categories.map(() => '') };
    el.innerHTML = `<div class="phoneletter">${esc(v.letter)}</div><form id="lf2">${v.categories.map((c, i) => `<label for="c${i}">${esc(c)}</label><input id="c${i}" maxlength="30" autocomplete="off" autocapitalize="words" value="${esc(draft.list[i] || '')}" placeholder="${esc(v.letter)}…">`).join('')}<button class="btn" type="submit">I'm done</button></form>`;
    const f = el.querySelector('#lf2');
    const list = () => [...f.querySelectorAll('input')].map(i => i.value);
    f.querySelectorAll('input').forEach((inp, i) => (inp.oninput = () => { draft.list[i] = inp.value; }));
    // Send progress quietly so time running out still counts what's typed.
    f.querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => send({ type: 'answers', list: list() })));
    f.onsubmit = e => { e.preventDefault(); f.querySelector('button').disabled = true; send({ type: 'answers', list: list(), final: true }); };
    return;
  }
  if (v.phase === 'write') h = `<div class="phoneletter">${esc(v.letter)}</div><h2>Done!</h2><p class="say">Waiting for everyone…</p>`;
  else if (v.phase === 'review') h = `<p class="muted">Letter ${esc(v.letter)}</p><p class="tq small">${esc(v.cat)}</p><p>Yours: <b>${esc(v.mine[v.categories.indexOf(v.cat)] || '—')}</b> <span class="muted">${STATUS[v.myStatus]}</span></p><p class="muted">Tap 👎 if an answer doesn't fit:</p><div class="opts">${v.others.map(o => `<button class="opt ${o.vetoed ? 'on' : ''}" data-veto="${esc(o.pid)}">${esc(o.name)}: <b>${esc(o.text)}</b> ${o.vetoed ? '👎' : ''} <small class="muted">${STATUS[o.status]}</small></button>`).join('') || '<p class="muted">No other answers.</p>'}</div>`;
  else if (v.phase === 'scores') h = `<h2 class="win">+${v.gained}</h2><p class="say">${v.score} points</p>`;
  else if (v.phase === 'over') h = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You won!' : `You came ${v.rank} of ${v.of}`}</h2><p class="say">${v.score} points</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-veto]').forEach(b => (b.onclick = () => send({ type: 'veto', who: b.dataset.veto })));
}
