// Salad Bowl: everyone secretly adds names to the bowl. Two teams play three rounds with the same names:
// 1) describe it, 2) one word only, 3) act it out. (Fishbowl / Celebrity-style.)
import { esc } from '../ui.js';
import { isRude } from '../names.js';

export const meta = {
  id: 'bowl',
  name: 'Salad Bowl',
  min: 4,
  max: 20,
  blurb: 'Describe it, one word, then act it out. Same names, three rounds.',
};

export const BANK = [
  'Santa Claus', 'The Tooth Fairy', 'Abraham Lincoln', 'Albert Einstein', 'Cinderella', 'A pirate', 'Robin Hood', 'Sherlock Holmes', 'King Arthur', 'A mermaid',
  'The Easter Bunny', 'Dracula', 'Frankenstein', 'A cowboy', 'An astronaut', 'A ninja', 'Bigfoot', 'Hercules', 'Pinocchio', 'Little Red Riding Hood',
  'A lifeguard', 'A mad scientist', 'Napoleon', 'Cleopatra', 'George Washington', 'A firefighter', 'Goldilocks', 'Peter Pan', 'A ballerina', 'A zombie',
  'A wizard', 'A dinosaur', 'The Statue of Liberty', 'A lumberjack', 'A clown', 'A magician', 'Rapunzel', 'A sumo wrestler', 'The Loch Ness Monster', 'A knight',
  'Jack and the Beanstalk', 'A chef', 'A mummy', 'Romeo', 'A superhero', 'A gorilla', 'A penguin', 'A kangaroo', 'A yeti', 'Mother Goose',
];
export const TEAMS = ['Team Sun', 'Team Moon'];
export const ROUNDS = [
  { name: 'Describe it', rule: 'Say anything except the name itself.', short: 'Describe' },
  { name: 'One word', rule: 'Just ONE word per name. Choose wisely!', short: 'One word' },
  { name: 'Act it out', rule: 'No talking! Charades only.', short: 'Act it out' },
];
export const TIMES = { submit: 90000, ready: 25000, turn: 45000, turnEnd: 6000, roundEnd: 7000 };
const PER_PLAYER = 3;

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const key = t => String(t || '').toLowerCase().replace(/^(a|an|the)\s+/, '').replace(/[^a-z0-9]/g, '');

export function cleanName(t) {
  const x = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (x.length < 2) return { ok: false, why: 'Add a name.' };
  if (isRude(x)) return { ok: false, why: 'Keep it family-friendly.' };
  return { ok: true, text: x };
}

export function setup(players, rnd = Math.random, prev = null) {
  const sameCrowd = prev?.teamOf && players.every(p => prev.teamOf[p.pid] !== undefined) && Math.abs(players.filter(p => prev.teamOf[p.pid] === 0).length * 2 - players.length) <= 1;
  const teamOf = {};
  if (sameCrowd) players.forEach(p => (teamOf[p.pid] = prev.teamOf[p.pid]));
  else shuffle(players.map(p => p.pid), rnd).forEach((pid, i) => (teamOf[pid] = i % 2));
  return {
    game: 'bowl',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    teamOf, teamScore: [0, 0], subs: {}, names: [], bowl: [],
    round: 0, roundNo: 0, turn: 0, giverIdx: [0, 0], first: Math.floor(rnd() * 2),
    phase: 'submit', deadline: Date.now() + TIMES.submit,
    card: null, log: [], eventId: 0, lastEvent: null, lastTurn: null, carry: 0,
  };
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const team = (s, t) => s.players.filter(p => s.teamOf[p.pid] === t).map(p => p.pid);
const playing = s => (s.turn + s.first) % 2;
const giver = s => { const t = team(s, playing(s)); return t[s.giverIdx[playing(s)] % t.length]; };
const event = (s, name) => { s.eventId++; s.lastEvent = name; };

function fillBowl(s, rnd) {
  const seen = new Set();
  const names = [];
  for (const p of s.players) for (const t of s.subs[p.pid] || []) { const k = key(t); if (k && !seen.has(k)) { seen.add(k); names.push(t); } }
  const want = Math.max(10, s.players.length * PER_PLAYER);
  for (const t of shuffle([...BANK], rnd)) { if (names.length >= want) break; const k = key(t); if (!seen.has(k)) { seen.add(k); names.push(t); } }
  s.names = names;
}

function startRound(s, now, rnd) {
  s.bowl = shuffle(s.names.map((_, i) => i), rnd);
  s.phase = 'ready';
  s.roundNo++;
  s.newRound = true;
  s.deadline = now + TIMES.ready;
}

function draw(s) { s.card = s.bowl.length ? s.bowl.pop() : null; }

function endTurn(s, now) {
  s.lastTurn = { team: playing(s), giver: nameOf(s, giver(s)), log: s.log, round: s.round };
  s.giverIdx[playing(s)]++;
  s.card = null;
  if (!s.bowl.length) {
    s.phase = 'roundEnd';
    s.deadline = now + TIMES.roundEnd;
  } else {
    s.turn++;
    s.phase = 'turnEnd';
    s.deadline = now + TIMES.turnEnd;
  }
}

function afterRoundEnd(s, now, rnd) {
  s.round++;
  s.turn++;   // the other team starts the next round
  if (s.round >= ROUNDS.length) { s.phase = 'over'; s.deadline = 0; s.roundNo++; return; }
  startRound(s, now, rnd);
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'submit' && a.type === 'names' && Array.isArray(a.names) && !s.subs[pid]) {
    const list = a.names.slice(0, PER_PLAYER).map(cleanName).filter(r => r.ok).map(r => r.text);
    if (list.length) s.subs[pid] = list;
    if (s.players.every(p => s.subs[p.pid])) { fillBowl(s, rnd); startRound(s, now, rnd); }
  } else if (s.phase === 'ready' && a.type === 'start' && pid === giver(s)) {
    s.phase = 'turn'; s.newRound = false; s.deadline = now + TIMES.turn; s.log = []; draw(s); event(s, 'start');
  } else if (s.phase === 'turn' && pid === giver(s) && a.card === s.card && s.card !== null) {
    if (a.type === 'got') {
      s.log.push({ name: s.names[s.card], result: 'got' });
      s.teamScore[playing(s)]++;
      event(s, 'got');
      draw(s);
      if (s.card === null) endTurn(s, now);
    } else if (a.type === 'skip' && s.bowl.length) {
      s.log.push({ name: s.names[s.card], result: 'skip' });
      s.bowl.unshift(s.card);   // back to the bottom of the bowl
      event(s, 'skip');
      draw(s);
    }
  }
  return s;
}

export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'submit') { fillBowl(s, rnd); startRound(s, now, rnd); }
  else if (s.phase === 'ready') act(s, giver(s), { type: 'start' }, now, rnd);
  else if (s.phase === 'turn') { if (s.card !== null) s.bowl.push(s.card); endTurn(s, now); }
  else if (s.phase === 'turnEnd') { s.phase = 'ready'; s.roundNo++; s.deadline = now + TIMES.ready; }
  else if (s.phase === 'roundEnd') afterRoundEnd(s, now, rnd);
  return s;
}

export function tick(s, now = Date.now(), rnd = Math.random) {
  if (!s.deadline || now < s.deadline) return s;
  return hostAct(s, 'next', now, rnd);
}

const winnerLine = s => (s.teamScore[0] === s.teamScore[1] ? 'It\'s a tie!' : `${TEAMS[s.teamScore[0] > s.teamScore[1] ? 0 : 1]} wins!`);
export function narration(s) {
  if (s.phase === 'submit') return 'Welcome to Salad Bowl! Everyone, secretly add three names to the bowl. Famous people, characters, anyone your group would know.';
  if (s.phase === 'ready') return `${s.newRound ? `Round ${s.round + 1}: ${ROUNDS[s.round].name}. ${ROUNDS[s.round].rule} ` : ''}${TEAMS[playing(s)]}, ${nameOf(s, giver(s))} is up.`;
  if (s.phase === 'turnEnd') return `Time! ${s.lastTurn.log.filter(l => l.result === 'got').length} for ${TEAMS[s.lastTurn.team]}.`;
  if (s.phase === 'roundEnd') return s.round + 1 < ROUNDS.length ? `The bowl is empty! Same names again, but now: ${ROUNDS[s.round + 1].name}.` : 'The bowl is empty!';
  if (s.phase === 'over') return winnerLine(s);
  return '';
}

export function cue(s) {
  if (s.phase === 'submit') return { sound: 'join', wait: 800, title: 'Salad Bowl', sub: 'Add 3 names to the bowl' };
  if (s.phase === 'ready') return { sound: 'join', wait: 700, title: `Round ${s.round + 1}`, sub: ROUNDS[s.round].name };
  if (s.phase === 'turn') return { sound: 'vote', wait: 200 };
  if (s.phase === 'turnEnd') return { sound: 'drumroll', wait: 300 };
  if (s.phase === 'roundEnd') return { sound: 'win', wait: 900, title: 'Bowl empty!', sub: s.round + 1 < ROUNDS.length ? `Next: ${ROUNDS[s.round + 1].name}` : 'Final scores', fx: 'confetti' };
  if (s.phase === 'over') return { sound: 'win', wait: 1600, title: 'Game Over', sub: winnerLine(s), tone: 'dawn', fx: 'confetti' };
  return null;
}

export function cueEvent(s) {
  if (s.lastEvent === 'got') return { id: s.eventId, sound: 'safe', say: '' };
  if (s.lastEvent === 'skip') return { id: s.eventId, sound: 'tick', say: '' };
  return null;
}

export function botAct(v, rnd = Math.random) {
  if (v.phase === 'submit' && !v.submitted) return { type: 'names', names: shuffle([...BANK], rnd).slice(0, 3) };
  if (v.phase === 'ready' && v.isGiver) return { type: 'start' };
  if (v.phase === 'turn' && v.isGiver && v.card) return { type: rnd() < 0.75 ? 'got' : 'skip', card: v.cardId };
  return null;
}

// ---------- views ----------
export function tvView(s, now = Date.now()) {
  const v = {
    phase: s.phase, round: s.round, rounds: ROUNDS, playing: playing(s),
    teams: TEAMS.map((name, t) => ({ name, score: s.teamScore[t], members: team(s, t).map(p => nameOf(s, p)) })),
    giver: nameOf(s, giver(s)), left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
    inBowl: s.bowl.length + (s.card !== null ? 1 : 0), total: s.names.length,
    got: s.log.filter(l => l.result === 'got').length,
  };
  if (s.phase === 'submit') { v.done = s.players.filter(p => s.subs[p.pid]).map(p => p.name); v.waiting = s.players.filter(p => !s.subs[p.pid]).map(p => p.name); }
  if (['turnEnd', 'roundEnd'].includes(s.phase) && s.lastTurn) v.lastTurn = s.lastTurn;
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const t = s.teamOf[pid];
  const v = { phase: s.phase, round: s.round, team: TEAMS[t], teamIdx: t, playing: playing(s), isGiver: pid === giver(s), giver: nameOf(s, giver(s)), scores: [...s.teamScore] };
  if (s.phase === 'submit') { v.submitted = !!s.subs[pid]; v.mine = s.subs[pid] || null; return v; }
  if (s.phase === 'turn' && v.isGiver && s.card !== null) { v.card = s.names[s.card]; v.cardId = s.card; v.got = s.log.filter(l => l.result === 'got').length; v.canSkip = s.bowl.length > 0; }
  if (s.phase === 'over') v.won = s.teamScore[t] > s.teamScore[1 - t];
  return v;
}

// ---------- renderers ----------
const roundPills = r => `<div class="bpills">${ROUNDS.map((x, i) => `<span class="${i === r ? 'on' : i < r ? 'past' : ''}">${i + 1}. ${esc(x.short)}</span>`).join('')}</div>`;
export function renderTV(v, el) {
  document.body.classList.toggle('day', v.phase !== 'submit');
  const teams = `<div class="side">${v.teams.map((t, i) => `<div class="scores team t${i} ${v.playing === i && !['over', 'submit'].includes(v.phase) ? 'ctl' : ''}"><h3>${esc(t.name)}</h3><div class="tscore">${t.score}</div><p class="muted small">${t.members.map(esc).join(', ')}</p></div>`).join('')}</div>`;
  const bowl = `<div class="saladbowl"><span>${v.inBowl}</span><small>in the bowl</small></div>`;
  let h = '';
  if (v.phase === 'submit') h = `<h2>Fill the bowl</h2><p class="say">Everyone secretly adds ${PER_PLAYER} names on their phone: famous people, characters, anyone your group knows. We'll top it up if you're short.</p><p class="clock ${v.left <= 10 ? 'hurry' : ''}">${Math.floor(v.left / 60)}:${String(v.left % 60).padStart(2, '0')}</p><div class="roster">${v.done.map(n => `<div class="chip skdone">✓ ${esc(n)}</div>`).join('')}${v.waiting.map(n => `<div class="chip">✏️ ${esc(n)}</div>`).join('')}</div><button class="btn ghost" data-host="next">Start with what we have</button>
    <div class="how"><h3>How to play</h3><ol><li>Everyone adds names to the bowl.</li><li>Teams take turns. The clue-giver gets names one at a time and their team guesses as many as they can.</li><li>Round 1: describe it. Round 2: one word only. Round 3: act it out, no talking.</li><li>It's the same names every round, so pay attention!</li></ol></div>`;
  if (v.phase === 'ready') h = `${roundPills(v.round)}<p class="cat">${esc(v.rounds[v.round].rule)}</p><h2><span class="tc${v.playing}">${esc(v.teams[v.playing].name)}</span>: ${esc(v.giver)} is up</h2>${bowl}<p class="muted">Waiting for ${esc(v.giver)} to press Start…</p><button class="btn ghost" data-host="next">Start now</button>`;
  if (v.phase === 'turn') h = `${roundPills(v.round)}<h2>${esc(v.giver)}: ${esc(v.rounds[v.round].name)}</h2><div class="row center"><div class="tabooclock ${v.left <= 10 ? 'hurry' : ''}"><span class="clock">${v.left}</span></div>${bowl}</div><p class="say center">Got so far: <b class="win">${v.got}</b></p><p class="muted center">${esc(v.rounds[v.round].rule)}</p><button class="btn ghost" data-host="next">End turn</button>`;
  if (v.phase === 'turnEnd' || v.phase === 'roundEnd') h = `${roundPills(v.round)}<h2>${v.phase === 'roundEnd' ? 'The bowl is empty! ' : ''}<span class="tc${v.lastTurn.team}">${esc(v.teams[v.lastTurn.team].name)}</span> got ${v.lastTurn.log.filter(l => l.result === 'got').length}</h2><div class="history">${v.lastTurn.log.map(l => `<span class="${l.result === 'got' ? 'win' : 'muted'}">${esc(l.name)}${l.result === 'got' ? ' ✓' : ' (skip)'}</span>`).join('') || '<span>No names this turn</span>'}</div>${v.phase === 'roundEnd' && v.round + 1 < v.rounds.length ? `<p class="say">Next round: <b>${esc(v.rounds[v.round + 1].name)}</b>. ${esc(v.rounds[v.round + 1].rule)}</p>` : ''}<button class="btn" data-host="next">Next</button>`;
  if (v.phase === 'over') h = `<h2 class="win">${v.teams[0].score === v.teams[1].score ? 'It\'s a tie!' : `${esc(v.teams[v.teams[0].score > v.teams[1].score ? 0 : 1].name)} wins!`}</h2><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${teams}</div>`;
}

let draft = { key: '', list: ['', '', ''] };
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2>'; return; }
  const head = `<p class="muted"><b class="tc${v.teamIdx}">${esc(v.team)}</b> · Sun ${v.scores[0]} · Moon ${v.scores[1]}</p>`;
  if (v.phase === 'submit') {
    if (v.submitted) { el.innerHTML = `${head}<h2>In the bowl!</h2><p class="muted">Yours: ${v.mine.map(esc).join(', ')}</p><p class="say">Shh, keep them secret.</p>`; return; }
    if (draft.key !== 'submit') draft = { key: 'submit', list: ['', '', ''] };
    el.innerHTML = `${head}<h2>Add ${PER_PLAYER} names</h2><p class="muted">Famous people, characters, anyone your group would know. Keep them secret!</p><form id="bf">${draft.list.map((t, i) => `<input id="b${i}" maxlength="40" autocomplete="off" value="${esc(t)}" placeholder="Name ${i + 1}">`).join('')}<p class="lose" id="err"></p><div class="row"><button class="btn ghost" type="button" id="help">🎲 Help me</button><button class="btn" type="submit">Into the bowl</button></div></form>`;
    const f = el.querySelector('#bf'), ins = [...f.querySelectorAll('input')];
    ins.forEach((inp, i) => (inp.oninput = () => (draft.list[i] = inp.value)));
    f.querySelector('#help').onclick = () => { const i = ins.findIndex(x => !x.value.trim()); const k = i < 0 ? 0 : i; ins[k].value = BANK[Math.floor(Math.random() * BANK.length)]; draft.list[k] = ins[k].value; };
    f.onsubmit = e => {
      e.preventDefault();
      const rs = ins.map(x => cleanName(x.value));
      const bad = rs.find((r, i) => !r.ok && ins[i].value.trim());
      if (bad) { f.querySelector('#err').textContent = bad.why; return; }
      const names = rs.filter(r => r.ok).map(r => r.text);
      if (!names.length) { f.querySelector('#err').textContent = 'Add at least one name.'; return; }
      f.querySelector('[type=submit]').disabled = true;
      send({ type: 'names', names });
    };
    return;
  }
  let h = head;
  if (v.phase === 'over') h += `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'Your team won!' : v.scores[0] === v.scores[1] ? 'It\'s a tie!' : 'Your team lost'}</h2>`;
  else if (v.phase === 'ready') h += v.isGiver ? `<h2>You're up!</h2><p class="say"><b>${esc(ROUNDS[v.round].name)}:</b> ${esc(ROUNDS[v.round].rule)}</p><button class="btn" data-start>Start (45 seconds)</button>` : v.teamIdx === v.playing ? `<h2>Get ready to guess!</h2><p class="say">${esc(v.giver)} is up. Shout out guesses!</p>` : `<h2>${esc(v.giver)} is up</h2><p class="say">Other team's turn. No helping!</p>`;
  else if (v.phase === 'turn' && v.card) h += `<p class="cat">${esc(ROUNDS[v.round].name)}</p><div class="tcard2"><div class="tword">${esc(v.card)}</div></div><div class="tbtns"><button class="btn" data-got>Got it! +1</button>${v.canSkip ? '<button class="btn ghost" data-skip>Skip</button>' : ''}</div><p class="muted center">${v.got} so far</p>`;
  else if (v.phase === 'turn') h += v.teamIdx === v.playing ? `<h2>Guess out loud!</h2><p class="say">${esc(ROUNDS[v.round].rule)}</p>` : `<h2>${esc(v.giver)} is up</h2><p class="say">Watch and enjoy.</p>`;
  else h += '<h2>Check the TV</h2>';
  el.innerHTML = h;
  el.querySelector('[data-start]')?.addEventListener('click', () => send({ type: 'start' }));
  el.querySelector('[data-got]')?.addEventListener('click', e => { e.target.disabled = true; try { navigator.vibrate?.(30); } catch {} send({ type: 'got', card: v.cardId }); });
  el.querySelector('[data-skip]')?.addEventListener('click', e => { e.target.disabled = true; send({ type: 'skip', card: v.cardId }); });
}
