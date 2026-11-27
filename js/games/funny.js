// Funny Answers: everyone writes answers to silly prompts. Each prompt goes to two players,
// then the room votes for the funnier answer. A final round where everyone answers one prompt.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'funny',
  name: 'Funny Answers',
  min: 3,
  max: 10,
  blurb: 'Answer silly prompts, then the room votes for the funniest.',
};

export const PROMPTS = [
  'The worst thing to say on the first day of school', 'A terrible name for a pet goldfish', 'What the dog is really thinking during dinner',
  'The secret ingredient in Grandma\'s famous pie', 'The worst superpower to have', 'A rejected ice cream flavor',
  'Something you should never say to a pirate', 'The real reason the chicken crossed the road', 'A bad name for a theme park ride',
  'The worst thing to find in your sandwich', 'Something you never want to hear your pilot say', 'A terrible slogan for toothpaste',
  'The title of a cat\'s autobiography', 'What aliens think our cereal is for', 'The worst gift to bring to a birthday party',
  'A weird new family tradition', 'The most useless invention ever', 'A bad name for your car',
  'What the Thanksgiving turkey would say if it could talk', 'An unexpected item in Santa\'s sleigh', 'The worst thing to yell in a library',
  'A strange new Olympic sport', 'The worst job for a vampire', 'What your shoes would say about you',
  'A terrible name for a band', 'Something you\'d hate to find under your bed', 'A rejected crayon color',
  'The worst advice a fortune cookie could give', 'What a snowman does in the summer', 'The worst thing to bring on a camping trip',
  'A new holiday everyone should celebrate', 'What the moon thinks about all night', 'A weird thing to collect',
  'The real reason dinosaurs went extinct', 'A bad name for a restaurant', 'The worst thing a GPS could say',
  'Something you shouldn\'t do at a job interview', 'The weirdest thing to put on a pizza', 'What babies are secretly plotting',
  'A bad motto for a superhero', 'The worst thing to hear from your dentist', 'A terrible theme for a birthday party',
  'What the fridge light does when the door is closed', 'The worst thing to say when meeting a king', 'A bad name for a hamster',
  "A bad thing to hear from your dentist", "The worst flavor of toothpaste", "What cats talk about when we leave",
  "A terrible slogan for a hotel", "The name of a boy band made of dads", "What the Tooth Fairy does with all the teeth",
  "A bad time to start singing", "The worst thing to find in your shoe", "A rejected Olympic sport",
  "What aliens think of Earth after one day", "A surprising thing to see at the grocery store", "The worst theme for a birthday party",
  "Something a superhero's mom would say", "The worst advice a coach could give", "What the family dog would post online",
  "A strange thing to be the world champion of", "The least scary monster", "A bad thing to say on an elevator",
  "What's really at the end of the rainbow", "The worst prize on a game show", "A new rule that should exist at school",
  "Something you shouldn't do at a wedding", "The title of a boring superhero movie", "What the snowman said before melting",
  "A terrible name for a sports team", "The worst thing to pack for the beach", "What the moon is made of, really",
  "Something a wizard would complain about", "A bad name for a perfume", "A suspicious thing to hear from a babysitter",
  "The real reason dinosaurs disappeared", "A strange item on a kids' menu", "What grandparents do when nobody's watching",
  "The worst mascot for a cereal", "A bad thing to yell at a library", "Something you'd find in a giant's pocket",
  "The least useful thing in a toolbox", "A terrible title for a lullaby", "What your pet thinks your job is",
  "The worst thing to bring to show-and-tell", "A rule pirates always follow", "A bad thing to hear from a pilot",
  "The strangest thing to put on a pizza", "What trees gossip about", "A terrible name for a superhero's sidekick",
  "The worst way to wake someone up", "A holiday that should exist", "Something a robot would be afraid of",
  "The worst song to play at a wedding", "What's really inside a piñata", "A bad invention for the kitchen",
  "The motto of a very lazy army", "A strange thing to say when you meet a king", "The worst present from a grandparent",
  "What squirrels are really planning", "A bad name for a roller coaster", "The first rule of the secret club in the treehouse",
  'The worst thing to hear from your GPS', 'A bad name for a roller coaster', 'What the tooth fairy does with all those teeth', 'The least helpful thing to pack for a camping trip',
  'A sign you should not eat at this restaurant', 'The worst theme for a birthday party', 'What the cat knocked off the table this time', 'A terrible thing to yell at a soccer game',
  'The real reason the WiFi is slow', 'A bad slogan for a dentist', 'What Bigfoot does on weekends', 'The worst song to play at a wedding', 'A rejected name for a superhero',
  'Something you should never put in a blender', 'The strangest thing to find under the couch', 'What the snowman said before he melted', 'A bad excuse for being late to dinner',
  'The worst flavor of toothpaste', 'What the school bus driver is really thinking', 'A terrible new rule for the house', 'The least scary monster ever', 'What a pirate orders at a drive-through',
  'A bad thing to hear from the pilot', 'The worst thing to bring to show and tell',
];
export const FINALS = [
  'Describe this group in three words', 'The title of a movie about tonight', 'The best excuse for being late to a family dinner',
  'The headline if this group made the news', 'A secret talent nobody here knows you have',
];
export const BOT_LINES = [
  'Three raccoons in a trench coat', 'A suspicious amount of glitter', 'Grandma\'s secret recipe', 'Socks with sandals',
  'A very confused goose', 'Mashed potato sculpture', 'An angry pancake', 'Way too many llamas', 'Interpretive dance',
  'A haunted toaster', 'The world\'s smallest piano', 'Whatever is in the back of the fridge', 'Rubber duck army',
];

const ROUNDS = 2;              // matchup rounds; then the final
const PTS = 100;
export const TIMES = { write: 90000, vote: 20000, result: 6000, finalWrite: 60000, finalVote: 30000, finalResult: 9000 };

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function cleanAnswer(t) {
  const s = String(t || '').normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/[<>{}\[\]\\`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 45);
  if (!s) return { ok: false, why: 'Write something first!' };
  if (isRude(s)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: s };
}

export function setup(players, rnd = Math.random, prev = null) {
  const used = new Set(prev?.usedPrompts || []);
  let pool = PROMPTS.map((_, i) => i).filter(i => !used.has(i));
  if (pool.length < players.length * ROUNDS) pool = PROMPTS.map((_, i) => i);
  const scores = {};
  players.forEach(p => (scores[p.pid] = 0));
  const s = {
    game: 'funny',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    pool: shuffle(pool, rnd), round: 0, scores,
    finalPrompt: FINALS[Math.floor(rnd() * FINALS.length)],
    usedPrompts: [...used].slice(-30),
    eventId: 0,
  };
  startRound(s, Date.now(), rnd);
  return s;
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const mult = s => s.round + 1;

function startRound(s, now, rnd) {
  const order = shuffle(s.players.map(p => p.pid), rnd);
  const n = order.length;
  // Prompt k goes to players k and k+1 (wrapping), so everyone gets two prompts and two opponents.
  s.matchups = order.map((pid, k) => {
    const prompt = s.pool.pop() ?? Math.floor(rnd() * PROMPTS.length);
    s.usedPrompts.push(prompt);
    return { prompt, a: pid, b: order[(k + 1) % n], answers: {}, votes: {} };
  });
  s.m = 0;
  s.phase = 'write';
  s.deadline = now + TIMES.write;
}

const myMatchups = (s, pid) => s.matchups.map((m, i) => ({ ...m, i })).filter(m => m.a === pid || m.b === pid);
const allWritten = s => s.matchups.every(m => m.answers[m.a] !== undefined && m.answers[m.b] !== undefined);
const voters = (s, m) => s.players.filter(p => p.pid !== m.a && p.pid !== m.b).map(p => p.pid);

function fillBlanks(s) {
  s.matchups.forEach(m => [m.a, m.b].forEach(pid => { if (m.answers[pid] === undefined) m.answers[pid] = ''; }));
}

function startVote(s, now) { fillBlanks(s); s.m = 0; s.phase = 'vote'; s.deadline = now + TIMES.vote; }

function score(s) {
  const m = s.matchups[s.m];
  const count = { [m.a]: 0, [m.b]: 0 };
  Object.values(m.votes).forEach(v => (count[v] = (count[v] || 0) + 1));
  const total = count[m.a] + count[m.b];
  const g = { [m.a]: count[m.a] * PTS * mult(s), [m.b]: count[m.b] * PTS * mult(s) };
  // A sweep (every vote) earns a bonus; a blank answer forfeits to the other player.
  [m.a, m.b].forEach(pid => { if (total > 0 && count[pid] === total) g[pid] += 100 * mult(s); });
  if (!m.answers[m.a] && m.answers[m.b]) g[m.b] += 100 * mult(s);
  if (!m.answers[m.b] && m.answers[m.a]) g[m.a] += 100 * mult(s);
  // The audience's favorite earns a small bonus.
  const aud = Object.values(m.aud || {}), na = aud.filter(x => x === m.a).length, nb = aud.length - na;
  if (na !== nb) { m.crowd = na > nb ? m.a : m.b; g[m.crowd] += 50 * mult(s); }
  Object.entries(g).forEach(([pid, n]) => (s.scores[pid] += n));
  m.count = count; m.gained = g; m.sweep = total > 0 && (count[m.a] === total || count[m.b] === total) ? (count[m.a] === total ? m.a : m.b) : null;
}

function nextMatchup(s, now, rnd) {
  if (s.m + 1 < s.matchups.length) { s.m++; s.phase = 'vote'; s.deadline = now + TIMES.vote; return; }
  if (s.round + 1 < ROUNDS) { s.round++; startRound(s, now, rnd); return; }
  s.round = ROUNDS;
  s.final = { answers: {}, votes: {} };
  s.phase = 'finalWrite';
  s.deadline = now + TIMES.finalWrite;
}

function finalScore(s, now) {
  const count = {};
  Object.values(s.final.votes).forEach(v => (count[v] = (count[v] || 0) + 1));
  Object.entries(count).forEach(([pid, n]) => (s.scores[pid] += n * PTS * 3));
  s.final.count = count;
  s.phase = 'finalResult';
  s.deadline = now + TIMES.finalResult;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'write' && a.type === 'answer') {
    const m = s.matchups[a.m];
    if (!m || (m.a !== pid && m.b !== pid)) return s;
    const c = cleanAnswer(a.text);
    if (!c.ok) return s;
    m.answers[pid] = c.text;
    if (allWritten(s)) startVote(s, now);
  } else if (s.phase === 'vote' && a.type === 'vote') {
    const m = s.matchups[s.m];
    if (!voters(s, m).includes(pid) || (a.pick !== m.a && a.pick !== m.b)) return s;
    m.votes[pid] = a.pick;
    if (voters(s, m).every(v => m.votes[v])) { score(s); s.phase = 'result'; s.deadline = now + TIMES.result; }
  } else if (s.phase === 'finalWrite' && a.type === 'answer') {
    const c = cleanAnswer(a.text);
    if (!c.ok) return s;
    s.final.answers[pid] = c.text;
    if (s.players.every(p => s.final.answers[p.pid] !== undefined)) { s.phase = 'finalVote'; s.deadline = now + TIMES.finalVote; }
  } else if (s.phase === 'finalVote' && a.type === 'vote' && a.pick !== pid && s.final.answers[a.pick]) {
    s.final.votes[pid] = a.pick;
    if (s.players.every(p => s.final.votes[p.pid] || Object.keys(s.final.answers).filter(x => x !== p.pid && s.final.answers[x]).length === 0)) finalScore(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'write') startVote(s, now);
  else if (s.phase === 'vote') { score(s); s.phase = 'result'; s.deadline = now + TIMES.result; }
  else if (s.phase === 'result') nextMatchup(s, now, rnd);
  else if (s.phase === 'finalWrite') { s.phase = 'finalVote'; s.deadline = now + TIMES.finalVote; }
  else if (s.phase === 'finalVote') finalScore(s, now);
  else if (s.phase === 'finalResult') s.phase = 'over';
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (now < s.deadline) return s;
  return hostAct(s, 'next', now, rnd);
}

export function narration(s) {
  switch (s.phase) {
    case 'write': return s.round === 0 ? 'Welcome to Funny Answers! Check your phone and answer your two prompts. Funny beats true!' : 'Round two, and points are doubled. Get writing!';
    case 'vote': { const m = s.matchups[s.m]; return `${PROMPTS[m.prompt]}.`; }
    case 'finalWrite': return `Final round! Everyone answers the same prompt. ${s.finalPrompt}.`;
    case 'finalVote': return 'Vote for your favorite!';
    case 'over': return 'That\'s the game!';
  }
  return '';
}

export function cue(s) {
  switch (s.phase) {
    case 'write': return { sound: 'join', wait: 800, title: s.round === 0 ? 'Funny Answers' : 'Round 2', sub: s.round === 0 ? 'Answer your prompts' : 'Double points!' };
    case 'vote': return { sound: 'stamp', after: 'stamp', wait: 750 };
    case 'result': { const m = s.matchups[s.m]; return { sound: m.sweep ? 'win' : 'safe', wait: 300, fx: m.sweep ? 'confetti' : null, react: m.sweep ? 'cheer' : 'laugh', flash: m.sweep ? 'gold' : null }; }
    case 'finalWrite': return { sound: 'drumroll', wait: 1800, title: 'Final Round', sub: 'Everyone answers one prompt', tone: 'night' };
    case 'finalVote': return { sound: 'vote', wait: 400 };
    case 'finalResult': return { sound: 'win', wait: 900 };
    case 'over': return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'Funniest in the room', tone: 'dawn', fx: 'confetti' };
  }
  return null;
}

export function botAct(v, rnd = Math.random) {
  const any = a => a[Math.floor(rnd() * a.length)];
  if (v.phase === 'write') { const todo = v.mine.find(m => m.answer === null); return todo ? { type: 'answer', m: todo.i, text: any(BOT_LINES) } : null; }
  if (v.phase === 'vote' && v.canVote && !v.voted) return { type: 'vote', pick: any(v.options).pid };
  if (v.phase === 'finalWrite' && v.myFinal === null) return { type: 'answer', text: any(BOT_LINES) };
  if (v.phase === 'finalVote' && !v.voted && v.options?.length) return { type: 'vote', pick: any(v.options).pid };
  return null;
}

// ---------- views ----------
const board = s => s.players.map(p => ({ name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, round: s.round + 1, scores: board(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), eventId: s.eventId };
  if (s.phase === 'write') { v.waiting = s.players.filter(p => myMatchups(s, p.pid).some(m => m.answers[p.pid] === undefined)).map(p => p.name); v.total = s.players.length; }
  if (s.phase === 'vote' || s.phase === 'result') {
    const m = s.matchups[s.m];
    // Answers are shown anonymously until the result.
    v.prompt = PROMPTS[m.prompt]; v.n = s.m + 1; v.of = s.matchups.length;
    v.answers = [m.a, m.b].map(pid => ({ text: m.answers[pid] || '(no answer)', name: s.phase === 'result' ? nameOf(s, pid) : null, votes: s.phase === 'result' ? m.count[pid] : null, gained: s.phase === 'result' ? m.gained[pid] : null, sweep: s.phase === 'result' && m.sweep === pid, crowd: s.phase === 'result' && m.crowd === pid, voters: s.phase === 'result' ? Object.entries(m.votes).filter(([, x]) => x === pid).map(([p]) => nameOf(s, p)) : [] }));
    v.votesIn = Object.keys(m.votes).length; v.need = voters(s, m).length;
  }
  if (s.phase.startsWith('final')) {
    v.prompt = s.finalPrompt;
    v.answersIn = Object.keys(s.final.answers).length; v.total = s.players.length;
    if (s.phase !== 'finalWrite') v.list = Object.entries(s.final.answers).filter(([, t]) => t).map(([pid, text]) => ({ text, name: s.phase === 'finalResult' ? nameOf(s, pid) : null, votes: s.phase === 'finalResult' ? s.final.count[pid] || 0 : null }));
    if (s.phase === 'finalResult') v.list.sort((a, b) => b.votes - a.votes);
  }
  if (s.phase === 'over') {
    // The answer that won its matchup by the biggest share of votes.
    let best = null;
    for (const m of s.matchups) for (const pid of [m.a, m.b]) { const n = m.count?.[pid] || 0, tot = (m.count?.[m.a] || 0) + (m.count?.[m.b] || 0); if (m.answers[pid] && tot && (!best || n / tot > best.share || (n / tot === best.share && n > best.n))) best = { share: n / tot, n, text: m.answers[pid], name: nameOf(s, pid), prompt: PROMPTS[m.prompt] }; }
    if (best && best.n) v.quip = best;
  }
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, score: s.scores[pid], round: s.round + 1 };
  if (s.phase === 'write') v.mine = myMatchups(s, pid).map(m => ({ i: m.i, prompt: PROMPTS[m.prompt], answer: m.answers[pid] ?? null }));
  if (s.phase === 'vote' || s.phase === 'result') {
    const m = s.matchups[s.m];
    v.prompt = PROMPTS[m.prompt];
    v.mineUp = m.a === pid || m.b === pid;
    v.canVote = voters(s, m).includes(pid);
    v.voted = m.votes[pid] || null;
    v.options = [m.a, m.b].map(p => ({ pid: p, text: m.answers[p] || '(no answer)' }));
    if (s.phase === 'result' && v.mineUp) v.gained = m.gained[pid];
  }
  if (s.phase.startsWith('final')) {
    v.prompt = s.finalPrompt; v.myFinal = s.final.answers[pid] ?? null; v.voted = s.final.votes[pid] || null;
    if (s.phase === 'finalVote') v.options = Object.entries(s.final.answers).filter(([p, t]) => p !== pid && t).map(([p, text]) => ({ pid: p, text }));
  }
  if (s.phase === 'over' || s.phase === 'finalResult') { const r = board(s); v.rank = r.findIndex(x => x.name === nameOf(s, pid)) + 1; v.of = r.length; }
  return v;
}

// ---------- renderers ----------
export function renderTV(v, el) {
  document.body.classList.toggle('day', ['result', 'finalResult', 'over'].includes(v.phase));
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'write') h = `<p class="cat">Round ${v.round}${v.round > 1 ? ' · double points' : ''}</p><h2>Answer your prompts</h2><p class="say">Check your phone. Each prompt goes head-to-head against one other player.</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p>${v.waiting.length ? `<p class="muted">Still writing: ${v.waiting.map(esc).join(', ')}</p>` : ''}<button class="btn ghost" data-host="next">Stop writing</button>`;
  if (v.phase === 'vote' || v.phase === 'result') {
    h = `<p class="cat">Matchup ${v.n} of ${v.of} · Round ${v.round}</p><div class="cq">${esc(v.prompt)}</div><div class="faceoff ${v.phase}">${v.answers.map((a, i) => `<div class="fa ${v.phase === 'result' && a.votes > v.answers[1 - i].votes ? 'won' : ''}" style="animation-delay:${i * 0.25}s"><div class="fa-text">${esc(a.text)}</div>${v.phase === 'result' ? `<div class="fa-by">${esc(a.name)}${a.crowd ? ' · 👏 crowd favorite' : ''}${a.sweep ? ' · <b class="win">SWEEP!</b>' : ''}</div><div class="fa-votes">${a.votes} vote${a.votes === 1 ? '' : 's'} · +${a.gained}</div><small class="muted">${a.voters.map(esc).join(', ')}</small>` : ''}</div>`).join('<b class="vs">vs</b>')}</div>`;
    h += v.phase === 'vote' ? `<p class="say center">Vote for the funnier answer on your phone!</p><div class="meter"><span style="width:${v.need ? (100 * v.votesIn) / v.need : 0}%"></span></div><button class="btn ghost" data-host="next">Close voting</button>` : '<button class="btn" data-host="next">Next</button>';
  }
  if (v.phase === 'finalWrite') h = `<p class="cat">Final round · triple points</p><div class="cq">${esc(v.prompt)}</div><p class="say">Everyone answers on their phone.</p><div class="meter"><span style="width:${(100 * v.answersIn) / v.total}%"></span></div><button class="btn ghost" data-host="next">Stop writing</button>`;
  if (v.phase === 'finalVote' || v.phase === 'finalResult') h = `<p class="cat">Final round</p><div class="cq">${esc(v.prompt)}</div><div class="answers">${v.list.map((a, i) => `<div class="ans" style="animation-delay:${i * 0.08}s">${esc(a.text)}${a.name ? `<small class="muted"> · ${esc(a.name)} · <b class="win">${a.votes}</b></small>` : ''}</div>`).join('')}</div>${v.phase === 'finalVote' ? '<p class="say">Vote for your favorite (not your own!)</p><button class="btn ghost" data-host="next">Close voting</button>' : '<button class="btn" data-host="next">See the winner</button>'}`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0]?.name || '')} is the funniest!</h2>${v.quip ? `<div class="quip"><small>Quip of the night · ${esc(v.quip.prompt)}</small><b>“${esc(v.quip.text)}”</b><span>${esc(v.quip.name)}</span></div>` : ''}<div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2>';
  else if (v.phase === 'write') {
    const todo = v.mine.find(m => m.answer === null);
    h = todo ? `<p class="muted">Prompt ${v.mine.indexOf(todo) + 1} of ${v.mine.length}</p><p class="tq small">${esc(todo.prompt)}</p><form id="ff"><input id="fa" maxlength="45" autocomplete="off" required placeholder="Make it funny…"><p class="lose" id="err"></p><button class="btn" type="submit">Send</button></form><button class="btn ghost" id="safety" type="button">🛟 Stuck? Give me one</button>` : '<h2>All done!</h2><p class="say">Waiting for everyone else…</p>';
    if (todo) { el.innerHTML = h; const f = el.querySelector('#ff'); f.querySelector('input').focus(); el.querySelector('#safety').onclick = () => { f.querySelector('input').value = BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)]; }; f.onsubmit = e => { e.preventDefault(); const r = cleanAnswer(f.querySelector('input').value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'answer', m: todo.i, text: r.text }); }; return; }
  } else if (v.phase === 'vote') h = `<p class="tq small">${esc(v.prompt)}</p>${v.mineUp ? '<h2>That\'s yours!</h2><p class="say">Sit back while the room votes.</p>' : v.canVote ? `<h2>Which is funnier?</h2><div class="opts">${v.options.map(o => `<button class="opt ${v.voted === o.pid ? 'on' : ''}" data-pick="${esc(o.pid)}">${esc(o.text)}</button>`).join('')}</div>` : '<p class="say">Watch the TV!</p>'}`;
  else if (v.phase === 'result') h = `<p class="tq small">${esc(v.prompt)}</p>${v.mineUp ? `<h2 class="${v.gained ? 'win' : ''}">+${v.gained}</h2>` : ''}<p class="muted">${v.score.toLocaleString()} points</p>`;
  else if (v.phase === 'finalWrite') {
    if (v.myFinal === null) { el.innerHTML = `<p class="muted">Final round</p><p class="tq small">${esc(v.prompt)}</p><form id="ff"><input id="fa" maxlength="45" autocomplete="off" required><p class="lose" id="err"></p><button class="btn" type="submit">Send</button></form><button class="btn ghost" id="safety" type="button">🛟 Stuck? Give me one</button>`; const f = el.querySelector('#ff'); f.querySelector('input').focus(); el.querySelector('#safety').onclick = () => { f.querySelector('input').value = BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)]; }; f.onsubmit = e => { e.preventDefault(); const r = cleanAnswer(f.querySelector('input').value); if (!r.ok) { f.querySelector('#err').textContent = r.why; return; } f.querySelector('button').disabled = true; send({ type: 'answer', text: r.text }); }; return; }
    h = '<h2>Answer in!</h2><p class="say">Waiting for everyone…</p>';
  } else if (v.phase === 'finalVote') h = `<p class="tq small">${esc(v.prompt)}</p><h2>Vote for your favorite</h2><div class="opts">${v.options.map(o => `<button class="opt ${v.voted === o.pid ? 'on' : ''}" data-pick="${esc(o.pid)}">${esc(o.text)}</button>`).join('')}</div>`;
  else if (v.phase === 'finalResult' || v.phase === 'over') h = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You\'re the funniest!' : `You came ${v.rank} of ${v.of}`}</h2><p class="say">${v.score.toLocaleString()} points</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-pick]').forEach(b => (b.onclick = () => send({ type: 'vote', pick: b.dataset.pick })));
}

// The audience votes on each matchup too; their favorite gets a small bonus.
export function audienceView(s, pid) {
  if (s.phase !== 'vote') return null;
  const m = s.matchups[s.m];
  if (!m.answers[m.a] || !m.answers[m.b]) return null;
  return { q: PROMPTS[m.prompt], options: [m.a, m.b].map(p => ({ v: p, label: m.answers[p] })), picked: m.aud?.[pid] || null };
}
export function audienceAct(s, pid, a) {
  if (s.phase !== 'vote' || a?.type !== 'aud') return;
  const m = s.matchups[s.m];
  if (a.pick === m.a || a.pick === m.b) (m.aud = m.aud || {})[pid] = a.pick;
}
