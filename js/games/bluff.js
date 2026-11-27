// Bluff: a strange-but-true fact appears with a blank. Everyone writes a believable lie,
// then everyone tries to pick the truth from the lies. Points for finding the truth and for fooling others.
import { esc } from '../ui.js';
import { isRude } from '../names.js';
import { FACTS } from './bluff-facts.js';

export const meta = {
  id: 'bluff',
  name: 'Bluff',
  min: 3,
  max: 10,
  blurb: 'Write a fake answer to a strange true fact, then sniff out the real one.',
};

export const TIMES = { write: 60000, pick: 30000, step: 3800, scores: 7000 };
const PROMPTS = 4;                 // facts per game; the last one is worth double
const TRUTH_PTS = 1000, FOOL_PTS = 500;

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = w => String(w || '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/^(a|an|the)\s+/, '').replace(/[^a-z0-9]/g, '');
const isTruth = (fact, text) => { const n = norm(text); return [fact.a, ...(fact.alt || [])].some(x => norm(x) === n || norm(x) + 's' === n || norm(x) === n + 's'); };

export function cleanLie(text, fact) {
  const t = String(text || '').normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/[<>{}\[\]\\`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  if (!t) return { ok: false, why: 'Type a fake answer first.' };
  if (isRude(t)) return { ok: false, why: 'Keep it family-friendly.' };
  if (fact && isTruth(fact, t)) return { ok: false, why: 'That\'s actually the truth! Write a lie instead.' };
  return { ok: true, text: t };
}

export function setup(players, rnd = Math.random, prev = null) {
  const recent = new Set(prev?.usedFacts || []);
  const pool = FACTS.map((f, i) => i).filter(i => !recent.has(i));
  const picks = shuffle(pool.length >= PROMPTS ? pool : FACTS.map((f, i) => i), rnd).slice(0, PROMPTS);
  const scores = {};
  players.forEach(p => (scores[p.pid] = 0));
  return {
    game: 'bluff',
    phase: 'write',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    facts: picks,
    n: 0,                 // which prompt we're on
    lies: {},             // pid -> text
    options: [],          // {id, text, truth, authors:[pid], house}
    picks: {},            // pid -> option id
    reveal: [],           // option ids in reveal order
    step: 0,
    scores,
    gained: {},
    usedFacts: [...recent, ...picks].slice(-30),
    deadline: Date.now() + TIMES.write,
    started: false,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const fact = s => FACTS[s.facts[s.n]];
const mult = s => (s.n === s.facts.length - 1 ? 2 : 1);

function startWrite(s, now) { s.phase = 'write'; s.lies = {}; s.picks = {}; s.options = []; s.gained = {}; s.deadline = now + TIMES.write; }

function buildOptions(s, rnd) {
  const f = fact(s);
  const byText = new Map();
  for (const [pid, text] of Object.entries(s.lies)) {
    const k = norm(text);
    if (!byText.has(k)) byText.set(k, { text, authors: [] });
    byText.get(k).authors.push(pid);
  }
  const opts = [...byText.values()].map((o, i) => ({ id: 'L' + i, text: o.text, authors: o.authors, truth: false, house: false }));
  // Pad with house lies so there are always at least 4 choices.
  const spare = shuffle((f.decoys || []).filter(d => !byText.has(norm(d))), rnd);
  while (opts.length < Math.max(3, Math.min(5, s.players.length)) && spare.length) opts.push({ id: 'H' + opts.length, text: spare.shift(), authors: [], truth: false, house: true });
  opts.push({ id: 'T', text: f.a, authors: [], truth: true, house: false });
  s.options = shuffle(opts, rnd);
}

function startPick(s, now, rnd) { buildOptions(s, rnd); s.phase = 'pick'; s.deadline = now + TIMES.pick; }

function startReveal(s, now) {
  const m = mult(s);
  const g = {};
  s.players.forEach(p => (g[p.pid] = 0));
  for (const [pid, id] of Object.entries(s.picks)) {
    const o = s.options.find(x => x.id === id);
    if (!o) continue;
    if (o.truth) g[pid] += TRUTH_PTS * m;
    else o.authors.forEach(a => { if (a !== pid) g[a] += FOOL_PTS * m; });
  }
  Object.entries(g).forEach(([pid, n]) => (s.scores[pid] = (s.scores[pid] || 0) + n));
  s.gained = g;
  // Reveal only options someone picked (lies first, most-picked last), then the truth.
  const pickedBy = id => Object.values(s.picks).filter(x => x === id).length;
  s.reveal = s.options.filter(o => !o.truth && pickedBy(o.id) > 0).sort((a, b) => pickedBy(a.id) - pickedBy(b.id)).map(o => o.id).concat('T');
  s.step = 0;
  s.phase = 'reveal';
  s.deadline = now + TIMES.step;
}

function nextPrompt(s, now) {
  if (s.n + 1 >= s.facts.length) { s.phase = 'over'; return; }
  s.n++;
  startWrite(s, now);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'write' && a.type === 'safety' && !s.lies[pid]) {
    // "Help me": a stock lie nobody else has used yet.
    const taken = new Set(Object.values(s.lies).map(x => x.toLowerCase()));
    const pool = (fact(s).decoys || []).filter(d => !taken.has(d.toLowerCase()));
    s.lies[pid] = pool.length ? pool[Math.floor(rnd() * pool.length)] : 'a very confused goose';
    if (s.players.every(p => s.lies[p.pid])) startPick(s, now, rnd);
  } else if (s.phase === 'write' && a.type === 'lie') {
    const c = cleanLie(a.text, fact(s));
    if (!c.ok) return s;
    s.lies[pid] = c.text;
    if (s.players.every(p => s.lies[p.pid])) startPick(s, now, rnd);
  } else if (s.phase === 'pick' && a.type === 'pick') {
    const o = s.options.find(x => x.id === a.id);
    if (!o || o.authors.includes(pid)) return s;
    s.picks[pid] = o.id;
    if (s.players.every(p => s.picks[p.pid])) startReveal(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'write') startPick(s, now, rnd);
  else if (s.phase === 'pick') startReveal(s, now);
  else if (s.phase === 'reveal') { s.phase = 'scores'; s.deadline = now + TIMES.scores; }
  else if (s.phase === 'scores') nextPrompt(s, now);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (now < s.deadline) return s;
  if (s.phase === 'write') startPick(s, now, rnd);
  else if (s.phase === 'pick') startReveal(s, now);
  else if (s.phase === 'reveal') {
    if (s.step + 1 < s.reveal.length) { s.step++; s.deadline = now + TIMES.step; }
    else { s.phase = 'scores'; s.deadline = now + TIMES.scores; }
  } else if (s.phase === 'scores') nextPrompt(s, now);
  return s;
}

export function narration(s) {
  const f = fact(s);
  const spoken = f.q.replace('____', 'blank');
  switch (s.phase) {
    case 'write': return s.n === 0
      ? `Here's a strange but true fact. ${spoken} Write a fake answer so convincing that everyone else picks it.`
      : s.n === s.facts.length - 1 ? `Final fact, and it's worth double! ${spoken}` : `Next fact. ${spoken}`;
    case 'pick': return 'Now find the truth. One of these is real.';
    case 'reveal': return '';
    case 'scores': return '';
    case 'over': return 'That\'s the game! The master of lies is on the board.';
  }
  return '';
}

export function cue(s) {
  switch (s.phase) {
    case 'write': return { sound: 'join', wait: 700, title: s.n === s.facts.length - 1 ? 'Final Fact' : `Fact ${s.n + 1}`, sub: s.n === s.facts.length - 1 ? 'Double points!' : 'Write a convincing lie' };
    case 'pick': return { sound: 'vote', wait: 500, title: 'Find the Truth', sub: 'One answer is real' };
    case 'reveal': return { sound: 'drumroll', wait: 0 };
    case 'over': return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'The master of lies', tone: 'dawn', fx: 'confetti' };
  }
  return null;
}

export function botAct(v, rnd = Math.random) {
  const any = a => a[Math.floor(rnd() * a.length)];
  if (v.phase === 'write' && !v.myLie) {
    const f = FACTS.find(x => x.q === v.q);
    return { type: 'lie', text: any(f?.decoys?.length ? f.decoys : ['pancakes', 'seven', 'socks']) };
  }
  if (v.phase === 'pick' && !v.picked && v.options?.length) return { type: 'pick', id: any(v.options).id };
  return null;
}

// ---------- views ----------
const board = s => s.players.map(p => ({ name: p.name, score: s.scores[p.pid] || 0, gained: s.gained[p.pid] || 0 })).sort((a, b) => b.score - a.score);

export function tvView(s, now = Date.now()) {
  const f = fact(s);
  const v = {
    phase: s.phase, n: s.n, total: s.facts.length, double: mult(s) === 2, q: f.q,
    left: Math.max(0, Math.ceil(((s.deadline || 0) - now) / 1000)),
    scores: board(s),
  };
  if (s.phase === 'write') { v.done = Object.keys(s.lies).length; v.need = s.players.length; v.writers = s.players.map(p => ({ name: p.name, done: !!s.lies[p.pid] })); }
  if (s.phase === 'pick') { v.options = s.options.map(o => ({ text: o.text })); v.done = Object.keys(s.picks).length; v.need = s.players.length; }
  if (s.phase === 'reveal' || s.phase === 'scores') {
    const shown = s.phase === 'scores' ? s.reveal.length : s.step + 1;
    v.items = s.reveal.slice(0, shown).map(id => {
      const o = s.options.find(x => x.id === id);
      return {
        text: o.text, truth: o.truth, house: o.house,
        authors: o.authors.map(a => nameOf(s, a)),
        fooled: Object.entries(s.picks).filter(([, x]) => x === id).map(([pid]) => nameOf(s, pid)),
      };
    });
    v.current = s.phase === 'reveal' ? s.step : -1;
    v.answer = f.a;
  }
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const f = fact(s);
  const v = { phase: s.phase, n: s.n, total: s.facts.length, double: mult(s) === 2, q: f.q, myLie: s.lies[pid] || null, score: s.scores[pid] || 0 };
  if (s.phase === 'pick') {
    v.options = s.options.filter(o => !o.authors.includes(pid)).map(o => ({ id: o.id, text: o.text }));
    v.picked = s.picks[pid] || null;
  }
  if (s.phase === 'reveal' || s.phase === 'scores' || s.phase === 'over') {
    const mine = s.options.find(o => o.authors.includes(pid));
    v.fooled = mine ? Object.entries(s.picks).filter(([, x]) => x === mine.id).map(([p]) => nameOf(s, p)) : [];
    v.foundTruth = s.picks[pid] === 'T';
    v.gained = s.gained[pid] || 0;
    v.answer = f.a;
    if (s.phase === 'over') {
      const ranked = board(s);
      v.rank = ranked.findIndex(r => r.name === nameOf(s, pid)) + 1;
      v.of = ranked.length;
    }
  }
  return v;
}

// ---------- renderers ----------
const blank = q => esc(q).replace('____', '<span class="blank">_____</span>');
const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
const pts = n => n.toLocaleString();

export function renderTV(v, el) {
  document.body.classList.toggle('day', ['reveal', 'scores', 'over'].includes(v.phase));
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${pts(p.score)}${p.gained && ['scores', 'over'].includes(v.phase) ? `<small> +${pts(p.gained)}</small>` : ''}</b></div>`).join('')}</div>`;
  const head = `<p class="cat">Fact ${v.n + 1} of ${v.total}${v.double ? ' · <b>Double points</b>' : ''}</p><div class="fact">${blank(v.q)}</div>`;
  const progress = v.need ? `<div class="meter"><span style="width:${(100 * v.done) / v.need}%"></span></div>` : '';
  let h = '';
  if (v.phase === 'write') h = `${head}<p class="say">Write a fake answer on your phone. Make it believable!</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${mmss(v.left)}</p>${progress}<div class="roster">${v.writers.map(w => `<div class="chip ${w.done ? '' : 'waiting'}">${esc(w.name)}${w.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">Stop writing</button>`;
  if (v.phase === 'pick') h = `${head}<p class="say">Which one is the truth? Pick on your phone.</p><div class="answers">${v.options.map((o, i) => `<div class="ans" style="animation-delay:${i * 0.08}s">${esc(o.text)}</div>`).join('')}</div><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${mmss(v.left)}</p>${progress}<button class="btn ghost" data-host="next">Close picks</button>`;
  if (v.phase === 'reveal' || v.phase === 'scores') {
    h = `${head}<div class="reveals">${v.items.map((it, i) => `<div class="rv ${it.truth ? 'truth' : 'lie'} ${i === v.current ? 'now' : ''}">
        <div class="rv-text">${esc(it.text)}</div>
        <div class="rv-tag">${it.truth ? 'THE TRUTH' : it.house ? 'Our lie' : `Lie by ${it.authors.map(esc).join(' & ')}`}</div>
        <div class="rv-who">${it.fooled.length ? (it.truth ? 'Found by ' : 'Fooled ') + it.fooled.map(esc).join(', ') : it.truth ? 'Nobody found it!' : ''}</div>
      </div>`).join('')}</div>${v.phase === 'scores' ? '<button class="btn" data-host="next">Next fact</button>' : ''}`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0]?.name || '')} wins!</h2><p class="say">The master of lies, with ${pts(v.scores[0]?.score || 0)} points.</p><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${pts(p.score)}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  const top = `<p class="muted">Fact ${v.n + 1} of ${v.total}${v.double ? ' · <b>Double points</b>' : ''}</p><div class="fact small">${blank(v.q)}</div>`;
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>';
  else if (v.phase === 'write' && !v.myLie) h = `${top}<form id="lf"><label for="lie">Your fake answer</label><input id="lie" maxlength="30" autocomplete="off" required><p class="lose" id="err"></p><button class="btn" type="submit">Submit lie</button></form><button class="btn ghost" id="safety">🛟 Stuck? Give me one</button><p class="muted">Tip: match the style. A number for a number, a short word for a word.</p>`;
  else if (v.phase === 'write') h = `${top}<h2>Lie locked in</h2><p class="say">"${esc(v.myLie)}"</p><p class="muted">Waiting for everyone else…</p>`;
  else if (v.phase === 'pick') h = `${top}<h2>Find the truth</h2><div class="opts">${v.options.map(o => `<button class="opt ${v.picked === o.id ? 'on' : ''}" data-pick="${esc(o.id)}">${esc(o.text)}</button>`).join('')}</div>${v.picked ? '<p class="muted">Locked in. You can change it until time\'s up.</p>' : '<p class="muted">Your own lie isn\'t on this list.</p>'}`;
  else if (v.phase === 'reveal' || v.phase === 'scores') h = `${top}<h2>${v.foundTruth ? '<span class="win">You found the truth!</span>' : 'Watch the TV…'}</h2><p class="say">The answer: <b>${esc(v.answer)}</b></p>${v.myLie ? `<p>Your lie "${esc(v.myLie)}" fooled ${v.fooled.length ? `<b>${v.fooled.map(esc).join(', ')}</b>` : 'nobody'}.</p>` : ''}${v.phase === 'scores' ? `<p class="say">+${pts(v.gained)} · ${pts(v.score)} total</p>` : ''}`;
  else if (v.phase === 'over') h = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You won!' : `You came ${v.rank} of ${v.of}`}</h2><p class="say">${pts(v.score)} points</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-pick]').forEach(b => (b.onclick = () => send({ type: 'pick', id: b.dataset.pick })));
  const lf = el.querySelector('#lf');
  if (lf) {
    lf.querySelector('#lie').focus();
    lf.onsubmit = e => {
      e.preventDefault();
      // The phone doesn't know the answer, so the TV does the truth check; this only catches the obvious.
      const r = cleanLie(lf.querySelector('#lie').value, null);
      if (!r.ok) { lf.querySelector('#err').textContent = r.why; return; }
      lf.querySelector('button').disabled = true;
      lf.querySelector('#err').textContent = '';
      send({ type: 'lie', text: r.text });
      // If the TV rejects it (it was the truth), the phone stays on this form; tell them why.
      setTimeout(() => { if (document.body.contains(lf)) { lf.querySelector('button').disabled = false; lf.querySelector('#err').textContent = 'That\'s actually the truth! Write a lie instead.'; } }, 4000);
    };
  }
  el.querySelector('#safety')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'safety' }); });
}
