// TV / host page: owns the room, the player list and the game state.
import { GAMES, COMING_SOON, SHELVES, NIGHTS } from './games/index.js';
import { openRoom } from './net.js';
import { esc, store, newCode, say, voice, voices, enableDpad, autofocus, drawScene, titleCard, confetti, clawMarks } from './ui.js';
import { art } from './art.js';
import { play, sfx, startAmbient, stopAmbient, startBed, stopBed, quiet } from './sfx.js';
import { newKeys, cleanPub, samePub, sharedKey, seal, unseal } from './secure.js';
import { cleanAct, textsIn, maskView, maskLine } from './content.js';
import { settleName, cleanName, isRude, uniqueName, funName, MAX_NAME } from './names.js';

const app = document.getElementById('app');
const statusEl = document.getElementById('status');
drawScene(document.getElementById('sky'));
enableDpad();

// Saved so a TV refresh doesn't lose the game.
let host = store.get('pg-host') || { code: newCode(), players: [], gameId: 'werewolf', state: null };
host.audience = host.audience || [];
host.settings = { relaxed: false, howto: true, kids: false, music: true, ...(host.settings || {}) };
host.hidden = host.hidden || [];
let recentTexts = [];
let vetoOpen = false;
const tvView = () => maskView(game().tvView(host.state, Date.now()), host.hidden);
let room = null;
let lastSent = {};
// The TV's key pair for private messages (kept across refreshes and new rooms).
let hostKeys = store.get('pg-host-keys');
if (!hostKeys) newKeys().then(k => { hostKeys = k; if (k) store.set('pg-host-keys', k); sendViews(true); }).catch(() => {});
const sendQ = {};
const lastActN = {};
let viewSeq = Date.now();
let lastPhase = '';

const game = () => GAMES[host.gameId];
const save = () => store.set('pg-host', host);
const joinUrl = () => {
  const u = new URL('play.html', location.href);
  u.search = '';
  u.searchParams.set('code', host.code);
  if (new URLSearchParams(location.search).has('local')) u.searchParams.set('local', '1');
  return u.toString();
};

// Every player gets a village character and a color that follow them through every game.
const FACES = [['🦊', '#f28a3d'], ['🦉', '#c9a15a'], ['🐸', '#5fbf6b'], ['🐻', '#b0763f'], ['🐰', '#f2a0c0'], ['🦝', '#9aa3b8'], ['🦔', '#d9b38c'], ['🐢', '#3fa38f'], ['🦆', '#f2c94c'], ['🦋', '#6fa8ff'], ['🐝', '#f2b21d'], ['🦌', '#c98b5a'], ['🐺', '#8fa0c8'], ['🐱', '#f2b880'], ['🐶', '#d8a36a'], ['🐭', '#c0c0cc'], ['🐷', '#f29aa8'], ['🐮', '#e8e2d0'], ['🐞', '#e2473b'], ['🦜', '#4fc3a1']];
function ensureFaces() {
  const everyone = [...host.players, ...host.audience];
  for (const p of everyone) {
    if (p.face) continue;
    const used = new Set(everyone.map(x => x.face?.[0]));
    p.face = FACES.find(f => !used.has(f[0])) || FACES[Math.floor(Math.random() * FACES.length)];
  }
}
// After a game draws its screen, put each player's character beside their name in the shared score, podium and roster parts.
function decorate() {
  const list = [...host.players].sort((a, b) => b.name.length - a.name.length);
  app.querySelectorAll('.srow > span:first-child, .pod > b, .roster .chip, .ccseat > b, .gfseat > b, .hseat > b, .bjseat > b, .mmcast b, .ccplayers b').forEach(el => {
    if (el.querySelector('.pface')) return;
    const text = el.textContent.replace(/^[^\p{L}\p{N}]+/u, '');
    const p = list.find(x => text === x.name || text.startsWith(x.name + ' ') || text.startsWith(x.name));
    if (!p?.face) return;
    const i = document.createElement('i');
    i.className = 'pface'; i.textContent = p.face[0]; i.style.setProperty('--pc', p.face[1]);
    el.prepend(i);
  });
}

const REACTIONS = ['👏', '😂', '😱', '🔥', '❤️', '👎'];
const isAudience = pid => host.audience.some(a => a.pid === pid);
function viewFor(pid) {
  if (isAudience(pid)) {
    const me = host.audience.find(a => a.pid === pid);
    return { phase: 'audience', me: me.name, game: game().meta.name, playing: !!host.state, players: host.players.map(p => p.name), reactions: REACTIONS, ask: host.state && game().audienceView ? maskView(game().audienceView(host.state, pid) || null, host.hidden) : null };
  }
  if (!host.state) {
    const me = host.players.find(p => p.pid === pid) || {};
    return { phase: 'lobby', players: host.players.map(p => p.name), game: game().meta.name, me: me.name, fixed: !!me.fixed, byHost: !!me.locked, _me: me.face, ...(pid === remotePid() ? { _remote: true, canStart: host.players.length >= game().meta.min } : {}), ...(game().meta.id === 'funny' ? { canPrompt: true, myPrompts: (host.custom || []).filter(c => c.pid === pid).map(c => c.text) } : {}) };
  }
  return { ...maskView(game().phoneView(host.state, pid), host.hidden), game: host.gameId, _me: host.players.find(p => p.pid === pid)?.face, ...(host.paused ? { _paused: true } : {}), ...(gains[pid] ? { _gain: gains[pid] } : {}), ...(places[pid] ? { _place: places[pid] } : {}), ...(finalRound ? { _final: true } : {}), ...(host.blurDraw ? { _nodraw: true } : {}), ...(pid === remotePid() ? { _remote: true } : {}) };
}

// Each phone hears about its own points the moment they land, and its finishing place at the end.
let gains = {}, places = {}, lastScore = {}, gainId = 0, finalRound = false, finalSaid = false;
function scoreList() {
  const v = game().tvView(host.state, Date.now());
  return Array.isArray(v.scores) && v.scores[0]?.name && typeof v.scores[0].score === 'number' ? v.scores : null;
}
function trackScores() {
  if (!host.state) return;
  const list = scoreList();
  if (!list) return;
  const over = host.state.phase === 'over';
  list.forEach((row, i) => {
    const p = host.players.find(x => x.name === row.name);
    if (!p) return;
    if (lastScore[p.pid] !== undefined && row.score > lastScore[p.pid]) gains[p.pid] = { n: row.score - lastScore[p.pid], id: ++gainId };
    lastScore[p.pid] = row.score;
    if (over && host.gameId !== 'imposter') places[p.pid] = { n: list.filter(x => x.score > row.score).length + 1, of: list.length };
  });
}
// Which round is the last one, for the games that count rounds on screen.
const ROUNDS_OF = { quick: v => [v.n, v.total], potato: v => [v.r, v.of], hunt: v => [v.r, v.of], freeze: v => [v.r, v.of], meld: v => [v.turn, v.turns], charades: v => [v.turn, v.turns], taboo: v => [v.turn, v.turns], crew: v => [v.card, v.cards], doodle: v => [v.k, v.of], whosaid: v => [v.i + 1, v.total], bingo: v => [v.round, v.rounds], trivia: v => [v.n, v.total], copycat: () => null, meter: v => [v.q, v.of], faker: v => [v.r, v.of], rebus: v => [v.r, v.of] };
function checkFinal() {
  const f = host.state && ROUNDS_OF[host.gameId], r = f ? f(game().tvView(host.state, Date.now())) : null;
  finalRound = !!(r && r[1] > 2 && r[0] === r[1] && host.state.phase !== 'over');
  document.body.classList.toggle('finalround', finalRound);
  if (finalRound && !finalSaid) { finalSaid = true; if (sfx.on) play('fanfare'); setTimeout(() => say('Final round!'), 300); flash('gold'); }
}

// Extra buttons beside Pause: End game (press twice), and Hide drawing in the drawing games.
let endArmed = 0;
function vetoExtras() {
  const vbar = document.getElementById('vetobar');
  if (!vbar || !host.state) return;
  if (!vbar.querySelector('[data-host=endgame]')) vbar.insertAdjacentHTML('afterbegin', `<button class="btn ghost small" data-host="endgame">${Date.now() - endArmed < 4000 ? 'Press again to end' : '✕ End game'}</button>`);
  if (['sketch', 'doodle'].includes(host.gameId) && !vbar.querySelector('[data-host=blurdraw]')) vbar.insertAdjacentHTML('afterbegin', `<button class="btn ghost small" data-host="blurdraw">🙈 ${host.blurDraw ? 'Show' : 'Hide'} drawing</button>`);
}
// The phone remote: one player's phone (the first to join, unless turned off) can press Next, Pause and Start for the TV.
const remotePid = () => (host.settings.remote === false ? null : host.players.find(p => !p.bot)?.pid || null);

function sendViews(force) {
  if (!room) return;
  trackScores();
  for (const p of [...host.players, ...host.audience]) {
    if (p.bot) continue;
    const v = JSON.stringify(viewFor(p.pid));
    if (force || lastSent[p.pid] !== v) {
      lastSent[p.pid] = v;
      sendView(p, JSON.parse(v));
    }
  }
}

// Views go out encrypted for that one phone whenever both sides have keys.
function sendView(p, view) {
  if (!p.pub || !hostKeys) return room.send({ t: 'view', to: p.pid, view });
  const n = ++viewSeq;
  sendQ[p.pid] = (sendQ[p.pid] || Promise.resolve()).then(async () => {
    const key = await sharedKey(hostKeys.priv, p.pub);
    room?.send({ t: 'view', to: p.pid, hpub: hostKeys.pub, enc: await seal(key, { n, view }) });
  }).catch(() => {});
}

// Relaxed timers: every new countdown gets 50% longer.
let stretchedFor = 0;
function stretch() {
  const s = host.state;
  if (!host.settings.relaxed || !s?.deadline || s.deadline === stretchedFor) return;
  const now = Date.now();
  if (s.deadline > now) s.deadline = Math.round(now + (s.deadline - now) * 1.5);
  stretchedFor = s.deadline;
}

let fresh = false;
let lastEventId = 0;
let lastViewKey = '';
const viewKey = v => JSON.stringify({ ...v, left: 0 });
function changed() {
  ensureFaces();
  stretch();
  save();
  if (host.state) {
    const key = host.state.phase + host.state.round;
    if (key !== lastPhase) { lastPhase = key; fresh = true; host.blurDraw = false; announce(); }
    const ce = game().cueEvent?.(host.state);
    if (ce && ce.id !== lastEventId) {
      lastEventId = ce.id;
      setTimeout(() => { if (sfx.on) { play(ce.sound); if (ce.react) setTimeout(() => play(ce.react), 350); } if (ce.fx) flash(ce.fx); if (ce.say) say(maskLine(ce.say, host.hidden)); }, ce.delay || 0);
    }
  }
  checkFinal();
  countNight();
  render();
  fresh = false;
  sendViews();
}

// Sound effect first, then the narrator once it has played.
let sayTimer = null;
function announce() {
  const g = game(), s = host.state;
  const c = g.cue ? g.cue(s) : null;
  clearTimeout(sayTimer);
  stopAmbient();
  if (c && sfx.on) {
    play(c.sound);
    if (c.after) setTimeout(() => play(c.after), c.wait - 500);
    if (c.ambient) setTimeout(startAmbient, c.wait);
  }
  const line = g.narration(s);
  // Game over with a score table: the shared winners' ceremony replaces the game's own title card.
  if (s.phase === 'over' && host.gameId !== 'imposter' && ceremony()) { sayTimer = setTimeout(() => say(maskLine(line, host.hidden)), 4200); return; }
  if (c?.title) titleCard(c.title, c.sub, c.tone, introArt ? art(host.gameId, ICONS[host.gameId]) : ''); if (c?.title) introArt = false;
  else if (s.phase !== 'over') flash('wipe');
  // A title card covers the screen for about three seconds, so the phase's clock doesn't start until it clears.
  if (c?.title && s.deadline > Date.now()) { shiftTimes(s, 2600); stretchedFor += 2600; }
  if (c?.fx === 'confetti') setTimeout(confetti, 900);
  if (c?.flash) setTimeout(() => flash(c.flash), c.flashAt || 0);
  if (c?.fx === 'claws') setTimeout(clawMarks, 600);
  // The reaction beat: the villagers cheer, gasp or groan a moment after the reveal.
  const react = c?.react || (c?.fx === 'confetti' ? 'cheer' : c?.fx === 'claws' ? 'gasp' : c?.sound === 'lose' ? 'groan' : null);
  if (react && sfx.on) setTimeout(() => play(react), (c.wait || 600) + 250);
  sayTimer = setTimeout(() => say(maskLine(line, host.hidden)), c && sfx.on ? c.wait : 0);
}

function onMessage(m) {
  if (!m || typeof m !== 'object' || typeof m.pid !== 'string') return;
  const raw = String(m.name || '').slice(0, 60);
  if (m.t === 'hello') {
    if (kicked.has(m.pid)) return room.send({ t: 'view', to: m.pid, view: { phase: 'kicked' } });
    let p = host.players.find(x => x.pid === m.pid);
    const aud = host.audience.find(x => x.pid === m.pid);
    const pub = cleanPub(m.pub);
    const known = p || aud;
    // A hello for an existing player must carry that player's own key; anything else is someone else using their id.
    if (known?.pub && !samePub(known.pub, pub)) return;
    if (known && !known.pub && pub && !host.state) known.pub = pub;
    const others = [...host.players, ...host.audience].filter(x => x !== p && x !== aud).map(x => x.name);
    // Someone in the audience gets a seat as soon as there's room in the lobby.
    if (aud && !host.state && host.players.length < game().meta.max) {
      host.audience = host.audience.filter(x => x !== aud);
      host.players.push((p = aud));
      play('join');
    } else if (aud) { lastSent[aud.pid] = null; return changed(); }
    if (!p && host.state && game().addPlayer && host.state.phase !== 'over' && host.players.length < game().meta.max) {
      const { name, changed: fixedName } = settleName(raw, others);
      host.players.push((p = { pid: m.pid, name, asked: raw, fixed: fixedName, pub }));
      ensureFaces();
      game().addPlayer(host.state, { pid: p.pid, name });
      play('join'); say(`${name} jumps in!`);
      lastSent[p.pid] = null;
      return changed();
    }
    if (!p && (host.state || host.players.length >= game().meta.max)) {
      const { name, changed: fixedName } = settleName(raw, others);
      host.audience.push({ pid: m.pid, name, asked: raw, fixed: fixedName, pub });
      play('join');
      lastSent[m.pid] = null;
      return changed();
    }
    if (!p && !host.state && host.players.length < game().meta.max) {
      const { name, changed } = settleName(raw, others);
      host.players.push((p = { pid: m.pid, name, asked: raw, fixed: changed, pub }));
      play('join');
    } else if (p && !host.state && !p.locked && raw !== p.asked) {
      const { name, changed } = settleName(raw, others);
      Object.assign(p, { name, asked: raw, fixed: changed });
    }
    if (p) { lastSent[p.pid] = null; changed(); }
    else room.send({ t: 'view', to: m.pid, view: { phase: host.state ? 'spectate' : 'full' } });
  } else if (m.t === 'suggest') {
    // A player-written prompt, offered from the lobby. Three each, cleaned like any typed answer.
    const p = host.players.find(x => x.pid === m.pid);
    const text = cleanAct({ type: 'answer', text: String(m.text || '').slice(0, 70) }, host.settings.kids)?.text?.replace(/[<>{}\[\]\\`]/g, '').trim();
    if (p && !host.state && text && text.length > 5 && !isRude(text) && (host.custom = host.custom || []).filter(c => c.pid === m.pid).length < 3 && host.custom.length < 24) { host.custom.push({ pid: m.pid, text }); lastSent[m.pid] = null; changed(); }
  } else if (m.t === 'bye') {
    host.audience = host.audience.filter(x => x.pid !== m.pid);
    if (!host.state) host.players = host.players.filter(x => x.pid !== m.pid);
    changed();
  } else if (m.t === 'react' && REACTIONS.includes(m.e)) {
    const who = [...host.players, ...host.audience].find(x => x.pid === m.pid);
    const now = Date.now();
    if (!who || now - (lastReact[m.pid] || 0) < 700) return;
    lastReact[m.pid] = now;
    floatReaction(m.e, who.name);
  } else if (m.t === 'act') {
    const actor = host.players.find(p => p.pid === m.pid) || host.audience.find(p => p.pid === m.pid);
    if (!actor) return;
    if (actor?.pub && hostKeys) {
      // Encrypted action: decrypt, and ignore replays of old ones.
      if (!m.enc) return;
      sharedKey(hostKeys.priv, actor.pub).then(k => unseal(k, m.enc)).then(d => {
        if (!d || !(d.n > (lastActN[m.pid] || 0))) return;
        lastActN[m.pid] = d.n;
        handleAct(m.pid, d.a);
      }).catch(() => {});
      return;
    }
    handleAct(m.pid, m.a);
  }
}

function handleAct(pidFrom, rawAct) {
  const m = { pid: pidFrom, a: rawAct };
  if (rawAct?.type === '_host') { if (pidFrom === remotePid() && ['next', 'pause', 'start', 'again', 'lobby'].includes(rawAct.a)) hostAction(rawAct.a); return; }
  if (!host.state || host.paused) return;
  if (isAudience(pidFrom)) { if (game().audienceAct) { game().audienceAct(host.state, pidFrom, rawAct); changed(); } return; }
  {
    const a = cleanAct(m.a, host.settings.kids);
    const who = host.players.find(p => p.pid === m.pid);
    if (a?.type !== 'draft') for (const t of textsIn(a)) { recentTexts = [{ t, name: who?.name || '' }, ...recentTexts.filter(x => x.t.toLowerCase() !== t.toLowerCase())].slice(0, 30); }
    game().act(host.state, m.pid, a, Date.now());
    if (sfx.on && !['draft', 'dial', 'tap', 'flip', 'toss'].includes(a?.type) && Date.now() - lastLock > 150) { lastLock = Date.now(); play('lockin'); }
    changed();
  }
}
let lastLock = 0;

const lastReact = {};
function floatReaction(e, name) {
  const el = document.createElement('div');
  el.className = 'react';
  el.style.left = 8 + Math.random() * 84 + 'vw';
  el.innerHTML = `<span>${e}</span><small>${esc(name)}</small>`;
  document.body.append(el);
  setTimeout(() => el.remove(), 3200);
}

// Pausing: every clock time stored in the game (deadlines and the like) moves later by the time spent paused.
function shiftTimes(x, ms) {
  if (!x || typeof x !== 'object') return;
  for (const k of Object.keys(x)) {
    if (typeof x[k] === 'number' && x[k] > 1e12 && x[k] < 1e13) x[k] += ms;
    else if (typeof x[k] === 'object') shiftTimes(x[k], ms);
  }
}

// Full-screen punctuation for a moment: a red buzzer flash, a frost flash, a gold flash, or a screen shake.
function flash(kind) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (kind === 'shake') { app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake'); return setTimeout(() => app.classList.remove('shake'), 700); }
  if (kind === 'boom') flash('shake');
  const el = Object.assign(document.createElement('div'), { className: 'fxflash ' + kind });
  document.body.append(el); setTimeout(() => el.remove(), 1000);
}
// Anything a game marks with data-pop="key" punches in (with a sound) the first time that key shows up mid-phase.
const popped = new Set();
let lastPop = 0;
function pops(isFresh) {
  app.querySelectorAll('[data-pop]').forEach(el => {
    const k = host.gameId + ':' + el.dataset.pop;
    if (popped.has(k)) return;
    popped.add(k);
    if (isFresh && !el.dataset.always) return;
    el.classList.add('popin');
    if (sfx.on && Date.now() - lastPop > 120) { lastPop = Date.now(); play(el.dataset.snd || 'pop'); }
  });
}

// A first-game coach: the first time a room plays one of the trickier games, a tip sits on screen for each step.
function guideTip() {
  const g = game();
  if (!g.guide || !host.settings.howto || (host.played?.[host.gameId] || 0) > 1) return;
  const tip = g.guide(host.state);
  if (tip) app.querySelector('.panel')?.insertAdjacentHTML('beforeend', `<div class="guide"><b>💡 First game</b> ${esc(tip)}</div>`);
}

// Card games: when a pile or hand on the TV gains cards mid-phase (a hit, a draw, a card played), the new ones fly in.
let cardCounts = [];
function cardPops(isFresh) {
  const groups = [...new Set([...app.querySelectorAll('.pc')].map(c => c.parentElement))];
  const counts = groups.map(g => g.querySelectorAll(':scope > .pc').length);
  if (!isFresh && counts.length === cardCounts.length) groups.forEach((g, i) => { const kids = g.querySelectorAll(':scope > .pc'); for (let k = cardCounts[i]; k < counts[i]; k++) kids[k]?.classList.add('dealt'); });
  cardCounts = counts;
}
// Scoreboards re-sort with a slide: rows glide to their new places instead of jumping.
let rowAt = {};
function slideScores() {
  const next = {};
  app.querySelectorAll('.scores .srow').forEach(el => {
    const k = el.firstElementChild?.textContent || '', y = el.getBoundingClientRect().top;
    next[k] = y;
    const dy = rowAt[k] === undefined ? 0 : rowAt[k] - y;
    if (Math.abs(dy) > 4 && el.animate) { el.animate([{ transform: `translateY(${dy}px)`, background: dy > 0 ? '#3a8f6a66' : '#0000' }, { transform: 'none', background: '#0000' }], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1)' }); }
  });
  rowAt = next;
}
let introArt = false;   // the first title card of each game carries its cover art
let ceremonyOff = null;
// The winners' ceremony, shared by every game that ends with a score table: third, second, then a drumroll and first.
function ceremony() {
  const v = tvView();
  let list = Array.isArray(v.scores) && v.scores.length >= 2 && v.scores[0]?.name ? v.scores : null;
  if (!list && Array.isArray(v.teams) && typeof v.teams[0]?.score === 'number') list = [...v.teams].sort((a, b) => b.score - a.score);
  if (!list || matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  ceremonyOff?.();
  const el = document.createElement('div');
  el.className = 'ceremony';
  el.dataset.theme = THEME_OF[host.gameId] || '';
  const face = n => host.players.find(p => p.name === n)?.face;
  const val = p => { const k = ['score', 'chips', 'hearts', 'books'].find(x => typeof p[x] === 'number'); return k ? p[k].toLocaleString() : typeof p.burns === 'number' ? p.burns + ' 🔥' : ''; };
  const tie = list.length > 1 && val(list[0]) !== '' && val(list[0]) === val(list[1]);
  const top = list.slice(0, 3);
  el.innerHTML = `<h2>${tie ? "It's a tie!" : 'And the winner is…'}</h2><div class="cpods">${[1, 0, 2].filter(i => top[i]).map(i => { const f = face(top[i].name); return `<div class="cpod c${i + 1}"><i style="--pc:${f?.[1] || '#232a5c'}">${f?.[0] || '🏅'}</i><b>${esc(top[i].name)}</b><span>${val(top[i])}</span><em>${i + 1}</em></div>`; }).join('')}</div><p>Press any button to continue</p>`;
  document.body.append(el);
  // While the ceremony is up it swallows remote presses, so OK closes it instead of also pressing Play again underneath.
  const t0 = Date.now();
  const key = e => { e.preventDefault(); e.stopImmediatePropagation(); if (Date.now() - t0 > 4500) close(); };
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 500); removeEventListener('keydown', key, true); };
  el.onclick = close; addEventListener('keydown', key, true); ceremonyOff = () => { el.remove(); removeEventListener('keydown', key, true); ceremonyOff = null; };
  if (sfx.on) { setTimeout(() => play('pop'), 700); setTimeout(() => play('pop'), 1700); play('drumroll'); setTimeout(() => play('drumroll'), 1500); setTimeout(() => { play('fanfare'); play('cheer'); }, 3300); }
  setTimeout(() => { el.classList.add('first'); confetti(); }, 3300);
  setTimeout(close, 11000);
  return true;
}

// Tonight's tally: who won what, for the awards at the end of the night.
function countNight() {
  const s = host.state;
  if (!s || s.phase !== 'over' || host.counted) return;
  host.counted = true;
  const v = game().tvView(s, Date.now());
  const t = (host.tally = host.tally || { games: [], by: {} });
  const row = n => (t.by[n] = t.by[n] || { wins: 0, podiums: 0, games: 0, last: 0 });
  host.players.forEach(p => row(p.name).games++);
  let winners = [];
  const list = Array.isArray(v.scores) && v.scores[0]?.name ? v.scores : null;
  if (list && host.gameId !== 'imposter') {
    const key = ['score', 'chips', 'hearts', 'books', 'burns'].find(k => typeof list[0][k] === 'number');
    winners = key ? list.filter(p => p[key] === list[0][key]).map(p => p.name) : [list[0].name];
    list.slice(0, 3).forEach(p => row(p.name).podiums++);
    row(list[list.length - 1].name).last++;
  } else if (Array.isArray(v.teams) && typeof v.teams[0]?.score === 'number') {
    const top = Math.max(...v.teams.map(x => x.score));
    winners = v.teams.filter(x => x.score === top).flatMap(x => x.members || []);
  } else if (typeof v.winner === 'string' && host.players.some(p => p.name === v.winner)) winners = [v.winner];
  winners.forEach(n => { row(n).wins++; row(n).pts = (row(n).pts || 0) + 3; });
  if (list && host.gameId !== 'imposter') list.slice(0, 3).forEach((p, i) => { if (!winners.includes(p.name)) row(p.name).pts = (row(p.name).pts || 0) + (i === 1 ? 2 : 1); });
  t.games.push({ game: game().meta.name, winners });
  save();
}
function nightAwards() {
  const t = host.tally;
  if (!t?.games.length) return;
  const names = Object.keys(t.by), top = k => names.slice().sort((a, b) => (t.by[b].pts || 0) - (t.by[a].pts || 0) || t.by[b][k] - t.by[a][k])[0];
  const face = n => host.players.find(p => p.name === n)?.face;
  const awards = [];
  const champ = top('wins');
  if (t.by[champ].pts) awards.push(['🏆 Champion of the night', champ, `${t.by[champ].pts || 0} night points · ${t.by[champ].wins} win${t.by[champ].wins === 1 ? '' : 's'}`]);
  const pod = names.filter(n => n !== champ).sort((a, b) => t.by[b].podiums - t.by[a].podiums)[0];
  if (pod && t.by[pod].podiums) awards.push(['🥈 Always in the mix', pod, `${t.by[pod].podiums} top-three finish${t.by[pod].podiums === 1 ? "" : "es"}`]);
  const sport = names.filter(n => n !== champ && n !== pod).sort((a, b) => t.by[b].last - t.by[a].last || t.by[b].games - t.by[a].games)[0];
  if (sport) awards.push(['💛 Best sport', sport, `played ${t.by[sport].games} game${t.by[sport].games === 1 ? '' : 's'} and kept smiling`]);
  ceremonyOff?.();
  const el = document.createElement('div');
  el.className = 'ceremony first nightawards';
  el.innerHTML = `<h2>Tonight's awards</h2><div class="nawards">${awards.map(([title, n, note], i) => { const f = face(n); return `<div class="naward" style="animation-delay:${0.4 + i * 0.9}s"><small>${title}</small><i style="--pc:${f?.[1] || '#232a5c'}">${f?.[0] || '🏅'}</i><b>${esc(n)}</b><span>${esc(note)}</span></div>`; }).join('')}</div><div class="nlist">${t.games.map(g => `<span><b>${esc(g.game)}</b> ${g.winners.length ? esc(g.winners.join(' & ')) : '—'}</span>`).join('')}</div><p>Press any button to close</p>`;
  document.body.append(el);
  const t0 = Date.now();
  const key = e => { e.preventDefault(); e.stopImmediatePropagation(); if (Date.now() - t0 > 1500) close(); };
  const close = () => { el.remove(); removeEventListener('keydown', key, true); };
  el.onclick = close; addEventListener('keydown', key, true); ceremonyOff = () => { el.remove(); removeEventListener('keydown', key, true); ceremonyOff = null; };
  if (sfx.on) { play('fanfare'); setTimeout(() => play('cheer'), 600); }
  setTimeout(confetti, 500);
  say(awards.map(a => `${a[0].replace(/^\S+ /, '')}: ${a[1]}.`).join(' '));
}

function startGame() {
  host.paused = 0;
  // The audience gets promoted into open seats for the next game.
  while (host.audience.length && host.players.length < game().meta.max) host.players.push(host.audience.shift());
  const prev = host.state && host.state.game === host.gameId ? host.state : host.lastByGame?.[host.gameId];
  host.state = game().setup(host.players, Math.random, prev, { short: !!host.settings.short, ...(host.opts?.[host.gameId] || {}), custom: (host.custom || []).map(c => c.text) });
  if (host.gameId === 'funny') host.custom = [];
  introArt = true;
  lastEventId = 0; popped.clear(); gains = {}; places = {}; lastScore = {}; finalRound = false; finalSaid = false;
  host.played = { ...(host.played || {}), [host.gameId]: (host.played?.[host.gameId] || 0) + 1 }; host.counted = false;
  lastPhase = '';
  changed();
}

function hostAction(a) {
  if (a === 'start') return startGame();
  if (a === 'again') return startGame();
  if (a.startsWith('night:')) { const nt = NIGHTS.find(x => x.id === a.slice(6)); if (nt) { host.queue = nt.games.slice(1); host.night = nt.id; host.gameId = nt.games[0]; host.screen = 'gather'; save(); } return changed(); }
  if (a === 'endnight') { host.queue = []; host.night = null; save(); return render(); }
  if (a === 'lobby') { host.lastByGame = { ...(host.lastByGame || {}), [host.gameId]: host.state }; host.state = null; ceremonyOff?.(); if (host.queue?.length) { host.gameId = host.queue.shift(); host.screen = 'gather'; } else { host.night = null; host.screen = 'menu'; } stopAmbient(); document.body.classList.remove('day'); return changed(); }
  if (a === 'newcode') {
    // Same players again: tell every phone the new code so nobody has to rejoin by hand.
    const next = newCode(), keep = { settings: host.settings, tally: host.tally, played: host.played, opts: host.opts, lastByGame: host.lastByGame, shelf: host.shelf };
    try { room?.send({ t: 'move', code: next }); } catch {}
    host = { ...keep, code: next, players: [], audience: [], gameId: host.gameId, state: null };
    save(); return setTimeout(connect, 400);
  }
  if (a === 'voice') { voice.on = !voice.on; return render(); }
  if (a === 'testvoice') return say('Night falls on the village. Somewhere in the dark, the wolves are hungry.', true);
  if (a === 'relaxed') { host.settings.relaxed = !host.settings.relaxed; save(); return render(); }
  if (a === 'howto') { host.settings.howto = !host.settings.howto; save(); return render(); }
  if (a === 'pause' && host.state) {
    if (!host.paused) { host.paused = Date.now(); stopAmbient(); }
    else { const ms = Date.now() - host.paused; shiftTimes(host.state, ms); stretchedFor += ms; host.paused = 0; }
    save(); render(); return sendViews();
  }
  if (a.startsWith('opt:')) { const o = (game().meta.options || []).find(x => x.id === a.slice(4)); if (o) { const mine = (host.opts = host.opts || {})[host.gameId] = host.opts[host.gameId] || {}; const i = o.choices.findIndex(c => c[0] === (mine[o.id] ?? o.choices[0][0])); mine[o.id] = o.choices[(i + 1) % o.choices.length][0]; save(); } return render(); }
  if (a === 'endgame') { if (Date.now() - endArmed < 4000) { endArmed = 0; stopBed(); return hostAction('lobby'); } endArmed = Date.now(); setTimeout(render, 4100); return render(); }
  if (a === 'blurdraw') { host.blurDraw = !host.blurDraw; save(); return changed(); }
  if (a === 'remote') { host.settings.remote = host.settings.remote === false; save(); return changed(); }
  if (a === 'streamer') { host.settings.streamer = !host.settings.streamer; save(); return render(); }
  if (a === 'clearprompts') { host.custom = []; save(); return changed(); }
  if (a === 'menu' || a === 'settings') { host.screen = a; save(); return render(); }
  if (a === 'awards') return nightAwards();
  if (a === 'cleartally') { host.tally = null; save(); return render(); }
  if (a === 'music') { host.settings.music = !host.settings.music; if (!host.settings.music) stopBed(); save(); return render(); }
  if (a === 'short') { host.settings.short = !host.settings.short; save(); return render(); }
  if (a === 'kids') { host.settings.kids = !host.settings.kids; save(); return render(); }
  if (a === 'veto') { vetoOpen = !vetoOpen; return render(); }
  if (a.startsWith('hide:')) {
    const t = recentTexts[Number(a.slice(5))]?.t;
    if (t) host.hidden = host.hidden.some(h => h.toLowerCase() === t.toLowerCase()) ? host.hidden.filter(h => h.toLowerCase() !== t.toLowerCase()) : [...host.hidden, t];
    lastViewKey = ''; return changed();
  }
  if (a === 'sfx') { sfx.on = !sfx.on; if (sfx.on) play('join'); return render(); }
  if (a === 'addbot' && !host.state && host.players.length < game().meta.max) {
    const used = new Set(host.players.map(p => p.name));
    const name = BOT_NAMES.find(n => !used.has(n)) || 'Bot ' + (host.players.length + 1);
    host.players.push({ pid: 'bot-' + Math.random().toString(36).slice(2, 8), name, bot: true });
    return changed();
  }
  if (a.startsWith('edit:')) { editing = a.slice(5); return render(); }
  if (a === 'canceledit') { editing = null; return render(); }
  if (a === 'kick' && editing) {
    const p = host.players.find(x => x.pid === editing);
    if (p && !p.bot) { kicked.add(p.pid); room?.send({ t: 'view', to: p.pid, view: { phase: 'kicked' } }); }
    host.players = host.players.filter(x => x.pid !== editing);
    editing = null;
    return changed();
  }
  if ((a === 'rename' || a === 'randomname') && editing) {
    const p = host.players.find(x => x.pid === editing);
    if (!p) { editing = null; return render(); }
    const others = host.players.filter(x => x !== p).map(x => x.name);
    let n = a === 'randomname' ? funName(others) : cleanName(app.querySelector('#rename')?.value);
    if (!n) return;
    n = uniqueName(n, others);
    Object.assign(p, { name: n, locked: true, fixed: false });
    editing = null;
    lastSent[p.pid] = null;
    return changed();
  }
  if (a === 'clearbots' && !host.state) { host.players = host.players.filter(p => !p.bot); return changed(); }
  if (!host.state) return;
  game().hostAct(host.state, a, Date.now());
  changed();
}

const BOT_NAMES = ['Bot Ava', 'Bot Ben', 'Bot Cleo', 'Bot Dax', 'Bot Eli', 'Bot Fay', 'Bot Gus', 'Bot Hana', 'Bot Ivo', 'Bot Jo', 'Bot Kit', 'Bot Lu', 'Bot Max', 'Bot Nia', 'Bot Oz', 'Bot Pip'];

// Bots act a few seconds after a phase starts, at a human-ish pace.
let botWait = {};
function runBots() {
  const g = game();
  if (!host.state || !g.botAct) return;
  const now = Date.now();
  let acted = false;
  for (const p of host.players) {
    if (!p.bot) continue;
    const a = g.botAct(g.phoneView(host.state, p.pid));
    if (!a) { delete botWait[p.pid]; continue; }
    const key = host.state.phase + host.state.round;
    if (!botWait[p.pid] || botWait[p.pid].key !== key) botWait[p.pid] = { key, at: now + 2000 + Math.random() * 6000 };
    if (now >= botWait[p.pid].at) { g.act(host.state, p.pid, a, now); delete botWait[p.pid]; acted = true; }
  }
  if (acted) changed();
}

function qr(text) {
  try {
    const q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  } catch { return ''; }
}

const seen = new Set();
const kicked = new Set();
let editing = null;
// A glyph for each game in the menu.
const ICONS = { werewolf: '🐺', imposter: '🕵️', bluff: '🤥', whosaid: '💬', ducks: '🦆', trivia: '🧠', spin: '🎡', crowd: '📊', bingo: '🎱', quick: '⚡', ladder: '🪜', cases: '💼', funny: '😂', letters: '🔤', taboo: '🚫', agents: '🕶️', sketch: '✏️', meld: '🧿', bowl: '🥗', crew: '🤝', charades: '🎭', clash: '🃏', blackjack: '♠️', gofish: '🐟', bluffcards: '🎴', hearts: '♥️', shade: '🎨', estimate: '🎯', truths: '🤞', wordhunt: '🔎', midnight: '🌙', missions: '🗝️', dares: '😈', split: '✂️', doodle: '🖼️', memory: '🧩', copycat: '🐱', hunt: '🌈', freeze: '🧊', haunted: '👻', bomb: '💣', potato: '🥔', mystery: '💎', bracket: '🏆', faker: '🤫', meter: '📈', rebus: '🧩' };

// Each game lives in its own visual world: a color scheme, a background and a headline typeface. Games not listed keep the night village.
const THEME_OF = {};
Object.entries({
  comic: ['funny', 'bracket', 'split', 'dares', 'bluffcards'], paper: ['bluff', 'truths', 'whosaid', 'meter', 'letters'], sketch: ['sketch', 'doodle', 'shade'],
  kids: ['hunt', 'freeze', 'copycat', 'memory', 'ducks', 'potato', 'bingo', 'charades', 'gofish'], show: ['trivia', 'spin', 'crowd', 'ladder', 'cases', 'quick', 'estimate', 'rebus'],
  noir: ['imposter', 'faker', 'wordhunt', 'agents', 'missions', 'mystery', 'bomb'], teams: ['taboo', 'bowl', 'crew', 'meld'], felt: ['clash', 'blackjack', 'hearts'],
}).forEach(([t, ids]) => ids.forEach(id => (THEME_OF[id] = t)));
// Headlines arrive a word at a time.
function wordsIn() {
  app.querySelectorAll('.stage.enter .panel > h2, .stage.enter .panel > .cq').forEach(el => {
    if (el.children.length || el.textContent.length > 140) return;
    el.innerHTML = el.textContent.split(' ').map((w, i) => `<span class="wd" style="--i:${i}">${esc(w)}</span>`).join(' ');
  });
}

// The menu's live preview: bots really play the highlighted game, sped up, on a small stage.
let pv = null;
function previewGame(id) {
  if (!GAMES[id]) return;
  if (pv?.id !== id) pv = { id, s: null, now: Date.now(), stuck: 0, last: '', over: 0, players: ['Ava', 'Ben', 'Cleo', 'Dax', 'Eli', 'Fay'].slice(0, Math.max(GAMES[id].meta.min, Math.min(5, GAMES[id].meta.max))).map((n, i) => ({ pid: 'bot-pv' + i, name: n })) };
  const m = GAMES[id].meta, q = x => app.querySelector(x);
  const stageEl = q('.pvstage'); if (stageEl) { stageEl.dataset.theme = THEME_OF[id] || ''; stageEl.parentElement.dataset.theme = THEME_OF[id] || ''; }
  if (q('#pvname')) { q('#pvname').textContent = m.name; q('#pvicon').innerHTML = art(id, ICONS[id]); q('#pvblurb').textContent = m.blurb; q('#pvtags').innerHTML = `<span>👥 ${m.min}–${m.max} players</span>${m.kids ? '<span>🧒 Little kids</span>' : ''}${SHELVES.filter(f => f.games?.includes(id) && !['featured', 'kids'].includes(f.id)).slice(0, 2).map(f => `<span>${esc(f.name)}</span>`).join('')}`; }
  app.querySelectorAll('.mgame').forEach(b => b.classList.toggle('on', b.dataset.game === id));
  previewStep(true);
}
function previewStep(first) {
  const el = app.querySelector('.pvstage');
  if (!el || !pv || host.state) return;
  const G = GAMES[pv.id];
  try {
    if (!pv.s || pv.over > 4) { pv.s = G.setup(pv.players, Math.random, null, { short: true }); pv.over = 0; pv.now = Math.max(pv.now, Date.now()); }
    const s = pv.s;
    if (!first) {
      pv.now += 2600;
      if (s.phase === 'over') pv.over++;
      else {
        for (const p of pv.players) { if (Math.random() < 0.6) { const a = G.botAct?.(G.phoneView(s, p.pid, pv.now), Math.random); if (a) G.act(s, p.pid, a, pv.now, Math.random); } }
        G.tick?.(s, pv.now, Math.random);
        const k = s.phase + s.round + (s.eventId || '');
        pv.stuck = k === pv.last ? pv.stuck + 1 : 0; pv.last = k;
        if (pv.stuck > 5 && G.hostAct) { G.hostAct(s, 'next', pv.now, Math.random); pv.stuck = 0; }
      }
    }
    const was = ['day', 'night'].map(c => document.body.classList.contains(c));
    G.renderTV({ ...G.tvView(s, pv.now), fresh: false }, el);
    ['day', 'night'].forEach((c, i) => document.body.classList.toggle(c, was[i]));
    el.querySelectorAll('.how').forEach(h => h.remove());
  } catch (e) { el.innerHTML = `<div class="pvfall">${ICONS[pv.id] || '🎲'}</div>`; pv.s = null; }
  // Fit the whole game screen inside the box: lay it out at a fixed width, measure how tall it came out, and scale to fit both ways.
  const box = el.parentElement;
  el.style.transform = 'none'; el.style.width = '1040px'; el.style.height = 'auto';
  const h = Math.max(300, el.scrollHeight), k = Math.min(box.clientWidth / 1040, box.clientHeight / h);
  el.style.transform = `translate(${Math.max(0, (box.clientWidth - 1040 * k) / 2)}px, ${Math.max(0, (box.clientHeight - h * k) / 2)}px) scale(${k})`;
}
setInterval(() => previewStep(false), 900);

function renderLobby() {
  const g = game();
  const n = host.players.length;
  const need = Math.max(0, g.meta.min - n);
  const url = joinUrl();
  const screen = host.screen || 'menu';
  const nightbar = (() => { const nt = NIGHTS.find(x => x.id === host.night); return nt ? `<div class="nightbar"><b>${nt.icon} ${esc(nt.name)}</b><span>Now: <b>${esc(g.meta.name)}</b>${host.queue?.length ? ` · Then: ${host.queue.map(id => esc(GAMES[id].meta.name)).join(' → ')}` : ' · last game'}</span></div>` : ''; })();
  if (screen === 'menu') {
    const shelf = SHELVES.find(x => x.id === (host.shelf || 'featured'));
    const list = Object.values(GAMES).filter(m => !shelf?.games || shelf.games.includes(m.meta.id));
    if (!list.some(m => m.meta.id === host.gameId)) host.gameId = list[0].meta.id;
    app.innerHTML = `<div class="menu">
    <section class="panel mlist">
      <div class="shelves">${SHELVES.map(f => `<button class="shelf ${(host.shelf || 'featured') === f.id ? 'on' : ''}" data-shelf="${f.id}">${esc(f.name)}</button>`).join('')}</div>
      <div class="mgames">${list.map(m => `<button class="mgame ${m.meta.id === host.gameId ? 'on' : ''}" data-game="${m.meta.id}"><i>${ICONS[m.meta.id] || '🎲'}</i><b>${esc(m.meta.name)}</b>${m.meta.kids ? '<small>🧒</small>' : ''}</button>`).join('')}</div>
      <div class="mfoot"><button class="btn ghost small" data-host="settings">⚙ Settings</button><button class="btn ghost small" data-host="addbot">🤖 Add a bot</button>${host.tally?.games.length ? '<button class="btn ghost small" data-host="awards">🏆 Awards</button>' : ''}</div>
    </section>
    <section class="panel mprev">
      <div class="mhead"><span id="pvicon"></span><div><h2 id="pvname"></h2><p id="pvblurb"></p><div id="pvtags" class="pvtags"></div></div><div class="mroom">Room<b class="code mini">${host.code}</b><small>${n} in</small></div></div>
      <div class="pvbox"><div class="pvstage" inert aria-hidden="true"></div><span class="pvlabel">Preview · press OK to play</span></div>
      <div class="mnights"><span class="muted">Or a ready-made night:</span>${NIGHTS.map(x => `<button class="btn ghost small" data-host="night:${x.id}" title="${x.games.map(id => esc(GAMES[id].meta.name)).join(' → ')}">${x.icon} ${esc(x.name)}</button>`).join('')}</div>
    </section>
  </div>`;
    app.querySelectorAll('.mgame').forEach(b => { const go = () => { if (pv?.id !== b.dataset.game || !app.querySelector('.pvstage').firstChild) { if (pv && pv.id !== b.dataset.game && sfx.on) play('pop'); host.gameId = b.dataset.game; previewGame(b.dataset.game); } }; b.onfocus = go; b.onmouseenter = go; });
    previewGame(host.gameId);
    if (!app.contains(document.activeElement)) app.querySelector('.mgame.on')?.focus({ preventScroll: true });
    app.querySelector('.mgame.on')?.scrollIntoView({ block: 'nearest' });
    host.players.forEach(p => seen.add(p.pid));
    return;
  }
  if (screen === 'settings') {
    app.innerHTML = `<div class="lobby one"><section class="panel settings"><h2>Settings</h2>
      <div class="row">
        <button class="btn ghost" data-host="voice">Narrator: ${voice.on ? 'on' : 'off'}</button>
        <button class="btn ghost" data-host="sfx">Sound effects: ${sfx.on ? 'on' : 'off'}</button>
        <button class="btn ghost" data-host="newcode">New room</button>
      </div>
      <div class="row">
        <button class="btn ghost" data-host="relaxed">Relaxed timers: ${host.settings.relaxed ? 'on' : 'off'}</button>
        <button class="btn ghost" data-host="howto">How-to screens: ${host.settings.howto ? 'first time' : 'off'}</button>
        <button class="btn ghost" data-host="music">Music: ${host.settings.music ? 'on' : 'off'}</button>
        <button class="btn ghost" data-host="short">Game length: ${host.settings.short ? 'short' : 'full'}</button>
        <button class="btn ghost" data-host="remote">Phone remote: ${remotePid() ? esc(host.players.find(p => p.pid === remotePid()).name) : host.settings.remote === false ? 'off' : 'first to join'}</button>
        <button class="btn ghost" data-host="streamer">Room code: ${host.settings.streamer ? 'hidden' : 'shown'}</button>
        <button class="btn ghost" data-host="kids">Kids mode: ${host.settings.kids ? 'on' : 'off'}</button>
        <span class="muted">Relaxed gives everyone 50% more time.</span>
      </div>
      <div class="row">
        <label class="inline" for="vsel">Narrator voice</label>
        <select id="vsel">${voices().slice(0, 12).map(v => `<option ${v.name === voice.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('') || '<option>Default</option>'}</select>
        <button class="btn ghost" data-host="testvoice">Test voice</button>
      </div>
      <div class="row">
        <button class="btn ghost" data-host="addbot">Add a bot player</button>
        ${host.players.some(p => p.bot) ? '<button class="btn ghost" data-host="clearbots">Remove bots</button>' : ''}
        <span class="muted">Bots fill empty seats for testing. They play at random.</span>
      </div>
      <div class="row"><button class="btn" data-host="menu">← Back to games</button></div>
    </section></div>`;
    host.players.forEach(p => seen.add(p.pid));
    return;
  }
  app.innerHTML = `<div class="lobby gather">
    <section class="panel join">
      <h2>Join on your phone</h2>
      <p class="muted">Go to <b class="url">${esc(url.replace(/\?.*/, '').replace(/^https?:\/\//, ''))}</b><br>and enter room code</p>
      <div class="code">${host.code}</div>
      <p class="muted">or scan</p>
      <div class="qr">${qr(url)}</div>
    </section>
    <section class="panel">
      ${(() => {
        // Seats around the campfire: everyone who has joined, plus open seats waiting to be filled.
        const total = Math.max(n, Math.min(g.meta.max, 8));
        const seat = (i, inner, cls, attrs = '') => { const a = ((i + 0.5) / total) * Math.PI * 2 - Math.PI / 2; return `<${attrs ? 'button' : 'div'} class="seat ${cls}" ${attrs} style="left:${(50 + 42 * Math.cos(a)).toFixed(1)}%;top:${(52 + 35 * Math.sin(a)).toFixed(1)}%;--d:${(i * 0.37) % 2}s">${inner}</${attrs ? 'button' : 'div'}>`; };
        return `<div class="ring n${Math.min(total, 12)}"><div class="fireflies">${Array.from({ length: 14 }, (_, k) => `<i style="left:${(k * 37) % 100}%;top:${(k * 53) % 100}%;animation-delay:${-(k * 0.9)}s"></i>`).join('')}</div>
          <div class="ringmid">${art(host.gameId, ICONS[host.gameId])}<h2>${esc(g.meta.name)}</h2><p>${n ? `${n} player${n === 1 ? '' : 's'} in` : 'Grab a seat!'}${need ? ` · need ${need} more` : ''}</p><button class="btn" data-host="start" ${need ? 'disabled' : ''}>${need ? 'Waiting…' : "Everybody's in!"}</button></div>
          ${Array.from({ length: total }, (_, i) => { const p = host.players[i]; return p
            ? seat(i, `<i style="--pc:${p.face?.[1] || '#232a5c'}">${p.face?.[0] || '🙂'}</i><b>${esc(p.name)}</b>${i === 0 ? '<em>👑</em>' : ''}`, `taken ${p.bot ? 'bot' : ''} ${seen.has(p.pid) ? '' : 'pop'} ${editing === p.pid ? 'on' : ''}`, `data-host="edit:${esc(p.pid)}" title="Rename or remove"`)
            : seat(i, '<i>Join!</i>', 'open'); }).join('')}</div>`;
      })()}
      <div class="row gfoot"><button class="btn ghost small" data-host="menu">← Games</button><button class="btn ghost small" data-host="addbot">🤖 Add a bot</button>${host.players.some(p => p.bot) ? '<button class="btn ghost small" data-host="clearbots">Remove bots</button>' : ''}<span class="muted small">Tap a seat to rename or remove.</span></div>
      ${g.meta.options?.length ? `<div class="row gameopts"><span class="muted">${esc(g.meta.name)} options</span>${g.meta.options.map(o => { const cur = host.opts?.[host.gameId]?.[o.id] ?? o.choices[0][0]; return `<button class="btn ghost" data-host="opt:${o.id}">${esc(o.name)}: ${esc((o.choices.find(c => c[0] === cur) || o.choices[0])[1])}</button>`; }).join('')}</div>` : ''}
      ${host.gameId === 'funny' ? `<p class="muted">✍️ Players can add their own prompts from their phones: <b>${(host.custom || []).length}</b> added.${(host.custom || []).length ? ' <button class="btn ghost small" data-host="clearprompts">Clear</button>' : ''}</p>` : ''}
      ${host.audience.length ? `<p class="muted">Audience (${host.audience.length}): ${host.audience.map(a => esc(a.name)).join(', ')}. They join automatically when a seat opens.</p>` : ''}
      ${(() => { const p = host.players.find(x => x.pid === editing); return p ? `<div class="editbox"><label for="rename">Rename ${esc(p.name)}</label><div class="row"><input id="rename" maxlength="${MAX_NAME}" value="${esc(p.name)}" autocomplete="off"><button class="btn" data-host="rename">Save</button><button class="btn ghost" data-host="randomname">Random name</button><button class="btn ghost" data-host="kick">Remove player</button><button class="btn ghost" data-host="canceledit">Cancel</button></div></div>` : ''; })()}
      ${nightbar}
      ${host.tally?.games.length ? `<div class="nightbar tonight"><b>Tonight</b><span>${Object.entries(host.tally.by).filter(e => e[1].pts).sort((a, b) => b[1].pts - a[1].pts).slice(0, 6).map(([n, r]) => `${esc(n)} <b>${r.pts}</b>`).join(' · ') || `${host.tally.games.length} game${host.tally.games.length === 1 ? '' : 's'} played`}</span><button class="btn ghost small" data-host="awards">Tonight's awards</button><button class="btn ghost small" data-host="cleartally">Reset</button></div>` : ''}
    </section>
  </div>`;
  host.players.forEach(p => seen.add(p.pid));
}

function render() {
  if (!host.state) renderLobby();
  else { const v = tvView(); lastViewKey = viewKey(v); v.fresh = fresh; game().renderTV(v, app); if (fresh) wordsIn(); decorate(); pops(fresh); guideTip(); slideScores(); cardPops(fresh); }
  document.body.classList.toggle('night', host.state?.phase === 'night');
  // How-to screens show in full the first time a room plays a game, then get out of the way.
  quiet.on = !host.state;
  document.body.dataset.theme = host.state ? THEME_OF[host.gameId] || '' : '';
  document.body.dataset.game = host.state ? host.gameId : '';
  document.body.classList.toggle('inlobby', !host.state);
  document.body.classList.toggle('streamer', !!host.settings.streamer);
  document.body.classList.toggle('nodraw', !!host.blurDraw);
  document.body.classList.toggle('nohow', !host.settings.howto || (host.played?.[host.gameId] || 0) > 1);
  const badge = document.getElementById('aud') || Object.assign(document.createElement('div'), { id: 'aud' });
  if (!badge.isConnected) document.body.append(badge);
  badge.hidden = !host.audience.length;
  badge.textContent = `👥 ${host.audience.length} watching`;
  let vb = document.getElementById('vetobar');
  if (!vb) { vb = Object.assign(document.createElement('div'), { id: 'vetobar' }); document.body.append(vb); }
  vb.hidden = !host.state;
  host.hidden = host.hidden || [];
  const isHidden = t => host.hidden.some(h => h.toLowerCase() === t.toLowerCase());
  vb.innerHTML = vetoOpen && host.state ? `<div class="vetopanel"><h3>Hide an answer</h3><p class="muted small">Tap anything players typed to hide it from the TV, phones and narrator. Tap again to show it.</p><div class="vetolist">${recentTexts.map((x, i) => `<button class="btn ghost ${isHidden(x.t) ? 'on' : ''}" data-host="hide:${i}">${isHidden(x.t) ? '🙈 ' : ''}${esc(x.t)} <small class="muted">${esc(x.name)}</small></button>`).join('') || '<p class="muted">Nothing typed yet.</p>'}</div><button class="btn" data-host="veto">Done</button></div>` : `<button class="btn ghost vetobtn" data-host="pause">${host.paused ? '▶ Resume' : '⏸ Pause'}</button><button class="btn ghost vetobtn" data-host="veto">🙈 Hide an answer</button>${host.paused ? '<div class="pausecover"><b>Paused</b><span>Press Resume when everyone is back</span></div>' : ''}`;
  vetoExtras();
  vb.querySelectorAll('[data-host]').forEach(b => (b.onclick = () => hostAction(b.dataset.host)));
  app.querySelectorAll('[data-host]').forEach(b => (b.onclick = () => hostAction(b.dataset.host)));
  const vsel = app.querySelector('#vsel');
  if (vsel) vsel.onchange = () => { voice.name = vsel.value; say('Good evening, villagers.', true); };
  app.querySelectorAll('[data-game]').forEach(b => (b.onclick = () => { host.gameId = b.dataset.game; host.screen = 'gather'; host.queue = []; host.night = null; if (sfx.on) play('lockin'); flash('wipe'); changed(); }));
  app.querySelectorAll('[data-shelf]').forEach(b => (b.onclick = () => { host.shelf = b.dataset.shelf; save(); render(); }));
  autofocus(app);
}

async function connect() {
  room?.close();
  lastSent = {};
  render();
  room = await openRoom(host.code, onMessage, s => {
    statusEl.textContent = s === 'live' ? `Room ${host.code} · connected` : s === 'connecting' ? 'Connecting…' : 'Connection lost, retrying…';
    statusEl.dataset.s = s;
    if (s === 'live') sendViews(true);
  });
}

// A living backdrop behind every game: slow drifting shapes, tinted per game, so the screen is never still.
const backdrop = Object.assign(document.createElement('div'), { id: 'backdrop' });
backdrop.innerHTML = Array.from({ length: 16 }, (_, i) => `<i class="b${i % 4}" style="left:${(i * 61) % 100}%;--s:${40 + ((i * 37) % 90)}px;--t:${18 + ((i * 7) % 16)}s;animation-delay:${-(i * 2.3)}s"></i>`).join('');
document.body.prepend(backdrop);
function tintBackdrop() {
  let h = 0; for (const ch of host.gameId || '') h = (h * 31 + ch.charCodeAt(0)) % 360;
  backdrop.style.setProperty('--hue', host.state ? h : 45);
  backdrop.classList.toggle('busy', !!host.state);
}
setInterval(tintBackdrop, 1500);

// One shared countdown bar across the top of the TV for every game, plus thinking music while a timer runs.
const tbar = Object.assign(document.createElement('div'), { id: 'tbar' });
tbar.innerHTML = '<span></span>';
document.body.append(tbar);
let barFor = 0, barTotal = 1;
const OWN_AUDIO = ['freeze', 'copycat'], SECRET = ['potato', 'freeze'];
function timerBar() {
  const s = host.state, now = Date.now();
  const vbar = document.getElementById('vetobar'); if (vbar) vbar.style.display = s ? '' : 'none';
  vetoExtras();
  // Only timers the game itself shows on screen: a hidden fuse (Hot Potato, Freeze Dance) must stay hidden.
  const live = s && !host.paused && s.phase !== 'over' && s.deadline > now && !SECRET.includes(host.gameId) && !!app.querySelector('.clock');
  tbar.hidden = !live;
  if (!live) { barFor = 0; stopBed(); return; }
  if (s.deadline !== barFor) { barFor = s.deadline; barTotal = Math.max(1000, s.deadline - now); tbar.firstChild.style.transition = 'none'; tbar.firstChild.style.width = '100%'; void tbar.offsetWidth; }
  const left = s.deadline - now;
  tbar.firstChild.style.transition = 'width 1s linear';
  tbar.firstChild.style.width = Math.max(0, (100 * (left - 1000)) / barTotal) + '%';
  tbar.classList.toggle('hurry', left <= 10000);
  if (host.settings.music && sfx.on && !OWN_AUDIO.includes(host.gameId) && barTotal >= 12000) startBed(left <= 10000 ? 'hurry' : 'think'); else stopBed();
}
setInterval(timerBar, 1000);

setInterval(() => {
  if (!host.state || host.paused) return;
  runBots();
  const before = JSON.stringify(host.state);
  game().tick(host.state, Date.now());
  if (JSON.stringify(host.state) !== before) return changed();
  stretch();
  // Some views change with time alone (e.g. an animation finishing): redraw only when the view itself changes.
  if (viewKey(tvView()) !== lastViewKey) render();
  sendViews();
  if (host.state.deadline) {
    const clock = app.querySelector('.clock');
    const left = Math.max(0, Math.ceil((host.state.deadline - Date.now()) / 1000));
    if (clock) {
      clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      clock.classList.toggle('hurry', left <= 10);
      if (left <= 10 && left > 0) play('tick');
      if (left === 30) say('Thirty seconds left.');
    }
  }
}, 1000);

try { speechSynthesis.addEventListener('voiceschanged', () => { if (!host.state) render(); }); } catch {}

if (host.state) lastPhase = host.state.phase + host.state.round;
connect();
