// Werewolf: pure game engine (runs on the TV/host) plus TV and phone renderers.
// The host owns the state. Phones only send actions and render the view they are sent.
import { esc } from '../ui.js';

export const meta = {
  id: 'werewolf',
  name: 'Werewolf',
  min: 5,
  max: 16,
  blurb: 'Secret roles, night attacks and a village vote. Find the wolves before they find you.',
};

export const ROLES = {
  W: { name: 'Werewolf', color: '#e2483d', text: 'Each night, pick a villager to eliminate with your pack. By day, act innocent.' },
  S: { name: 'Seer', color: '#a9b8ff', text: 'Each night, check one player to learn if they are a werewolf.' },
  D: { name: 'Doctor', color: '#7fc8a9', text: 'Each night, protect one player from the wolves. You can protect yourself.' },
  V: { name: 'Villager', color: '#f3ecd2', text: 'Find the werewolves. Talk, accuse and vote them out by day.' },
};

export const TIMES = { nightMin: 15000, discuss: 180000, verdict: 15000 };

const wolfCount = n => (n <= 6 ? 1 : n <= 10 ? 2 : 3);

export function setup(players, rnd = Math.random) {
  const n = players.length;
  const deck = [];
  for (let i = 0; i < wolfCount(n); i++) deck.push('W');
  deck.push('S');
  if (n >= 6) deck.push('D');
  while (deck.length < n) deck.push('V');
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return {
    game: 'werewolf',
    phase: 'roles',
    round: 0,
    players: players.map((p, i) => ({ pid: p.pid, name: p.name, role: deck[i], alive: true })),
    ready: {},
    night: null,
    votes: {},
    morning: '',
    verdict: null,
    winner: null,
    deadline: 0,
    log: [],
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const alive = s => s.players.filter(p => p.alive);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';

function winner(s) {
  const a = alive(s);
  const w = a.filter(p => p.role === 'W').length;
  if (w === 0) return 'V';
  if (w >= a.length - w) return 'W';
  return null;
}

function startNight(s, now) {
  s.phase = 'night';
  s.round++;
  s.night = { picks: {}, seerSaw: null, start: now };
  s.votes = {};
  s.verdict = null;
}

function nightDone(s, now) {
  const everyone = alive(s).every(p => s.night.picks[p.pid] !== undefined);
  return everyone && now - s.night.start >= TIMES.nightMin;
}

function resolveNight(s, now, rnd) {
  const n = s.night;
  const wolfPicks = alive(s).filter(p => p.role === 'W').map(p => n.picks[p.pid]).filter(Boolean);
  const count = {};
  wolfPicks.forEach(t => (count[t] = (count[t] || 0) + 1));
  const top = Math.max(0, ...Object.values(count));
  const tied = Object.keys(count).filter(k => count[k] === top);
  const victim = tied.length ? tied[Math.floor(rnd() * tied.length)] : null;
  const doc = alive(s).find(p => p.role === 'D');
  const saved = doc ? n.picks[doc.pid] : null;
  if (victim && victim !== saved) {
    const v = P(s, victim);
    v.alive = false;
    s.morning = `${v.name} was taken in the night. They were a ${ROLES[v.role].name}.`;
  } else {
    s.morning = victim ? 'The wolves attacked, but the Doctor saved their target. Everyone survived.' : 'Everyone survived the night.';
  }
  s.log.push(`Night ${s.round}: ${s.morning}`);
  s.night = null;
  s.winner = winner(s);
  if (s.winner) return (s.phase = 'over');
  s.phase = 'day';
  s.deadline = now + TIMES.discuss;
}

function resolveVote(s, now) {
  const count = {};
  Object.values(s.votes).forEach(t => (count[t] = (count[t] || 0) + 1));
  const ranked = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const tally = ranked.map(([pid, c]) => ({ name: pid === 'skip' ? 'Skip' : nameOf(s, pid), count: c }));
  let out = null;
  let text;
  if (ranked.length && ranked[0][0] !== 'skip' && !(ranked[1] && ranked[1][1] === ranked[0][1])) {
    out = P(s, ranked[0][0]);
    out.alive = false;
    text = `The village voted out ${out.name}. They were a ${ROLES[out.role].name}.`;
  } else {
    text = ranked.length ? 'The vote was split, so nobody was voted out.' : 'Nobody voted, so nobody was voted out.';
  }
  s.log.push(`Day ${s.round}: ${text}`);
  s.verdict = { text, tally, role: out ? out.role : null };
  s.winner = winner(s);
  s.phase = 'verdict';
  s.deadline = now + TIMES.verdict;
}

// A phone did something.
export function act(s, pid, a, now = Date.now()) {
  const me = P(s, pid);
  if (!me || !a) return s;
  if (s.phase === 'roles' && a.type === 'ready') s.ready[pid] = true;
  else if (s.phase === 'night' && me.alive && a.type === 'pick') {
    const t = P(s, a.target);
    if (!t || !t.alive) return s;
    if (me.role === 'W' && t.role === 'W') return s;
    if (me.role === 'S') {
      if (s.night.picks[pid] || t.pid === pid) return s; // one look per night
      s.night.seerSaw = { name: t.name, wolf: t.role === 'W' };
    }
    s.night.picks[pid] = t.pid;
  } else if (s.phase === 'vote' && me.alive && a.type === 'vote') {
    if (a.target !== 'skip' && !(P(s, a.target) || {}).alive) return s;
    s.votes[pid] = a.target;
    if (alive(s).every(p => s.votes[p.pid])) resolveVote(s, now);
  }
  if (s.phase === 'roles' && s.players.every(p => s.ready[p.pid])) startNight(s, now);
  return s;
}

// A button on the TV.
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a === 'next' && s.phase === 'roles') startNight(s, now);
  else if (a === 'next' && s.phase === 'day') { s.phase = 'vote'; s.votes = {}; }
  else if (a === 'next' && s.phase === 'vote') resolveVote(s, now);
  else if (a === 'next' && s.phase === 'verdict') s.winner ? (s.phase = 'over') : startNight(s, now);
  else if (a === 'next' && s.phase === 'night') resolveNight(s, now, rnd); // stuck night: force it
  return s;
}

// Called every second on the host.
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'night' && nightDone(s, now)) resolveNight(s, now, rnd);
  else if (s.phase === 'day' && now >= s.deadline) { s.phase = 'vote'; s.votes = {}; }
  else if (s.phase === 'verdict' && now >= s.deadline) s.winner ? (s.phase = 'over') : startNight(s, now);
  return s;
}

// What the TV narrator says when a phase begins.
export function narration(s) {
  switch (s.phase) {
    case 'roles': return 'Check your phones for your secret role. Keep it hidden.';
    case 'night': return `Night ${s.round}. Everyone, look only at your own phone and make your choice.`;
    case 'day': return `Good morning, village. ${s.morning} Discuss who you suspect.`;
    case 'vote': return 'Time to vote. Choose on your phone.';
    case 'verdict': return s.verdict.text;
    case 'over': return s.winner === 'V' ? 'The village wins! Every werewolf has been found.' : 'The werewolves win! They now outnumber the village.';
  }
  return '';
}

// ---------- views ----------
export function tvView(s, now = Date.now()) {
  const a = alive(s);
  const base = {
    phase: s.phase, round: s.round,
    players: s.players.map(p => ({ name: p.name, alive: p.alive, role: s.phase === 'over' || !p.alive ? p.role : null })),
    left: Math.max(0, Math.ceil(((s.deadline || 0) - now) / 1000)),
  };
  if (s.phase === 'roles') base.done = Object.keys(s.ready).length;
  if (s.phase === 'night') base.done = a.filter(p => s.night.picks[p.pid] !== undefined).length;
  if (s.phase === 'vote') base.done = a.filter(p => s.votes[p.pid]).length;
  base.total = s.phase === 'roles' ? s.players.length : a.length;
  if (s.phase === 'day') base.morning = s.morning;
  if (s.phase === 'verdict') base.verdict = s.verdict;
  if (s.phase === 'over') { base.winner = s.winner; base.log = s.log; }
  return base;
}

export function phoneView(s, pid) {
  const me = P(s, pid);
  if (!me) return { phase: 'spectate' };
  const v = { phase: s.phase, round: s.round, role: me.role, alive: me.alive };
  const others = alive(s).filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name }));
  if (me.role === 'W') v.pack = s.players.filter(p => p.role === 'W' && p.pid !== pid).map(p => p.name);
  if (s.phase === 'roles') v.ready = !!s.ready[pid];
  if (s.phase === 'night' && me.alive) {
    v.picked = s.night.picks[pid] || null;
    if (me.role === 'W') {
      v.prompt = 'Choose who the pack attacks.';
      v.options = others.filter(o => P(s, o.pid).role !== 'W');
      v.packPicks = alive(s).filter(p => p.role === 'W' && p.pid !== pid && s.night.picks[p.pid]).map(p => ({ who: p.name, target: nameOf(s, s.night.picks[p.pid]) }));
    } else if (me.role === 'S') {
      v.prompt = 'Choose one player to look into.';
      v.options = others;
      v.saw = v.picked ? s.night.seerSaw : null;
    } else if (me.role === 'D') {
      v.prompt = 'Choose one player to protect tonight.';
      v.options = alive(s).map(p => ({ pid: p.pid, name: p.pid === pid ? p.name + ' (you)' : p.name }));
    } else {
      v.prompt = 'Who do you suspect? (Everyone taps something at night, so nobody can tell who has a power.)';
      v.options = others;
    }
  }
  if (s.phase === 'vote' && me.alive) { v.options = others; v.voted = s.votes[pid] || null; }
  if (s.phase === 'day') v.morning = s.morning;
  if (s.phase === 'verdict') v.verdict = s.verdict.text;
  if (s.phase === 'over') v.won = s.winner === (me.role === 'W' ? 'W' : 'V');
  return v;
}

// ---------- renderers ----------
const roleIcon = r => ({
  W: '<path d="M20 78 30 24 44 44 52 40 60 44 74 24 82 78Q51 96 20 78Z" fill="#e2483d"/><circle cx="40" cy="58" r="4" fill="#fff"/><circle cx="62" cy="58" r="4" fill="#fff"/>',
  S: '<ellipse cx="50" cy="50" rx="40" ry="22" fill="none" stroke="#a9b8ff" stroke-width="6"/><circle cx="50" cy="50" r="12" fill="#a9b8ff"/>',
  D: '<rect x="40" y="14" width="20" height="72" rx="4" fill="#7fc8a9"/><rect x="14" y="40" width="72" height="20" rx="4" fill="#7fc8a9"/>',
  V: '<path d="M16 86V46L50 18 84 46V86Z" fill="#f3ecd2"/><rect x="42" y="58" width="16" height="28" fill="#171c44"/>',
})[r];

const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function renderTV(v, el) {
  document.body.classList.toggle('day', ['day', 'vote', 'verdict'].includes(v.phase));
  const roster = `<div class="roster">${v.players.map(p => `<div class="chip ${p.alive ? '' : 'out'}" ${p.role ? `style="--rc:${ROLES[p.role].color}"` : ''}><span class="nm">${esc(p.name)}</span>${p.role ? `<small>${ROLES[p.role].name}</small>` : ''}</div>`).join('')}</div>`;
  const progress = `<div class="meter"><span style="width:${v.total ? (100 * v.done) / v.total : 0}%"></span></div><p class="muted">${v.done} of ${v.total}</p>`;
  let h = '';
  if (v.phase === 'roles') h = `<h2>Check your phone</h2><p class="say">Hold your card to see your secret role, then tap <b>I've seen it</b>.</p>${progress}<button class="btn" data-host="next">Everyone's ready, start the night</button>`;
  if (v.phase === 'night') h = `<h2>Night ${v.round}</h2><p class="say">Eyes on your own phone only. Everyone makes a choice.</p>${progress}<button class="btn ghost" data-host="next">Force the night to end</button>`;
  if (v.phase === 'day') h = `<h2>Morning ${v.round}</h2><p class="say">${esc(v.morning)}</p><p class="clock">${mmss(v.left)}</p><p class="muted">Discuss. Voting starts when the clock runs out.</p><button class="btn" data-host="next">Start the vote now</button>`;
  if (v.phase === 'vote') h = `<h2>Vote</h2><p class="say">Everyone still in, vote on your phone.</p>${progress}<button class="btn ghost" data-host="next">Close the vote</button>`;
  if (v.phase === 'verdict') h = `<h2>The verdict</h2><p class="say">${esc(v.verdict.text)}</p><div class="tally">${v.verdict.tally.map(t => `<div><b>${t.count}</b> ${esc(t.name)}</div>`).join('') || '<div>No votes</div>'}</div><button class="btn" data-host="next">Continue</button>`;
  if (v.phase === 'over') h = `<h2 class="${v.winner === 'V' ? 'win' : 'lose'}">${v.winner === 'V' ? 'The village wins' : 'The werewolves win'}</h2><details><summary class="muted">What happened</summary><p>${v.log.map(esc).join('<br>')}</p></details><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage"><div class="panel">${h}</div>${roster}</div>`;
}

export function renderPhone(v, el, send) {
  const card = r => `<div class="card" id="card" tabindex="0" style="--rc:${ROLES[r].color}"><div class="face"><p class="say">Hold to see your role</p></div></div>`;
  const opts = (list, picked, type) => `<div class="opts">${list.map(o => `<button class="opt ${picked === o.pid ? 'on' : ''}" data-${type}="${esc(o.pid)}">${esc(o.name)}</button>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'spectate') h = `<h2>Game in progress</h2><p>You'll join the next round.</p>`;
  else if (!v.alive && v.phase !== 'over') h = `<h2>You're out</h2><p class="say">Stay quiet and enjoy the show. No hints!</p>${card(v.role)}`;
  else if (v.phase === 'roles') h = `<h2>Your secret role</h2>${card(v.role)}<button class="btn" data-ready ${v.ready ? 'disabled' : ''}>${v.ready ? 'Waiting for others' : "I've seen it"}</button>`;
  else if (v.phase === 'night') {
    h = `<h2>Night ${v.round}</h2><p>${esc(v.prompt)}</p>`;
    if (v.saw) h += `<div class="reveal ${v.saw.wolf ? 'lose' : 'win'}">${esc(v.saw.name)} is ${v.saw.wolf ? 'a werewolf' : 'not a werewolf'}</div><p class="muted">Remember it. Waiting for the night to end.</p>`;
    else h += opts(v.options, v.picked, 'pick');
    if (v.packPicks && v.packPicks.length) h += `<p class="muted">Your pack picked: ${v.packPicks.map(p => esc(p.who) + ' → ' + esc(p.target)).join(', ')}</p>`;
    if (v.picked && !v.saw) h += `<p class="muted">Locked in. You can change it until the night ends.</p>`;
  } else if (v.phase === 'day') h = `<h2>Morning</h2><p class="say">${esc(v.morning)}</p><p class="muted">Discuss with everyone. Voting is next.</p>`;
  else if (v.phase === 'vote') h = `<h2>Vote someone out</h2>${opts(v.options.concat([{ pid: 'skip', name: 'Skip vote' }]), v.voted, 'vote')}${v.voted ? '<p class="muted">Vote in. You can change it until everyone has voted.</p>' : ''}`;
  else if (v.phase === 'verdict') h = `<h2>The verdict</h2><p class="say">${esc(v.verdict)}</p>`;
  else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : 'lose'}">${v.won ? 'You won!' : 'You lost'}</h2><p>You were the ${ROLES[v.role].name}. Check the TV for everyone's roles.</p>`;
  el.innerHTML = h;

  const c = el.querySelector('#card');
  if (c) {
    const face = c.querySelector('.face');
    const show = e => { e && e.preventDefault(); c.classList.add('on'); face.innerHTML = `<svg viewBox="0 0 100 100">${roleIcon(v.role)}</svg><div class="rn">${ROLES[v.role].name}</div><p>${ROLES[v.role].text}</p>${v.pack ? `<p class="muted">${v.pack.length ? 'Your pack: ' + v.pack.map(esc).join(', ') : 'You hunt alone.'}</p>` : ''}`; };
    const hide = () => { c.classList.remove('on'); face.innerHTML = '<p class="say">Hold to see your role</p>'; };
    c.addEventListener('pointerdown', show);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => c.addEventListener(e, hide));
    c.addEventListener('keydown', e => (e.key === ' ' || e.key === 'Enter') && show(e));
    c.addEventListener('keyup', hide);
    c.addEventListener('contextmenu', e => e.preventDefault());
  }
  el.querySelectorAll('[data-ready]').forEach(b => (b.onclick = () => send({ type: 'ready' })));
  el.querySelectorAll('[data-pick]').forEach(b => (b.onclick = () => send({ type: 'pick', target: b.dataset.pick })));
  el.querySelectorAll('[data-vote]').forEach(b => (b.onclick = () => send({ type: 'vote', target: b.dataset.vote })));
}
