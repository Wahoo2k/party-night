// Secret Agents: two teams, a 5x5 board of words. Each team's spymaster sees which words are their agents
// and gives a one-word clue plus a number. Teammates vote on their phones to pick words. Avoid the trap!
// (Codenames-style word association, with our own name and look.)
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  walk: [
    { text: 'Here is how Secret Agents works. It takes one minute.' },
    { phase: 'clue', text: 'There are two teams. Each team has a spymaster, who can see on their phone which words belong to their team.' },
    { phase: 'clue', text: 'The spymaster gives one word and a number. Ocean, two, means two of our words have to do with the ocean.' },
    { phase: 'guess', text: 'Teammates talk it over and tap the words they think the clue means. A right word keeps your turn going.' },
    { text: 'The first team to find all its words wins. But tap the trap word, and your team loses on the spot.' },
  ],
  id: 'agents',
  teams: true,   // players choose their side on the join screen
  name: 'Secret Agents',
  min: 4,
  max: 16,
  blurb: 'Spymasters give one-word clues to find their team\'s words.',
};

export const WORDS = [
  'Apple', 'Anchor', 'Arrow', 'Bank', 'Bark', 'Bat', 'Battery', 'Beach', 'Bear', 'Bell', 'Bicycle', 'Bird', 'Board', 'Boat', 'Bolt', 'Bomb',
  'Book', 'Boot', 'Bottle', 'Bow', 'Box', 'Bridge', 'Brush', 'Bubble', 'Bug', 'Button', 'Cake', 'Camera', 'Candle', 'Card', 'Castle', 'Cat',
  'Cell', 'Chair', 'Check', 'Cheese', 'Chest', 'Circle', 'Clock', 'Cloud', 'Club', 'Coach', 'Coat', 'Comet', 'Cook', 'Cookie', 'Court', 'Cow',
  'Crane', 'Crown', 'Dance', 'Day', 'Diamond', 'Dog', 'Door', 'Dragon', 'Dream', 'Drill', 'Drum', 'Duck', 'Eagle', 'Egg', 'Engine', 'Eye',
  'Fair', 'Fall', 'Fan', 'Farm', 'Feather', 'Fence', 'Field', 'Fire', 'Fish', 'Flag', 'Flute', 'Fly', 'Foot', 'Fork', 'Fox', 'Frog',
  'Game', 'Ghost', 'Giant', 'Glass', 'Glove', 'Gold', 'Grass', 'Hammer', 'Hand', 'Hat', 'Heart', 'Helmet', 'Honey', 'Hook', 'Horn', 'Horse',
  'Ice', 'Iron', 'Jam', 'Jet', 'Key', 'King', 'Kite', 'Knight', 'Ladder', 'Lamp', 'Leaf', 'Lemon', 'Light', 'Line', 'Lion', 'Lock',
  'Log', 'Magic', 'Map', 'Mask', 'Match', 'Mint', 'Mirror', 'Moon', 'Mouse', 'Nail', 'Net', 'Night', 'Note', 'Nut', 'Ocean', 'Octopus',
  'Orange', 'Organ', 'Paint', 'Palm', 'Pan', 'Paper', 'Park', 'Pen', 'Penguin', 'Piano', 'Pig', 'Pilot', 'Pin', 'Pipe', 'Pirate', 'Pitch',
  'Plane', 'Plate', 'Pool', 'Pop', 'Port', 'Queen', 'Rabbit', 'Racket', 'Rain', 'Ring', 'Robot', 'Rock', 'Rocket', 'Roll', 'Root', 'Rose',
  'Ruler', 'Saddle', 'Sail', 'Scale', 'School', 'Seal', 'Shadow', 'Shark', 'Ship', 'Shoe', 'Shop', 'Shot', 'Sink', 'Skate', 'Snow', 'Sock',
  'Space', 'Spider', 'Spoon', 'Spring', 'Square', 'Star', 'Stick', 'Storm', 'Sun', 'Swing', 'Table', 'Tail', 'Tank', 'Tie', 'Tooth', 'Tower',
  'Track', 'Train', 'Tree', 'Trunk', 'Turtle', 'Wall', 'Watch', 'Wave', 'Web', 'Whale', 'Wheel', 'Whistle', 'Wind', 'Wing', 'Witch', 'Yard',
];
export const TEAMS = ['Team Sun', 'Team Moon'];
const T = s => s.teamNames || TEAMS;   // the names the players gave their teams on the join screen, if they did
export const TIMES = { clue: 120000, guess: 150000, flash: 1500 };

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = t => String(t || '').toLowerCase().replace(/[^a-z]/g, '');

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const sameCrowd = prev?.teamOf && players.every(p => prev.teamOf[p.pid] !== undefined) && Math.abs(players.filter(p => prev.teamOf[p.pid] === 0).length * 2 - players.length) <= 1;
  const teamOf = {};
  // Teams the players chose on the join screen win, as long as each side has at least two people.
  const chosen = opts?.teams && players.every(p => opts.teams[p.pid] === 0 || opts.teams[p.pid] === 1) && [0, 1].every(t => players.filter(p => opts.teams[p.pid] === t).length >= 2);
  if (chosen) players.forEach(p => (teamOf[p.pid] = opts.teams[p.pid]));
  else if (sameCrowd) players.forEach(p => (teamOf[p.pid] = prev.teamOf[p.pid]));
  else shuffle(players.map(p => p.pid), rnd).forEach((pid, i) => (teamOf[pid] = i % 2));
  const team = t => players.filter(p => teamOf[p.pid] === t).map(p => p.pid);
  // Spymasters rotate each game.
  const k = (prev?.round || 0);
  // A real person gives the clues whenever a team has one: a bot can't think of a clue, and can't follow one either.
  const isBot = pid => String(pid).startsWith('bot-');
  const spy = [0, 1].map(t => { const real = team(t).filter(pid => !isBot(pid)), pool = real.length ? real : team(t); return pool[k % pool.length]; });
  const first = Math.floor(rnd() * 2);
  const words = shuffle([...WORDS], rnd).slice(0, 25);
  const key = shuffle([...Array(first === 0 ? 9 : 8).fill(0), ...Array(first === 1 ? 9 : 8).fill(1), ...Array(7).fill('n'), 'x'], rnd);
  return {
    game: 'agents',
    teamNames: Array.isArray(opts?.teamNames) && opts.teamNames.length === 2 ? opts.teamNames.map((n, i) => String(n || TEAMS[i]).slice(0, 18)) : null,
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    teamOf, spy, words, key, revealed: Array(25).fill(false),
    turn: first, phase: 'clue', clue: null, guessesLeft: 0,
    votes: {}, winner: null, why: null, round: k + 1,
    history: [], eventId: 0, lastEvent: null, last: null,
    deadline: Date.now() + TIMES.clue,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const guessers = (s, t) => s.players.filter(p => s.teamOf[p.pid] === t && p.pid !== s.spy[t]).map(p => p.pid);
const left = (s, t) => s.key.filter((k, i) => k === t && !s.revealed[i]).length;
const event = (s, name) => { s.eventId++; s.lastEvent = name; };

function endTurn(s, now) {
  s.turn = 1 - s.turn;
  s.clue = null;
  s.votes = {};
  s.phase = 'clue';
  s.deadline = now + TIMES.clue;
}

function win(s, t, why) { s.winner = t; s.why = why; s.phase = 'over'; event(s, 'over'); }

function reveal(s, i, now) {
  s.revealed[i] = true;
  s.votes = {};
  const k = s.key[i];
  s.last = { i, word: s.words[i], key: k };
  s.history.push({ team: s.turn, word: s.words[i], key: k });
  event(s, k === s.turn ? 'hit' : k === 'x' ? 'trap' : 'miss');
  if (k === 'x') return win(s, 1 - s.turn, 'trap');
  if (left(s, 0) === 0) return win(s, 0, 'found');
  if (left(s, 1) === 0) return win(s, 1, 'found');
  if (k !== s.turn) return endTurn(s, now);
  s.guessesLeft--;
  if (s.guessesLeft <= 0) endTurn(s, now);
}

// A choice goes through once at least half of the team's guessers agree on it.
function tally(s, now) {
  const g = guessers(s, s.turn);
  const need = Math.ceil(g.length / 2);
  const count = {};
  g.forEach(pid => { const v = s.votes[pid]; if (v !== undefined) count[v] = (count[v] || 0) + 1; });
  const pick = Object.entries(count).find(([, n]) => n >= need);
  if (!pick) return;
  if (pick[0] === 'end') endTurn(s, now);
  else reveal(s, Number(pick[0]), now);
}

export function cleanClue(word, board) {
  const w = String(word || '').trim().split(/\s+/)[0] || '';
  if (!/^[A-Za-z'-]{2,20}$/.test(w)) return { ok: false, why: 'One word, letters only.' };
  if (isRude(w)) return { ok: false, why: 'Keep it family-friendly.' };
  const n = norm(w);
  const hit = board.find(b => { const x = norm(b); return x === n || x.includes(n) || n.includes(x); });
  if (hit) return { ok: false, why: `Too close to "${hit}" on the board.` };
  return { ok: true, word: w.toUpperCase() };
}

export function act(s, pid, a, now = Date.now()) {
  if (!P(s, pid) || !a || s.phase === 'over') return s;
  if (s.phase === 'clue' && a.type === 'clue' && pid === s.spy[s.turn]) {
    const c = cleanClue(a.word, s.words.filter((_, i) => !s.revealed[i]));
    const n = Math.max(1, Math.min(9, Math.round(Number(a.n) || 1)));
    if (!c.ok) return s;
    s.clue = { word: c.word, n };
    s.guessesLeft = n + 1;
    s.phase = 'guess';
    s.deadline = now + TIMES.guess;
    event(s, 'clue');
  } else if (s.phase === 'guess' && a.type === 'vote' && s.teamOf[pid] === s.turn && pid !== s.spy[s.turn]) {
    const v = a.i === 'end' ? 'end' : Number(a.i);
    if (v !== 'end' && (!(v >= 0 && v < 25) || s.revealed[v])) return s;
    s.votes[pid] = s.votes[pid] === v ? undefined : v;
    tally(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a === 'next' && (s.phase === 'clue' || s.phase === 'guess')) endTurn(s, now);
  return s;
}

export function tick(s, now = Date.now()) {
  if (s.phase !== 'over' && now >= s.deadline) endTurn(s, now);
  return s;
}

const rot = (lines, k) => lines[((k % lines.length) + lines.length) % lines.length];   // the host does not say the same thing every time
export function narration(s) {
  if (s.phase === 'clue') return s.history.length === 0 && !s.clue ? `Welcome to Secret Agents! ${T(s)[s.turn]} goes first. Spymasters, check your phones for the secret key.` : `${T(s)[s.turn]}, your spymaster is thinking.`;
  if (s.phase === 'guess' && s.lastEvent === 'clue') return `${s.clue.word}, ${s.clue.n}.`;
  if (s.phase === 'over') return s.why === 'trap' ? `Oh no, the trap! ${T(s)[s.winner]} wins!` : `${T(s)[s.winner]} found all their agents and wins!`;
  return '';
}

export function cue(s) {
  if (s.phase === 'clue') return { sound: 'join', wait: 700, title: T(s)[s.turn], sub: 'Spymaster, give a clue' };
  if (s.phase === 'guess') return { sound: 'vote', wait: 300 };
  if (s.phase === 'over') return { sound: s.why === 'trap' ? 'lose' : 'win', wait: 1500, title: `${T(s)[s.winner]} Wins!`, sub: s.why === 'trap' ? 'The other team hit the trap' : 'All agents found', tone: s.why === 'trap' ? 'blood' : 'dawn', fx: s.why === 'trap' ? 'claws' : 'confetti' };
  return null;
}

export function cueEvent(s) {
  if (!s.eventId || !s.last) return null;
  if (s.lastEvent === 'hit') return { id: s.eventId, sound: 'safe', say: rot(['An agent!', 'Good find.', 'That is one of yours.', 'Another agent found.'], s.eventId) };
  if (s.lastEvent === 'miss') return { id: s.eventId, sound: 'death', say: s.last.key === 'n' ? 'A bystander.' : 'That one belongs to the other team!' };
  return null;
}

// Bots know the key (they're for testing), and get it wrong sometimes.
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'clue' && v.isSpy && v.myTurn) {
    const open = v.board.filter(b => !b.revealed).map(b => b.w);
    const word = ['Beep', 'Zap', 'Gizmo', 'Whirr', 'Clank'].find(w => cleanClue(w, open).ok) || 'Hmm';
    return { type: 'clue', word, n: 1 + Math.floor(rnd() * 2) };
  }
  if (v.phase === 'guess' && v.myTurn && !v.isSpy) {
    if (v.humans) return v.humanLead !== null && v.myVote !== v.humanLead ? { type: 'vote', i: v.humanLead } : null;
    const open = v.board.filter(b => !b.revealed);
    // Go along with the card teammates already picked.
    const lead = [...open].sort((a, b) => b.votes.length - a.votes.length)[0];
    if (lead && lead.votes.length && v.myVote !== lead.i) return { type: 'vote', i: lead.i };
    if (v.myVote !== null) return null;
    const mine = open.filter(b => b.k === v.team);
    if (rnd() < 0.08) return { type: 'vote', i: 'end' };
    const pick = rnd() < 0.7 && mine.length ? mine[Math.floor(rnd() * mine.length)] : open[Math.floor(rnd() * open.length)];
    return pick ? { type: 'vote', i: pick.i } : null;
  }
  return null;
}

// ---------- views ----------
function boardFor(s, showKey, withVotes) {
  return s.words.map((w, i) => ({
    i, w, revealed: s.revealed[i],
    k: s.revealed[i] || showKey ? s.key[i] : null,
    votes: withVotes ? Object.entries(s.votes).filter(([, v]) => v === i).map(([pid]) => nameOf(s, pid)) : [],
  }));
}

export function tvView(s, now = Date.now()) {
  return {
    phase: s.phase, turn: s.turn, clue: s.clue, guessesLeft: s.guessesLeft,
    board: boardFor(s, s.phase === 'over', true),
    teams: T(s).map((name, t) => ({ name, left: left(s, t), spy: nameOf(s, s.spy[t]), members: s.players.filter(p => s.teamOf[p.pid] === t && p.pid !== s.spy[t]).map(p => p.name) })),
    endVotes: Object.values(s.votes).filter(v => v === 'end').length,
    left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
    winner: s.winner, why: s.why, last: s.last,
  };
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const t = s.teamOf[pid];
  const isSpy = s.spy[t] === pid;
  const bot = String(pid).startsWith('bot-');
  return {
    phase: s.phase, team: t, teamName: T(s)[t], isSpy, myTurn: s.turn === t, turnName: T(s)[s.turn],
    clue: s.clue, guessesLeft: s.guessesLeft, myVote: s.votes[pid] ?? null,
    board: boardFor(s, isSpy || bot || s.phase === 'over', true),
    need: Math.ceil(guessers(s, s.turn).length / 2), spyName: nameOf(s, s.spy[s.turn]),
    // Bots on a team with real guessers never choose for them: they wait and then back whatever a person picked.
    humans: guessers(s, t).filter(g => !String(g).startsWith('bot-')).length,
    humanLead: (() => { const g = guessers(s, t).find(g => !String(g).startsWith('bot-') && s.votes[g] !== undefined); return g ? s.votes[g] : null; })(),
    left: [left(s, 0), left(s, 1)], winner: s.winner, names: T(s),
  };
}

// ---------- renderers ----------
const KEY_CLASS = k => (k === 0 ? 'k0' : k === 1 ? 'k1' : k === 'x' ? 'kx' : k === 'n' ? 'kn' : '');
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase !== 'over' || v.why !== 'trap');
  const side = `<div class="side">${v.teams.map((t, i) => `<div class="scores team t${i} ${v.turn === i && v.phase !== 'over' ? 'ctl' : ''}"><h3>${esc(t.name)}</h3><div class="tscore">${t.left}</div><p class="muted small">agents left</p><p class="small">Spymaster: <b>${esc(t.spy)}</b></p><p class="muted small">${t.members.map(esc).join(', ')}</p></div>`).join('')}</div>`;
  const grid = `<div class="agrid">${v.board.map(b => `<div class="acard ${b.revealed ? 'rev ' + KEY_CLASS(b.k) : ''} ${v.phase === 'over' && !b.revealed ? 'peek ' + KEY_CLASS(b.k) : ''} ${v.last && v.last.i === b.i ? 'flipnow' : ''}"><span>${esc(b.w)}</span>${b.votes.length ? `<small>${b.votes.map(esc).join(', ')}</small>` : ''}</div>`).join('')}</div>`;
  let status = '';
  if (v.phase === 'clue') status = `<p class="say"><b class="tc${v.turn}">${esc(v.teams[v.turn].name)}</b>: ${esc(v.teams[v.turn].spy)} is thinking of a clue…</p><p class="muted center">The spymaster sees which words belong to the team and types one word that links some of them.</p>`;
  if (v.phase === 'guess') status = `<div class="clueline"><span class="tc${v.turn}">${esc(v.teams[v.turn].name)}</span><b>${esc(v.clue.word)}</b><i>${v.clue.n}</i><small>${v.guessesLeft} guess${v.guessesLeft === 1 ? '' : 'es'} left${v.endVotes ? ` · ${v.endVotes} want to stop` : ''}</small></div><p class="muted center">${esc(v.teams[v.turn].name)}: on your phones, tap the ${v.clue.n} word${v.clue.n === 1 ? '' : 's'} you think go${v.clue.n === 1 ? 'es' : ''} with “${esc(v.clue.word)}”.</p>`;
  if (v.phase === 'over') status = `<h2 class="${v.why === 'trap' ? 'lose' : 'win'}">${v.why === 'trap' ? 'The trap!' : 'All agents found!'} <span class="tc${v.winner}">${esc(v.teams[v.winner].name)}</span> wins</h2><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  const ctl = v.phase === 'over' ? '' : `<button class="btn ghost" data-host="next">End ${esc(v.teams[v.turn].name)}'s turn</button>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${status}${grid}${ctl}</div>${side}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  const grid = clickable => `<div class="agrid small">${v.board.map(b => `<button class="acard ${b.revealed ? 'rev ' + KEY_CLASS(b.k) : v.isSpy || v.phase === 'over' ? 'peek ' + KEY_CLASS(b.k) : ''} ${v.myVote === b.i ? 'mine' : ''}" ${clickable && !b.revealed ? `data-v="${b.i}"` : 'disabled'}><span>${esc(b.w)}</span>${b.votes.length ? `<small>${b.votes.length}</small>` : ''}</button>`).join('')}</div>`;
  const head = `<p class="muted"><b class="tc${v.team}">${esc(v.teamName || '')}</b>${v.isSpy ? ' · <b>Spymaster</b>' : ''} · agents left: ${esc(v.names?.[0] || 'Sun')} ${v.left?.[0]} · ${esc(v.names?.[1] || 'Moon')} ${v.left?.[1]}</p>`;
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2>';
  else if (v.phase === 'over') h = `${head}<h2 class="${v.winner === v.team ? 'win' : 'lose'}">${v.winner === v.team ? 'Your team won!' : 'Your team lost'}</h2>${grid(false)}`;
  else if (v.isSpy && v.phase === 'clue' && v.myTurn) h = `${head}<h2>You give the clue</h2><div class="ahelp"><p>Only you can see the colors. Your team must find the words in <b class="tc${v.team}">your color</b>.</p><p>Type <b>one word</b> that links some of them, and <b>how many</b> it links. Example: <i>ocean 2</i> for WAVE and SHIP.</p><p>Don't lead them to the <b>black trap</b>: picking it loses the game.</p></div>${grid(false)}<form id="af2"><div class="row"><input id="cw" maxlength="20" placeholder="One word" autocomplete="off" required><input id="cn" type="number" inputmode="numeric" min="1" max="9" value="2" class="num" required></div><p class="lose" id="err"></p><button class="btn" type="submit">Send clue</button></form>`;
  else if (v.isSpy) h = `${head}<h2>${v.myTurn ? 'Your team is guessing' : `${esc(v.turnName)}'s turn`}</h2>${v.clue ? `<p class="say">Clue: <b>${esc(v.clue.word)} ${v.clue.n}</b></p>` : ''}<p class="muted">No hints, no faces!</p>${grid(false)}`;
  else if (v.phase === 'guess' && v.myTurn) h = `${head}<div class="clueline small"><b>${esc(v.clue.word)}</b><i>${v.clue.n}</i></div><div class="ahelp"><p>${esc(v.spyName)} says <b>${v.clue.n}</b> word${v.clue.n === 1 ? '' : 's'} on the board go${v.clue.n === 1 ? 'es' : ''} with “<b>${esc(v.clue.word)}</b>”. <b>Tap the one you think it is.</b></p><p>${v.need > 1 ? `It is picked when ${v.need} teammates tap the same word.` : 'Your tap picks it.'} Right: keep going (${v.guessesLeft} guess${v.guessesLeft === 1 ? '' : 'es'} left). Wrong: your turn ends.</p></div>${grid(true)}<button class="btn ghost ${v.myVote === 'end' ? 'on' : ''}" data-v="end">Stop guessing</button>`;
  else h = `${head}<h2>${v.myTurn ? `${esc(v.spyName)} is thinking of a clue…` : `${esc(v.turnName)}'s turn`}</h2><p class="muted">${v.myTurn ? 'Next you will get a one-word clue and tap the words that match it.' : 'Nothing to do until it is your team\'s turn.'}</p>${v.clue && !v.myTurn ? `<p class="say">Their clue: <b>${esc(v.clue.word)} ${v.clue.n}</b></p>` : ''}${grid(false)}`;
  el.innerHTML = h;
  el.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => send({ type: 'vote', i: b.dataset.v === 'end' ? 'end' : Number(b.dataset.v) })));
  const f = el.querySelector('#af2');
  if (f) f.onsubmit = e => {
    e.preventDefault();
    const r = cleanClue(f.querySelector('#cw').value, v.board.filter(b => !b.revealed).map(b => b.w));
    if (!r.ok) { f.querySelector('#err').textContent = r.why; return; }
    f.querySelector('button').disabled = true;
    send({ type: 'clue', word: r.word, n: Number(f.querySelector('#cn').value) });
  };
}
