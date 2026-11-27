// TV / host page: owns the room, the player list and the game state.
import { GAMES, COMING_SOON, SHELVES, NIGHTS } from './games/index.js';
import { openRoom } from './net.js';
import { esc, store, newCode, say, voice, voices, enableDpad, autofocus, drawScene, titleCard, confetti, clawMarks } from './ui.js';
import { play, sfx, startAmbient, stopAmbient } from './sfx.js';
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
host.settings = { relaxed: false, howto: true, kids: false, ...(host.settings || {}) };
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
    return { phase: 'audience', me: me.name, game: game().meta.name, playing: !!host.state, players: host.players.map(p => p.name), reactions: REACTIONS };
  }
  if (!host.state) {
    const me = host.players.find(p => p.pid === pid) || {};
    return { phase: 'lobby', players: host.players.map(p => p.name), game: game().meta.name, me: me.name, fixed: !!me.fixed, byHost: !!me.locked, _me: me.face };
  }
  return { ...maskView(game().phoneView(host.state, pid), host.hidden), game: host.gameId, _me: host.players.find(p => p.pid === pid)?.face, ...(host.paused ? { _paused: true } : {}) };
}

function sendViews(force) {
  if (!room) return;
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
    if (key !== lastPhase) { lastPhase = key; fresh = true; announce(); }
    const ce = game().cueEvent?.(host.state);
    if (ce && ce.id !== lastEventId) {
      lastEventId = ce.id;
      setTimeout(() => { if (sfx.on) play(ce.sound); if (ce.say) say(maskLine(ce.say, host.hidden)); }, ce.delay || 0);
    }
  }
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
  if (c?.title) titleCard(c.title, c.sub, c.tone);
  if (c?.fx === 'confetti') setTimeout(confetti, 900);
  if (c?.fx === 'claws') setTimeout(clawMarks, 600);
  const line = g.narration(s);
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
  } else if (m.t === 'act' && host.state) {
    const actor = host.players.find(p => p.pid === m.pid);
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
  if (!host.state || host.paused) return;
  {
    const a = cleanAct(m.a, host.settings.kids);
    const who = host.players.find(p => p.pid === m.pid);
    if (a?.type !== 'draft') for (const t of textsIn(a)) { recentTexts = [{ t, name: who?.name || '' }, ...recentTexts.filter(x => x.t.toLowerCase() !== t.toLowerCase())].slice(0, 30); }
    game().act(host.state, m.pid, a, Date.now());
    changed();
  }
}

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

function startGame() {
  host.paused = 0;
  // The audience gets promoted into open seats for the next game.
  while (host.audience.length && host.players.length < game().meta.max) host.players.push(host.audience.shift());
  const prev = host.state && host.state.game === host.gameId ? host.state : host.lastByGame?.[host.gameId];
  host.state = game().setup(host.players, Math.random, prev);
  lastEventId = 0;
  lastPhase = '';
  changed();
}

function hostAction(a) {
  if (a === 'start') return startGame();
  if (a === 'again') return startGame();
  if (a.startsWith('night:')) { const nt = NIGHTS.find(x => x.id === a.slice(6)); if (nt) { host.queue = nt.games.slice(1); host.night = nt.id; host.gameId = nt.games[0]; host.shelf = 'all'; save(); } return changed(); }
  if (a === 'endnight') { host.queue = []; host.night = null; save(); return render(); }
  if (a === 'lobby') { host.lastByGame = { ...(host.lastByGame || {}), [host.gameId]: host.state }; host.state = null; if (host.queue?.length) host.gameId = host.queue.shift(); else host.night = null; stopAmbient(); document.body.classList.remove('day'); return changed(); }
  if (a === 'newcode') { host = { code: newCode(), players: [], gameId: host.gameId, state: null }; save(); return connect(); }
  if (a === 'voice') { voice.on = !voice.on; return render(); }
  if (a === 'testvoice') return say('Night falls on the village. Somewhere in the dark, the wolves are hungry.', true);
  if (a === 'relaxed') { host.settings.relaxed = !host.settings.relaxed; save(); return render(); }
  if (a === 'howto') { host.settings.howto = !host.settings.howto; save(); return render(); }
  if (a === 'pause' && host.state) {
    if (!host.paused) { host.paused = Date.now(); stopAmbient(); }
    else { const ms = Date.now() - host.paused; shiftTimes(host.state, ms); stretchedFor += ms; host.paused = 0; }
    save(); render(); return sendViews();
  }
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
function renderLobby() {
  const g = game();
  const n = host.players.length;
  const need = Math.max(0, g.meta.min - n);
  const url = joinUrl();
  app.innerHTML = `<div class="lobby">
    <section class="panel join">
      <h2>Join on your phone</h2>
      <div class="qr">${qr(url)}</div>
      <p class="muted">Scan the code, or go to<br><b class="url">${esc(url.replace(/\?.*/, ''))}</b><br>and enter</p>
      <div class="code">${host.code}</div>
    </section>
    <section class="panel">
      <h2>${n ? `${n} player${n === 1 ? '' : 's'} in` : 'Waiting for players'}</h2>
      <div class="roster">${host.players.map(p => `<button class="chip ${p.bot ? 'bot' : ''} ${seen.has(p.pid) ? '' : 'pop'} ${editing === p.pid ? 'on' : ''}" data-host="edit:${esc(p.pid)}" title="Rename or remove" style="--rc:${p.face?.[1] || ''}"><i class="pface" style="--pc:${p.face?.[1] || ''}">${p.face?.[0] || ''}</i>${esc(p.name)}</button>`).join('') || '<p class="muted">Names appear here as phones join.</p>'}</div>
      ${host.players.length ? '<p class="muted small">Select a name to rename or remove that player.</p>' : ''}
      ${host.audience.length ? `<p class="muted">Audience (${host.audience.length}): ${host.audience.map(a => esc(a.name)).join(', ')}. They join automatically when a seat opens.</p>` : ''}
      ${(() => { const p = host.players.find(x => x.pid === editing); return p ? `<div class="editbox"><label for="rename">Rename ${esc(p.name)}</label><div class="row"><input id="rename" maxlength="${MAX_NAME}" value="${esc(p.name)}" autocomplete="off"><button class="btn" data-host="rename">Save</button><button class="btn ghost" data-host="randomname">Random name</button><button class="btn ghost" data-host="kick">Remove player</button><button class="btn ghost" data-host="canceledit">Cancel</button></div></div>` : ''; })()}
      ${(() => { const nt = NIGHTS.find(x => x.id === host.night); return nt ? `<div class="nightbar"><b>${nt.icon} ${esc(nt.name)}</b><span>Now: <b>${esc(g.meta.name)}</b>${host.queue?.length ? ` · Then: ${host.queue.map(id => esc(GAMES[id].meta.name)).join(' → ')}` : ' · last game'}</span><button class="btn ghost small" data-host="endnight">Pick games myself</button></div>` : `<h3>Start a game night</h3><div class="nights">${NIGHTS.map(x => `<button class="night" data-host="night:${x.id}"><span>${x.icon}</span><b>${esc(x.name)}</b><small>${esc(x.blurb)}</small><small>${x.games.map(id => esc(GAMES[id].meta.name)).join(' → ')}</small></button>`).join('')}</div>`; })()}
      <h3>${host.night ? 'Game' : 'Or pick a game'}</h3>
      <div class="games">
        <div class="shelves">${SHELVES.map(f => `<button class="shelf ${(host.shelf || 'featured') === f.id ? 'on' : ''}" data-shelf="${f.id}">${esc(f.name)}</button>`).join('')}</div>
        ${Object.values(GAMES).filter(m => { const f = SHELVES.find(x => x.id === (host.shelf || 'featured')); return !f?.games || f.games.includes(m.meta.id); }).map(m => `<button class="game ${m.meta.id === host.gameId ? 'on' : ''}" data-game="${m.meta.id}">${m.meta.kids ? '<span class="kidbadge">👶 Little kids</span>' : ''}<b>${esc(m.meta.name)}</b><span>${esc(m.meta.blurb)}</span><small>${m.meta.min}–${m.meta.max} players</small></button>`).join('')}
        ${COMING_SOON.map(c => `<div class="game soon"><b>${esc(c.name)}</b><span>${esc(c.blurb)}</span><small>Coming soon</small></div>`).join('')}
      </div>
      <div class="row">
        <button class="btn" data-host="start" ${need ? 'disabled' : ''}>${need ? `Need ${need} more player${need === 1 ? '' : 's'}` : `Start ${esc(g.meta.name)}`}</button>
        <button class="btn ghost" data-host="voice">Narrator: ${voice.on ? 'on' : 'off'}</button>
        <button class="btn ghost" data-host="sfx">Sound effects: ${sfx.on ? 'on' : 'off'}</button>
        <button class="btn ghost" data-host="newcode">New room</button>
      </div>
      <div class="row">
        <button class="btn ghost" data-host="relaxed">Relaxed timers: ${host.settings.relaxed ? 'on' : 'off'}</button>
        <button class="btn ghost" data-host="howto">How-to screens: ${host.settings.howto ? 'on' : 'off'}</button>
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
    </section>
  </div>`;
  host.players.forEach(p => seen.add(p.pid));
}

function render() {
  if (!host.state) renderLobby();
  else { const v = tvView(); lastViewKey = viewKey(v); v.fresh = fresh; game().renderTV(v, app); decorate(); }
  document.body.classList.toggle('night', host.state?.phase === 'night');
  document.body.classList.toggle('nohow', !host.settings.howto);
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
  vb.querySelectorAll('[data-host]').forEach(b => (b.onclick = () => hostAction(b.dataset.host)));
  app.querySelectorAll('[data-host]').forEach(b => (b.onclick = () => hostAction(b.dataset.host)));
  const vsel = app.querySelector('#vsel');
  if (vsel) vsel.onchange = () => { voice.name = vsel.value; say('Good evening, villagers.', true); };
  app.querySelectorAll('[data-game]').forEach(b => (b.onclick = () => { host.gameId = b.dataset.game; changed(); }));
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
