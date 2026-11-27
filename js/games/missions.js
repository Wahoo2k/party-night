// Inside Job (was Missions; the id is still `missions`): a hidden-traitor game. A few players are secretly traitors who know each other.
// Each round a leader picks a team, everyone votes on it, and the team secretly plays Success or Fail.
// Three successful missions win it for the crew; three failed missions win it for the traitors.
// (The Resistance-style.)
import { esc } from '../ui.js';

export const meta = {
  id: 'missions',
  name: 'Inside Job',
  min: 5,
  max: 10,
  blurb: 'Pick a team, run the mission. A traitor might fail it.',
};

const SIZES = { 5: [2, 3, 2, 3, 3], 6: [2, 3, 4, 3, 4], 7: [2, 3, 3, 4, 4], 8: [3, 4, 4, 5, 5], 9: [3, 4, 4, 5, 5], 10: [3, 4, 4, 5, 5] };
const TRAITORS = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
export const TIMES = { roles: 15000, pick: 90000, vote: 40000, voteShow: 6000, mission: 30000, result: 7000 };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function setup(players, rnd = Math.random) {
  const order = shuffle(players.map(p => ({ pid: p.pid, name: p.name })), rnd);
  const n = order.length;
  const traitors = shuffle(order.map(p => p.pid), rnd).slice(0, TRAITORS[n]);
  return {
    game: 'missions', players: order, traitors, sizes: SIZES[n], needFails: SIZES[n].map((_, i) => (i === 3 && n >= 7 ? 2 : 1)),
    m: 0, leader: Math.floor(rnd() * n), rejects: 0, team: [], votes: {}, plays: {}, results: [], lastVote: null, lastMission: null,
    phase: 'roles', round: 0, deadline: Date.now() + TIMES.roles, winner: null,
  };
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const isP = (s, pid) => s.players.some(p => p.pid === pid);
const leader = s => s.players[s.leader].pid;
const wins = (s, r) => s.results.filter(x => x === r).length;

function toPick(s, now) { s.team = []; s.votes = {}; s.plays = {}; s.phase = 'pick'; s.round++; s.deadline = now + TIMES.pick; }
function nextLeader(s) { s.leader = (s.leader + 1) % s.players.length; }

function closeVote(s, now) {
  const yes = s.players.filter(p => s.votes[p.pid] === true).length;
  const approved = yes > s.players.length / 2;
  s.lastVote = { approved, list: s.players.map(p => ({ name: p.name, v: s.votes[p.pid] === true })), team: s.team.map(pid => nameOf(s, pid)) };
  s.rejects = approved ? 0 : s.rejects + 1;
  s.phase = 'voteShow'; s.round++; s.deadline = now + TIMES.voteShow;
}

function afterVoteShow(s, now) {
  if (s.lastVote.approved) { s.phase = 'mission'; s.round++; s.deadline = now + TIMES.mission; return; }
  nextLeader(s);
  if (s.rejects >= 5) { s.winner = 'traitors'; s.why = 'Five teams in a row were turned down.'; s.phase = 'over'; s.round++; s.deadline = 0; return; }
  toPick(s, now);
}

function closeMission(s, now) {
  const fails = s.team.filter(pid => s.plays[pid] === false).length;
  const ok = fails < s.needFails[s.m];
  s.results.push(ok ? 'S' : 'F');
  s.lastMission = { ok, fails, team: s.team.map(pid => nameOf(s, pid)) };
  s.phase = 'result'; s.round++; s.deadline = now + TIMES.result;
}

function afterResult(s, now) {
  if (wins(s, 'S') >= 3) { s.winner = 'crew'; s.why = 'Three missions succeeded.'; }
  else if (wins(s, 'F') >= 3) { s.winner = 'traitors'; s.why = 'Three missions failed.'; }
  if (s.winner) { s.phase = 'over'; s.round++; s.deadline = 0; return; }
  s.m++; nextLeader(s); toPick(s, now);
}

export function act(s, pid, a, now = Date.now()) {
  if (!a || !isP(s, pid)) return s;
  if (s.phase === 'pick' && pid === leader(s) && a.type === 'team' && Array.isArray(a.team)) {
    const team = [...new Set(a.team)].filter(x => isP(s, x));
    if (team.length !== s.sizes[s.m]) return s;
    s.team = team; s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote;
  } else if (s.phase === 'vote' && a.type === 'vote' && typeof a.yes === 'boolean') {
    s.votes[pid] = a.yes;
    if (s.players.every(p => s.votes[p.pid] !== undefined)) closeVote(s, now);
  } else if (s.phase === 'mission' && a.type === 'play' && s.team.includes(pid) && s.plays[pid] === undefined) {
    s.plays[pid] = s.traitors.includes(pid) ? !!a.ok : true;   // loyal crew can only succeed
    if (s.team.every(t => s.plays[t] !== undefined)) closeMission(s, now);
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'roles') toPick(s, now);
  else if (s.phase === 'pick') { const others = shuffle(s.players.map(p => p.pid).filter(p => p !== leader(s)), rnd); s.team = [leader(s), ...others].slice(0, s.sizes[s.m]); s.phase = 'vote'; s.round++; s.deadline = now + TIMES.vote; }
  else if (s.phase === 'vote') { s.players.forEach(p => { if (s.votes[p.pid] === undefined) s.votes[p.pid] = true; }); closeVote(s, now); }
  else if (s.phase === 'voteShow') afterVoteShow(s, now);
  else if (s.phase === 'mission') { s.team.forEach(t => { if (s.plays[t] === undefined) s.plays[t] = true; }); closeMission(s, now); }
  else if (s.phase === 'result') afterResult(s, now);
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) { return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s; }

export function narration(s) {
  if (s.phase === 'roles') return `Welcome to Inside Job. ${s.traitors.length} of you are secret traitors. Check your phone to see which side you're on.`;
  if (s.phase === 'pick') return `Mission ${s.m + 1}. ${nameOf(s, leader(s))} is the leader. Pick a team of ${s.sizes[s.m]}.`;
  if (s.phase === 'vote') return 'Everyone, vote on this team.';
  if (s.phase === 'voteShow') return s.lastVote.approved ? 'The team is approved. Off you go!' : `The team is turned down.${s.rejects >= 3 ? ` That's ${s.rejects} in a row. Careful, five and the traitors win!` : ''}`;
  if (s.phase === 'mission') return 'The team is on the mission. Play your cards in secret.';
  if (s.phase === 'result') return s.lastMission.ok ? 'Mission success!' : `Mission failed! ${s.lastMission.fails} fail card${s.lastMission.fails === 1 ? '' : 's'}.`;
  if (s.phase === 'over') return `${s.winner === 'crew' ? 'The crew wins!' : 'The traitors win!'} The traitors were ${s.traitors.map(t => nameOf(s, t)).join(' and ')}.`;
  return '';
}
export function cue(s) {
  if (s.phase === 'roles') return { sound: 'join', wait: 700, title: 'Inside Job', sub: 'Check your secret role', tone: 'night' };
  if (s.phase === 'pick') return { sound: 'join', wait: 500, title: `Mission ${s.m + 1}`, sub: `${nameOf(s, leader(s))} leads` };
  if (s.phase === 'vote') return { sound: 'vote', wait: 300 };
  if (s.phase === 'voteShow') return { sound: s.lastVote.approved ? 'safe' : 'lose', wait: 500 };
  if (s.phase === 'mission') return { sound: 'drumroll', wait: 800, tone: 'night' };
  if (s.phase === 'result') return { sound: s.lastMission.ok ? 'win' : 'death', wait: 800, title: s.lastMission.ok ? 'Success!' : 'Failed!', tone: s.lastMission.ok ? 'dawn' : 'blood', fx: s.lastMission.ok ? 'confetti' : 'claws' };
  if (s.phase === 'over') return { sound: s.winner === 'crew' ? 'win' : 'death', wait: 1500, title: s.winner === 'crew' ? 'Crew wins!' : 'Traitors win!', tone: s.winner === 'crew' ? 'dawn' : 'blood', fx: s.winner === 'crew' ? 'confetti' : 'claws' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'pick' && v.isLeader) { const others = v.players.filter(p => !p.me).sort(() => rnd() - 0.5); return { type: 'team', team: [v.me, ...others.map(p => p.pid)].slice(0, v.size) }; }
  if (v.phase === 'vote' && v.myVote === null) return { type: 'vote', yes: v.onTeam || rnd() < 0.55 };
  if (v.phase === 'mission' && v.onTeam && !v.played) return { type: 'play', ok: v.traitor ? rnd() < 0.3 : true };
  return null;
}

export function tvView(s, now = Date.now()) {
  return {
    phase: s.phase, m: s.m + 1, sizes: s.sizes, needFails: s.needFails, results: s.results, rejects: s.rejects, leader: nameOf(s, leader(s)),
    team: s.team.map(pid => nameOf(s, pid)), size: s.sizes[s.m], votesIn: Object.keys(s.votes).length, playsIn: Object.keys(s.plays).length, total: s.players.length,
    lastVote: ['voteShow'].includes(s.phase) ? s.lastVote : null, lastMission: s.phase === 'result' ? s.lastMission : null,
    winner: s.winner, why: s.why, traitors: s.phase === 'over' ? s.traitors.map(t => nameOf(s, t)) : null, nTraitors: s.traitors.length,
    left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
  };
}
export function phoneView(s, pid) {
  if (!isP(s, pid)) return { phase: 'spectate' };
  const traitor = s.traitors.includes(pid);
  return {
    phase: s.phase, round: s.round, traitor, me: pid, partners: traitor ? s.traitors.filter(t => t !== pid).map(t => nameOf(s, t)) : [],
    isLeader: leader(s) === pid, leader: nameOf(s, leader(s)), size: s.sizes[s.m], m: s.m + 1,
    players: s.players.map(p => ({ pid: p.pid, name: p.name, me: p.pid === pid })),
    team: s.team.map(t => nameOf(s, t)), onTeam: s.team.includes(pid), myVote: s.votes[pid] ?? null, played: s.plays[pid] !== undefined,
    won: s.winner ? (s.winner === 'traitors') === traitor : null,
  };
}

const track = v => `<div class="mstrack">${v.sizes.map((n, i) => `<div class="msm ${v.results[i] === 'S' ? 'ok' : v.results[i] === 'F' ? 'bad' : i === v.m - 1 && v.phase !== 'over' ? 'now' : ''}"><b>${v.results[i] === 'S' ? '✓' : v.results[i] === 'F' ? '✕' : n}</b><small>${v.results[i] ? '' : `${n} people${v.needFails[i] > 1 ? ' · needs 2 fails' : ''}`}</small></div>`).join('')}</div><div class="msrej">Turned down in a row: ${[1, 2, 3, 4, 5].map(i => `<span class="${i <= v.rejects ? 'on' : ''}">${i}</span>`).join('')}</div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('night', ['roles', 'mission'].includes(v.phase));
  document.body.classList.toggle('day', v.phase === 'over' && v.winner === 'crew');
  let h = track(v);
  if (v.phase === 'roles') h += `<h2>Check your secret role</h2><p class="say">${v.nTraitors} of you are traitors. Traitors know each other. Everyone else is loyal crew, and doesn't know who to trust.</p><button class="btn" data-host="next">Ready</button><div class="how"><h3>How to play</h3><ol><li>The leader picks a team for the mission.</li><li>Everyone votes to approve or turn it down. Five turned down in a row and the traitors win.</li><li>The team secretly plays Success or Fail. Loyal crew can only play Success. One Fail ruins the mission.</li><li>Three successes: the crew wins. Three failures: the traitors win.</li></ol></div>`;
  if (v.phase === 'pick') h += `<h2>${esc(v.leader)} is picking a team of ${v.size}</h2><p class="say">Talk it over! Who do you trust? <span class="clock">${v.left}</span></p><button class="btn ghost" data-host="next">Pick for them</button>`;
  if (v.phase === 'vote') h += `<h2>Approve this team?</h2><div class="roster">${v.team.map(n => `<div class="chip">${esc(n)}</div>`).join('')}</div><div class="meter"><span style="width:${(100 * v.votesIn) / v.total}%"></span></div><p class="muted center">${v.votesIn} of ${v.total} voted <span class="clock">${v.left}</span></p>`;
  if (v.phase === 'voteShow') h += `<h2 class="${v.lastVote.approved ? 'win' : 'lose'}">${v.lastVote.approved ? 'Approved!' : 'Turned down!'}</h2><div class="msvotes">${v.lastVote.list.map(x => `<span class="${x.v ? 'yes' : 'no'}">${esc(x.name)} ${x.v ? '👍' : '👎'}</span>`).join('')}</div><button class="btn" data-host="next">Continue</button>`;
  if (v.phase === 'mission') h += `<h2>On the mission…</h2><div class="roster">${v.team.map(n => `<div class="chip">${esc(n)}</div>`).join('')}</div><p class="say center">${v.playsIn} of ${v.team.length} cards played</p>`;
  if (v.phase === 'result') h += `<h2 class="${v.lastMission.ok ? 'win' : 'lose'}">${v.lastMission.ok ? 'Mission success!' : 'Mission failed!'}</h2><div class="mscards">${Array.from({ length: v.lastMission.team.length }, (_, i) => `<div class="mscard ${i < v.lastMission.fails ? 'fail' : 'ok'}" style="animation-delay:${i * 0.4}s">${i < v.lastMission.fails ? 'FAIL' : 'SUCCESS'}</div>`).join('')}</div><p class="muted center">Team: ${v.lastMission.team.map(esc).join(', ')}</p><button class="btn" data-host="next">Next mission</button>`;
  if (v.phase === 'over') h += `<h2 class="${v.winner === 'crew' ? 'win' : 'lose'}">${v.winner === 'crew' ? 'The crew wins!' : 'The traitors win!'}</h2><p class="say">${esc(v.why)} The traitors were <b>${v.traitors.map(esc).join(', ')}</b>.</p><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage solo ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div></div>`;
}

let sel = { round: -1, team: [] };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  if (sel.round !== v.round) sel = { round: v.round, team: [] };
  const role = `<div class="role ${v.traitor ? 'insider' : 'crew'}"><b>${v.traitor ? '🗡️ Traitor' : '🛡️ Loyal crew'}</b>${v.traitor ? `<p>${v.partners.length ? `Your fellow traitor${v.partners.length > 1 ? 's' : ''}: <b>${v.partners.map(esc).join(', ')}</b>` : ''}. Fail missions without getting caught.</p>` : '<p>Succeed three missions. Watch out for traitors!</p>'}</div>`;
  let h = '';
  if (v.phase === 'roles') h = role;
  else if (v.phase === 'pick' && v.isLeader) h = `<h2>Pick ${v.size} for mission ${v.m}</h2><div class="opts">${v.players.map(p => `<button class="opt ${sel.team.includes(p.pid) ? 'on' : ''}" data-p="${esc(p.pid)}">${esc(p.name)}${p.me ? ' (you)' : ''}</button>`).join('')}</div><button class="btn" id="go" ${sel.team.length === v.size ? '' : 'disabled'}>Propose team (${sel.team.length}/${v.size})</button>${role}`;
  else if (v.phase === 'pick') h = `<h2>${esc(v.leader)} is picking a team</h2>${role}`;
  else if (v.phase === 'vote') h = `<h2>Approve this team?</h2><p class="say">${v.team.map(esc).join(', ')}</p>${v.myVote === null ? '<div class="row"><button class="btn" data-y="1">👍 Approve</button><button class="btn ghost" data-y="0">👎 Turn down</button></div>' : `<p class="muted">You voted ${v.myVote ? '👍' : '👎'}</p>`}${role}`;
  else if (v.phase === 'mission' && v.onTeam && !v.played) h = `<h2>Play your card</h2><p class="muted">Nobody will know who played what.</p><div class="mscards"><button class="mscard ok" data-ok="1">SUCCESS</button>${v.traitor ? '<button class="mscard fail" data-ok="0">FAIL</button>' : ''}</div>${role}`;
  else if (v.phase === 'mission') h = `<h2>${v.onTeam ? 'Card played' : 'The team is on the mission'}</h2>${role}`;
  else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : 'lose'}">${v.won ? 'You won!' : 'You lost'}</h2>${role}`;
  else h = `<h2>Watch the TV</h2>${role}`;
  el.innerHTML = h;
  el.querySelectorAll('[data-p]').forEach(b => (b.onclick = () => { const p = b.dataset.p; sel.team = sel.team.includes(p) ? sel.team.filter(x => x !== p) : sel.team.length < v.size ? [...sel.team, p] : sel.team; renderPhone(v, el, send); }));
  el.querySelector('#go')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'team', team: sel.team }); });
  el.querySelectorAll('[data-y]').forEach(b => (b.onclick = () => send({ type: 'vote', yes: b.dataset.y === '1' })));
  el.querySelectorAll('[data-ok]').forEach(b => (b.onclick = () => { el.querySelectorAll('[data-ok]').forEach(x => (x.disabled = true)); send({ type: 'play', ok: b.dataset.ok === '1' }); }));
}
