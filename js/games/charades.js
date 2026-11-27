// Picture Charades: the actor's phone shows a picture card. Act it out, no talking! When someone guesses,
// the actor taps their name and both get a point. Pictures mean kids who can't read yet can play too.
import { esc } from '../ui.js';

export const meta = {
  id: 'charades',
  name: 'Picture Charades',
  min: 3,
  max: 20,
  blurb: 'Act out the picture on your phone. Great for kids who can\'t read yet.',
  kids: true,
};

export const CARDS = [
  ['🐘', 'Elephant'], ['🐒', 'Monkey'], ['🐍', 'Snake'], ['🐸', 'Frog'], ['🐧', 'Penguin'], ['🦀', 'Crab'], ['🐔', 'Chicken'], ['🐶', 'Dog'], ['🐱', 'Cat'], ['🐰', 'Bunny'],
  ['🦁', 'Lion'], ['🐻', 'Bear'], ['🦘', 'Kangaroo'], ['🐟', 'Fish'], ['🦋', 'Butterfly'], ['🐝', 'Bee'], ['🐢', 'Turtle'], ['🦖', 'Dinosaur'], ['🐴', 'Horse'], ['🦆', 'Duck'],
  ['⚽', 'Soccer'], ['🏀', 'Basketball'], ['🏊', 'Swimming'], ['🚴', 'Riding a bike'], ['⛷️', 'Skiing'], ['🎳', 'Bowling'], ['🥊', 'Boxing'], ['🏄', 'Surfing'], ['🎣', 'Fishing'], ['🧗', 'Climbing'],
  ['🎸', 'Guitar'], ['🥁', 'Drums'], ['🎺', 'Trumpet'], ['🎻', 'Violin'], ['🎹', 'Piano'], ['🎤', 'Singing'], ['💃', 'Dancing'], ['👻', 'Ghost'], ['🧟', 'Zombie'], ['🤖', 'Robot'],
  ['🦸', 'Superhero'], ['🧙', 'Wizard'], ['🧜', 'Mermaid'], ['🏴‍☠️', 'Pirate'], ['👑', 'King'], ['🤡', 'Clown'], ['👨‍🚀', 'Astronaut'], ['👩‍🍳', 'Chef'], ['👮', 'Police officer'], ['🧑‍🚒', 'Firefighter'],
  ['🍦', 'Ice cream'], ['🍕', 'Pizza'], ['🍌', 'Banana'], ['🍝', 'Spaghetti'], ['🍿', 'Popcorn'], ['🌭', 'Hot dog'], ['🍉', 'Watermelon'], ['🥞', 'Pancakes'], ['🍋', 'Lemon'], ['🎂', 'Birthday cake'],
  ['🚗', 'Driving'], ['✈️', 'Airplane'], ['🚀', 'Rocket'], ['🚂', 'Train'], ['🚁', 'Helicopter'], ['⛵', 'Sailboat'], ['🛹', 'Skateboard'], ['🚲', 'Bicycle'], ['🛸', 'Flying saucer'], ['🚒', 'Fire truck'],
  ['🪥', 'Brushing teeth'], ['😴', 'Sleeping'], ['🧹', 'Sweeping'], ['📸', 'Taking a photo'], ['🎁', 'Opening a present'], ['🛁', 'Taking a bath'], ['📞', 'Phone call'], ['🪁', 'Flying a kite'], ['🧊', 'Freezing cold'], ['🔥', 'Too hot'],
  ['☔', 'Rain'], ['⛄', 'Snowman'], ['🌋', 'Volcano'], ['🌪️', 'Tornado'], ['🌈', 'Rainbow'], ['🎈', 'Balloon'], ['🪄', 'Magic trick'], ['🎢', 'Roller coaster'], ['🤧', 'Sneezing'], ['🥶', 'Shivering'],
];
export const TIMES = { ready: 25000, turn: 50000, turnEnd: 6000 };

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  return {
    game: 'charades', players: order, turns: Math.min(order.length, opts.short ? 5 : 12), turn: 0, round: 0,
    scores: Object.fromEntries(order.map(p => [p.pid, 0])),
    deck: shuffle(CARDS.map((_, i) => i), rnd), card: null, log: [], lastTurn: null,
    phase: 'ready', deadline: Date.now() + TIMES.ready, eventId: 0, lastEvent: null,
  };
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const actor = s => s.players[s.turn % s.players.length].pid;
const draw = (s, rnd) => { if (!s.deck.length) s.deck = shuffle(CARDS.map((_, i) => i), rnd); s.card = s.deck.pop(); };
const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);

function endTurn(s, now) {
  if (s.card !== null) s.deck.unshift(s.card);
  s.card = null;
  s.lastTurn = { actor: nameOf(s, actor(s)), log: s.log };
  s.phase = 'turnEnd'; s.round++;
  s.deadline = now + TIMES.turnEnd;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'ready' && a.type === 'start' && pid === actor(s)) {
    s.phase = 'turn'; s.round++; s.log = []; draw(s, rnd); s.deadline = now + TIMES.turn; s.eventId++; s.lastEvent = 'start';
  } else if (s.phase === 'turn' && pid === actor(s) && a.card === s.card) {
    if (a.type === 'got' && a.by !== pid && s.players.some(p => p.pid === a.by)) {
      s.scores[pid]++; s.scores[a.by]++;
      s.log.push({ word: CARDS[s.card][1], emoji: CARDS[s.card][0], by: nameOf(s, a.by) });
      s.eventId++; s.lastEvent = 'got';
      draw(s, rnd);
    } else if (a.type === 'skip') {
      s.log.push({ word: CARDS[s.card][1], emoji: CARDS[s.card][0], by: null });
      s.eventId++; s.lastEvent = 'skip';
      draw(s, rnd);
    }
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'ready') act(s, actor(s), { type: 'start' }, now, rnd);
  else if (s.phase === 'turn') endTurn(s, now);
  else if (s.phase === 'turnEnd') {
    s.turn++;
    if (s.turn >= s.turns) { s.phase = 'over'; s.round++; s.deadline = 0; return s; }
    s.phase = 'ready'; s.round++; s.deadline = now + TIMES.ready;
  }
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (!s.deadline || now < s.deadline) return s;
  return hostAct(s, 'next', now, rnd);
}

export function narration(s) {
  if (s.phase === 'ready') return `${s.turn === 0 ? 'Welcome to Picture Charades! No talking, just acting. ' : ''}${nameOf(s, actor(s))}, you're up! Press start when you're ready.`;
  if (s.phase === 'turnEnd') { const n = s.lastTurn.log.filter(l => l.by).length; return `Time! ${n} guessed.`; }
  if (s.phase === 'over') return `${ranking(s)[0].name} wins Picture Charades!`;
  return '';
}

export function cue(s) {
  if (s.phase === 'ready') return { sound: 'join', wait: 700, title: nameOf(s, actor(s)), sub: 'is acting' };
  if (s.phase === 'turn') return { sound: 'vote', wait: 200 };
  if (s.phase === 'turnEnd') return { sound: 'drumroll', wait: 300 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} wins!`, tone: 'dawn', fx: 'confetti' };
  return null;
}

export function cueEvent(s) {
  if (s.lastEvent === 'got') return { id: s.eventId, sound: 'safe', say: '' };
  if (s.lastEvent === 'skip') return { id: s.eventId, sound: 'tick', say: '' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'ready' && v.isActor) return { type: 'start' };
  if (v.phase === 'turn' && v.isActor && v.card) return rnd() < 0.75 ? { type: 'got', card: v.cardId, by: v.others[Math.floor(rnd() * v.others.length)].pid } : { type: 'skip', card: v.cardId };
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, turn: s.turn + 1, turns: s.turns, actor: nameOf(s, actor(s)), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s), got: s.log.filter(l => l.by).length };
  if (s.phase === 'turnEnd') v.lastTurn = s.lastTurn;
  return v;
}

export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const v = { phase: s.phase, isActor: pid === actor(s), actor: nameOf(s, actor(s)), score: s.scores[pid] };
  if (s.phase === 'turn' && v.isActor && s.card !== null) {
    v.card = CARDS[s.card]; v.cardId = s.card;
    v.others = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name }));
    v.got = s.log.filter(l => l.by).length;
  }
  if (s.phase === 'over') v.place = ranking(s).findIndex(x => x.pid === pid) + 1;
  return v;
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const scores = `<div class="scores"><h3>Scores</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = `<p class="cat">Turn ${v.turn} of ${v.turns}</p>`;
  if (v.phase === 'ready') h += `<h2>${esc(v.actor)} is up!</h2><p class="say">${esc(v.actor)} acts out the picture on their phone. <b>No talking, no sounds, no pointing at things!</b> Shout out your guesses. When you get it, ${esc(v.actor)} taps your name and you both get a point.</p><button class="btn ghost" data-host="next">Start now</button>`;
  if (v.phase === 'turn') h += `<h2>🎭 ${esc(v.actor)} is acting…</h2><div class="tabooclock ${v.left <= 10 ? 'hurry' : ''}"><span class="clock">${v.left}</span></div><p class="say center">Guessed so far: <b class="win">${v.got}</b></p><p class="muted center">No talking! Guess out loud.</p><button class="btn ghost" data-host="next">End turn</button>`;
  if (v.phase === 'turnEnd') h += `<h2>${esc(v.lastTurn.actor)}: ${v.lastTurn.log.filter(l => l.by).length} guessed</h2><div class="chcards">${v.lastTurn.log.map(l => `<div class="chcard ${l.by ? '' : 'skipped'}"><span>${l.emoji}</span><b>${esc(l.word)}</b><small>${l.by ? `got it: ${esc(l.by)}` : 'skipped'}</small></div>`).join('') || '<p class="muted">No cards this turn</p>'}</div><button class="btn" data-host="next">Next actor</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} wins!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  let h = `<p class="muted">${v.score} point${v.score === 1 ? "" : "s"}</p>`;
  if (v.phase === 'ready') h += v.isActor ? `<h2>You're acting!</h2><p class="say">Act out each picture. No talking! When someone gets it, tap their name.</p><button class="btn" data-start>Start (50 seconds)</button>` : `<h2>${esc(v.actor)} is up</h2><p class="say">Watch and shout your guesses!</p>`;
  else if (v.phase === 'turn' && v.card) h += `<div class="chbig"><span>${v.card[0]}</span><b>${esc(v.card[1])}</b></div><p class="muted">Who guessed it?</p><div class="chwho">${v.others.map(o => `<button class="btn" data-by="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}</div><button class="btn ghost" data-skip>Skip this one</button>`;
  else if (v.phase === 'turn') h += `<h2>Guess out loud!</h2><p class="say">${esc(v.actor)} is acting. No peeking at their phone!</p>`;
  else if (v.phase === 'turnEnd') h += '<h2>Time!</h2><p class="say">Check the TV.</p>';
  else if (v.phase === 'over') h += `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You won!' : `You came #${v.place}`}</h2>`;
  el.innerHTML = h;
  el.querySelector('[data-start]')?.addEventListener('click', () => send({ type: 'start' }));
  el.querySelectorAll('[data-by]').forEach(b => b.addEventListener('click', () => { el.querySelectorAll('[data-by],[data-skip]').forEach(x => (x.disabled = true)); try { navigator.vibrate?.(30); } catch {} send({ type: 'got', card: v.cardId, by: b.dataset.by }); }));
  el.querySelector('[data-skip]')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'skip', card: v.cardId }); });
}
