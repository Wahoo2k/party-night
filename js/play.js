// Phone controller page: joins a room, shows whatever the TV sends for this player.
import { GAMES } from './games/index.js';
import { openRoom } from './net.js';
import { esc, store as localStore, uid, cleanCode, drawScene } from './ui.js';

const app = document.getElementById('app');
const statusEl = document.getElementById('status');
drawScene(document.getElementById('sky'));

const params = new URLSearchParams(location.search);
// In ?local test mode several "phones" are tabs of one browser, so each tab keeps its own details.
const tabStore = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { sessionStorage.removeItem(k); } catch {} },
};
const store = params.has('local') ? tabStore : localStore;
let code = cleanCode(params.get('code') || store.get('pg-code'));
let name = store.get('pg-name') || '';
let pid = null;
let room = null;
let lastView = '';
let heard = 0;
let hello = null;

function joinForm(err = '') {
  app.innerHTML = `<form class="panel" id="f">
    <h2>Join the game</h2>
    <label for="code">Room code from the TV</label>
    <input id="code" class="big" maxlength="4" autocomplete="off" autocapitalize="characters" value="${esc(code)}" required>
    <label for="name">Your name</label>
    <input id="name" maxlength="20" autocomplete="nickname" value="${esc(name)}" required>
    ${err ? `<p class="lose">${esc(err)}</p>` : ''}
    <button class="btn">Join</button>
  </form>`;
  app.querySelector('#f').onsubmit = e => {
    e.preventDefault();
    code = cleanCode(app.querySelector('#code').value);
    name = app.querySelector('#name').value.trim().slice(0, 20);
    if (code.length !== 4) return joinForm('Room codes are 4 letters.');
    if (!name) return joinForm('Add your name so everyone knows who you are.');
    store.set('pg-code', code);
    store.set('pg-name', name);
    join();
  };
}

const send = a => room?.send({ t: 'act', pid, a });

function onMessage(m) {
  if (!m || m.t !== 'view' || m.to !== pid) return;
  heard = Date.now();
  const s = JSON.stringify(m.view);
  if (s === lastView) return;
  lastView = s;
  render(m.view);
}

function render(v) {
  if (v.phase === 'full') { app.innerHTML = `<div class="panel"><h2>That room is full</h2><button class="btn" id="back">Try another code</button></div>`; app.querySelector('#back').onclick = leave; return; }
  if (v.phase === 'lobby') {
    app.innerHTML = `<div class="panel"><h2>You're in, ${esc(v.me || name)}</h2><p class="say">Watch the TV. The game starts when the host is ready.</p>
      <p class="muted">Game: ${esc(v.game)} · ${v.players.length} playing</p>
      <div class="roster">${v.players.map(n => `<div class="chip">${esc(n)}</div>`).join('')}</div>
      <button class="btn ghost" id="leave">Leave room</button></div>`;
    app.querySelector('#leave').onclick = leave;
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  app.replaceChildren(wrap);
  GAMES.werewolf.renderPhone(v, wrap, send);
}

function leave() {
  room?.send({ t: 'bye', pid });
  room?.close();
  clearInterval(hello);
  store.del('pg-code');
  room = null;
  lastView = '';
  joinForm();
}

async function join() {
  const key = 'pg-pid-' + code;
  pid = store.get(key) || uid();
  store.set(key, pid);
  app.innerHTML = `<div class="panel"><h2>Joining ${esc(code)}…</h2><p class="muted">Make sure the TV is showing this room code.</p></div>`;
  room = await openRoom(code, onMessage, s => {
    statusEl.textContent = s === 'live' ? `Room ${code} · ${name}` : s === 'connecting' ? 'Connecting…' : 'Connection lost, retrying…';
    statusEl.dataset.s = s;
  });
  const ping = () => room?.send({ t: 'hello', pid, name });
  ping();
  clearInterval(hello);
  // Keep saying hello: it re-syncs after either side refreshes. Fast until the TV answers.
  hello = setInterval(() => { if (!heard || Date.now() - heard > 8000) ping(); }, 2500);
  setTimeout(() => {
    if (heard || !room) return;
    app.innerHTML = `<div class="panel"><h2>No answer from ${esc(code)}</h2><p class="say">Check the code on the TV and that the TV page is open. Still trying…</p><button class="btn" id="back">Change code</button></div>`;
    app.querySelector('#back').onclick = leave;
  }, 12000);
}

code && name ? join() : joinForm();
