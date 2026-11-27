// Brain Teasers: a mix of quick puzzles on the TV. Word pictures (rebus: "STAND over I" = "I understand"), emoji
// phrases, anagrams, say-it-out-loud sound-alikes, and mystery pictures that start blurred or zoomed in and slowly
// clear. Everyone types the answer. Faster is worth more. A hint appears halfway through.
import { esc } from '../ui.js';

export const meta = { id: 'rebus', name: 'Brain Teasers', min: 1, max: 20, blurb: 'Word pictures, emoji phrases, anagrams, sound-alikes and mystery pictures. Fastest answer wins.' };

// Word-layout puzzles: h is trusted markup written here (never player text). a is the answer, alt other accepted wordings.
const L = (h, a, ...alt) => ({ k: 'rebus', ask: 'What does it say?', h, a, alt });
const E = (e, a, ...alt) => ({ k: 'emoji', ask: 'Put them together', h: `<div class="rb-emoji">${e}</div>`, a, alt, pic: true });
// Emoji phrase: a movie, saying or thing told in emoji.
const EP = (e, cat, a, ...alt) => ({ k: 'emoji', ask: cat, h: `<div class="rb-emoji">${e}</div>`, a, alt });
// Anagram: the letters are scrambled the same way every time (so the TV and phones match).
const scramble = w => { const a = [...w]; let h = 7; for (let i = a.length - 1; i > 0; i--) { h = (h * 31 + w.charCodeAt(i % w.length) + i) % 9973; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a.join('') === w ? a.reverse().join('') : a.join(''); };
const AN = (w, cat) => ({ k: 'anagram', ask: `Unscramble: ${cat}`, h: `<div class="rb-tiles">${[...scramble(w)].map(c => `<i>${c}</i>`).join('')}</div>`, a: w[0] + w.slice(1).toLowerCase(), alt: [] });
// Sound-alike: read the nonsense out loud and listen to what you're saying.
const SA = (t, a, ...alt) => ({ k: 'sound', ask: 'Say it out loud', h: `<span class="rb-say">${t}</span>`, a, alt });
// Mystery picture: starts blurred or zoomed right in, and clears as the clock runs.
const MP = (e, how, a, ...alt) => ({ k: how, ask: how === 'zoom' ? 'Zoomed in. What is it?' : 'What is it?', h: `<div class="rb-pic rb-${how}"><span>${e}</span></div>`, a, alt, pic: true });
const over = (x, y) => `<div class="rb-stack"><span>${x}</span><span>${y}</span></div>`;
export const PUZZLES = [
  L(over('STAND', 'I'), 'I understand'), L(over('MIND', 'MATTER'), 'Mind over matter'), L(over('HEAD', 'HEELS'), 'Head over heels'), L(over('MAN', 'BOARD'), 'Man overboard'),
  L(over('GROUND', 'FEET FEET FEET<br>FEET FEET FEET'), 'Six feet underground', 'six feet under ground', 'six feet under', '6 feet under', '6 feet underground'), L(over('ONCE', 'A TIME'), 'Once upon a time'),
  L(over('TRAVEL', 'CCCCCCC'), 'Travel overseas', 'travel over seas', 'overseas travel'), L(over('WEAR', 'LONG'), 'Long underwear'), L(over('KNEE', 'LIGHTS'), 'Neon lights', 'neon light'),
  L(over('ARREST', 'YOU\'RE'), 'You\'re under arrest', 'you are under arrest', 'under arrest'), L(over('EGGS', 'EASY'), 'Eggs over easy'), L(over('THE WEATHER', 'FEELING'), 'Feeling under the weather', 'under the weather'),
  L('<span class="rb-big">DICE DICE</span>', 'Paradise', 'pair of dice', 'pair o dice'), L('<span class="rb-big">CYCLE CYCLE CYCLE</span>', 'Tricycle'), L('<span class="rb-big">NOON GOOD</span>', 'Good afternoon'),
  L('<span class="rb-big">ECNALG</span>', 'Backward glance', 'a backward glance', 'backwards glance', 'glance backward', 'glance backwards', 'look back'), L('<span class="rb-big">HIJKLMNO</span>', 'Water', 'h2o', 'h to o'),
  L('<span class="rb-big">GET IT GET IT<br>GET IT GET IT</span>', 'Forget it'), L('<span class="rb-big">YOU JUST ME</span>', 'Just between you and me', 'just between you & me', 'between you and me'),
  L('<span class="rb-big">BAN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ANA</span>', 'Banana split'), L('<span class="rb-big">MILL1ON</span>', 'One in a million', '1 in a million'), L('<span class="rb-big">BJAOCKX</span>', 'Jack in the box', 'jack in a box'),
  L('<span class="rb-big">STA4NCE</span>', 'For instance'), L('<span class="rb-big">TIM&nbsp;&nbsp;&nbsp;&nbsp;ING</span>', 'Split second timing', 'split timing', 'split-second timing'),
  L('<span class="rb-big">GIVE GET GIVE GET<br>GIVE GET GIVE GET</span>', 'Forgive and forget', 'forgive & forget'), L('<span class="rb-big">HISTORY HISTORY HISTORY</span>', 'History repeats itself', 'history repeating', 'history repeats'),
  L('<span class="rb-big">STEP PETS PETS</span>', 'One step forward two steps back', 'one step forward, two steps back', '1 step forward 2 steps back'),
  L('<span class="rb-huge">DEAL</span>', 'Big deal', 'a big deal'), L('<span class="rb-tiny">TALK</span>', 'Small talk'), L('<span class="rb-tiny">WORLD</span>', 'Small world', 'its a small world', 'it\'s a small world'),
  L('<span class="rb-vert">T<br>O<br>W<br>N</span>', 'Downtown', 'down town'), L('<div class="rb-top">SECRET</div>', 'Top secret'), L('<div class="rb-top">CHAIR</div>', 'High chair', 'highchair'),
  L('<span class="rb-grow"><i>P</i><i>A</i><i>I</i><i>N</i><i>S</i></span>', 'Growing pains'), L('<span class="rb-big">M<b class="rb-blue">ONCE</b>OON</span>', 'Once in a blue moon'),
  L('<span class="rb-lines">R|E|A|D|I|N|G</span>', 'Reading between the lines', 'read between the lines'),
  E('🐝 ➕ 🍃', 'Belief', 'beleaf'), E('☀️ ➕ 🌼', 'Sunflower'), E('🔥 ➕ 🪰', 'Firefly'), E('🌧️ ➕ 🎀', 'Rainbow'), E('🦶 ➕ ⚽', 'Football'), E('⭐ ➕ 🐟', 'Starfish'), E('🧈 ➕ 🪰', 'Butterfly'),
  E('🍯 ➕ 🌙', 'Honeymoon'), E('🐴 ➕ 👟', 'Horseshoe'), E('🥚 ➕ 🌱', 'Eggplant'), E('🚪 ➕ 🔔', 'Doorbell'), E('📖 ➕ 🪱', 'Bookworm'), E('☕ ➕ 🍰', 'Cupcake'), E('🌽 ➕ 🐕', 'Corn dog', 'corndog'),
  E('🐱 ➕ 🐟', 'Catfish'), E('🌊 ➕ 🐴', 'Seahorse', 'sea horse'), E('👂 ➕ 💍', 'Earring', 'ear ring', 'earrings'), E('🖐️ ➕ 👜', 'Handbag', 'hand bag'), E('🏠 ➕ 🌱', 'Houseplant', 'house plant'),
  EP('🦁👑', 'Movie', 'The Lion King', 'lion king'), EP('🐠🔍', 'Movie', 'Finding Nemo'), EP('🦈🌊', 'Movie', 'Jaws'), EP('🚢🧊💔', 'Movie', 'Titanic', 'the titanic'), EP('🧸🤠🚀', 'Movie', 'Toy Story'),
  EP('🐀👨‍🍳', 'Movie', 'Ratatouille'), EP('🦖🏞️', 'Movie', 'Jurassic Park'), EP('⭐⚔️', 'Movie', 'Star Wars'), EP('🏠🎈🎈🎈', 'Movie', 'Up'), EP('👸❄️⛄', 'Movie', 'Frozen'),
  EP('🌧️🐱🐶', 'Saying', 'Raining cats and dogs', 'its raining cats and dogs', 'it\'s raining cats and dogs'), EP('🐘🛋️', 'Saying', 'Elephant in the room', 'the elephant in the room'), EP('⏰✈️', 'Saying', 'Time flies'),
  EP('🐦🐦🪨', 'Saying', 'Two birds with one stone', 'kill two birds with one stone', 'two birds one stone', '2 birds 1 stone'), EP('🧠🌩️', 'One word', 'Brainstorm', 'brain storm'), EP('🌙🚶', 'One word', 'Moonwalk', 'moon walk'),
  EP('🍎👁️', 'Saying', 'Apple of my eye', 'the apple of my eye', 'apple of your eye'), EP('🔥🚒', 'Two words', 'Fire truck', 'firetruck', 'fire engine'), EP('💤👸', 'Fairy tale', 'Sleeping Beauty'), EP('🐺🌕', 'Creature', 'Werewolf', 'were wolf'),
  AN('PIZZA', 'a food'), AN('GUITAR', 'an instrument'), AN('DOLPHIN', 'an animal'), AN('VOLCANO', 'in nature'), AN('BIRTHDAY', 'a celebration'), AN('SANDWICH', 'a food'), AN('ELEPHANT', 'an animal'),
  AN('PYRAMID', 'a landmark'), AN('KITCHEN', 'a room'), AN('BLANKET', 'on a bed'), AN('PENGUIN', 'an animal'), AN('MUSTARD', 'on a hot dog'), AN('TORNADO', 'weather'), AN('LIBRARY', 'a place'),
  AN('POPCORN', 'a snack'), AN('DIAMOND', 'a gem'), AN('SOCCER', 'a sport'), AN('CAMPFIRE', 'outdoors'), AN('UMBRELLA', 'for rain'), AN('BACKPACK', 'for school'),
  SA('ISLE OF VIEW', 'I love you'), SA('PEA NUT BUDDER<br>ANNE JELLY', 'Peanut butter and jelly', 'peanut butter & jelly', 'pb and j', 'pbj'), SA('HOLE EEK OW', 'Holy cow'), SA('MAY DINN<br>CHAI NAH', 'Made in China'),
  SA('SUM WEAR OH VERDE<br>RAIN BEAU', 'Somewhere over the rainbow'), SA('HAPPY BIRD DAY<br>TWO EWE', 'Happy birthday to you', 'happy birthday'), SA('TEA WRECKS', 'T. rex', 't rex', 'trex', 'tyrannosaurus rex', 't-rex'),
  SA('PLEA STUMP<br>EAT CHEW', 'Pleased to meet you', 'please to meet you'), SA('ALLEY GATE HER', 'Alligator'), SA('CHEWS DAY', 'Tuesday'), SA('GRAY TMINDS<br>THIN CALLOW HIKE', 'Great minds think alike'),
  SA('LEMON EIGHT', 'Lemonade'), SA('MACK A RONY<br>ANN CHEESE', 'Macaroni and cheese', 'mac and cheese', 'macaroni & cheese', 'mac n cheese'), SA('APE EASE<br>UH CAKE', 'A piece of cake', 'piece of cake'),
  SA('BUCK ALL UP', 'Buckle up'), SA('KNOT MY<br>PROB LIMB', 'Not my problem'), SA('BREAK FUSSED<br>INN BED', 'Breakfast in bed'), SA('EYE SCREAM<br>SUN DAY', 'Ice cream sundae', 'icecream sundae', 'ice cream sunday'),
  SA('SHOCK LIT<br>CHIP COOK EASE', 'Chocolate chip cookies', 'chocolate chip cookie'), SA('GOOD KNIGHT<br>SLEEP TIE TEA', 'Good night sleep tight', 'goodnight sleep tight'),
  MP('🦒', 'blur', 'Giraffe'), MP('🍍', 'zoom', 'Pineapple'), MP('🚁', 'blur', 'Helicopter', 'chopper'), MP('🦀', 'zoom', 'Crab'), MP('🦉', 'blur', 'Owl'), MP('🚜', 'zoom', 'Tractor'), MP('🍩', 'blur', 'Donut', 'doughnut'),
  MP('🎻', 'zoom', 'Violin', 'fiddle'), MP('🦓', 'blur', 'Zebra'), MP('🌵', 'zoom', 'Cactus'), MP('🛴', 'blur', 'Scooter'), MP('🦜', 'zoom', 'Parrot'), MP('🍓', 'blur', 'Strawberry'), MP('⛵', 'zoom', 'Sailboat', 'boat', 'sail boat', 'yacht'),
  MP('🐙', 'blur', 'Octopus'), MP('🥨', 'zoom', 'Pretzel'), MP('🚂', 'blur', 'Train', 'locomotive', 'steam train'), MP('🦔', 'zoom', 'Hedgehog', 'porcupine'), MP('🍉', 'blur', 'Watermelon'), MP('🧲', 'zoom', 'Magnet'),
  MP('🪁', 'blur', 'Kite'), MP('🐢', 'zoom', 'Turtle', 'tortoise'), MP('🔭', 'blur', 'Telescope'), MP('🥁', 'zoom', 'Drum', 'drums'), MP('🦩', 'blur', 'Flamingo'), MP('🛶', 'zoom', 'Canoe', 'kayak'),
  E('🐍 ➕ 👀', 'Snake eyes'), E('🧊 ➕ 🍦', 'Ice cream', 'icecream'), E('🌙 ➕ 💡', 'Moonlight', 'moon light'), E('🍞 ➕ 🏆', 'Breadwinner', 'bread winner'), E('🔑 ➕ 🪵', 'Keyboard', 'key board'),
];
export const TIMES = { ready: 2500, solve: 40000, reveal: 7000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const norm = t => String(t || '').toLowerCase().normalize('NFKD').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
export const isRight = (p, text) => { const n = norm(text); return !!n && [p.a, ...(p.alt || [])].some(x => norm(x) === n); };
// The hint: first letter of each word, the rest as blanks.
const hint = a => a.split(' ').map(w => w[0] + w.slice(1).replace(/[A-Za-z0-9]/g, '_')).join('   ');

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const seen = new Set(prev?.seen || []);
  const want = { pics: p => p.pic, words: p => p.k === 'rebus', anagram: p => p.k === 'anagram', sound: p => p.k === 'sound', emoji: p => p.k === 'emoji' }[opts.kind] || (() => true);
  let pool = PUZZLES.map((_, i) => i).filter(i => want(PUZZLES[i]));
  const n = opts.short ? 5 : 8;
  const fresh = pool.filter(i => !seen.has(i));
  pool = fresh.length >= n ? fresh : pool;
  // Deal one of each kind in turn, so a mixed game really is mixed.
  const byKind = {}; shuffle(pool, rnd).forEach(i => (byKind[PUZZLES[i].k] = byKind[PUZZLES[i].k] || []).push(i));
  const kinds = shuffle(Object.keys(byKind), rnd), list = [];
  for (let k = 0; list.length < n && kinds.some(x => byKind[x].length); k++) { const pile = byKind[kinds[k % kinds.length]]; if (pile.length) list.push(pile.pop()); }
  const s = { game: 'rebus', players: players.map(p => ({ pid: p.pid, name: p.name })), list, r: 0, round: 0, scores: {}, seen: [...seen].slice(-30) };
  s.seen.push(...s.list);
  s.players.forEach(p => (s.scores[p.pid] = 0));
  ready(s, Date.now());
  return s;
}
const P = s => PUZZLES[s.list[Math.min(s.r, s.list.length - 1)]];
function ready(s, now) { s.solved = []; s.gained = {}; s.tries = {}; s.phase = 'ready'; s.round++; s.deadline = now + TIMES.ready; }
function reveal(s, now) { s.phase = 'reveal'; s.round++; s.deadline = now + TIMES.reveal; }

export function act(s, pid, a, now = Date.now()) {
  if (!a || s.phase !== 'solve' || a.type !== 'guess' || s.scores[pid] === undefined || s.solved.includes(pid)) return s;
  s.tries[pid] = (s.tries[pid] || 0) + 1;
  if (isRight(P(s), a.text)) {
    const left = Math.max(0, s.deadline - now) / TIMES.solve;
    const pts = Math.round((400 + 600 * left) / 10) * 10 + (s.solved.length === 0 ? 200 : 0);
    s.solved.push(pid); s.gained[pid] = pts; s.scores[pid] += pts; s.eventId = (s.eventId || 0) + 1;
    if (s.solved.length === s.players.length) reveal(s, now);
  } else s.miss = { pid, n: (s.miss?.n || 0) + 1 };
  return s;
}
export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'ready') { s.phase = 'solve'; s.round++; s.start = now; s.deadline = now + TIMES.solve; }
  else if (s.phase === 'solve') reveal(s, now);
  else if (s.phase === 'reveal') { s.r++; if (s.r >= s.list.length) { s.phase = 'over'; s.round++; s.deadline = 0; } else ready(s, now); }
  return s;
}
export function tick(s, now = Date.now()) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s; }

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
const hinted = (s, now) => s.phase === 'solve' && now - s.start > TIMES.solve / 2;
export function narration(s) {
  if (s.phase === 'ready') return s.r === 0 ? 'Brain Teasers! A different kind of puzzle every round. Type your answer. Faster is better.' : '';
  if (s.phase === 'solve') return P(s).ask + '.';
  if (s.phase === 'reveal') return `${P(s).a}!${s.solved.length ? ` ${nameOf(s, s.solved[0])} got it first.` : ' Nobody got that one.'}`;
  if (s.phase === 'over') return `${ranking(s)[0].name} wins Brain Teasers!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'ready') return { sound: 'join', wait: 500, title: s.r === 0 ? 'Brain Teasers' : `Puzzle ${s.r + 1}`, sub: s.r === 0 ? 'A new kind of puzzle every round' : '' };
  if (s.phase === 'solve') return { sound: 'whoosh', wait: 200 };
  if (s.phase === 'reveal') return { sound: 'drumroll', after: s.solved.length ? 'win' : 'lose', wait: 1300, react: s.solved.length ? 'cheer' : 'groan' };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function cueEvent(s) { return s.eventId && s.phase === 'solve' ? { id: s.eventId, sound: 'points', say: s.solved.length === 1 ? `${nameOf(s, s.solved[0])} has it!` : '' } : null; }
export function botAct(v, rnd = Math.random) { return v.phase === 'solve' && !v.solved && rnd() < 0.12 ? { type: 'guess', text: rnd() < 0.6 ? v._answer : 'banana' } : null; }

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, r: s.r + 1, of: s.list.length, scores: ranking(s), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), eventId: s.eventId || 0 };
  if (s.phase !== 'ready' && s.phase !== 'over') { v.h = P(s).h; v.ask = P(s).ask; v.start = s.start; v.solved = s.solved.map(p => ({ name: nameOf(s, p), pts: s.gained[p] })); v.total = s.players.length; v.hint = hinted(s, now) ? hint(P(s).a) : null; v.misses = s.miss?.n || 0; }
  if (s.phase === 'reveal') v.answer = P(s).a;
  return v;
}
export function phoneView(s, pid, now = Date.now()) {
  if (s.scores[pid] === undefined) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, score: s.scores[pid], solved: s.solved.includes(pid), gained: s.gained[pid] || 0, tries: s.tries[pid] || 0 };
  if (s.phase === 'solve') { v.h = P(s).h; v.ask = P(s).ask; v.start = s.start; v.hint = hinted(s, now) ? hint(P(s).a) : null; if (pid.startsWith('bot-')) v._answer = P(s).a; }
  if (s.phase === 'reveal') v.answer = P(s).a;
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Puzzle ${v.r} of ${v.of}</p>`;
  if (v.phase === 'ready') h += `<div class="rbbox"><span class="rb-big">?</span></div><div class="how"><h3>How to play</h3><ol><li>Every round is a different puzzle: a word picture, emoji, scrambled letters, a phrase to say out loud, or a mystery picture that slowly clears.</li><li>Type what it says on your phone. Guess as often as you like.</li><li>Faster answers score more. A hint appears halfway through.</li></ol></div>`;
  const secs = Math.max(0, (Date.now() - (v.start || Date.now())) / 1000).toFixed(1);
  if (v.phase === 'solve' || v.phase === 'reveal') h += `<p class="rbask">${esc(v.ask || '')}</p><div class="rbbox ${v.phase === 'reveal' ? 'done' : ''}" style="--el:${secs}s">${v.h}</div>${v.phase === 'reveal' ? `<div class="rbanswer">${esc(v.answer)}</div>` : `<p class="rbhint">${v.hint ? esc(v.hint) : '&nbsp;'}</p><p class="center"><span class="clock ${v.left <= 10 ? 'hurry' : ''}">${v.left}</span></p>`}<div class="huntfound">${v.solved.map((x, i) => `<span data-pop="rb${v.r}-${i}" data-snd="none">${['🥇', '🥈', '🥉'][i] || '✅'} ${esc(x.name)}${v.phase === 'reveal' ? ` +${x.pts}` : ''}</span>`).join('')}</div>${v.phase === 'solve' ? '<button class="btn ghost" data-host="next">Show the answer</button>' : '<button class="btn" data-host="next">Next puzzle</button>'}`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}
let wrongAt = 0;
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = '';
  if (v.phase === 'ready') h = '<h2>Get ready…</h2>';
  else if (v.phase === 'solve') h = v.solved ? `<h2 class="win">Got it! +${v.gained}</h2>` : `<p class="rbask">${esc(v.ask || '')}</p><div class="rbbox small" style="--el:${Math.max(0, (Date.now() - (v.start || Date.now())) / 1000).toFixed(1)}s">${v.h}</div>${v.hint ? `<p class="rbhint">${esc(v.hint)}</p>` : ''}<form id="rf"><input id="ra" maxlength="50" autocomplete="off" autocapitalize="off" placeholder="What does it say?" required><button class="btn">Guess</button></form>${v.tries && Date.now() - wrongAt < 2500 ? '<p class="lose">Not that. Try again!</p>' : ''}`;
  else if (v.phase === 'reveal') h = `<h2 class="${v.solved ? 'win' : ''}">${esc(v.answer)}</h2><p class="say">${v.solved ? `+${v.gained}` : 'Next time!'}</p>`;
  else if (v.phase === 'over') h = '<h2>Thanks for playing!</h2>';
  el.innerHTML = h + `<p class="muted small">Score: ${v.score.toLocaleString()}</p>`;
  const f = el.querySelector('#rf');
  if (f) { f.querySelector('input').focus(); f.onsubmit = e => { e.preventDefault(); const t = f.querySelector('input').value.trim(); if (t) { wrongAt = Date.now(); send({ type: 'guess', text: t }); f.querySelector('input').value = ''; } }; }
}
meta.options = [{ id: 'kind', name: 'Puzzles', choices: [['mix', 'a bit of everything'], ['pics', 'pictures only (kids)'], ['words', 'word pictures'], ['emoji', 'emoji phrases'], ['anagram', 'anagrams'], ['sound', 'say it out loud']] }];
