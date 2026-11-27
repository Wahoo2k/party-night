// Who Said That?: everyone privately answers a few questions about themselves,
// then the TV shows each answer and everyone guesses who wrote it.
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'whosaid',
  name: 'Who Said That?',
  min: 3,
  max: 12,
  blurb: 'Answer questions about yourselves, then guess whose answer is whose.',
};

// q = question, s = sample answers (bots use them; phones show one as a hint).
export const QUESTIONS = [
  { q: 'What snack could you eat every single day?', s: ['Goldfish crackers', 'Popcorn', 'Cheese and crackers', 'Gummy bears'] },
  { q: 'What did you want to be when you grew up, when you were little?', s: ['Astronaut', 'Veterinarian', 'Firefighter', 'A dinosaur'] },
  { q: 'What chore do you hate the most?', s: ['Folding laundry', 'Dishes', 'Cleaning the bathroom', 'Taking out the trash'] },
  { q: 'If you could live anywhere in the world, where?', s: ['Hawaii', 'Paris', 'A cabin in the mountains', 'Japan'] },
  { q: 'What\'s a food you refuse to eat?', s: ['Olives', 'Mushrooms', 'Brussels sprouts', 'Sushi'] },
  { q: 'What would you do with a free Saturday and no plans?', s: ['Sleep in', 'Video games all day', 'Go for a hike', 'Binge a show'] },
  { q: 'What\'s your hidden talent?', s: ['I can juggle', 'Wiggling my ears', 'Perfect parallel parking', 'Whistling loud'] },
  { q: 'What animal would you be?', s: ['A sloth', 'An eagle', 'A house cat', 'A dolphin'] },
  { q: 'What\'s the best gift you ever got?', s: ['My first bike', 'A puppy', 'A trip to Disney', 'A guitar'] },
  { q: 'What\'s your go-to karaoke song?', s: ['Don\'t Stop Believin\'', 'Sweet Caroline', 'Bohemian Rhapsody', 'I don\'t sing'] },
  { q: 'What\'s the weirdest thing you\'ve ever eaten?', s: ['Frog legs', 'Alligator', 'Pickle ice cream', 'Squid'] },
  { q: 'What would you name a pet goldfish?', s: ['Bubbles', 'Sir Swims-a-lot', 'Steve', 'Fishy McFishface'] },
  { q: 'What superpower would you pick?', s: ['Teleporting', 'Flying', 'Invisibility', 'Reading minds'] },
  { q: 'What\'s your biggest pet peeve?', s: ['Loud chewing', 'People who are late', 'Slow walkers', 'Wet socks'] },
  { q: 'What\'s your favorite holiday tradition?', s: ['Pie for breakfast', 'Matching pajamas', 'The big family game', 'Watching football'] },
  { q: 'What would you buy first if you won the lottery?', s: ['A beach house', 'A sports car', 'A private chef', 'Pay off the house'] },
  { q: 'What\'s a movie you could watch over and over?', s: ['Home Alone', 'The Princess Bride', 'Star Wars', 'Elf'] },
  { q: 'What\'s the most embarrassing thing that happened to you at school?', s: ['Tripped on stage', 'Called the teacher Mom', 'Fell asleep in class', 'Sneezed during a test'] },
  { q: 'What\'s your favorite smell?', s: ['Fresh cut grass', 'Cookies baking', 'Rain', 'New car'] },
  { q: 'What\'s the first thing you do in the morning?', s: ['Check my phone', 'Coffee', 'Hit snooze', 'Feed the dog'] },
  { q: 'If you had to eat one meal forever, what would it be?', s: ['Tacos', 'Pizza', 'Mac and cheese', 'Steak and potatoes'] },
  { q: 'What\'s a skill you wish you had?', s: ['Playing piano', 'Speaking French', 'Cooking', 'Drawing'] },
  { q: 'What\'s your dream vacation?', s: ['Safari in Africa', 'Road trip out West', 'Beach in Mexico', 'Europe by train'] },
  { q: 'What\'s something you\'re secretly scared of?', s: ['Spiders', 'Clowns', 'The dark', 'Deep water'] },
  { q: 'What would your autobiography be called?', s: ['Five More Minutes', 'Snacks and Naps', 'Always Late', 'It Wasn\'t Me'] },
  { q: 'What\'s the best pizza topping?', s: ['Pepperoni', 'Pineapple', 'Just cheese', 'Sausage'] },
  { q: 'What\'s your favorite thing about winter?', s: ['Hot chocolate', 'Snow days', 'Cozy blankets', 'Nothing'] },
  { q: 'What\'s a word or phrase you say way too much?', s: ['Literally', 'Bruh', 'Awesome', 'Anyway'] },
  { q: 'What did you get in trouble for most as a kid?', s: ['Talking back', 'Fighting with my sibling', 'Not cleaning my room', 'Staying up late'] },
  { q: 'Which fictional character are you most like?', s: ['Garfield', 'Hermione', 'SpongeBob', 'Eeyore'] },
  { q: 'What\'s your favorite candy?', s: ['Reese\'s', 'Sour Patch Kids', 'Kit Kat', 'Skittles'] },
  { q: 'If you were famous, what would you be famous for?', s: ['Cooking show', 'Pro athlete', 'Movie star', 'Inventing something'] },
  { q: 'What\'s the best sound in the world?', s: ['Rain on the roof', 'A baby laughing', 'Ice cream truck', 'Silence'] },
  { q: 'What\'s one thing you can\'t leave the house without?', s: ['My phone', 'Sunglasses', 'Chapstick', 'Earbuds'] },
  { q: 'What would you do if you were invisible for a day?', s: ['Sneak into a concert', 'Prank my family', 'Raid the bakery', 'Nap at work'] },
  { q: 'What\'s your favorite board or card game?', s: ['Monopoly', 'Uno', 'Scrabble', 'Chess'] },
  { q: "What's the best gift you've ever been given?", s: ["A bike", "A puppy", "Concert tickets", "A handmade card"] },
  { q: "What would you do first if you won the lottery?", s: ["Buy a house", "Quit my job", "Take everyone on a trip", "Tell nobody"] },
  { q: "What's your go-to karaoke song?", s: ["Don't Stop Believin'", "Anything Disney", "I refuse to sing", "Bohemian Rhapsody"] },
  { q: "What food did you hate as a kid but like now?", s: ["Mushrooms", "Brussels sprouts", "Onions", "Fish"] },
  { q: "What's the weirdest thing in your room right now?", s: ["A rock collection", "Three empty mugs", "A giant stuffed shark", "Old concert tickets"] },
  { q: "What's a smell that takes you right back to childhood?", s: ["Fresh-cut grass", "Crayons", "Grandma's kitchen", "Sunscreen"] },
  { q: "If you had a boat, what would you name it?", s: ["Seas the Day", "The Leaky Lady", "Boaty", "Mom's Day Off"] },
  { q: "What's the most useless thing you know how to do?", s: ["Wiggle my ears", "Solve a Rubik's cube", "Recite movie lines", "Juggle two things"] },
  { q: "What's your perfect pizza?", s: ["Just cheese", "Pepperoni and mushroom", "Pineapple, no regrets", "Everything on it"] },
  { q: "What job would you be terrible at?", s: ["Surgeon", "Waiter", "Air traffic controller", "Kindergarten teacher"] },
  { q: "What was your first job, or what would you want it to be?", s: ["Babysitting", "Mowing lawns", "Ice cream shop", "Lifeguard"] },
  { q: "What's a small thing that makes your day better?", s: ["A good parking spot", "Coffee", "A dog saying hi", "Clean sheets"] },
  { q: "What would your superhero name be?", s: ["Captain Nap", "The Snack Avenger", "Doctor Late", "Night Owl"] },
  { q: "What's the first thing you'd buy for a brand new house?", s: ["A giant couch", "A trampoline", "A good bed", "A pizza oven"] },
  { q: "What's your most-used emoji?", s: ["The laughing one", "Thumbs up", "The skull", "Heart"] },
  { q: "Which animal would you most like as a sidekick?", s: ["A wolf", "A parrot", "An otter", "A very loyal goose"] },
  { q: "What's the best vacation you've ever had?", s: ["The beach", "Camping", "Disney", "A road trip"] },
  { q: "What's something you're weirdly competitive about?", s: ["Board games", "Parking", "Mini golf", "Loading the dishwasher"] },
  { q: "What's your comfort movie?", s: ["Home Alone", "The Princess Bride", "Shrek", "Anything with a dog"] },
  { q: "What would you bring to a potluck?", s: ["Chips", "Mac and cheese", "Cookies", "Something from the store"] },
  { q: "What's your least favorite household sound?", s: ["The smoke alarm", "Someone chewing", "The vacuum", "An alarm clock"] },
  { q: "What's a food you could never give up?", s: ["Cheese", "Bread", "Chocolate", "Tacos"] },
  { q: "If you could instantly master one instrument, which?", s: ["Piano", "Drums", "Violin", "Banjo"] },
  { q: "What's the longest you've gone without sleep, and why?", s: ["A whole night for a test", "A long flight", "A new baby", "A video game"] },
  { q: "What's your signature dance move?", s: ["The robot", "Finger guns", "The sprinkler", "Standing still"] },
  { q: "What's the best thing about the town you grew up in?", s: ["The pizza place", "The lake", "Nothing much", "Friday night football"] },
  { q: "What would you add to the Olympics?", s: ["Napping", "Extreme hide and seek", "Speed grocery shopping", "Dad jokes"] },
  { q: "Which three words would your best friend use to describe you?", s: ["Loud, loyal, late", "Calm, kind, hungry", "Funny, stubborn, fun", "Always running behind"] },
  { q: "What's a tradition you'd love to start?", s: ["Pancake Sundays", "A yearly camping trip", "Game night", "Backwards dinner"] },
  { q: "What's your most irrational fear?", s: ["Moths", "Deep water", "Clowns", "Stepping on a Lego"] },
  { q: "What's the best thing you know how to cook?", s: ["Grilled cheese", "Chili", "Pancakes", "Cereal"] },
  { q: "If animals could talk, which would be the rudest?", s: ["Cats", "Geese", "Seagulls", "Llamas"] },
  { q: "What would you put on a billboard for everyone to see?", s: ["Be kind", "Use your turn signal", "Call your mom", "Free tacos here"] },
  { q: "Where's the strangest place you've fallen asleep?", s: ["In class", "At a concert", "On a bus", "At the dinner table"] },
  { q: "What would you want your last meal to be?", s: ["Steak and fries", "Mom's lasagna", "Sushi", "Breakfast for dinner"] },
  { q: "What's a nickname you've had?", s: ["Shorty", "Champ", "Bug", "Speedy"] },
];

export const TIMES = { answer: 120000, guess: 25000, reveal: 6000 };
const PER_PLAYER = 2;       // questions each player answers
const MAX_ITEMS = 12;       // answers shown per game
const GUESS_PTS = 100, FOOL_PTS = 50;

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function cleanAnswer(text) {
  const t = String(text || '').normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/[<>{}\[\]\\`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!t) return { ok: false, why: 'Answer both questions.' };
  if (isRude(t)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: t };
}

export function setup(players, rnd = Math.random, prev = null) {
  const recent = new Set(prev?.usedQs || []);
  let pool = QUESTIONS.map((q, i) => i).filter(i => !recent.has(i));
  if (pool.length < PER_PLAYER * 2) pool = QUESTIONS.map((q, i) => i);
  // Everyone answers the same questions, so answers are comparable and fun to guess.
  const qs = shuffle(pool, rnd).slice(0, PER_PLAYER);
  const scores = {};
  players.forEach(p => (scores[p.pid] = prev?.scores?.[p.pid] || 0));
  return {
    game: 'whosaid',
    phase: 'answer',
    round: (prev?.round || 0) + 1,
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    qs,
    answers: {},        // pid -> [text, text]
    items: [],          // {q, text, pid}
    i: 0,
    guesses: {},        // pid -> author pid, for the current item
    history: [],        // {pid, right:[pids], wrong:[pids]}
    scores,
    gained: {},
    usedQs: [...recent, ...qs].slice(-24),
    deadline: Date.now() + TIMES.answer,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const item = s => s.items[s.i];

function startGuessing(s, now, rnd) {
  const all = [];
  for (const [pid, list] of Object.entries(s.answers)) list.forEach((text, k) => text && all.push({ q: s.qs[k], text, pid }));
  // Spread authors out: one answer from each person before anyone's second.
  const byP = {};
  shuffle(all, rnd).forEach(a => (byP[a.pid] = byP[a.pid] || []).push(a));
  const order = [];
  for (let k = 0; k < PER_PLAYER; k++) shuffle(Object.keys(byP), rnd).forEach(pid => byP[pid][k] && order.push(byP[pid][k]));
  s.items = order.slice(0, MAX_ITEMS);
  s.i = 0;
  if (!s.items.length) { s.phase = 'over'; return; }
  s.phase = 'guess';
  s.guesses = {};
  s.gained = {};
  s.deadline = now + TIMES.guess;
}

function reveal(s, now) {
  const it = item(s);
  const right = [], wrong = [];
  for (const [pid, g] of Object.entries(s.guesses)) (g === it.pid ? right : wrong).push(pid);
  const g = {};
  right.forEach(pid => (g[pid] = (g[pid] || 0) + GUESS_PTS));
  if (wrong.length) g[it.pid] = (g[it.pid] || 0) + FOOL_PTS * wrong.length;
  Object.entries(g).forEach(([pid, n]) => (s.scores[pid] = (s.scores[pid] || 0) + n));
  s.gained = g;
  s.history.push({ pid: it.pid, right, wrong });
  s.phase = 'reveal';
  s.deadline = now + TIMES.reveal;
}

function next(s, now) {
  if (s.i + 1 >= s.items.length) { s.phase = 'over'; return; }
  s.i++;
  s.phase = 'guess';
  s.guesses = {};
  s.gained = {};
  s.deadline = now + TIMES.guess;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'answer' && a.type === 'answers' && Array.isArray(a.list)) {
    const list = s.qs.map((_, k) => cleanAnswer(a.list[k]));
    if (list.some(r => !r.ok)) return s;
    s.answers[pid] = list.map(r => r.text);
    if (s.players.every(p => s.answers[p.pid])) startGuessing(s, now, rnd);
  } else if (s.phase === 'guess' && a.type === 'guess' && pid !== item(s).pid && P(s, a.who)) {
    s.guesses[pid] = a.who;
    if (s.players.every(p => p.pid === item(s).pid || s.guesses[p.pid])) reveal(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'answer') startGuessing(s, now, rnd);
  else if (s.phase === 'guess') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (now < s.deadline) return s;
  if (s.phase === 'answer') startGuessing(s, now, rnd);
  else if (s.phase === 'guess') reveal(s, now);
  else if (s.phase === 'reveal') next(s, now);
  return s;
}

export function narration(s) {
  switch (s.phase) {
    case 'answer': return 'Answer the questions on your phone. Be honest, or be sneaky. Nobody will know it\'s you... yet.';
    case 'guess': return s.i === 0 ? `${QUESTIONS[item(s).q].q} Someone answered: ${item(s).text}. Who said that?` : `Someone said: ${item(s).text}. Who was it?`;
    case 'reveal': return `It was ${nameOf(s, item(s).pid)}!`;
    case 'over': return 'That\'s the game! Turns out you don\'t know each other as well as you thought.';
  }
  return '';
}

export function cue(s) {
  switch (s.phase) {
    case 'answer': return { sound: 'join', wait: 700, title: 'Who Said That?', sub: 'Answer about yourself' };
    case 'guess': return s.i === 0 ? { sound: 'vote', wait: 600, title: 'Who Said That?', sub: 'Guess on your phone' } : { sound: 'vote', wait: 300 };
    case 'reveal': return { sound: 'drumroll', after: 'stamp', wait: 1800, react: 'laugh' };
    case 'over': return { sound: 'win', wait: 1600, title: 'Game Over', sub: 'Who knows who best?', tone: 'dawn', fx: 'confetti' };
  }
  return null;
}

export function botAct(v, rnd = Math.random) {
  const any = a => a[Math.floor(rnd() * a.length)];
  if (v.phase === 'answer' && !v.done) return { type: 'answers', list: v.questions.map(q => any(QUESTIONS.find(x => x.q === q)?.s || ['Not sure'])) };
  if (v.phase === 'guess' && !v.mine && !v.guessed && v.options?.length) return { type: 'guess', who: any(v.options).pid };
  return null;
}

// ---------- views ----------
const board = s => s.players.map(p => ({ name: p.name, score: s.scores[p.pid] || 0, gained: s.gained[p.pid] || 0 })).sort((a, b) => b.score - a.score);

function awards(s) {
  const tally = {};
  s.players.forEach(p => (tally[p.pid] = { right: 0, seen: 0 }));
  s.history.forEach(h => { if (!tally[h.pid]) return; tally[h.pid].right += h.right.length; tally[h.pid].seen += h.right.length + h.wrong.length; });
  const rated = Object.entries(tally).filter(([, t]) => t.seen).map(([pid, t]) => ({ name: nameOf(s, pid), rate: t.right / t.seen }));
  if (rated.length < 2) return [];
  rated.sort((a, b) => b.rate - a.rate);
  return [
    { title: 'Open book', name: rated[0].name, note: 'easiest to guess' },
    { title: 'Mystery person', name: rated[rated.length - 1].name, note: 'hardest to guess' },
  ];
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, left: Math.max(0, Math.ceil(((s.deadline || 0) - now) / 1000)), scores: board(s), total: s.items.length, i: s.i };
  if (s.phase === 'answer') { v.questions = s.qs.map(k => QUESTIONS[k].q); v.writers = s.players.map(p => ({ name: p.name, done: !!s.answers[p.pid] })); }
  if (s.phase === 'guess' || s.phase === 'reveal') {
    const it = item(s);
    v.q = QUESTIONS[it.q].q;
    v.text = it.text;
    const voters = s.players.filter(p => p.pid !== it.pid);
    v.done = voters.filter(p => s.guesses[p.pid]).length;
    v.need = voters.length;
  }
  if (s.phase === 'reveal') {
    const it = item(s);
    v.author = nameOf(s, it.pid);
    v.guesses = Object.entries(s.guesses).map(([pid, g]) => ({ name: nameOf(s, pid), guess: nameOf(s, g), right: g === it.pid }));
  }
  if (s.phase === 'over') v.awards = awards(s);
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, score: s.scores[pid] || 0, total: s.items.length, i: s.i };
  if (s.phase === 'answer') {
    v.questions = s.qs.map(k => QUESTIONS[k].q);
    v.hints = s.qs.map(k => QUESTIONS[k].s[0]);
    v.done = !!s.answers[pid];
  }
  if (s.phase === 'guess' || s.phase === 'reveal') {
    const it = item(s);
    v.q = QUESTIONS[it.q].q;
    v.text = it.text;
    v.mine = it.pid === pid;
    v.options = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name }));
    v.guessed = s.guesses[pid] || null;
  }
  if (s.phase === 'reveal') {
    const it = item(s);
    v.author = nameOf(s, it.pid);
    v.right = s.guesses[pid] === it.pid;
    v.gained = s.gained[pid] || 0;
  }
  if (s.phase === 'over') {
    const ranked = board(s);
    v.rank = ranked.findIndex(r => r.name === nameOf(s, pid)) + 1;
    v.of = ranked.length;
  }
  return v;
}

// ---------- renderers ----------
const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
const pts = n => n.toLocaleString();

export function renderTV(v, el) {
  document.body.classList.toggle('day', ['reveal', 'over'].includes(v.phase));
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${pts(p.score)}${p.gained && v.phase === 'reveal' ? `<small> +${pts(p.gained)}</small>` : ''}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'answer') h = `<h2>Answer on your phone</h2><p class="say">Everyone answers the same ${v.questions.length} questions about themselves. Then we guess who said what.</p><ol class="qlist">${v.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ol><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${mmss(v.left)}</p><div class="roster">${v.writers.map(w => `<div class="chip ${w.done ? '' : 'waiting'}">${esc(w.name)}${w.done ? ' ✓' : ''}</div>`).join('')}</div><button class="btn ghost" data-host="next">Stop answering</button>`;
  if (v.phase === 'guess' || v.phase === 'reveal') {
    h = `<p class="cat">Answer ${v.i + 1} of ${v.total}</p><p class="muted qline">${esc(v.q)}</p><div class="quote">“${esc(v.text)}”</div>`;
    if (v.phase === 'guess') h += `<p class="say">Who said that? Guess on your phone.</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${mmss(v.left)}</p><div class="meter"><span style="width:${v.need ? (100 * v.done) / v.need : 0}%"></span></div><button class="btn ghost" data-host="next">Reveal now</button>`;
    else h += `<div class="author">It was <b>${esc(v.author)}</b>!</div><div class="tally">${v.guesses.map(g => `<div class="${g.right ? 'win' : ''}">${esc(g.name)} → ${esc(g.guess)} ${g.right ? '✓' : ''}</div>`).join('') || '<div>No guesses</div>'}</div><button class="btn" data-host="next">Next answer</button>`;
  }
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0]?.name || '')} knows everyone best!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${pts(p.score)}</span></div>`).join('')}</div>${v.awards.length ? `<div class="awards">${v.awards.map(a => `<div><small>${esc(a.title)}</small><b>${esc(a.name)}</b><span>${esc(a.note)}</span></div>`).join('')}</div>` : ''}<div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>';
  else if (v.phase === 'answer' && !v.done) h = `<h2>About you</h2><p class="muted">Answer honestly, or be sneaky. Nobody sees who wrote what until the end.</p><form id="af">${v.questions.map((q, k) => `<label for="a${k}">${esc(q)}</label><input id="a${k}" maxlength="40" autocomplete="off" placeholder="e.g. ${esc(v.hints[k])}" required>`).join('')}<p class="lose" id="err"></p><button class="btn" type="submit">Send answers</button></form>`;
  else if (v.phase === 'answer') h = '<h2>Answers in!</h2><p class="say">Waiting for everyone else…</p>';
  else if (v.phase === 'guess' && v.mine) h = `<p class="muted">${esc(v.q)}</p><div class="quote small">“${esc(v.text)}”</div><h2>That's yours!</h2><p class="say">Keep a straight face. You score when people guess wrong.</p>`;
  else if (v.phase === 'guess') h = `<p class="muted">${esc(v.q)}</p><div class="quote small">“${esc(v.text)}”</div><h2>Who said that?</h2><div class="opts">${v.options.map(o => `<button class="opt ${v.guessed === o.pid ? 'on' : ''}" data-who="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}</div>`;
  else if (v.phase === 'reveal') h = `<div class="quote small">“${esc(v.text)}”</div><h2>${v.mine ? 'Your answer!' : v.right ? '<span class="win">You got it!</span>' : 'Nope!'}</h2><p class="say">It was ${esc(v.author)}. ${v.gained ? `+${pts(v.gained)}` : ''}</p><p class="muted">${pts(v.score)} total</p>`;
  else if (v.phase === 'over') h = `<h2 class="${v.rank === 1 ? 'win' : ''}">${v.rank === 1 ? 'You won!' : `You came ${v.rank} of ${v.of}`}</h2><p class="say">${pts(v.score)} points</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-who]').forEach(b => (b.onclick = () => send({ type: 'guess', who: b.dataset.who })));
  const af = el.querySelector('#af');
  if (af) {
    af.querySelector('input').focus();
    af.onsubmit = e => {
      e.preventDefault();
      const list = [...af.querySelectorAll('input')].map(i => i.value);
      const bad = list.map(cleanAnswer).find(r => !r.ok);
      if (bad) { af.querySelector('#err').textContent = bad.why; return; }
      af.querySelector('button').disabled = true;
      send({ type: 'answers', list });
    };
  }
}
