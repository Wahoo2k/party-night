// Taboo Talk: two teams. The clue-giver describes the word on their phone without saying any of the
// forbidden words; their team shouts guesses. The other team watches the card and can buzz a slip.
import { esc } from '../ui.js';

export const meta = {
  id: 'taboo',
  name: 'Taboo Talk',
  min: 4,
  max: 16,
  blurb: 'Describe the word without saying the forbidden ones.',
};

export const CARDS = [
  ['Pizza', 'cheese', 'slice', 'pepperoni', 'Italian'], ['Beach', 'sand', 'ocean', 'waves', 'sun'], ['Birthday', 'cake', 'party', 'candles', 'presents'],
  ['Dog', 'bark', 'pet', 'puppy', 'cat'], ['Snowman', 'snow', 'carrot', 'winter', 'build'], ['Teacher', 'school', 'class', 'student', 'homework'],
  ['Basketball', 'hoop', 'dribble', 'court', 'NBA'], ['Rainbow', 'colors', 'rain', 'sky', 'arc'], ['Pirate', 'ship', 'treasure', 'parrot', 'captain'],
  ['Moon', 'night', 'sky', 'space', 'full'], ['Pancake', 'syrup', 'breakfast', 'flip', 'batter'], ['Dentist', 'teeth', 'cavity', 'drill', 'floss'],
  ['Airplane', 'fly', 'pilot', 'airport', 'wings'], ['Vampire', 'blood', 'bite', 'Dracula', 'fangs'], ['Popcorn', 'movie', 'butter', 'pop', 'kernel'],
  ['Library', 'books', 'quiet', 'read', 'borrow'], ['Tornado', 'wind', 'storm', 'twister', 'Kansas'], ['Guitar', 'strings', 'play', 'music', 'rock'],
  ['Penguin', 'bird', 'ice', 'Antarctica', 'tuxedo'], ['Camping', 'tent', 'fire', 'outdoors', 'marshmallow'], ['Superhero', 'cape', 'powers', 'save', 'villain'],
  ['Volcano', 'lava', 'erupt', 'mountain', 'hot'], ['Thanksgiving', 'turkey', 'November', 'pie', 'thankful'], ['Halloween', 'costume', 'candy', 'October', 'pumpkin'],
  ['Toothbrush', 'teeth', 'brush', 'paste', 'morning'], ['Elephant', 'trunk', 'big', 'gray', 'ears'], ['Zoo', 'animals', 'cage', 'visit', 'keeper'],
  ['Rocket', 'space', 'launch', 'NASA', 'fly'], ['Cookie', 'chocolate chip', 'bake', 'sweet', 'jar'], ['Soccer', 'ball', 'kick', 'goal', 'field'],
  ['Ice cream', 'cone', 'cold', 'scoop', 'flavor'], ['Doctor', 'hospital', 'sick', 'nurse', 'medicine'], ['Alarm clock', 'wake', 'morning', 'ring', 'snooze'],
  ['Swimming pool', 'water', 'swim', 'dive', 'lifeguard'], ['Grandma', 'grandmother', 'old', 'family', 'cookies'], ['Bicycle', 'pedal', 'wheels', 'ride', 'bike'],
  ['Spider', 'web', 'legs', 'eight', 'bug'], ['Hamburger', 'bun', 'beef', 'grill', 'fries'], ['Castle', 'king', 'queen', 'princess', 'moat'],
  ['Magician', 'magic', 'trick', 'rabbit', 'wand'], ['Fireworks', 'July', 'boom', 'sky', 'colors'], ['Sunglasses', 'sun', 'eyes', 'wear', 'shades'],
  ['Umbrella', 'rain', 'wet', 'open', 'cover'], ['Robot', 'machine', 'metal', 'beep', 'computer'], ['Shark', 'teeth', 'ocean', 'fish', 'fin'],
  ['Chocolate', 'candy', 'sweet', 'brown', 'cocoa'], ['Train', 'tracks', 'choo', 'station', 'ride'], ['Homework', 'school', 'teacher', 'study', 'assignment'],
  ['Mirror', 'reflection', 'look', 'glass', 'see'], ['Cereal', 'milk', 'breakfast', 'bowl', 'spoon'], ['Football', 'ball', 'touchdown', 'quarterback', 'NFL'],
  ['Kangaroo', 'hop', 'pouch', 'Australia', 'joey'], ['Christmas', 'Santa', 'December', 'tree', 'presents'], ['Pumpkin', 'orange', 'Halloween', 'pie', 'carve'],
  ['Bubble', 'soap', 'blow', 'pop', 'bath'], ['Cowboy', 'horse', 'hat', 'ranch', 'Western'], ['Telephone', 'call', 'ring', 'talk', 'phone'],
  ['Bee', 'honey', 'sting', 'buzz', 'hive'], ['Pajamas', 'sleep', 'bed', 'night', 'wear'], ['Wedding', 'marry', 'bride', 'groom', 'ring'],
];
export const TEAMS = ['Team Sun', 'Team Moon'];
const TURNS_PER_TEAM = 3;
export const TIMES = { ready: 20000, turn: 60000, turnEnd: 7000 };

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const sameCrowd = prev?.teamOf && players.every(p => prev.teamOf[p.pid] !== undefined) && Math.abs(players.filter(p => prev.teamOf[p.pid] === 0).length * 2 - players.length) <= 1;
  const teamOf = {};
  if (sameCrowd) players.forEach(p => (teamOf[p.pid] = prev.teamOf[p.pid]));
  else shuffle(players.map(p => p.pid), rnd).forEach((pid, i) => (teamOf[pid] = i % 2));
  return {
    game: 'taboo', perTeam: opts.short ? 2 : TURNS_PER_TEAM,
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    teamOf, teamScore: [0, 0],
    deck: shuffle(CARDS.map((_, i) => i), rnd),
    turn: 0, giverIdx: [0, 0],
    phase: 'ready', deadline: Date.now() + TIMES.ready,
    card: null, log: [], eventId: 0, lastEvent: null,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const team = (s, t) => s.players.filter(p => s.teamOf[p.pid] === t).map(p => p.pid);
const playing = s => s.turn % 2;
const giver = s => { const t = team(s, playing(s)); return t[s.giverIdx[playing(s)] % t.length]; };
const event = (s, name) => { s.eventId++; s.lastEvent = name; };

function draw(s, rnd) {
  if (!s.deck.length) s.deck = shuffle(CARDS.map((_, i) => i), rnd);
  s.card = s.deck.pop();
}

function mark(s, result, rnd, by) {
  s.log.push({ word: CARDS[s.card][0], result, by });
  s.teamScore[playing(s)] += result === 'got' ? 1 : result === 'taboo' ? -1 : 0;
  event(s, result);
  draw(s, rnd);
}

function endTurn(s, now) {
  s.phase = 'turnEnd';
  s.deadline = now + TIMES.turnEnd;
  s.lastTurn = { team: playing(s), giver: nameOf(s, giver(s)), log: s.log };
}

function nextTurn(s, now) {
  s.giverIdx[playing(s)]++;
  s.turn++;
  if (s.turn >= s.perTeam * 2) { s.phase = 'over'; return; }
  s.log = [];
  s.card = null;
  s.phase = 'ready';
  s.deadline = now + TIMES.ready;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'ready' && a.type === 'start' && pid === giver(s)) { s.phase = 'turn'; s.deadline = now + TIMES.turn; s.log = []; draw(s, rnd); event(s, 'start'); }
  else if (s.phase === 'turn' && pid === giver(s) && ['got', 'skip', 'taboo'].includes(a.type)) mark(s, a.type, rnd, pid);
  else if (s.phase === 'turn' && a.type === 'buzz' && s.teamOf[pid] !== playing(s) && a.card === s.card) mark(s, 'taboo', rnd, pid);
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'ready') act(s, giver(s), { type: 'start' }, now, rnd);
  else if (s.phase === 'turn') endTurn(s, now);
  else if (s.phase === 'turnEnd') nextTurn(s, now);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (now < s.deadline) return s;
  return hostAct(s, 'next', now, rnd);
}

export function narration(s) {
  if (s.phase === 'ready') return `${s.turn === 0 ? 'Welcome to Taboo Talk! ' : ''}${TEAMS[playing(s)]}, you're up. ${nameOf(s, giver(s))}, you're giving clues. Press start on your phone when your team is ready.`;
  if (s.phase === 'turnEnd') return `Time! ${TEAMS[s.lastTurn.team]} got ${s.lastTurn.log.filter(l => l.result === 'got').length}.`;
  if (s.phase === 'over') return s.teamScore[0] === s.teamScore[1] ? 'It\'s a tie!' : `${TEAMS[s.teamScore[0] > s.teamScore[1] ? 0 : 1]} wins Taboo Talk!`;
  return '';
}

export function cue(s) {
  if (s.phase === 'ready') return { sound: 'join', wait: 800, title: TEAMS[playing(s)], sub: `${nameOf(s, giver(s))} gives the clues` };
  if (s.phase === 'turn') return { sound: 'vote', wait: 200 };
  if (s.phase === 'turnEnd') return { sound: 'drumroll', wait: 300 };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: 'Game Over', sub: s.teamScore[0] === s.teamScore[1] ? 'It\'s a tie!' : `${TEAMS[s.teamScore[0] > s.teamScore[1] ? 0 : 1]} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.lastEvent === 'got') return { id: s.eventId, sound: 'safe', say: '' };
  if (s.lastEvent === 'taboo') return { id: s.eventId, sound: 'death', say: 'Taboo!' };
  if (s.lastEvent === 'skip') return { id: s.eventId, sound: 'tick', say: '' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'ready' && v.isGiver) return { type: 'start' };
  if (v.phase === 'turn' && v.isGiver) { const r = rnd(); return { type: r < 0.65 ? 'got' : r < 0.9 ? 'skip' : 'taboo' }; }
  return null;
}

// ---------- views ----------
export function tvView(s, now = Date.now()) {
  const v = {
    phase: s.phase, turn: s.turn + 1, turns: s.perTeam * 2, playing: playing(s),
    teams: TEAMS.map((name, t) => ({ name, score: s.teamScore[t], members: team(s, t).map(p => nameOf(s, p)) })),
    giver: nameOf(s, giver(s)), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
    got: s.log.filter(l => l.result === 'got').length, eventId: s.eventId, lastEvent: s.lastEvent,
  };
  if (s.phase === 'turnEnd' || s.phase === 'over') v.lastTurn = s.lastTurn ? { ...s.lastTurn, log: s.lastTurn.log.map(l => ({ word: l.word, result: l.result })) } : null;
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const t = s.teamOf[pid];
  const v = { phase: s.phase, team: TEAMS[t], teamIdx: t, playing: playing(s), isGiver: pid === giver(s), giver: nameOf(s, giver(s)), scores: [...s.teamScore], got: s.log.filter(l => l.result === 'got').length };
  // The card goes to the clue-giver and to the other team (who watch for slips), never to the guessers.
  if (s.phase === 'turn' && (v.isGiver || t !== playing(s)) && s.card !== null) { v.card = CARDS[s.card]; v.cardId = s.card; }
  if (s.phase === 'over') v.won = s.teamScore[t] > s.teamScore[1 - t];
  return v;
}

// ---------- renderers ----------
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const teams = `<div class="side">${v.teams.map((t, i) => `<div class="scores team t${i} ${v.playing === i && v.phase !== 'over' ? 'ctl' : ''}"><h3>${esc(t.name)}</h3><div class="tscore">${t.score}</div><p class="muted small">${t.members.map(esc).join(', ')}</p></div>`).join('')}</div>`;
  let h = `<p class="cat">Turn ${v.turn} of ${v.turns}</p>`;
  if (v.phase === 'ready') h += `<h2><span class="tc${v.playing}">${esc(v.teams[v.playing].name)}</span> is up</h2><p class="say"><b>${esc(v.giver)}</b> gives clues. Their team guesses out loud. The other team watches the card on their phones and buzzes any forbidden word.</p><p class="muted">Waiting for ${esc(v.giver)} to press Start…</p><button class="btn ghost" data-host="next">Start now</button>`;
  if (v.phase === 'turn') h += `<h2>${esc(v.giver)} is describing…</h2><div class="tabooclock ${v.left <= 10 ? 'hurry' : ''}"><span class="clock">${v.left}</span></div><p class="say center">Got so far: <b class="win">${v.got}</b></p><p class="muted center">Guess out loud! No pointing, no "sounds like," no forbidden words.</p><button class="btn ghost" data-host="next">End turn</button>`;
  if (v.phase === 'turnEnd') h += `<h2><span class="tc${v.lastTurn.team}">${esc(v.teams[v.lastTurn.team].name)}</span> got ${v.lastTurn.log.filter(l => l.result === 'got').length}</h2><div class="history">${v.lastTurn.log.map(l => `<span class="${l.result === 'got' ? 'win' : l.result === 'taboo' ? 'lose' : 'muted'}">${esc(l.word)}${l.result === 'taboo' ? ' ✕' : l.result === 'skip' ? ' (skip)' : ' ✓'}</span>`).join('') || '<span>No words this turn</span>'}</div><button class="btn" data-host="next">Next team</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${v.teams[0].score === v.teams[1].score ? 'It\'s a tie!' : `${esc(v.teams[v.teams[0].score > v.teams[1].score ? 0 : 1].name)} wins!`}</h2><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${teams}</div>`;
}

export function renderPhone(v, el, send) {
  let h = `<p class="muted"><b class="tc${v.teamIdx}">${esc(v.team || '')}</b> · Sun ${v.scores?.[0] ?? 0} · Moon ${v.scores?.[1] ?? 0}</p>`;
  const card = () => `<div class="tcard2"><div class="tword">${esc(v.card[0])}</div><div class="tban">${v.card.slice(1).map(w => `<span>${esc(w)}</span>`).join('')}</div></div>`;
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2>';
  else if (v.phase === 'over') h += `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'Your team won!' : v.scores[0] === v.scores[1] ? 'It\'s a tie!' : 'Your team lost'}</h2>`;
  else if (v.phase === 'ready') h += v.isGiver ? `<h2>You're giving clues!</h2><p class="say">Describe each word without saying it or any word on the red list. Your team guesses out loud.</p><button class="btn" data-start>Start (60 seconds)</button>` : v.teamIdx === v.playing ? `<h2>Get ready to guess!</h2><p class="say">${esc(v.giver)} is giving clues. Shout out guesses.</p>` : `<h2>Watch for slips</h2><p class="say">You'll see the card. Buzz if ${esc(v.giver)} says a forbidden word!</p>`;
  else if (v.phase === 'turn' && v.isGiver) h += `${card()}<div class="tbtns"><button class="btn" data-got>Got it! +1</button><button class="btn ghost" data-skip>Skip</button><button class="btn ghost" data-oops>Oops, I said one −1</button></div><p class="muted center">${v.got} so far</p>`;
  else if (v.phase === 'turn' && v.card) h += `${card()}<button class="buzz live" data-buzz>TABOO!</button><p class="muted center">Buzz if ${esc(v.giver)} says the word or a red word.</p>`;
  else if (v.phase === 'turn') h += `<h2>Guess out loud!</h2><p class="say">${esc(v.giver)} is describing. ${v.got} so far.</p>`;
  else if (v.phase === 'turnEnd') h += '<h2>Time!</h2><p class="say">Check the TV.</p>';
  el.innerHTML = h;
  el.querySelector('[data-start]')?.addEventListener('click', () => send({ type: 'start' }));
  el.querySelector('[data-got]')?.addEventListener('click', () => { try { navigator.vibrate?.(30); } catch {} send({ type: 'got' }); });
  el.querySelector('[data-skip]')?.addEventListener('click', () => send({ type: 'skip' }));
  el.querySelector('[data-oops]')?.addEventListener('click', () => send({ type: 'taboo' }));
  el.querySelector('[data-buzz]')?.addEventListener('pointerdown', e => { e.preventDefault(); try { navigator.vibrate?.(80); } catch {} send({ type: 'buzz', card: v.cardId }); });
}
