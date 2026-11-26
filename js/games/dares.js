// Secret Missions: a game that runs in the background of your party. Each phone holds three secret missions
// ("Get someone to say 'pineapple'"). Pull one off, tap Done, and the TV announces it. Everyone else has a
// few seconds to cry foul. Most points when the clock runs out wins.
import { esc } from '../ui.js';

export const meta = {
  id: 'dares',
  name: 'Secret Missions',
  min: 3,
  max: 20,
  blurb: 'Your phone gives you secret dares during the party. Pull them off!',
};

export const MISSIONS = [
  [1, 'Get someone to say the word "pineapple"'], [1, 'Get someone to give you a high five'], [1, 'Get someone to tell you their favorite movie'], [1, 'Get two people to say "cheers" at the same time'],
  [1, 'Get someone to tell you what they had for breakfast'], [1, 'Get someone to say your name three times'], [1, 'Get someone to show you a photo on their phone'], [1, 'Get someone to say "absolutely"'],
  [1, 'Get someone to fist-bump you'], [1, 'Get someone to name a vegetable'], [2, 'Get someone to sing at least one line of a song'], [2, 'Get someone to do a little dance'],
  [2, 'Get someone to tell you a joke'], [2, 'Get someone to say "I agree with you"'], [2, 'Get someone to stand on one foot'], [2, 'Get someone to compliment your shoes'],
  [2, 'Get someone to say a word that rhymes with "orange"'], [2, 'Get someone to do an animal impression'], [2, 'Get someone to spell their name out loud'], [2, 'Get someone to hum a tune'],
  [2, 'Use the word "magnificent" three times in one conversation'], [2, 'Get someone to tell you their birthday month'], [3, 'Get two people to switch seats'], [3, 'Get someone to do their best robot voice'],
  [3, 'Get the whole room to clap at the same time'], [3, 'Get someone to share a childhood nickname'], [3, 'Start a conversation about pirates and keep it going for a minute'], [3, 'Get someone to say "you\'re a genius"'],
  [3, 'Get someone to try a tongue twister'], [3, 'Get someone to do a slow-motion replay of something they just did'],
];
export const TIMES = { game: 15 * 60000, check: 12000 };
const HAND = 3, SWAPS = 2;
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random) {
  const s = { game: 'dares', players: players.map(p => ({ pid: p.pid, name: p.name })), deck: shuffle([...MISSIONS.keys()], rnd), hands: {}, swaps: {}, scores: {}, claims: [], feed: [], phase: 'play', round: 0, deadline: Date.now() + TIMES.game, nextId: 1, eventId: 0 };
  s.players.forEach(p => { s.hands[p.pid] = []; s.swaps[p.pid] = SWAPS; s.scores[p.pid] = 0; for (let i = 0; i < HAND; i++) draw(s, p.pid, rnd); });
  return s;
}

function draw(s, pid, rnd = Math.random) {
  const held = new Set(Object.values(s.hands).flat());
  if (!s.deck.length) s.deck = shuffle([...MISSIONS.keys()].filter(i => !held.has(i)), rnd);
  // Big groups: missions can repeat across players, just never twice in one hand.
  if (!s.deck.some(i => !s.hands[pid].includes(i))) s.deck = shuffle([...MISSIONS.keys()].filter(i => !s.hands[pid].includes(i)), rnd);
  for (let i = s.deck.length - 1; i >= 0; i--) {
    if (!s.hands[pid].includes(s.deck[i])) { s.hands[pid].push(s.deck.splice(i, 1)[0]); return; }
  }
}
const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const isP = (s, pid) => s.players.some(p => p.pid === pid);

function settle(s, now) {
  for (const c of s.claims.filter(c => !c.done && now >= c.until)) {
    c.done = true;
    const others = s.players.length - 1;
    c.ok = c.foul.length * 2 < others || others === 0;   // it counts unless at least half the others cry foul
    if (c.ok) s.scores[c.pid] += MISSIONS[c.m][0];
    s.feed.unshift({ name: nameOf(s, c.pid), text: MISSIONS[c.m][1], pts: MISSIONS[c.m][0], ok: c.ok });
    s.feed = s.feed.slice(0, 6);
    s.eventId++; s.lastOk = c.ok;
  }
  s.claims = s.claims.filter(c => !c.done);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !isP(s, pid) || s.phase !== 'play') return s;
  if ((a.type === 'done' || a.type === 'swap') && s.hands[pid].includes(a.m)) {
    if (a.type === 'swap' && s.swaps[pid] <= 0) return s;
    s.hands[pid] = s.hands[pid].filter(x => x !== a.m);
    if (a.type === 'swap') { s.swaps[pid]--; s.deck.unshift(a.m); }
    else { s.claims.push({ id: s.nextId++, pid, m: a.m, until: now + TIMES.check, foul: [] }); s.eventId++; s.lastOk = null; }
    draw(s, pid, rnd);
  } else if (a.type === 'foul') {
    const c = s.claims.find(x => x.id === a.id);
    if (c && c.pid !== pid && !c.foul.includes(pid)) c.foul.push(pid);
  }
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a === 'next' && s.phase === 'play') { s.claims.forEach(c => (c.until = now)); settle(s, now); s.phase = 'over'; s.round++; s.deadline = 0; }
  return s;
}
export function tick(s, now = Date.now()) {
  if (s.phase !== 'play') return s;
  settle(s, now);
  if (now >= s.deadline) hostAct(s, 'next', now);
  return s;
}

const ranking = s => s.players.map(p => ({ pid: p.pid, name: p.name, score: s.scores[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'play' && !s.feed.length && !s.claims.length) return 'Secret Missions has begun! Check your phone for three secret missions. Pull them off without getting caught. Keep partying!';
  if (s.phase === 'over') return `Time's up! ${ranking(s)[0].name} completed the most missions!`;
  return '';
}
export function cue(s) {
  if (s.phase === 'play') return { sound: 'join', wait: 700, title: 'Secret Missions', sub: '15 minutes. Go!' };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: "Time's up!", sub: `${ranking(s)[0].name} wins`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.lastOk === null) { const c = s.claims[s.claims.length - 1]; return c ? { id: s.eventId, sound: 'drumroll', say: `${nameOf(s, c.pid)} says they completed a mission!` } : null; }
  return { id: s.eventId, sound: s.lastOk ? 'win' : 'lose', say: s.lastOk ? 'Mission accepted!' : 'Foul! That one doesn\'t count.' };
}

export function botAct(v, rnd = Math.random) {
  if (v.phase !== 'play') return null;
  const c = v.claims.find(x => !x.mine && !x.fouled);
  if (c && rnd() < 0.15) return { type: 'foul', id: c.id };
  if (rnd() < 0.04 && v.missions.length) return { type: 'done', m: v.missions[0].m };
  if (rnd() < 0.01 && v.swaps) return { type: 'swap', m: v.missions[1].m };
  return null;
}

export function tvView(s, now = Date.now()) {
  return {
    phase: s.phase, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s), feed: s.feed,
    claims: s.claims.map(c => ({ name: nameOf(s, c.pid), text: MISSIONS[c.m][1], left: Math.max(0, Math.ceil((c.until - now) / 1000)), fouls: c.foul.length })),
  };
}
export function phoneView(s, pid) {
  if (!isP(s, pid)) return { phase: 'spectate' };
  return {
    phase: s.phase, score: s.scores[pid], swaps: s.swaps[pid], place: s.phase === 'over' ? ranking(s).findIndex(x => x.pid === pid) + 1 : 0,
    missions: s.hands[pid].map(m => ({ m, pts: MISSIONS[m][0], text: MISSIONS[m][1] })),
    claims: s.claims.map(c => ({ id: c.id, name: nameOf(s, c.pid), text: MISSIONS[c.m][1], mine: c.pid === pid, fouled: c.foul.includes(pid) })),
  };
}

export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase === 'over');
  const scores = `<div class="scores"><h3>Points</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'play') h = `<h2>🕵️ Secret Missions</h2><p class="clock ${v.left <= 60 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p>${v.claims.map(c => `<div class="dclaim"><b>${esc(c.name)}</b> says they did it: <i>${esc(c.text)}</i><small>Did they? Tap 👎 on your phone if not. ${c.fouls ? `${c.fouls} 👎 · ` : ''}${c.left}s</small></div>`).join('')}<div class="dfeed">${v.feed.map(f => `<div class="${f.ok ? 'ok' : 'no'}">${f.ok ? '✅' : '❌'} <b>${esc(f.name)}</b>: ${esc(f.text)} ${f.ok ? `<b class="win">+${f.pts}</b>` : '<span class="lose">foul!</span>'}</div>`).join('') || '<p class="say">Keep partying! Missions pop up here when someone pulls one off.</p>'}</div><button class="btn ghost" data-host="next">End the game</button><div class="how"><h3>How to play</h3><ol><li>Your phone has three secret missions, like "Get someone to say pineapple".</li><li>Pull one off sneakily during the party, then tap Done.</li><li>Everyone else gets a few seconds to tap 👎 if it didn't really happen.</li><li>You get a new mission each time. Most points at the end wins.</li></ol></div>`;
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} is the top secret agent!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${scores}</div>`;
}

export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'Top secret agent!' : `You came #${v.place}`}</h2><p class="muted">${v.score} points</p>`; return; }
  const others = v.claims.filter(c => !c.mine);
  el.innerHTML = `<p class="muted">${v.score} points · ${v.swaps} swap${v.swaps === 1 ? '' : 's'} left · keep this screen hidden!</p>
    ${others.map(c => `<div class="dclaim"><b>${esc(c.name)}</b>: ${esc(c.text)}${c.fouled ? '<p class="muted">You called foul.</p>' : `<button class="btn ghost" data-foul="${c.id}">👎 That didn't happen</button>`}</div>`).join('')}
    <h2>Your secret missions</h2>${v.missions.map(m => `<div class="dmission"><span class="dpts">${'★'.repeat(m.pts)}</span><p>${esc(m.text)}</p><div class="row"><button class="btn" data-done="${m.m}">Done!</button>${v.swaps ? `<button class="btn ghost" data-swap="${m.m}">Swap</button>` : ''}</div></div>`).join('')}`;
  el.querySelectorAll('[data-done]').forEach(b => (b.onclick = () => { b.disabled = true; try { navigator.vibrate?.(40); } catch {} send({ type: 'done', m: Number(b.dataset.done) }); }));
  el.querySelectorAll('[data-swap]').forEach(b => (b.onclick = () => { b.disabled = true; send({ type: 'swap', m: Number(b.dataset.swap) }); }));
  el.querySelectorAll('[data-foul]').forEach(b => (b.onclick = () => send({ type: 'foul', id: Number(b.dataset.foul) })));
}
