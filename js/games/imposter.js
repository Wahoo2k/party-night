// Imposter: everyone gets the same secret word except one player, who only knows the category.
// Players take turns typing a one-word clue, then vote on who's faking.
// If the imposter is caught, they get one guess at the word to steal the win.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'imposter',
  name: 'Imposter',
  min: 4,
  max: 12,
  blurb: 'Everyone knows the secret word except one faker. Give clues, then find the imposter.',
};

// Each secret word, with a few good one-word hints (bots use these as clues).
export const WORDS = {
  "Animals": {
    "Penguin": ["ice", "tuxedo", "waddle"],
    "Giraffe": ["neck", "tall", "spots"],
    "Kangaroo": ["pouch", "hop", "Australia"],
    "Octopus": ["tentacles", "ink", "eight"],
    "Elephant": ["trunk", "ivory", "memory"],
    "Squirrel": ["acorn", "bushy", "tree"],
    "Shark": ["fin", "teeth", "jaws"],
    "Owl": ["hoot", "night", "wise"],
    "Zebra": ["stripes", "Africa", "safari"],
    "Turtle": ["shell", "slow", "pond"],
    "Flamingo": ["pink", "leg", "lawn"],
    "Hedgehog": ["spiky", "roll", "quills"],
    "Camel": ["hump", "desert", "thirst"],
    "Dolphin": ["flipper", "clicks", "smart"],
    "Spider": ["web", "legs", "creepy"],
  },
  "Food": {
    "Pizza": ["slice", "cheese", "delivery"],
    "Pancakes": ["syrup", "stack", "flip"],
    "Tacos": ["shell", "Tuesday", "salsa"],
    "Sushi": ["rice", "raw", "chopsticks"],
    "Popcorn": ["movie", "butter", "kernel"],
    "Spaghetti": ["noodles", "meatballs", "twirl"],
    "Burrito": ["wrap", "beans", "tortilla"],
    "Waffles": ["squares", "syrup", "iron"],
    "Pretzel": ["twist", "salty", "mall"],
    "Nachos": ["chips", "melted", "stadium"],
    "Lasagna": ["layers", "Garfield", "baked"],
    "Cupcake": ["frosting", "sprinkles", "party"],
    "Hot dog": ["bun", "mustard", "ballpark"],
    "Pickle": ["dill", "sour", "jar"],
    "Watermelon": ["seeds", "summer", "juicy"],
  },
  "Places": {
    "Beach": ["sand", "waves", "towel"],
    "Airport": ["gate", "luggage", "security"],
    "Library": ["books", "quiet", "shush"],
    "Hospital": ["nurse", "doctor", "emergency"],
    "Zoo": ["cages", "animals", "exhibits"],
    "Movie theater": ["screen", "popcorn", "seats"],
    "Castle": ["king", "moat", "tower"],
    "Desert": ["sand", "cactus", "dry"],
    "Volcano": ["lava", "eruption", "ash"],
    "Museum": ["exhibit", "statue", "history"],
    "Space station": ["orbit", "astronaut", "gravity"],
    "Farm": ["barn", "tractor", "cows"],
    "Gym": ["weights", "sweat", "treadmill"],
    "Bowling alley": ["pins", "strike", "shoes"],
    "Ski lodge": ["fireplace", "slopes", "cocoa"],
  },
  "Jobs": {
    "Firefighter": ["hose", "ladder", "siren"],
    "Astronaut": ["rocket", "moon", "helmet"],
    "Chef": ["kitchen", "recipe", "apron"],
    "Dentist": ["teeth", "floss", "drill"],
    "Pilot": ["cockpit", "wings", "runway"],
    "Teacher": ["classroom", "homework", "chalk"],
    "Plumber": ["pipes", "wrench", "leak"],
    "Magician": ["wand", "rabbit", "tricks"],
    "Lifeguard": ["whistle", "pool", "rescue"],
    "Detective": ["clues", "magnifying", "mystery"],
    "Farmer": ["crops", "tractor", "overalls"],
    "Mail carrier": ["letters", "stamps", "mailbox"],
    "Barber": ["haircut", "clippers", "pole"],
    "Referee": ["whistle", "stripes", "foul"],
    "Zookeeper": ["feeding", "animals", "cages"],
  },
  "Sports": {
    "Soccer": ["goal", "kick", "cleats"],
    "Basketball": ["hoop", "dribble", "court"],
    "Tennis": ["racket", "serve", "love"],
    "Golf": ["club", "hole", "tee"],
    "Hockey": ["puck", "ice", "stick"],
    "Baseball": ["bat", "diamond", "inning"],
    "Bowling": ["pins", "strike", "lane"],
    "Surfing": ["wave", "board", "wipeout"],
    "Skiing": ["slopes", "poles", "lift"],
    "Boxing": ["gloves", "ring", "punch"],
    "Volleyball": ["spike", "net", "sand"],
    "Swimming": ["laps", "goggles", "pool"],
    "Karate": ["belt", "chop", "dojo"],
    "Skateboarding": ["ramp", "wheels", "ollie"],
    "Archery": ["arrow", "bow", "target"],
  },
  "Around the house": {
    "Toaster": ["bread", "crumbs", "pop"],
    "Vacuum": ["suction", "carpet", "dust"],
    "Bathtub": ["bubbles", "soak", "faucet"],
    "Couch": ["cushions", "sit", "nap"],
    "Fridge": ["cold", "magnets", "leftovers"],
    "Lamp": ["bulb", "shade", "light"],
    "Toothbrush": ["bristles", "paste", "brush"],
    "Pillow": ["fluffy", "sleep", "case"],
    "Microwave": ["beep", "reheat", "zap"],
    "Doorbell": ["ring", "visitor", "ding"],
    "Ceiling fan": ["spin", "blades", "breeze"],
    "Laundry basket": ["clothes", "hamper", "dirty"],
    "Remote control": ["buttons", "channel", "clicker"],
    "Mirror": ["reflection", "glass", "selfie"],
    "Staircase": ["steps", "railing", "climb"],
  },
  "Things": {
    "Umbrella": ["rain", "open", "handle"],
    "Backpack": ["straps", "school", "zipper"],
    "Bicycle": ["pedals", "wheels", "helmet"],
    "Guitar": ["strings", "strum", "chords"],
    "Camera": ["photo", "lens", "flash"],
    "Balloon": ["helium", "float", "pop"],
    "Candle": ["wax", "flame", "wick"],
    "Scissors": ["cut", "blades", "paper"],
    "Trampoline": ["bounce", "jump", "springs"],
    "Telescope": ["stars", "lens", "planets"],
    "Skateboard": ["wheels", "deck", "ramp"],
    "Snow globe": ["shake", "glass", "flakes"],
    "Kite": ["string", "wind", "tail"],
    "Compass": ["north", "needle", "directions"],
    "Headphones": ["music", "ears", "wireless"],
  },
  "Holidays": {
    "Thanksgiving": ["turkey", "pie", "gratitude"],
    "Halloween": ["costume", "candy", "pumpkin"],
    "Christmas": ["tree", "Santa", "presents"],
    "Birthday": ["cake", "candles", "party"],
    "New Year": ["midnight", "countdown", "resolution"],
    "Fourth of July": ["fireworks", "flag", "cookout"],
    "Valentine's Day": ["hearts", "roses", "love"],
    "Easter": ["eggs", "bunny", "basket"],
    "Graduation": ["cap", "gown", "diploma"],
    "Wedding": ["bride", "rings", "vows"],
    "Hanukkah": ["menorah", "candles", "dreidel"],
    "Super Bowl": ["football", "commercials", "halftime"],
    "Mother's Day": ["flowers", "mom", "brunch"],
    "April Fools": ["prank", "joke", "gotcha"],
    "Snow day": ["sledding", "cancelled", "shovel"],
  },
  "Weather": {
    "Tornado": ["funnel", "Kansas", "twister"],
    "Rainbow": ["colors", "arc", "gold"],
    "Blizzard": ["whiteout", "snow", "cold"],
    "Thunderstorm": ["rumble", "lightning", "rain"],
    "Heat wave": ["hot", "sweat", "sun"],
    "Fog": ["mist", "gray", "hazy"],
    "Hail": ["ice", "balls", "dents"],
    "Hurricane": ["eye", "coast", "evacuate"],
    "Drizzle": ["light", "sprinkle", "damp"],
    "Sunset": ["orange", "evening", "horizon"],
    "Snowflake": ["unique", "crystal", "frozen"],
    "Lightning": ["bolt", "flash", "strike"],
    "Breeze": ["gentle", "wind", "cool"],
    "Icicle": ["drip", "frozen", "pointy"],
    "Puddle": ["splash", "boots", "rain"],
  },
  "Movies": {
    "Superhero": ["cape", "powers", "villain"],
    "Cartoon": ["animated", "drawn", "Saturday"],
    "Horror": ["scary", "scream", "ghost"],
    "Musical": ["songs", "dance", "Broadway"],
    "Western": ["cowboy", "horse", "saloon"],
    "Pirates": ["treasure", "ship", "parrot"],
    "Dinosaurs": ["fossil", "roar", "extinct"],
    "Robots": ["metal", "beep", "machine"],
    "Aliens": ["UFO", "space", "green"],
    "Zombies": ["undead", "brains", "shuffle"],
    "Spies": ["secret", "gadget", "agent"],
    "Princess": ["crown", "castle", "tiara"],
    "Wizard": ["wand", "spell", "robe"],
    "Ninja": ["stealth", "stars", "black"],
    "Car chase": ["speed", "police", "crash"],
  },
};

const wordsIn = c => Object.keys(WORDS[c] || {});

export const TIMES = { clue: 45000, discuss: 60000, guess: 30000, reveal: 4000 };
const CLUE_ROUNDS = 2;

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = w => String(w || '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]/g, '');
const sameWord = (a, b) => { const x = norm(a), y = norm(b); return !!x && (x === y || x === y + 's' || x + 's' === y || x === y + 'es' || x + 'es' === y); };

export function setup(players, rnd = Math.random, prev = null) {
  const cats = Object.keys(WORDS);
  const used = new Set(prev?.usedWords || []);
  let category, word;
  for (let i = 0; i < 50; i++) {
    category = cats[Math.floor(rnd() * cats.length)];
    const list = wordsIn(category);
    word = list[Math.floor(rnd() * list.length)];
    if (!used.has(word)) break;
  }
  used.add(word);
  // Don't make the same person imposter twice in a row.
  const choices = players.filter(p => p.pid !== prev?.imposter);
  const imposter = (choices.length ? choices : players)[Math.floor(rnd() * (choices.length || players.length))].pid;
  const scores = {};
  players.forEach(p => (scores[p.pid] = prev?.scores?.[p.pid] || 0));
  return {
    game: 'imposter',
    phase: 'roles',
    round: (prev?.round || 0) + 1,
    category, word, imposter,
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    order: shuffle(players.map(p => p.pid), rnd),
    turn: 0,
    clues: [],          // {pid, text, lap}
    ready: {},
    votes: {},
    guess: null,
    caught: false,
    result: null,       // 'caught' | 'escaped' | 'stole'
    scores,
    gained: {},
    usedWords: [...used].slice(-40),
    deadline: 0,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const current = s => s.order[s.turn % s.order.length];
const lap = s => Math.floor(s.turn / s.order.length) + 1;

function startClues(s, now) { s.phase = 'clues'; s.turn = 0; s.deadline = now + TIMES.clue; }

function addClue(s, pid, text, now) {
  s.clues.push({ pid, text, lap: lap(s) });
  s.turn++;
  if (s.turn >= s.order.length * CLUE_ROUNDS) { s.phase = 'discuss'; s.deadline = now + TIMES.discuss; }
  else s.deadline = now + TIMES.clue;
}

// Tidy a clue: one word (or a short phrase up to 2 words), not the secret word, nothing rude.
export function cleanClue(text, word) {
  let t = String(text || '').normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/[<>{}\[\]\\`]/g, '').replace(/\s+/g, ' ').trim();
  t = t.split(' ').slice(0, 2).join(' ').slice(0, 20);
  if (!t) return { ok: false, why: 'Type a clue first.' };
  if (word && (norm(t).includes(norm(word)) || norm(word).split('').length > 3 && t.split(' ').some(x => sameWord(x, word)))) return { ok: false, why: 'You can\'t use the secret word itself!' };
  if (isRude(t)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: t };
}

function score(s) {
  const g = {};
  s.players.forEach(p => (g[p.pid] = 0));
  if (s.result === 'caught') {
    s.players.forEach(p => { if (p.pid !== s.imposter) g[p.pid] += 1; });
    Object.entries(s.votes).forEach(([pid, t]) => { if (t === s.imposter && pid !== s.imposter) g[pid] += 1; });
  } else {
    g[s.imposter] += s.result === 'stole' ? 3 : 2;
  }
  Object.entries(g).forEach(([pid, n]) => (s.scores[pid] = (s.scores[pid] || 0) + n));
  s.gained = g;
}

function resolveVote(s, now) {
  const count = {};
  Object.values(s.votes).forEach(t => (count[t] = (count[t] || 0) + 1));
  const ranked = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const tie = ranked[1] && ranked[1][1] === top[1];
  s.tally = ranked.map(([pid, c]) => ({ name: nameOf(s, pid), count: c }));
  s.accused = !top || tie ? null : top[0];
  s.caught = s.accused === s.imposter;
  if (s.caught) { s.phase = 'guess'; s.deadline = now + TIMES.guess; }
  else { s.result = 'escaped'; score(s); s.phase = 'over'; }
}

function resolveGuess(s, text) {
  s.guess = text || '';
  s.result = sameWord(s.guess, s.word) ? 'stole' : 'caught';
  score(s);
  s.phase = 'over';
}

export function act(s, pid, a, now = Date.now()) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'roles' && a.type === 'ready') {
    s.ready[pid] = true;
    if (s.players.every(p => s.ready[p.pid])) startClues(s, now);
  } else if (s.phase === 'clues' && a.type === 'clue' && current(s) === pid) {
    const c = cleanClue(a.text, pid === s.imposter ? null : s.word);
    // The imposter doesn't know the word, so they can't be blocked for "using" it; a lucky hit still counts.
    if (c.ok) addClue(s, pid, c.text, now);
  } else if (s.phase === 'vote' && a.type === 'vote' && a.target !== pid && P(s, a.target)) {
    s.votes[pid] = a.target;
    if (s.players.every(p => s.votes[p.pid])) resolveVote(s, now);
  } else if (s.phase === 'guess' && a.type === 'guess' && pid === s.imposter) {
    resolveGuess(s, String(a.text || '').slice(0, 30));
  }
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'roles') startClues(s, now);
  else if (s.phase === 'clues') addClue(s, current(s), '(skipped)', now);
  else if (s.phase === 'discuss') { s.phase = 'vote'; s.votes = {}; }
  else if (s.phase === 'vote') { if (Object.keys(s.votes).length) resolveVote(s, now); else { s.result = 'escaped'; score(s); s.phase = 'over'; } }
  else if (s.phase === 'guess') resolveGuess(s, '');
  return s;
}

export function tick(s, now = Date.now()) {
  if (s.phase === 'clues' && now >= s.deadline) addClue(s, current(s), '(no clue)', now);
  else if (s.phase === 'discuss' && now >= s.deadline) { s.phase = 'vote'; s.votes = {}; }
  else if (s.phase === 'guess' && now >= s.deadline) resolveGuess(s, '');
  return s;
}

export function narration(s) {
  switch (s.phase) {
    case 'roles': return 'Check your phone for the secret word. One of you didn\'t get it. That\'s the imposter.';
    case 'clues': return s.turn === 0 ? `The category is ${s.category}. Take turns giving one word clues. Not too obvious, or the imposter will catch on.` : '';
    case 'discuss': return 'All the clues are in. Who doesn\'t know the word? Talk it over.';
    case 'vote': return 'Time to vote. Who is the imposter?';
    case 'guess': return 'You caught the imposter! But wait. If they can guess the secret word, they steal the win.';
    case 'over': return s.result === 'caught' ? `The imposter is caught! The word was ${s.word}.` : s.result === 'stole' ? `They guessed it! The word was ${s.word}. The imposter steals the win!` : `The imposter got away! The word was ${s.word}.`;
  }
  return '';
}

export function cue(s) {
  switch (s.phase) {
    case 'roles': return { sound: 'join', wait: 600, title: 'Imposter', sub: 'One of you is faking it' };
    case 'clues': return s.turn === 0 ? { sound: 'vote', wait: 600, title: s.category, sub: 'Give a one-word clue' } : null;
    case 'discuss': return { sound: 'dawn', wait: 1800, title: 'Discuss', sub: 'Who doesn\'t know the word?', tone: 'dawn' };
    case 'vote': return { sound: 'vote', wait: 500, title: 'The Vote', sub: 'Choose on your phone' };
    case 'guess': return { sound: 'drumroll', after: 'death', wait: 2300 };
    case 'over': return s.result === 'caught'
      ? { sound: 'win', wait: 1600, title: 'Caught!', sub: `The word was ${s.word}`, tone: 'dawn', fx: 'confetti' }
      : { sound: 'lose', wait: 1600, title: s.result === 'stole' ? 'Stolen!' : 'Got Away!', sub: `The word was ${s.word}`, tone: 'blood' };
  }
  return null;
}

export function botAct(v, rnd = Math.random) {
  const words = WORDS[v.category] || {};
  const any = a => a[Math.floor(rnd() * a.length)];
  const used = new Set((v.allClues || []).map(c => norm(c)));
  if (v.phase === 'roles' && !v.ready) return { type: 'ready' };
  if (v.phase === 'clues' && v.myTurn) {
    // Crew: a real hint for the word. Imposter: guess the word from the clues so far and hint at that.
    const target = v.isImposter ? (rnd() < 0.6 ? bestGuess(v.category, v.allClues || [], rnd) : any(Object.keys(words))) : v.word;
    const pool = (words[target] || []).filter(h => !used.has(norm(h)) && !sameWord(h, v.word || ''));
    const mine = new Set((v.myClues || []).map(norm));
    const fallback = (words[target] || ['Hmm']).filter(h => !sameWord(h, v.word || '') && !mine.has(norm(h)));
    return { type: 'clue', text: any(pool.length ? pool : fallback.length ? fallback : ['Hmm']) };
  }
  if (v.phase === 'vote' && !v.voted && v.options?.length) {
    if (v.isImposter || !v.board) return { type: 'vote', target: any(v.options).pid };
    // Crew: vote for whoever's clues fit the word worst.
    const hints = new Set((words[v.word] || []).map(norm));
    const fit = o => (v.board.find(b => b.pid === o.pid)?.clues || []).filter(c => hints.has(norm(c))).length;
    const worst = Math.min(...v.options.map(fit));
    return { type: 'vote', target: any(v.options.filter(o => fit(o) === worst)).pid };
  }
  if (v.phase === 'guess' && v.isImposter) {
    // Bots aren't perfect: most of the time they guess a different word from the category.
    const best = bestGuess(v.category, v.allClues || [], rnd);
    return { type: 'guess', text: rnd() < 0.3 ? best : any(Object.keys(words)) };
  }
  return null;
}

// Which word in the category do these clues point to?
export function bestGuess(category, clues, rnd = Math.random) {
  const words = WORDS[category] || {};
  const said = new Set(clues.map(norm));
  let best = [], top = -1;
  for (const [w, hints] of Object.entries(words)) {
    const n = hints.filter(h => said.has(norm(h))).length;
    if (n > top) { top = n; best = [w]; } else if (n === top) best.push(w);
  }
  return best[Math.floor(rnd() * best.length)] || 'Hmm';
}

// ---------- views ----------
export function tvView(s, now = Date.now()) {
  const v = {
    phase: s.phase, round: s.round, category: s.category,
    left: Math.max(0, Math.ceil(((s.deadline || 0) - now) / 1000)),
    order: s.order.map(pid => ({ name: nameOf(s, pid), clues: s.clues.filter(c => c.pid === pid).map(c => c.text) })),
    turnName: s.phase === 'clues' ? nameOf(s, current(s)) : null,
    turnIndex: s.phase === 'clues' ? s.turn % s.order.length : -1,
    lap: lap(s),
    scores: s.players.map(p => ({ name: p.name, score: s.scores[p.pid] || 0, gained: s.gained[p.pid] || 0 })).sort((a, b) => b.score - a.score),
  };
  if (s.phase === 'roles') { v.done = Object.keys(s.ready).length; v.total = s.players.length; }
  if (s.phase === 'vote') { v.done = Object.keys(s.votes).length; v.total = s.players.length; }
  if (s.phase === 'guess') { v.imposterName = nameOf(s, s.imposter); v.tally = s.tally; }
  if (s.phase === 'over') Object.assign(v, { word: s.word, imposterName: nameOf(s, s.imposter), result: s.result, guess: s.guess, tally: s.tally || [], accusedName: s.accused ? nameOf(s, s.accused) : null });
  return v;
}

export function phoneView(s, pid) {
  const me = P(s, pid);
  if (!me) return { phase: 'spectate' };
  const isImposter = pid === s.imposter;
  const v = { phase: s.phase, round: s.round, category: s.category, isImposter, word: isImposter ? null : s.word };
  if (s.phase === 'roles') v.ready = !!s.ready[pid];
  if (s.phase === 'clues') {
    v.myTurn = current(s) === pid;
    v.turnName = nameOf(s, current(s));
    v.myClues = s.clues.filter(c => c.pid === pid).map(c => c.text);
    v.lap = lap(s);
    v.recent = s.clues.slice(-4).map(c => ({ name: nameOf(s, c.pid), text: c.text }));
    v.allClues = s.clues.map(c => c.text);
  }
  if (s.phase === 'discuss') v.all = s.order.map(p => ({ name: nameOf(s, p), clues: s.clues.filter(c => c.pid === p).map(c => c.text) }));
  if (s.phase === 'vote') {
    v.options = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name }));
    v.voted = s.votes[pid] || null;
    v.board = s.players.map(p => ({ pid: p.pid, clues: s.clues.filter(c => c.pid === p.pid).map(c => c.text) }));
  }
  if (s.phase === 'guess') { v.imposterName = nameOf(s, s.imposter); if (isImposter) v.allClues = s.clues.map(c => c.text); }
  if (s.phase === 'over') {
    v.word = s.word; v.result = s.result;
    v.won = isImposter ? s.result !== 'caught' : s.result === 'caught';
    v.gained = s.gained[pid] || 0; v.score = s.scores[pid] || 0;
  }
  return v;
}

// ---------- renderers ----------
const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

export function renderTV(v, el) {
  document.body.classList.toggle('day', ['discuss', 'vote', 'guess', 'over'].includes(v.phase));
  const board = `<div class="clueboard">${v.order.map((p, i) => `<div class="cluerow ${i === v.turnIndex ? 'now' : ''}"><b>${esc(p.name)}</b>${[0, 1].map(k => `<span class="clue ${p.clues[k] ? 'in' : ''}">${p.clues[k] ? esc(p.clues[k]) : ''}</span>`).join('')}</div>`).join('')}</div>`;
  const progress = v.total ? `<div class="meter"><span style="width:${(100 * v.done) / v.total}%"></span></div><p class="muted">${v.done} of ${v.total}</p>` : '';
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}${p.gained && v.phase === 'over' ? `<small> +${p.gained}</small>` : ''}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'roles') h = `<h2>Check your phone</h2><p class="say">Hold your card to see the secret word. One player only sees the category. They're the <b class="lose">Imposter</b>.</p>${progress}
    <div class="how"><h3>How to play</h3><ol>
      <li><b>Clues:</b> take turns typing one word that hints at the secret word. Too obvious and the imposter figures it out. Too vague and you look like the imposter.</li>
      <li><b>Imposter:</b> you don't know the word. Bluff! Give a clue that fits the category and listen closely.</li>
      <li><b>Vote:</b> after two rounds of clues, discuss and vote for the imposter.</li>
      <li><b>Last chance:</b> if the imposter is caught, they can still win by guessing the word.</li>
    </ol></div><button class="btn" data-host="next">Everyone's ready, start clues</button>`;
  if (v.phase === 'clues') h = `<p class="cat">Category: <b>${esc(v.category)}</b></p><h2>${esc(v.turnName)}'s turn</h2><p class="say">Type one clue on your phone. Round ${v.lap} of 2.</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${mmss(v.left)}</p>${board}<button class="btn ghost" data-host="next">Skip this player</button>`;
  if (v.phase === 'discuss') h = `<p class="cat">Category: <b>${esc(v.category)}</b></p><h2>Who's faking it?</h2><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${mmss(v.left)}</p>${board}<p class="muted">Whose clues don't quite fit? Voting starts when the clock runs out.</p><button class="btn" data-host="next">Start the vote now</button>`;
  if (v.phase === 'vote') h = `<h2>Vote</h2><p class="say">Vote on your phone for the imposter. A tie means the imposter escapes!</p>${progress}${board}<button class="btn ghost" data-host="next">Close the vote</button>`;
  if (v.phase === 'guess') h = `<h2>Caught: ${esc(v.imposterName)}!</h2><p class="say">But it's not over. If they guess the secret word, they steal the win.</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${mmss(v.left)}</p><div class="tally">${v.tally.map(t => `<div><b>${t.count}</b> ${esc(t.name)}</div>`).join('')}</div>`;
  if (v.phase === 'over') {
    const head = v.result === 'caught' ? `<h2 class="win">Imposter caught!</h2><p class="say">${esc(v.imposterName)} was the imposter${v.guess ? ` and guessed "${esc(v.guess)}"` : ''}.</p>`
      : v.result === 'stole' ? `<h2 class="lose">Stolen!</h2><p class="say">${esc(v.imposterName)} was caught but guessed the word!</p>`
      : `<h2 class="lose">The imposter got away!</h2><p class="say">It was ${esc(v.imposterName)}. ${v.accusedName ? `You voted out ${esc(v.accusedName)} instead.` : 'The vote was tied.'}</p>`;
    h = `${head}<div class="secret">The word was <b>${esc(v.word)}</b></div>${board}<div class="row"><button class="btn" data-host="again">Next round</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  const wordCard = () => `<div class="card" id="card" tabindex="0" style="--rc:${v.isImposter ? '#e2483d' : '#7fc8a9'}"><div class="face"><p class="say">Hold to see the word</p></div></div>`;
  let h = '';
  if (v.phase === 'spectate') h = `<h2>Round in progress</h2><p>You'll join the next round.</p>`;
  else if (v.phase === 'roles') h = `<h2>Your secret word</h2><p class="muted">Press and hold. Keep it hidden.</p>${wordCard()}<button class="btn" data-ready ${v.ready ? 'disabled' : ''}>${v.ready ? 'Waiting for others' : "I've seen it"}</button>`;
  else if (v.phase === 'clues' && v.myTurn) h = `<h2>Your turn!</h2><p class="muted">Category: <b>${esc(v.category)}</b> · ${v.isImposter ? '<span class="lose">You\'re the imposter. Bluff!</span>' : `Word: <b>${esc(v.word)}</b>`}</p>
    <form id="cf"><label for="clue">One-word clue</label><input id="clue" maxlength="20" autocomplete="off" autocapitalize="off" required><p class="lose" id="err"></p><button class="btn" type="submit">Send clue</button></form>
    ${v.recent.length ? `<p class="muted">Clues so far: ${v.recent.map(c => `${esc(c.name)}: <b>${esc(c.text)}</b>`).join(' · ')}</p>` : ''}`;
  else if (v.phase === 'clues') h = `<h2>${esc(v.turnName)} is thinking…</h2><p class="muted">Category: <b>${esc(v.category)}</b> · ${v.isImposter ? '<span class="lose">You\'re the imposter</span>' : `Word: <b>${esc(v.word)}</b>`}</p>${v.myClues.length ? `<p>Your clue${v.myClues.length > 1 ? 's' : ''}: <b>${v.myClues.map(esc).join(', ')}</b></p>` : '<p>Get your clue ready. Not too obvious!</p>'}${v.recent.length ? `<div class="recent">${v.recent.map(c => `<div><span>${esc(c.name)}</span><b>${esc(c.text)}</b></div>`).join('')}</div>` : ''}`;
  else if (v.phase === 'discuss') h = `<h2>Discuss</h2><p class="muted">Category: <b>${esc(v.category)}</b> · ${v.isImposter ? '<span class="lose">Act natural. Listen for the word!</span>' : `Word: <b>${esc(v.word)}</b>`}</p><div class="recent">${v.all.map(p => `<div><span>${esc(p.name)}</span><b>${p.clues.map(esc).join(', ')}</b></div>`).join('')}</div>`;
  else if (v.phase === 'vote') h = `<h2>Who's the imposter?</h2>${v.isImposter ? '<p class="muted">Vote for someone else to blend in.</p>' : ''}<div class="opts">${v.options.map(o => `<button class="opt ${v.voted === o.pid ? 'on' : ''}" data-vote="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}</div>${v.voted ? '<p class="muted">Vote in. You can change it until everyone has voted.</p>' : ''}`;
  else if (v.phase === 'guess' && v.isImposter) h = `<h2>You've been caught!</h2><p class="say">Guess the secret word to steal the win.</p><p class="muted">Category: <b>${esc(v.category)}</b></p><form id="gf"><label for="guess">Your guess</label><input id="guess" maxlength="30" autocomplete="off" required><button class="btn" type="submit">Guess</button></form>`;
  else if (v.phase === 'guess') h = `<h2>${esc(v.imposterName)} was caught!</h2><p class="say">They're guessing the word now. Fingers crossed…</p>`;
  else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : 'lose'}">${v.won ? 'You won!' : 'You lost'}</h2><p>The word was <b>${esc(v.word)}</b>.</p><p class="say">+${v.gained} point${v.gained === 1 ? '' : 's'} · ${v.score} total</p>`;
  el.innerHTML = h;

  const c = el.querySelector('#card');
  if (c) {
    const face = c.querySelector('.face');
    const show = e => { e && e.preventDefault(); c.classList.add('on'); face.innerHTML = v.isImposter ? `<div class="rn" style="color:#e2483d">Imposter</div><p>You don't know the word. The category is</p><p class="say"><b>${esc(v.category)}</b></p><p class="muted">Blend in!</p>` : `<p class="muted">${esc(v.category)}</p><div class="rn">${esc(v.word)}</div><p class="muted">Give clues, find the faker.</p>`; };
    const hide = () => { c.classList.remove('on'); face.innerHTML = '<p class="say">Hold to see the word</p>'; };
    c.addEventListener('pointerdown', show);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => c.addEventListener(e, hide));
    c.addEventListener('keydown', e => (e.key === ' ' || e.key === 'Enter') && show(e));
    c.addEventListener('keyup', hide);
    c.addEventListener('contextmenu', e => e.preventDefault());
  }
  el.querySelectorAll('[data-ready]').forEach(b => (b.onclick = () => send({ type: 'ready' })));
  el.querySelectorAll('[data-vote]').forEach(b => (b.onclick = () => send({ type: 'vote', target: b.dataset.vote })));
  const cf = el.querySelector('#cf');
  if (cf) {
    cf.querySelector('#clue').focus();
    cf.onsubmit = e => {
      e.preventDefault();
      const r = cleanClue(cf.querySelector('#clue').value, v.isImposter ? null : v.word);
      if (!r.ok) { cf.querySelector('#err').textContent = r.why; return; }
      cf.querySelector('button').disabled = true;
      send({ type: 'clue', text: r.text });
    };
  }
  const gf = el.querySelector('#gf');
  if (gf) {
    gf.querySelector('#guess').focus();
    gf.onsubmit = e => { e.preventDefault(); gf.querySelector('button').disabled = true; send({ type: 'guess', text: gf.querySelector('#guess').value.trim() }); };
  }
}
