// Crowd Says: two teams try to name the most popular answers. A face-off decides who plays,
// three strikes hands the other team one chance to steal. Our own name, look and phrasing.
import { esc } from '../ui.js';
import { QUESTIONS } from './crowd-bank.js';

export const meta = {
  id: 'crowd',
  name: 'Crowd Says',
  min: 2,
  max: 16,
  blurb: 'Two teams guess the most popular answers. Three strikes and you\'re out.',
};

const ROUNDS = 4;            // last round is worth double
export const TIMES = { faceoff: 20000, guess: 25000, steal: 25000, roundEnd: 7000, flash: 1800 };
export const TEAMS = ['Team Sun', 'Team Moon'];

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = t => String(t || '').toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(a|an|the|my|some|your|their)\b/g, ' ').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const singular = w => w.replace(/(ies)$/, 'y').replace(/(es)$/, '').replace(/s$/, '');

// Which answer (index) does this guess match, or -1.
export function match(guess, answers) {
  const g = norm(guess);
  if (!g) return -1;
  const gw = g.split(' ').map(singular);
  const cands = answers.map(([shown, , ...alts]) => [shown, ...alts].map(norm));
  // Exact words first, across every answer, so "baseball" never fuzzy-matches "basketball".
  for (let i = 0; i < cands.length; i++) for (const c of cands[i]) {
    if (g === c) return i;
    const cw = c.split(' ').map(singular);
    if (cw.every(w => gw.includes(w))) return i;     // "a beach towel" matches "towel"
  }
  // Then small typos.
  let best = -1, bestD = 99;
  for (let i = 0; i < cands.length; i++) for (const c of cands[i]) {
    const allow = c.length >= 8 ? 2 : c.length >= 5 ? 1 : 0;
    const d = lev(g.replace(/ /g, ''), c.replace(/ /g, ''));
    if (d <= allow && d < bestD) { best = i; bestD = d; }
  }
  return best;
}

export function setup(players, rnd = Math.random, prev = null) {
  const recent = new Set(prev?.usedQs || []);
  let pool = QUESTIONS.map((q, i) => i).filter(i => !recent.has(i));
  if (pool.length < ROUNDS) pool = QUESTIONS.map((q, i) => i);
  const qs = shuffle(pool, rnd).slice(0, ROUNDS);
  // Split into two teams; keep last game's teams if the same people are playing.
  const sameCrowd = prev?.teamOf && players.every(p => prev.teamOf[p.pid] !== undefined);
  const order = shuffle(players.map(p => p.pid), rnd);
  const teamOf = {};
  if (sameCrowd) players.forEach(p => (teamOf[p.pid] = prev.teamOf[p.pid]));
  else order.forEach((pid, i) => (teamOf[pid] = i % 2));
  const s = {
    game: 'crowd',
    players: players.map(p => ({ pid: p.pid, name: p.name })),
    teamOf,
    qs, r: 0,
    teamScore: [0, 0],
    usedQs: [...recent, ...qs].slice(-12),
    turnIdx: [0, 0],
    eventId: 0, lastEvent: null,
  };
  startRound(s, Date.now());
  return s;
}

const P = (s, pid) => s.players.find(p => p.pid === pid);
const nameOf = (s, pid) => (P(s, pid) || {}).name || 'Someone';
const team = (s, t) => s.players.filter(p => s.teamOf[p.pid] === t).map(p => p.pid);
const question = s => QUESTIONS[s.qs[s.r]];
const mult = s => (s.r === s.qs.length - 1 ? 2 : 1);
const event = (s, name) => { s.eventId++; s.lastEvent = name; };

function startRound(s, now) {
  s.phase = 'faceoff';
  s.revealed = [];
  s.pot = 0;
  s.strikes = 0;
  s.control = null;
  s.faceoffPair = 0;
  s.fo = {};                 // pid -> {text, idx}
  s.guessLog = [];
  s.stealBy = null;
  pickFaceoff(s);
  s.deadline = now + TIMES.faceoff;
}

function pickFaceoff(s) {
  const a = team(s, 0), b = team(s, 1);
  const k = s.r + s.faceoffPair;
  s.facers = [a.length ? a[k % a.length] : null, b.length ? b[k % b.length] : null].filter(Boolean);
  s.fo = {};
}

function reveal(s, idx) {
  if (idx < 0 || s.revealed.includes(idx)) return false;
  s.revealed.push(idx);
  s.pot += question(s).a[idx][1] * mult(s);
  return true;
}

function resolveFaceoff(s, now) {
  const entries = s.facers.map(pid => ({ pid, ...(s.fo[pid] || { idx: -1, text: '' }) }));
  entries.forEach(e => reveal(s, e.idx));
  const hits = entries.filter(e => e.idx >= 0).sort((x, y) => x.idx - y.idx || x.at - y.at);
  if (hits.length) {
    s.control = s.teamOf[hits[0].pid];
    s.foWinner = hits[0].pid;
    event(s, 'control');
    if (s.revealed.length === question(s).a.length) return endRound(s, now, s.control);
    s.phase = 'play';
    s.deadline = now + TIMES.guess;
    return;
  }
  event(s, 'strike');
  s.faceoffPair++;
  if (s.faceoffPair >= 2) return endRound(s, now, null);
  pickFaceoff(s);
  s.deadline = now + TIMES.faceoff;
}

const guesser = s => { const t = team(s, s.control); return t[s.turnIdx[s.control] % t.length]; };

function guess(s, pid, text, now) {
  const idx = match(text, question(s).a);
  const fresh = idx >= 0 && !s.revealed.includes(idx);
  s.guessLog.push({ pid, text: String(text || '').slice(0, 30), hit: fresh });
  s.turnIdx[s.control]++;
  if (fresh) {
    reveal(s, idx);
    event(s, 'hit');
    if (s.revealed.length === question(s).a.length) return endRound(s, now, s.control);
    s.deadline = now + TIMES.guess;
  } else {
    s.strikes++;
    event(s, 'strike');
    if (s.strikes >= 3) { s.phase = 'steal'; s.deadline = now + TIMES.steal; }
    else s.deadline = now + TIMES.guess;
  }
}

function steal(s, pid, text, now) {
  const idx = match(text, question(s).a);
  const ok = idx >= 0 && !s.revealed.includes(idx);
  s.stealBy = pid;
  s.stealText = String(text || '').slice(0, 30);
  if (ok) { reveal(s, idx); event(s, 'hit'); return endRound(s, now, 1 - s.control); }
  event(s, 'strike');
  endRound(s, now, s.control);
}

function endRound(s, now, winner) {
  if (winner !== null) s.teamScore[winner] += s.pot;
  s.roundWinner = winner;
  s.won = winner !== null ? s.pot : 0;
  s.revealedBeforeEnd = [...s.revealed];
  s.phase = 'roundEnd';
  s.deadline = now + TIMES.roundEnd;
}

function nextRound(s, now) {
  if (s.r + 1 >= s.qs.length) { s.phase = 'over'; return; }
  s.r++;
  startRound(s, now);
}

export function act(s, pid, a, now = Date.now()) {
  if (!P(s, pid) || !a) return s;
  if (s.phase === 'faceoff' && a.type === 'answer' && s.facers.includes(pid) && !s.fo[pid]) {
    s.fo[pid] = { text: String(a.text || '').slice(0, 30), idx: match(a.text, question(s).a), at: now };
    if (s.facers.every(f => s.fo[f])) resolveFaceoff(s, now);
  } else if (s.phase === 'play' && a.type === 'answer' && pid === guesser(s)) guess(s, pid, a.text, now);
  else if (s.phase === 'steal' && a.type === 'answer' && s.teamOf[pid] === 1 - s.control) steal(s, pid, a.text, now);
  return s;
}

export function hostAct(s, a, now = Date.now()) {
  if (a !== 'next') return s;
  if (s.phase === 'faceoff') resolveFaceoff(s, now);
  else if (s.phase === 'play') guess(s, guesser(s), '', now);
  else if (s.phase === 'steal') steal(s, null, '', now);
  else if (s.phase === 'roundEnd') nextRound(s, now);
  return s;
}

export function tick(s, now = Date.now()) {
  if (now < s.deadline) return s;
  return hostAct(s, 'next', now);
}

export function narration(s) {
  switch (s.phase) {
    case 'faceoff': return s.faceoffPair === 0 ? `${s.r === 0 ? 'Welcome to Crowd Says! ' : ''}${s.r === s.qs.length - 1 ? 'Final round, double points! ' : ''}${question(s).q} Face-off: ${s.facers.map(p => nameOf(s, p)).join(' versus ')}.` : `Nobody matched. Next face-off: ${s.facers.map(p => nameOf(s, p)).join(' versus ')}.`;
    case 'steal': return `Three strikes! ${TEAMS[1 - s.control]}, put your heads together. One guess to steal the points.`;
    case 'roundEnd': return s.roundWinner === null ? 'Nobody takes the points this round.' : `${TEAMS[s.roundWinner]} takes ${s.won} points!`;
    case 'over': return s.teamScore[0] === s.teamScore[1] ? 'It\'s a tie!' : `${TEAMS[s.teamScore[0] > s.teamScore[1] ? 0 : 1]} wins Crowd Says!`;
  }
  return '';
}

export function cue(s) {
  switch (s.phase) {
    case 'faceoff': return s.faceoffPair === 0 ? { sound: 'join', wait: 900, title: s.r === s.qs.length - 1 ? 'Final Round' : `Round ${s.r + 1}`, sub: s.r === s.qs.length - 1 ? 'Double points!' : 'Face-off!' } : { sound: 'vote', wait: 500 };
    case 'play': return { sound: 'safe', wait: 600 };
    case 'steal': return { sound: 'drumroll', wait: 1800, title: 'Steal!', sub: `${TEAMS[1 - s.control]} gets one guess`, tone: 'blood' };
    case 'roundEnd': return { sound: s.roundWinner === null ? 'death' : 'win', wait: 900 };
    case 'over': return { sound: 'win', wait: 1600, title: 'Game Over', sub: s.teamScore[0] === s.teamScore[1] ? 'It\'s a tie!' : `${TEAMS[s.teamScore[0] > s.teamScore[1] ? 0 : 1]} wins!`, tone: 'dawn', fx: 'confetti' };
  }
  return null;
}

export function cueEvent(s) {
  if (!s.eventId) return null;
  if (s.lastEvent === 'hit') return { id: s.eventId, sound: 'safe', say: '' };
  if (s.lastEvent === 'strike') return { id: s.eventId, sound: 'death', say: s.phase === 'play' || s.phase === 'steal' ? `Strike ${s.strikes}!` : '' };
  return null;
}

// Bots: usually name a real answer (more often the popular ones), sometimes miss.
export function botAct(v, rnd = Math.random) {
  if (!v.canAnswer) return null;
  const pool = (v._a || []).map((a, i) => ({ t: a[0], i })).filter(a => !(v.revealed || []).includes(a.i));
  if (!pool.length || rnd() < 0.28) return { type: 'answer', text: ['Hmm', 'Socks', 'Pickles', 'A llama'][Math.floor(rnd() * 4)] };
  const pickIdx = Math.min(pool.length - 1, Math.floor(rnd() * rnd() * pool.length));
  return { type: 'answer', text: pool[pickIdx].t };
}

// ---------- views ----------
function boardOf(s, all) {
  return question(s).a.map((a, i) => (all || s.revealed.includes(i) ? { text: a[0], pts: a[1] * mult(s), i, shown: s.revealed.includes(i) } : { i, hidden: true }));
}

export function tvView(s, now = Date.now()) {
  const v = {
    phase: s.phase, r: s.r + 1, rounds: s.qs.length, double: mult(s) === 2,
    q: question(s).q,
    board: boardOf(s, s.phase === 'roundEnd' || s.phase === 'over'),
    teams: TEAMS.map((name, t) => ({ name, score: s.teamScore[t], members: team(s, t).map(p => nameOf(s, p)) })),
    pot: s.pot, strikes: s.strikes, control: s.control,
    left: Math.max(0, Math.ceil((s.deadline - now) / 1000)),
    eventId: s.eventId, lastEvent: s.lastEvent,
  };
  if (s.phase === 'faceoff') v.facers = s.facers.map(p => ({ name: nameOf(s, p), team: s.teamOf[p], done: !!s.fo[p] }));
  if (s.phase === 'play') v.guesser = nameOf(s, guesser(s));
  if (s.phase === 'play' || s.phase === 'steal' || s.phase === 'roundEnd') v.log = s.guessLog.slice(-4).map(g => ({ name: nameOf(s, g.pid), text: g.text, hit: g.hit }));
  if (s.phase === 'roundEnd') Object.assign(v, { roundWinner: s.roundWinner, won: s.won, stealText: s.stealText, stealBy: s.stealBy ? nameOf(s, s.stealBy) : null });
  return v;
}

export function phoneView(s, pid) {
  if (!P(s, pid)) return { phase: 'spectate' };
  const t = s.teamOf[pid];
  const v = { phase: s.phase, q: question(s).q, team: TEAMS[t], teamIdx: t, strikes: s.strikes, pot: s.pot, control: s.control, revealedText: s.revealed.map(i => question(s).a[i][0]), revealed: [...s.revealed], scores: [...s.teamScore] };
  if (s.phase === 'faceoff') { v.facing = s.facers.includes(pid); v.done = !!s.fo[pid]; v.facers = s.facers.map(p => nameOf(s, p)); v.canAnswer = v.facing && !v.done; }
  if (s.phase === 'play') { v.myTurn = guesser(s) === pid; v.guesser = nameOf(s, guesser(s)); v.canAnswer = v.myTurn; v.onControl = t === s.control; }
  if (s.phase === 'steal') { v.canAnswer = t === 1 - s.control; }
  if (s.phase === 'over') v.won = s.teamScore[t] > s.teamScore[1 - t];
  if (String(pid).startsWith('bot-')) v._a = question(s).a;
  return v;
}

// ---------- renderers ----------
export function renderTV(v, el) {
  document.body.classList.toggle('day', true);
  const half = Math.ceil(v.board.length / 2);
  const slot = b => `<div class="cslot ${b.hidden ? 'hid' : 'on'} ${b.shown === false ? 'missed' : ''}"><span class="cnum">${b.i + 1}</span>${b.hidden ? '' : `<span class="ctext">${esc(b.text)}</span><span class="cpts">${b.pts}</span>`}</div>`;
  const boardHtml = `<div class="cboard"><div>${v.board.slice(0, half).map(slot).join('')}</div><div>${v.board.slice(half).map(slot).join('')}</div></div>`;
  const strikes = `<div class="strikes">${[0, 1, 2].map(i => `<span class="${i < v.strikes ? 'on' : ''}">✕</span>`).join('')}</div>`;
  const teams = `<div class="side">${v.teams.map((t, i) => `<div class="scores team t${i} ${v.control === i && v.phase !== 'roundEnd' ? 'ctl' : ''}"><h3>${esc(t.name)}</h3><div class="tscore">${t.score}</div><p class="muted small">${t.members.map(esc).join(', ')}</p></div>`).join('')}</div>`;
  let status = '';
  if (v.phase === 'faceoff') status = `<p class="say">Face-off: ${v.facers.map(f => `<b class="tc${f.team}">${esc(f.name)}</b>${f.done ? ' ✓' : ''}`).join(' vs ')}</p><p class="muted">Type your answer on your phone. The higher answer wins control.</p>`;
  if (v.phase === 'play') status = `<p class="say"><b class="tc${v.control}">${esc(v.teams[v.control].name)}</b> · <b>${esc(v.guesser)}</b>'s guess</p>${strikes}`;
  if (v.phase === 'steal') status = `<p class="say"><b class="tc${1 - v.control}">${esc(v.teams[1 - v.control].name)}</b>, talk it over! Anyone on your team can type one steal guess.</p>${strikes}`;
  if (v.phase === 'roundEnd') status = `<p class="say">${v.stealBy ? `Steal guess from ${esc(v.stealBy)}: “${esc(v.stealText || '…')}”. ` : ''}${v.roundWinner === null ? 'No points this round.' : `<b class="tc${v.roundWinner}">${esc(v.teams[v.roundWinner].name)}</b> wins <b>${v.won}</b> points!`}</p><button class="btn" data-host="next">Next round</button>`;
  if (v.phase === 'over') status = `<h2 class="win">${v.teams[0].score === v.teams[1].score ? 'It\'s a tie!' : `${esc(v.teams[v.teams[0].score > v.teams[1].score ? 0 : 1].name)} wins!`}</h2><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  const log = v.log?.length && v.phase !== 'roundEnd' ? `<div class="history">${v.log.map(g => `<span class="${g.hit ? 'win' : 'lose'}">${esc(g.name)}: ${esc(g.text || '…')}</span>`).join('')}</div>` : '';
  const timer = ['faceoff', 'play', 'steal'].includes(v.phase) ? `<span class="clock small ${v.left <= 5 ? 'hurry' : ''}">${v.left}</span>` : '';
  const h = `<p class="cat">Round ${v.r} of ${v.rounds}${v.double ? ' · <b>Double points</b>' : ''} · Pot <b>${v.pot}</b> ${timer}</p><div class="cq">${esc(v.q)}</div>${boardHtml}${status}${log}${['faceoff', 'play', 'steal'].includes(v.phase) ? '<button class="btn ghost" data-host="next">Time\'s up</button>' : ''}`;
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel">${h}</div>${teams}</div>`;
}

export function renderPhone(v, el, send) {
  let h = '';
  const head = `<p class="muted"><b class="tc${v.teamIdx}">${esc(v.team || '')}</b> · Sun ${v.scores?.[0] ?? 0} · Moon ${v.scores?.[1] ?? 0}</p><p class="tq small">${esc(v.q || '')}</p>`;
  const form = label => `<form id="cf2"><label for="cg">${label}</label><input id="cg" maxlength="30" autocomplete="off" required><button class="btn" type="submit">Send</button></form>`;
  const found = v.revealedText?.length ? `<p class="muted">On the board: ${v.revealedText.map(esc).join(', ')}</p>` : '';
  if (v.phase === 'spectate') h = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>';
  else if (v.phase === 'over') h = `<h2 class="${v.won ? 'win' : ''}">${v.won ? 'Your team won!' : v.scores[0] === v.scores[1] ? 'It\'s a tie!' : 'Your team lost'}</h2>`;
  else if (v.phase === 'faceoff') h = head + (v.canAnswer ? form('Face-off! Name the most popular answer') : v.facing ? '<h2>Answer locked</h2>' : `<h2>Face-off</h2><p class="say">${v.facers.map(esc).join(' vs ')}</p>`);
  else if (v.phase === 'play') h = head + found + (v.canAnswer ? form(`Your guess (${v.strikes} strike${v.strikes === 1 ? '' : 's'})`) : v.onControl ? `<h2>${esc(v.guesser)}'s guess</h2><p class="say">Help them out! You're up soon.</p>` : `<h2>${esc(v.guesser)} is guessing</h2><p class="say">Start thinking of a steal answer…</p>`);
  else if (v.phase === 'steal') h = head + found + (v.canAnswer ? form('Steal! One guess for your whole team') : '<h2>The other team is stealing…</h2>');
  else if (v.phase === 'roundEnd') h = `${head}<h2>Round over</h2>`;
  el.innerHTML = h;
  const f = el.querySelector('#cf2');
  if (f) { f.querySelector('input').focus(); f.onsubmit = e => { e.preventDefault(); f.querySelector('button').disabled = true; send({ type: 'answer', text: f.querySelector('input').value.trim() }); }; }
}
