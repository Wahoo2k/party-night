// Gold Rush: trivia where a right answer earns you a treasure chest. Chests hold gold, a jackpot, a hole in the bag,
// or the chance to steal from or swap with another player. Being good at trivia helps; it does not make you safe.
import { esc } from '../ui.js';
import { EASY, MEDIUM } from './ladder-bank.js';

export const meta = {
  id: 'gold',
  name: 'Gold Rush',
  min: 2,
  max: 12,
  blurb: 'Answer right to open a treasure chest. Find gold, lose gold, or steal it from a friend.',
  ownReveal: true,   // this game holds its scores back itself until its reveal has played
};

export const TIMES = { ask: 18000, chest: 14000, settle: 1500, perEvent: 1500, after: 5000 };
// What a chest can hold, and how often (out of 100).
export const CHESTS = [['gold', 50], ['jackpot', 10], ['hole', 10], ['steal', 20], ['swap', 10]];
const L = ['A', 'B', 'C', 'D'];
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function roll(rnd) { let x = rnd() * 100; for (const [k, w] of CHESTS) { if ((x -= w) < 0) return k; } return 'gold'; }

export function setup(players, rnd = Math.random, prev = null, opts = {}) {
  const max = opts.short ? 6 : 10;
  let deck = (prev?.deck || []).slice(); if (deck.length < max) deck = shuffle([...EASY.map((_, i) => [0, i]), ...MEDIUM.map((_, i) => [1, i])], rnd);
  const s = {
    game: 'gold', players: players.map(p => ({ pid: p.pid, name: p.name })), round: 0,
    scores: Object.fromEntries(players.map(p => [p.pid, 0])),
    deck, max, n: 0, q: null, picks: {}, chests: {}, events: [], result: null, settled: false, settleAt: 0, phase: 'ask', deadline: 0,
  };
  ask(s, Date.now(), rnd);
  return s;
}
function ask(s, now, rnd) {
  s.n++; const [lv, i] = s.deck.shift(), [q, right, ...wrong] = [EASY, MEDIUM][lv][i], options = shuffle([right, ...wrong.slice(0, 3)], rnd);
  s.q = { q, options, answer: options.indexOf(right) }; s.picks = {}; s.chests = {}; s.events = []; s.result = null; s.settled = false;
  s.phase = 'ask'; s.round++; s.deadline = now + TIMES.ask;
}
const winners = s => s.players.filter(p => s.picks[p.pid] === s.q.answer).map(p => p.pid);
function toChest(s, now) {
  if (!winners(s).length) return resolve(s, now, Math.random);
  s.phase = 'chest'; s.round++; s.deadline = now + TIMES.chest;
}
const needsTarget = c => c && (c.kind === 'steal' || c.kind === 'swap') && !c.target && !c.skip;
const chestDone = s => winners(s).every(pid => s.chests[pid] && !needsTarget(s.chests[pid]));
// Everything that happens is worked out here, in the order the chests were opened, from the gold as it stood.
function resolve(s, now, rnd) {
  const before = { ...s.scores }, events = [], others = pid => s.players.map(p => p.pid).filter(p => p !== pid);
  const order = winners(s).filter(pid => s.chests[pid]).sort((a, b) => s.chests[a].at - s.chests[b].at);
  winners(s).filter(pid => !s.chests[pid]).forEach(pid => events.push({ pid, kind: 'none' }));   // right, but never opened a chest
  for (const pid of order) {
    const c = s.chests[pid];
    if (c.kind === 'gold' || c.kind === 'jackpot') { s.scores[pid] += c.amount; events.push({ pid, kind: c.kind, amount: c.amount }); }
    else if (c.kind === 'hole') { const lost = Math.round(s.scores[pid] * 0.25 / 10) * 10; s.scores[pid] -= lost; events.push({ pid, kind: 'hole', amount: lost }); }
    else {
      // nobody chosen in time: it goes for the richest other player
      const target = c.target || (c.skip ? null : others(pid).sort((a, b) => s.scores[b] - s.scores[a])[0]);
      if (c.kind === 'steal') {
        const take = target ? Math.min(s.scores[target], Math.max(100, Math.round(s.scores[target] * 0.25 / 10) * 10)) : 0;
        if (take > 0) { s.scores[target] -= take; s.scores[pid] += take; events.push({ pid, kind: 'steal', target, amount: take }); }
        else { s.scores[pid] += 100; events.push({ pid, kind: 'gold', amount: 100, consolation: true }); }   // nothing to steal: a small find instead
      } else if (!target) events.push({ pid, kind: 'keep' });
      else { const mine = s.scores[pid]; s.scores[pid] = s.scores[target]; s.scores[target] = mine; events.push({ pid, kind: 'swap', target, amount: s.scores[pid] - mine }); }
    }
  }
  s.events = events; s.result = { before };
  s.settled = false; s.settleAt = now + TIMES.settle + Math.max(1, events.length) * TIMES.perEvent;
  s.phase = 'reveal'; s.round++; s.deadline = s.settleAt + TIMES.after;
}

export function act(s, pid, a, now = Date.now(), rnd = Math.random) {
  if (!a || !s.players.some(p => p.pid === pid)) return s;
  if (s.phase === 'ask' && a.type === 'pick' && s.picks[pid] === undefined) {
    const i = Number(a.i); if (!Number.isInteger(i) || i < 0 || i > 3) return s;
    s.picks[pid] = i; if (s.players.every(p => s.picks[p.pid] !== undefined)) toChest(s, now);
  } else if (s.phase === 'chest' && s.picks[pid] === s.q.answer) {
    if (a.type === 'chest' && !s.chests[pid] && [0, 1, 2].includes(Number(a.i))) {
      const kind = roll(rnd);
      s.chests[pid] = { i: Number(a.i), kind, at: now, amount: kind === 'gold' ? 100 + Math.floor(rnd() * 4) * 100 : kind === 'jackpot' ? 800 : 0 };
    } else if (a.type === 'target' && needsTarget(s.chests[pid])) {
      if (a.pid === null && s.chests[pid].kind === 'swap') s.chests[pid].skip = true;   // you may keep what you have instead of swapping
      else if (a.pid !== pid && s.players.some(p => p.pid === a.pid)) s.chests[pid].target = a.pid;
    }
    if (chestDone(s)) resolve(s, now, rnd);
  }
  return s;
}
export function hostAct(s, a, now = Date.now(), rnd = Math.random) {
  if (a !== 'next') return s;
  if (s.phase === 'ask') toChest(s, now);
  else if (s.phase === 'chest') resolve(s, now, rnd);
  else if (s.phase === 'reveal') { if (s.n >= s.max) { s.phase = 'over'; s.round++; s.deadline = 0; } else ask(s, now, rnd); }
  return s;
}
export function tick(s, now = Date.now(), rnd = Math.random) {
  if (s.phase === 'reveal' && !s.settled && now >= s.settleAt) { s.settled = true; return s; }
  return s.deadline && now >= s.deadline ? hostAct(s, 'next', now, rnd) : s;
}

const nameOf = (s, pid) => (s.players.find(p => p.pid === pid) || {}).name || 'Someone';
const ranking = (s, sc = s.scores) => s.players.map(p => ({ pid: p.pid, name: p.name, score: sc[p.pid] })).sort((a, b) => b.score - a.score);
export function narration(s) {
  if (s.phase === 'ask' && s.n === 1) return 'Welcome to Gold Rush! Answer right to open a treasure chest. Watch out for thieves.';
  if (s.phase === 'over') return 'And that is the game. Thanks for playing!';
  return '';
}
export function cue(s) {
  if (s.phase === 'ask') return s.n === 1 ? { sound: 'fanfare', wait: 1500, title: 'Gold Rush', sub: 'Answer right. Open a chest.' } : { sound: 'vote', wait: 300 };
  if (s.phase === 'chest') return { sound: 'safe', wait: 0 };
  if (s.phase === 'reveal') return s.settled ? null : { sound: winners(s).length ? 'drumroll' : 'groan', wait: 0 };
  if (s.phase === 'over') return { sound: 'win', wait: 1500, title: 'Game Over', sub: `${ranking(s)[0].name} is the richest!`, tone: 'dawn', fx: 'confetti' };
  return null;
}
export function botAct(v, rnd = Math.random) {
  if (v.phase === 'ask' && v.pick === null) return { type: 'pick', i: rnd() < 0.65 ? v.hint : Math.floor(rnd() * 4) };
  if (v.phase === 'chest' && v.canOpen) return { type: 'chest', i: Math.floor(rnd() * 3) };
  if (v.phase === 'chest' && v.targets) return { type: 'target', pid: v.targets[0].pid };
  return null;
}

export function tvView(s, now = Date.now()) {
  const held = s.phase === 'reveal' && !s.settled;
  const v = { phase: s.phase, n: s.n, max: s.max, left: Math.max(0, Math.ceil((s.deadline - now) / 1000)), scores: ranking(s, held ? s.result.before : s.scores) };
  if (s.phase === 'over') return v;
  v.q = s.q.q; v.options = s.q.options;
  if (s.phase === 'ask') v.players = s.players.map(p => ({ name: p.name, done: s.picks[p.pid] !== undefined }));
  else {
    v.answer = s.q.answer; v.right = winners(s).map(p => nameOf(s, p));
    if (s.phase === 'chest') v.players = winners(s).map(pid => ({ name: nameOf(s, pid), done: !!s.chests[pid] && !needsTarget(s.chests[pid]), opened: !!s.chests[pid] }));
    if (s.phase === 'reveal') { v.settled = !!s.settled; v.events = s.events.map(e => ({ name: nameOf(s, e.pid), kind: e.kind, amount: e.amount || 0, target: e.target ? nameOf(s, e.target) : null })); }
  }
  return v;
}
export function phoneView(s, pid) {
  if (!s.players.some(p => p.pid === pid)) return { phase: 'spectate' };
  const held = s.phase === 'reveal' && !s.settled;
  const v = { phase: s.phase, n: s.n, max: s.max, score: held ? s.result.before[pid] : s.scores[pid] };
  if (s.phase === 'ask') { v.q = s.q.q; v.options = s.q.options; v.pick = s.picks[pid] ?? null; if (String(pid).startsWith('bot-')) v.hint = s.q.answer; }
  if (s.phase === 'chest') {
    v.right = s.picks[pid] === s.q.answer; v.answer = s.q.options[s.q.answer]; const c = s.chests[pid];
    if (v.right && !c) v.canOpen = true;
    if (c) { v.chest = { i: c.i, kind: c.kind, amount: c.amount, target: c.target ? nameOf(s, c.target) : null, skip: !!c.skip }; if (needsTarget(c)) v.targets = s.players.filter(p => p.pid !== pid).map(p => ({ pid: p.pid, name: p.name, gold: s.scores[p.pid] })).sort((a, b) => b.gold - a.gold); }
  }
  if (s.phase === 'reveal') { v.settled = !!s.settled; v.right = s.picks[pid] === s.q.answer; v.answer = s.q.options[s.q.answer]; if (s.settled) { v.delta = s.scores[pid] - s.result.before[pid]; v.robbed = s.events.filter(e => e.target === pid).map(e => ({ by: nameOf(s, e.pid), kind: e.kind })); } }
  if (s.phase === 'over') { const r = ranking(s); v.place = r.findIndex(x => x.pid === pid) + 1; v.winner = r[0].name; }
  return v;
}

// ---------- renderers ----------
const ICON = { gold: '💰', jackpot: '💎', hole: '🕳️', steal: '🏴‍☠️', swap: '🔄', keep: '🤝', none: '⏰' };
const line = e => (e.kind === 'gold' ? `<b>${esc(e.name)}</b> finds <em>+${e.amount}</em>` : e.kind === 'jackpot' ? `<b>${esc(e.name)}</b> hits the JACKPOT <em>+${e.amount}</em>` : e.kind === 'hole' ? `<b>${esc(e.name)}</b> has a hole in the bag <em class="neg">−${e.amount}</em>` : e.kind === 'steal' ? `<b>${esc(e.name)}</b> steals <em>${e.amount}</em> from <b>${esc(e.target)}</b>!` : e.kind === 'swap' ? `<b>${esc(e.name)}</b> swaps gold with <b>${esc(e.target)}</b>!` : e.kind === 'keep' ? `<b>${esc(e.name)}</b> could swap, and keeps their own` : `<b>${esc(e.name)}</b> never opened a chest`);
let revKey = '', revAt = 0;
export function renderTV(v, el) {
  document.body.classList.toggle('day', false);
  const scores = `<div class="scores"><h3>Gold</h3>${v.scores.map(p => `<div class="srow"><span>${esc(p.name)}</span><b>${p.score.toLocaleString()}</b></div>`).join('')}</div>`;
  let h = '';
  if (v.phase === 'over') h = `<h2 class="win">${esc(v.scores[0].name)} is the richest!</h2><div class="podium">${v.scores.slice(0, 3).map((p, i) => `<div class="pod p${i + 1}"><b>${esc(p.name)}</b><span>${p.score.toLocaleString()}</span></div>`).join('')}</div><div class="row"><button class="btn" data-host="again">Play again</button><button class="btn ghost" data-host="lobby">Back to lobby</button></div>`;
  else {
    const shown = v.phase !== 'ask';
    const opts = `<div class="loopts ${shown ? 'rev' : ''}">${v.options.map((o, i) => `<div class="loopt ${shown && i === v.answer ? 'right' : ''} ${shown && i !== v.answer ? 'dim' : ''}" style="animation-delay:-2s"><b>${L[i]}</b><span>${esc(o)}</span></div>`).join('')}</div>`;
    let body = '';
    if (v.phase === 'ask') body = `<div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : ''}</div>`).join('')}</div>`;
    if (v.phase === 'chest') body = `<div class="grchests"><i>🧰</i><i>🧰</i><i>🧰</i></div><p class="tsrule"><b>${v.right.map(esc).join(', ')}: pick a chest on your phone!</b><span class="clock">${v.left}</span></p><div class="roster">${v.players.map(p => `<div class="chip ${p.done ? '' : 'waiting'}">${esc(p.name)}${p.done ? ' ✓' : p.opened ? ' …' : ''}</div>`).join('')}</div>`;
    if (v.phase === 'reveal') {
      const key = 'q' + v.n; if (revKey !== key) { revKey = key; revAt = Date.now(); import('../sfx.js').then(m => v.events.forEach((e, i) => setTimeout(() => m.play({ gold: 'points', jackpot: 'win', hole: 'groan', steal: 'gasp', swap: 'gasp', keep: 'pop', none: 'pop' }[e.kind]), 1500 + i * 1500))).catch(() => {}); }
      const el0 = Date.now() - revAt;
      body = v.events.length ? `<div class="grevents">${v.events.map((e, i) => `<div class="grev ${e.kind}" style="animation-delay:${1500 + i * 1500 - el0}ms"><i>${ICON[e.kind]}</i><span>${line(e)}</span></div>`).join('')}</div>` : '<p class="tsrule"><b>Nobody got it. No chests this time.</b></p>';
    }
    h = `<p class="cat">Question ${v.n} of ${v.max} ${v.phase === 'ask' ? `<span class="clock small ${v.left <= 5 ? 'hurry' : ''}">${v.left}</span>` : ''}</p><div class="loq ${shown ? 'small' : ''}">${esc(v.q)}</div>${opts}${body}<button class="btn ghost" data-host="next">${v.phase === 'ask' ? 'Show the answer' : v.phase === 'chest' ? 'Open them up' : v.n >= v.max ? 'Finish' : 'Next question'}</button>`;
  }
  el.innerHTML = `<div class="stage ${v.fresh ? 'enter' : ''}"><div class="panel gr">${h}</div>${scores}</div>`;
}
export function renderPhone(v, el, send) {
  if (v.phase === 'spectate') { el.innerHTML = '<h2>Game in progress</h2><p>You\'ll join the next game.</p>'; return; }
  if (v.phase === 'over') { el.innerHTML = `<h2 class="${v.place === 1 ? 'win' : ''}">${v.place === 1 ? 'You are the richest! 💰' : `${esc(v.winner)} wins`}</h2><p class="say">You finished ${['1st', '2nd', '3rd'][v.place - 1] || v.place + 'th'} with ${v.score.toLocaleString()} gold.</p>`; return; }
  const purse = `<p class="muted">💰 ${v.score.toLocaleString()} gold</p>`;
  if (v.phase === 'ask') {
    el.innerHTML = `${purse}<p class="tq small">${esc(v.q)}</p><div class="opts">${v.options.map((o, i) => `<button class="opt ${v.pick === i ? 'on' : ''}" data-i="${i}" ${v.pick !== null ? 'disabled' : ''}><b>${L[i]}</b> ${esc(o)}</button>`).join('')}</div>${v.pick !== null ? '<p class="say center">Locked in.</p>' : '<p class="muted">Get it right to open a chest.</p>'}`;
    el.querySelectorAll('[data-i]').forEach(b => (b.onclick = () => send({ type: 'pick', i: +b.dataset.i })));
    return;
  }
  if (v.phase === 'chest') {
    if (!v.right) { el.innerHTML = `${purse}<h2 class="lose">Wrong</h2><p class="say">It was ${esc(v.answer)}. No chest for you. Hope nobody robs you…</p>`; return; }
    if (v.canOpen) { el.innerHTML = `${purse}<h2 class="win">Right! Pick a chest</h2><div class="grpick">${[0, 1, 2].map(i => `<button class="btn" data-c="${i}">🧰</button>`).join('')}</div><p class="muted">Gold, a jackpot, a hole in your bag, or a chance to rob someone.</p>`; el.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => send({ type: 'chest', i: +b.dataset.c }))); return; }
    const c = v.chest, what = { gold: `Gold! +${c.amount}`, jackpot: `JACKPOT! +${c.amount}`, hole: 'A hole in your bag! You lose a quarter of your gold.', steal: 'A pirate flag! Steal a quarter of someone\'s gold.', swap: 'A swap! Trade ALL your gold with someone.' }[c.kind];
    if (v.targets) {
      el.innerHTML = `${purse}<h2 class="win">${ICON[c.kind]} ${what}</h2><p class="muted">${c.kind === 'steal' ? 'Who do you rob?' : 'Who do you swap with?'}</p><div class="opts">${v.targets.map(t => `<button class="opt" data-t="${esc(t.pid)}">${esc(t.name)} · ${t.gold.toLocaleString()}</button>`).join('')}${c.kind === 'swap' ? '<button class="opt" data-t="">Keep my own gold</button>' : ''}</div>`;
      el.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => send({ type: 'target', pid: b.dataset.t || null })));
      return;
    }
    el.innerHTML = `${purse}<h2 class="${c.kind === 'hole' ? 'lose' : 'win'}">${ICON[c.kind]} ${what}</h2><p class="say">${c.target ? `You chose ${esc(c.target)}. ` : c.skip ? 'You kept your own. ' : ''}Watch the TV.</p>`;
    return;
  }
  if (!v.settled) { el.innerHTML = `${purse}<h2>Watch the TV…</h2>`; return; }
  el.innerHTML = `${purse}<h2 class="${v.delta > 0 ? 'win' : v.delta < 0 ? 'lose' : ''}">${v.delta > 0 ? '+' + v.delta.toLocaleString() : v.delta < 0 ? '−' + Math.abs(v.delta).toLocaleString() : 'No change'}</h2>${v.robbed.length ? `<p class="say">${v.robbed.map(r => `${esc(r.by)} ${r.kind === 'steal' ? 'robbed you' : 'swapped with you'}`).join('. ')}!</p>` : ''}<p class="muted">The answer was ${esc(v.answer)}.</p>`;
}
