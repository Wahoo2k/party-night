// Midnight Wolves: a ten-minute werewolf game with one night and one vote. Three extra role cards sit in
// the middle. At night some roles peek at or swap cards, so you may not be what you started as!
// Then everyone talks and votes once. Village wins if a wolf is voted out.
import { esc } from '../ui.js';

export const meta = {
  id: 'midnight',
  name: 'Midnight Wolves',
  min: 3,
  max: 10,
  blurb: 'One night, one vote, ten minutes. Who is the wolf?',
};

export const ROLES = {
  wolf: { name: 'Werewolf', icon: '🐺', team: 'wolf', how: 'You see the other wolves. If you are the only wolf, peek at one middle card.' },
  seer: { name: 'Seer', icon: '🔮', team: 'village', how: 'Look at one player\'s card, or two of the middle cards.' },
  robber: { name: 'Robber', icon: '🦝', team: 'village', how: 'Swap your card with another player\'s and see your new card.' },
  trouble: { name: 'Troublemaker', icon: '🃏', team: 'village', how: 'Swap two other players\' cards without looking.' },
  drunk: { name: 'Sleepwalker', icon: '😵', team: 'village', how: 'Swap your card with a middle card without looking. You won\'t know what you are!' },
  insomniac: { name: 'Night Owl', icon: '🦉', team: 'village', how: 'Wake up at the end of the night and see your card.' },
  villager: { name: 'Villager', icon: '🧑‍🌾', team: 'village', how: 'No night power. Use your wits!' },
};
export const TIMES = { look: 12000, night: 35000, morning: 12000, day: 180000, vote: 35000 };
const ORDER = ['wolf', 'wolf', 'seer', 'robber', 'trouble', 'drunk', 'insomniac', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager'];

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const deck = shuffle(ORDER.slice(0, order.length + 3), rnd);
  const start = {};
  order.forEach((p, i) => (start[p.pid] = deck[i]));
  return {
    game: 'midnight', players: order, start, final: { ...start }, center: deck.slice(order.length), centerStart: deck.slice(order.length),
    choices: {}, learned: {}, votes: {}, result: null, phase: 'look', round: 0, deadline: Date.now() + TIMES.look,
  };
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const isP = (s, pid) => s.players.some(p => p.pid === pid);

// Everyone acts at once; the night is resolved in role order afterwards.
function resolve(s) {
  const C = s.choices, start = s.start, L = s.learned;
  const card = { ...start }, center = [...s.center];
  const wolves = s.players.filter(p => start[p.pid] === 'wolf').map(p => p.pid);
  for (const pid of wolves) {
    const others = wolves.filter(w => w !== pid).map(w => nameOf(s, w));
    if (others.length) L[pid] = `The other wolf is ${others.join(' and ')}.`;
    else { const i = [0, 1, 2].includes(C[pid]?.center) ? C[pid].center : 0; L[pid] = `You're the only wolf. Middle card ${i + 1} is the ${ROLES[center[i]].name} ${ROLES[center[i]].icon}.`; }
  }
  const by = role => s.players.find(p => start[p.pid] === role)?.pid;
  const seer = by('seer');
  if (seer) {
    const c = C[seer] || {};
    if (c.target && isP(s, c.target) && c.target !== seer) L[seer] = `${nameOf(s, c.target)} is the ${ROLES[card[c.target]].name} ${ROLES[card[c.target]].icon}.`;
    else { const [a, b] = Array.isArray(c.centers) && c.centers.length === 2 ? c.centers : [0, 1]; L[seer] = `Middle cards: ${ROLES[center[a]].name} ${ROLES[center[a]].icon} and ${ROLES[center[b]].name} ${ROLES[center[b]].icon}.`; }
  }
  const robber = by('robber');
  if (robber) {
    const t = C[robber]?.target;
    if (t && isP(s, t) && t !== robber) { [card[robber], card[t]] = [card[t], card[robber]]; L[robber] = `You swapped with ${nameOf(s, t)}. You are now the ${ROLES[card[robber]].name} ${ROLES[card[robber]].icon}!`; }
    else L[robber] = 'You decided not to rob anyone.';
  }
  const tm = by('trouble');
  if (tm) {
    const [a, b] = C[tm]?.pair || [];
    if (a && b && a !== b && isP(s, a) && isP(s, b) && a !== tm && b !== tm) { [card[a], card[b]] = [card[b], card[a]]; L[tm] = `You swapped ${nameOf(s, a)} and ${nameOf(s, b)}.`; }
    else L[tm] = 'You let everyone sleep.';
  }
  const drunk = by('drunk');
  if (drunk) { const i = [0, 1, 2].includes(C[drunk]?.center) ? C[drunk].center : 0; [card[drunk], center[i]] = [center[i], card[drunk]]; L[drunk] = `You swapped with middle card ${i + 1}. You don't know what you are now!`; }
  const owl = by('insomniac');
  if (owl) L[owl] = `You woke up as the ${ROLES[card[owl]].name} ${ROLES[card[owl]].icon}.`;
  s.final = card; s.center = center;
}

function tally(s) {
  const count = {};
  Object.values(s.votes).forEach(v => (count[v] = (count[v] || 0) + 1));
  const top = Math.max(0, ...Object.values(count));
  const out = top >= 2 ? Object.keys(count).filter(k => count[k] === top) : [];
  const wolvesNow = s.players.filter(p => s.final[p.pid] === 'wolf').map(p => p.pid);
  const wolfDied = out.some(pid => s.final[pid] === 'wolf');
  const village = wolfDied || (!wolvesNow.length && !out.length);
  s.result = { out, village, wolvesNow, count };
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !isP(s, pid)) return s;
  if (s.phase === 'night' && a.type === 'night' && !s.choices[pid]) {
    s.choices[pid] = { target: a.target, centers: a.centers, center: a.center, pair: a.pair };
    if (s.players.every(p => s.choices[p.pid])) morning(s, now);
  } else if (s.phase === 'vote' && a.type === 'vote' && isP(s, a.target) && a.target !== pid) {
    s.votes[pid] = a.target;
    if (s.players.every(p => s.votes[p.pid])) end(s);
  }
  return s;
}

function morning(s, now) { resolve(s); s.phase = 'morning'; s.round++; s.deadline = now + TIMES.morning; }
function end(s) { tally(s); s.phase = 'over'; s.round++; s.deadline = 0; }

export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'look') { s.phase = 'night'; s.round++; s.deadline = now + TIMES.night; }
  else if (s.phase === 'night') morning(s, now);
  else if (s.phase === 'morning') { s.phase = 'day'; s.round++; s.deadline = now + TIMES.day; }
  else if (s.phase === 'day') { s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote; }
  else if (s.phase === 'vote') end(s);
  return s;
}
export function tick(s, now = Date.now()) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now) : s; }

export function narration(s) {
  if (s.phase === 'look') return 'Welcome to Midnight Wolves. Look at your card, then keep it secret. Three more cards lie face down in the middle of the village.';
  if (s.phase === 'night') return 'Everyone, close your eyes… just kidding. Look at your phone. If you have a night power, use it now. Everyone else, tap anything so nobody can tell.';
  if (s.phase === 'morning') return 'The sun rises. Check what you learned in the night.';
  if (s.phase === 'day') return 'Now talk! Who is a wolf? Remember, your card may have changed in the night. You have three minutes.';
  if (s.phase === 'vote') return 'Time to vote! Point at the wolf on your phone.';
  if (s.phase === 'over') return s.result.village ? 'The village wins!' : 'The werewolves win!';
  return '';
}
export function cue(s) {
  if (s.phase === 'look') return { sound: 'join', wait: 700, title: 'Midnight Wolves', sub: 'Check your card', tone: 'night' };
  if (s.phase === 'night') return { sound: 'night', wait: 1800, title: 'Night falls', tone: 'night', ambient: 'crickets' };
  if (s.phase === 'morning') return { sound: 'dawn', wait: 1500, title: 'Morning', tone: 'dawn' };
  if (s.phase === 'day') return { sound: 'join', wait: 500 };
  if (s.phase === 'vote') return { sound: 'vote', wait: 500, title: 'Vote!' };
  if (s.phase === 'over') return { sound: s.result.village ? 'win' : 'death', wait: 1500, title: s.result.village ? 'Village wins!' : 'Wolves win!', tone: s.result.village ? 'dawn' : 'blood', fx: s.result.village ? 'confetti' : 'claws' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  const pick = a => a[Math.floor(rnd() * a.length)];
  if (v.phase === 'night' && !v.acted) {
    const others = v.others.map(o => o.pid);
    if (v.role === 'seer') return rnd() < 0.5 ? { type: 'night', target: pick(others) } : { type: 'night', centers: [0, 2] };
    if (v.role === 'robber') return { type: 'night', target: pick(others) };
    if (v.role === 'trouble') { const sh = others.slice().sort(() => rnd() - 0.5); return { type: 'night', pair: sh.slice(0, 2) }; }
    if (v.role === 'drunk' || v.role === 'wolf') return { type: 'night', center: Math.floor(rnd() * 3) };
    return { type: 'night' };
  }
  if (v.phase === 'vote' && !v.voted) return { type: 'vote', target: pick(v.others).pid };
  return null;
}

export function tvView(s, now = Date.now()) {
  const v = { phase: s.phase, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), roles: [...s.players.map(p => s.start[p.pid]), ...s.centerStart].sort(), count: s.players.length };
  if (s.phase === 'night') v.n = Object.keys(s.choices).length;
  if (s.phase === 'vote') v.n = Object.keys(s.votes).length;
  if (s.phase === 'over') {
    v.result = { ...s.result, out: s.result.out.map(pid => nameOf(s, pid)), wolvesNow: s.result.wolvesNow.map(pid => nameOf(s, pid)) };
    v.table = s.players.map(p => ({ name: p.name, start: s.start[p.pid], final: s.final[p.pid], votes: s.result.count[p.pid] || 0 }));
    v.center = s.center;
  }
  return v;
}
export function phoneView(s, pid) {
  if (!isP(s, pid)) return { phase: 'spectate' };
  const role = s.start[pid];
  const v = { phase: s.phase, round: s.round, role, others: s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name })) };
  if (s.phase === 'night') v.acted = !!s.choices[pid];
  if (['morning', 'day', 'vote'].includes(s.phase)) v.learned = s.learned[pid] || 'You slept peacefully.';
  if (s.phase === 'vote') v.voted = s.votes[pid] || null;
  if (s.phase === 'over') { v.final = s.final[pid]; v.won = (ROLES[s.final[pid]].team === 'village') === s.result.village; }
  return v;
}

const card = (r, big) => `<div class="mwcard ${ROLES[r].team} ${big ? 'big' : ''}"><span>${ROLES[r].icon}</span><b>${esc(ROLES[r].name)}</b></div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('night', ['look', 'night'].includes(v.phase));
  document.body.classList.toggle('day', ['day', 'vote'].includes(v.phase) || (v.phase === 'over' && v.result.village));
  const inPlay = `<div class="mwroles"><p class="muted">Cards in play (${v.count} players + 3 in the middle):</p>${[...new Set(v.roles)].map(r => `<span>${ROLES[r].icon} ${esc(ROLES[r].name)}${v.roles.filter(x => x === r).length > 1 ? ` ×${v.roles.filter(x => x === r).length}` : ''}</span>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'look') h = `<h2>Look at your card</h2><p class="say">Keep it secret! Then the night begins.</p>${inPlay}<button class="btn" data-host="next">Begin the night</button><div class="how"><h3>How to play</h3><ol><li>Everyone gets a secret role. Three more cards sit in the middle.</li><li>At night, some roles peek at or swap cards. You might end up on a different team!</li><li>In the morning, talk it out. Wolves will lie.</li><li>One vote. If a wolf is voted out, the village wins. If not, the wolves win.</li></ol></div>`;
  if (v.phase === 'night') h = `<h2>🌙 Night</h2><p class="say">Everyone tap something on your phone so nobody can tell who has a power.</p><p class="muted center">${v.n} of ${v.count} done <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Morning now</button>`;
  if (v.phase === 'morning') h = `<h2>☀️ Morning</h2><p class="say">Read what you learned. Then the talking starts.</p><button class="btn" data-host="next">Start talking</button>`;
  if (v.phase === 'day') h = `<h2>Who is the wolf?</h2><p class="clock ${v.left <= 30 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><p class="say">Claim a role, ask questions, catch the liars. Remember: your card may have changed!</p>${inPlay}<button class="btn" data-host="next">Vote now</button>`;
  if (v.phase === 'vote') h = `<h2>Vote!</h2><p class="say center">Tap who you think is a wolf. <span class="clock">${v.left}</span></p><div class="meter"><span style="width:${(100 * v.n) / v.count}%"></span></div><button class="btn ghost" data-host="next">Close the vote</button>`;
  if (v.phase === 'over') h = `<h2 class="${v.result.village ? 'win' : 'lose'}">${v.result.village ? 'The village wins!' : 'The werewolves win!'}</h2><p class="say">${v.result.out.length ? `Voted out: <b>${v.result.out.map(esc).join(' and ')}</b>.` : 'Nobody got enough votes.'} ${v.result.wolvesNow.length ? `Wolves at dawn: ${v.result.wolvesNow.map(esc).join(', ')}.` : 'There were no wolves among the players!'}</p><div class="mwtable">${v.table.map(t => `<div class="mwrow ${t.start !== t.final ? 'swapped' : ''}"><b>${esc(t.name)}</b>${card(t.start)}<span>→</span>${card(t.final)}<small>${t.votes} vote${t.votes === 1 ? '' : 's'}</small></div>`).join('')}</div><p class="muted">Middle: ${v.center.map(r => `${ROLES[r].icon} ${esc(ROLES[r].name)}`).join(' · ')}</p><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div></div>`;
}

let sel = { round: -1, list: [] };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (sel.round !== v.round) sel = { round: v.round, list: [] };
  const R = ROLES[v.role];
  let h = '';
  if (v.phase === 'look') h = `<p class="muted">Your card (keep it secret!)</p>${card(v.role, true)}<p class="say">${esc(R.how)}</p>`;
  else if (v.phase === 'night' && v.acted) h = '<h2>Done. Sleep tight…</h2>';
  else if (v.phase === 'night') {
    const players = (n, label) => `<p class="muted">${label}</p><div class="opts">${v.others.map(o => `<button class="opt ${sel.list.includes(o.pid) ? 'on' : ''}" data-p="${esc(o.pid)}" data-n="${n}">${esc(o.name)}</button>`).join('')}</div>`;
    const centers = (n, label) => `<p class="muted">${label}</p><div class="mwcenter">${[0, 1, 2].map(i => `<button class="mwback ${sel.list.includes('c' + i) ? 'on' : ''}" data-c="${i}" data-n="${n}">${i + 1}</button>`).join('')}</div>`;
    h = `${card(v.role)}<p class="muted">${esc(R.how)}</p>`;
    if (v.role === 'seer') h += players(1, 'Look at a player…') + centers(2, '…or two middle cards');
    else if (v.role === 'robber') h += players(1, 'Rob who?') + '<button class="btn ghost" data-skip>Don\'t rob</button>';
    else if (v.role === 'trouble') h += players(2, 'Pick two players to swap');
    else if (v.role === 'drunk') h += centers(1, 'Pick a middle card');
    else if (v.role === 'wolf') h += centers(1, 'If you\'re the only wolf, you\'ll peek at this middle card:');
    else h += '<p class="say">No power tonight. Tap to sleep.</p><button class="btn" data-skip>💤 Sleep</button>';
  } else if (['morning', 'day', 'vote'].includes(v.phase)) {
    h = `<p class="muted">You started as</p>${card(v.role)}<div class="role insider"><p>${esc(v.learned)}</p></div>`;
    if (v.phase === 'vote') h += v.voted ? '<h2>Vote in!</h2>' : `<h2>Who's a wolf?</h2><div class="opts">${v.others.map(o => `<button class="opt" data-v="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}</div>`;
  } else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : 'lose'}">${v.won ? 'You won!' : 'You lost'}</h2><p class="muted">You ended the night as</p>${card(v.final)}`;
  el.innerHTML = h;
  const sendNight = () => {
    const ps = sel.list.filter(x => !x.startsWith('c')), cs = sel.list.filter(x => x.startsWith('c')).map(x => Number(x.slice(1)));
    if (v.role === 'seer') return send(ps.length ? { type: 'night', target: ps[0] } : { type: 'night', centers: cs });
    if (v.role === 'robber') return send({ type: 'night', target: ps[0] });
    if (v.role === 'trouble') return send({ type: 'night', pair: ps });
    return send({ type: 'night', center: cs[0] });
  };
  const tap = (key, n) => {
    const isC = key.startsWith('c');
    sel.list = sel.list.filter(x => x.startsWith('c') === isC);   // players or middle cards, not both
    sel.list = sel.list.includes(key) ? sel.list.filter(x => x !== key) : [...sel.list, key].slice(-n);
    if (sel.list.length === n) sendNight(); else renderPhone(v, el, send);
  };
  el.querySelectorAll('[data-p]').forEach(b => (b.onclick = () => tap(b.dataset.p, Number(b.dataset.n))));
  el.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => tap('c' + b.dataset.c, Number(b.dataset.n))));
  el.querySelector('[data-skip]')?.addEventListener('click', () => send({ type: 'night' }));
  el.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => send({ type: 'vote', target: b.dataset.v })));
}

// First-game coach lines, one per step.
export function guide(s) {
  return { look: 'There is only ONE night. Remember your card, but it may get swapped before morning.', night: 'Powers happen in order: wolves see each other, the Seer peeks, the Robber steals a card, the Troublemaker swaps two other players. Everyone taps something so nobody stands out.', morning: 'Your phone says what you did or saw. It does not say if someone moved your card afterwards!', day: 'Say what you were and what you did. Stories that do not fit together are your clues. Wolves: claim to be someone else.', vote: 'Everyone votes at once. The village wins if a wolf gets the most votes. The wolves win if they all escape.' }[s.phase] || '';
}
