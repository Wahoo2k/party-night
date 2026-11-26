// TV / host page: owns the room, the player list and the game state.
import { GAMES, COMING_SOON } from './games/index.js';
import { openRoom } from './net.js';
import { esc, store, newCode, say, voice, enableDpad, autofocus, drawScene } from './ui.js';

const app = document.getElementById('app');
const statusEl = document.getElementById('status');
drawScene(document.getElementById('sky'));
enableDpad();

// Saved so a TV refresh doesn't lose the game.
let host = store.get('pg-host') || { code: newCode(), players: [], gameId: 'werewolf', state: null };
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

function viewFor(pid) {
  if (!host.state) return { phase: 'lobby', players: host.players.map(p => p.name), game: game().meta.name, me: (host.players.find(p => p.pid === pid) || {}).name };
  return game().phoneView(host.state, pid);
}

function sendViews(force) {
  if (!room) return;
  for (const p of host.players) {
    const v = JSON.stringify(viewFor(p.pid));
    if (force || lastSent[p.pid] !== v) {
      lastSent[p.pid] = v;
      room.send({ t: 'view', to: p.pid, view: JSON.parse(v) });
    }
  }
}

function changed() {
  save();
  if (host.state) {
    const key = host.state.phase + host.state.round;
    if (key !== lastPhase) { lastPhase = key; say(game().narration(host.state)); }
  }
  render();
  sendViews();
}

function onMessage(m) {
  if (!m || typeof m !== 'object' || typeof m.pid !== 'string') return;
  const name = String(m.name || '').trim().slice(0, 20);
  if (m.t === 'hello') {
    let p = host.players.find(x => x.pid === m.pid);
    if (!p && !host.state && name && host.players.length < game().meta.max) host.players.push((p = { pid: m.pid, name }));
    else if (p && name && !host.state) p.name = name;
    if (p) { lastSent[p.pid] = null; changed(); }
    else room.send({ t: 'view', to: m.pid, view: { phase: host.state ? 'spectate' : 'full' } });
  } else if (m.t === 'bye' && !host.state) {
    host.players = host.players.filter(x => x.pid !== m.pid);
    changed();
  } else if (m.t === 'act' && host.state) {
    game().act(host.state, m.pid, m.a, Date.now());
    changed();
  }
}

function startGame() {
  host.state = game().setup(host.players);
  lastPhase = '';
  changed();
}

function hostAction(a) {
  if (a === 'start') return startGame();
  if (a === 'again') return startGame();
  if (a === 'lobby') { host.state = null; document.body.classList.remove('day'); return changed(); }
  if (a === 'newcode') { host = { code: newCode(), players: [], gameId: host.gameId, state: null }; save(); return connect(); }
  if (a === 'voice') { voice.on = !voice.on; return render(); }
  if (!host.state) return;
  game().hostAct(host.state, a, Date.now());
  changed();
}

function qr(text) {
  try {
    const q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  } catch { return ''; }
}

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
      <div class="roster">${host.players.map(p => `<div class="chip">${esc(p.name)}</div>`).join('') || '<p class="muted">Names appear here as phones join.</p>'}</div>
      <h3>Game</h3>
      <div class="games">
        ${Object.values(GAMES).map(m => `<button class="game ${m.meta.id === host.gameId ? 'on' : ''}" data-game="${m.meta.id}"><b>${esc(m.meta.name)}</b><span>${esc(m.meta.blurb)}</span><small>${m.meta.min}–${m.meta.max} players</small></button>`).join('')}
        ${COMING_SOON.map(c => `<div class="game soon"><b>${esc(c.name)}</b><span>${esc(c.blurb)}</span><small>Coming soon</small></div>`).join('')}
      </div>
      <div class="row">
        <button class="btn" data-host="start" ${need ? 'disabled' : ''}>${need ? `Need ${need} more player${need === 1 ? '' : 's'}` : `Start ${esc(g.meta.name)}`}</button>
        <button class="btn ghost" data-host="voice">Narrator: ${voice.on ? 'on' : 'off'}</button>
        <button class="btn ghost" data-host="newcode">New room</button>
      </div>
    </section>
  </div>`;
}

function render() {
  if (!host.state) renderLobby();
  else game().renderTV(game().tvView(host.state, Date.now()), app);
  app.querySelectorAll('[data-host]').forEach(b => (b.onclick = () => hostAction(b.dataset.host)));
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
  const before = JSON.stringify(host.state);
  game().tick(host.state, Date.now());
  if (JSON.stringify(host.state) !== before) changed();
  else if (host.state.phase === 'day') {
    const clock = app.querySelector('.clock');
    const left = Math.max(0, Math.ceil((host.state.deadline - Date.now()) / 1000));
    if (clock) clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }
}, 1000);

if (host.state) lastPhase = host.state.phase + host.state.round;
connect();
