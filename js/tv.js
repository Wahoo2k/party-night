// TV / host page: owns the room, the player list and the game state.
import { GAMES, COMING_SOON } from './games/index.js';
import { openRoom } from './net.js';
import { esc, store, newCode, say, voice, voices, enableDpad, autofocus, drawScene, titleCard, confetti, clawMarks } from './ui.js';
import { play, sfx, startAmbient, stopAmbient } from './sfx.js';
import { settleName, cleanName, isRude, uniqueName, funName, MAX_NAME } from './names.js';

const app = document.getElementById('app');
const statusEl = document.getElementById('status');
drawScene(document.getElementById('sky'));
enableDpad();

// Saved so a TV refresh doesn't lose the game.
let host = store.get('pg-host') || { code: newCode(), players: [], gameId: 'werewolf', state: null };
host.audience = host.audience || [];
host.settings = { relaxed: false, howto: true, ...(host.settings || {}) };
let room = null;
let lastSent = {};
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

const REACTIONS = ['👏', '😂', '😱', '🔥', '❤️', '👎'];
const isAudience = pid => host.audience.some(a => a.pid === pid);
function viewFor(pid) {
  if (isAudience(pid)) {
    const me = host.audience.find(a => a.pid === pid);
    return { phase: 'audience', me: me.name, game: game().meta.name, playing: !!host.state, players: host.players.map(p => p.name), reactions: REACTIONS };
  }
  if (!host.state) {
    const me = host.players.find(p => p.pid === pid) || {};
    return { phase: 'lobby', players: host.players.map(p => p.name), game: game().meta.name, me: me.name, fixed: !!me.fixed, byHost: !!me.locked };
  }
  return { ...game().phoneView(host.state, pid), game: host.gameId };
}

function sendViews(force) {
  if (!room) return;
  for (const p of [...host.players, ...host.audience]) {
    if (p.bot) continue;
    const v = JSON.stringify(viewFor(p.pid));
    if (force || lastSent[p.pid] !== v) {
      lastSent[p.pid] = v;
      room.send({ t: 'view', to: p.pid, view: JSON.parse(v) });
    }
  }
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
  stretch();
  save();
  if (host.state) {
    const key = host.state.phase + host.state.round;
    if (key !== lastPhase) { lastPhase = key; fresh = true; announce(); }
    const ce = game().cueEvent?.(host.state);
    if (ce && ce.id !== lastEventId) {
      lastEventId = ce.id;
      setTimeout(() => { if (sfx.on) play(ce.sound); if (ce.say) say(ce.say); }, ce.delay || 0);
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
  sayTimer = setTimeout(() => say(line), c && sfx.on ? c.wait : 0);
}

function onMessage(m) {
  if (!m || typeof m !== 'object' || typeof m.pid !== 'string') return;
  const raw = String(m.name || '').slice(0, 60);
  if (m.t === 'hello') {
    if (kicked.has(m.pid)) return room.send({ t: 'view', to: m.pid, view: { phase: 'kicked' } });
    let p = host.players.find(x => x.pid === m.pid);
    const aud = host.audience.find(x => x.pid === m.pid);
    const others = [...host.players, ...host.audience].filter(x => x !== p && x !== aud).map(x => x.name);
    // Someone in the audience gets a seat as soon as there's room in the lobby.
    if (aud && !host.state && host.players.length < game().meta.max) {
      host.audience = host.audience.filter(x => x !== aud);
      host.players.push((p = aud));
      play('join');
    } else if (aud) { lastSent[aud.pid] = null; return changed(); }
    if (!p && (host.state || host.players.length >= game().meta.max)) {
      const { name, changed: fixedName } = settleName(raw, others);
      host.audience.push({ pid: m.pid, name, asked: raw, fixed: fixedName });
      play('join');
      lastSent[m.pid] = null;
      return changed();
    }
    if (!p && !host.state && host.players.length < game().meta.max) {
      const { name, changed } = settleName(raw, others);
      host.players.push((p = { pid: m.pid, name, asked: raw, fixed: changed }));
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
    game().act(host.state, m.pid, m.a, Date.now());
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

function startGame() {
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
  if (a === 'lobby') { host.lastByGame = { ...(host.lastByGame || {}), [host.gameId]: host.state }; host.state = null; stopAmbient(); document.body.classList.remove('day'); return changed(); }
  if (a === 'newcode') { host = { code: newCode(), players: [], gameId: host.gameId, state: null }; save(); return connect(); }
  if (a === 'voice') { voice.on = !voice.on; return render(); }
  if (a === 'testvoice') return say('Night falls on the village. Somewhere in the dark, the wolves are hungry.', true);
  if (a === 'relaxed') { host.settings.relaxed = !host.settings.relaxed; save(); return render(); }
  if (a === 'howto') { host.settings.howto = !host.settings.howto; save(); return render(); }
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
      <div class="roster">${host.players.map(p => `<button class="chip ${p.bot ? 'bot' : ''} ${seen.has(p.pid) ? '' : 'pop'} ${editing === p.pid ? 'on' : ''}" data-host="edit:${esc(p.pid)}" title="Rename or remove">${esc(p.name)}</button>`).join('') || '<p class="muted">Names appear here as phones join.</p>'}</div>
      ${host.players.length ? '<p class="muted small">Select a name to rename or remove that player.</p>' : ''}
      ${host.audience.length ? `<p class="muted">Audience (${host.audience.length}): ${host.audience.map(a => esc(a.name)).join(', ')}. They join automatically when a seat opens.</p>` : ''}
      ${(() => { const p = host.players.find(x => x.pid === editing); return p ? `<div class="editbox"><label for="rename">Rename ${esc(p.name)}</label><div class="row"><input id="rename" maxlength="${MAX_NAME}" value="${esc(p.name)}" autocomplete="off"><button class="btn" data-host="rename">Save</button><button class="btn ghost" data-host="randomname">Random name</button><button class="btn ghost" data-host="kick">Remove player</button><button class="btn ghost" data-host="canceledit">Cancel</button></div></div>` : ''; })()}
      <h3>Game</h3>
      <div class="games">
        ${Object.values(GAMES).map(m => `<button class="game ${m.meta.id === host.gameId ? 'on' : ''}" data-game="${m.meta.id}"><b>${esc(m.meta.name)}</b><span>${esc(m.meta.blurb)}</span><small>${m.meta.min}–${m.meta.max} players</small></button>`).join('')}
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
  else { const v = game().tvView(host.state, Date.now()); lastViewKey = viewKey(v); v.fresh = fresh; game().renderTV(v, app); }
  document.body.classList.toggle('night', host.state?.phase === 'night');
  document.body.classList.toggle('nohow', !host.settings.howto);
  const badge = document.getElementById('aud') || Object.assign(document.createElement('div'), { id: 'aud' });
  if (!badge.isConnected) document.body.append(badge);
  badge.hidden = !host.audience.length;
  badge.textContent = `👥 ${host.audience.length} watching`;
  app.querySelectorAll('[data-host]').forEach(b => (b.onclick = () => hostAction(b.dataset.host)));
  const vsel = app.querySelector('#vsel');
  if (vsel) vsel.onchange = () => { voice.name = vsel.value; say('Good evening, villagers.', true); };
  app.querySelectorAll('[data-game]').forEach(b => (b.onclick = () => { host.gameId = b.dataset.game; changed(); }));
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
  if (!host.state) return;
  runBots();
  const before = JSON.stringify(host.state);
  game().tick(host.state, Date.now());
  if (JSON.stringify(host.state) !== before) return changed();
  stretch();
  // Some views change with time alone (e.g. an animation finishing): redraw only when the view itself changes.
  if (viewKey(game().tvView(host.state, Date.now())) !== lastViewKey) render();
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
