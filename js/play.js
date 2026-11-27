// Phone controller page: joins a room, shows whatever the TV sends for this player.
import { GAMES } from './games/index.js';
import { openRoom } from './net.js';
import { esc, store as localStore, uid, cleanCode, drawScene } from './ui.js';
import { buzz } from './sfx.js';
import { newKeys, cleanPub, sharedKey, seal, unseal } from './secure.js';
import { cleanName, isRude, funName, MAX_NAME } from './names.js';

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
    <div class="namebox"><input id="name" maxlength="${MAX_NAME}" autocomplete="nickname" value="${esc(name)}" required><button type="button" class="btn ghost dice" id="dice" aria-label="Pick a random name">🎲</button></div>
    <p class="muted small">Up to ${MAX_NAME} characters. Tap 🎲 for a random name.</p>
    ${err ? `<p class="lose">${esc(err)}</p>` : ''}
    <button class="btn" id="join" type="submit">Join</button>
  </form>`;
  app.querySelector('#dice').onclick = () => { const i = app.querySelector('#name'); i.value = funName(); i.focus(); };
  app.querySelector('#f').onsubmit = e => {
    e.preventDefault();
    code = cleanCode(app.querySelector('#code').value);
    name = cleanName(app.querySelector('#name').value);
    if (code.length !== 4) return joinForm('Room codes are 4 letters.');
    if (!name) return joinForm('Add a name with at least one letter or number.');
    if (isRude(name)) { name = ''; return joinForm('Let\'s keep it family-friendly. Try another name, or tap 🎲.'); }
    store.set('pg-code', code);
    store.set('pg-name', name);
    join();
  };
}

// Private messages: this phone's key pair, and the TV's public key once we've heard from it.
let keys = store.get('pg-keys');
let hostPub = null;
let lastN = 0;
let inQ = Promise.resolve();
async function send(a) {
  if (!room) return;
  if (keys && hostPub) {
    try { const k = await sharedKey(keys.priv, hostPub); return room.send({ t: 'act', pid, enc: await seal(k, { n: Date.now(), a }) }); } catch {}
  }
  room.send({ t: 'act', pid, a });
}

function onMessage(m) {
  if (!m || m.t !== 'view' || m.to !== pid) return;
  if (m.enc) {
    // Decrypt in arrival order; drop anything older than what we've already shown.
    inQ = inQ.then(async () => {
      const hp = cleanPub(m.hpub);
      if (!keys || !hp) return;
      const d = await unseal(await sharedKey(keys.priv, hp), m.enc);
      if (!d || d.n < lastN) return;
      lastN = d.n; hostPub = hp;
      onMessage({ t: 'view', to: pid, view: d.view });
    }).catch(() => {});
    return;
  }
  heard = Date.now();
  const s = JSON.stringify(m.view);
  if (s === lastView) return;
  lastView = s;
  render(m.view);
}

let lastPhaseSeen = '';
function render(v) {
  document.body.classList.toggle('paused', !!v._paused);
  const key = v.phase + (v.round || '');
  const isNew = key !== lastPhaseSeen;
  if (isNew) { app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter'); }
  document.body.classList.toggle('night', v.phase === 'night');
  document.body.classList.toggle('day', ['day', 'vote', 'verdict'].includes(v.phase));
  if (key !== lastPhaseSeen) { lastPhaseSeen = key; if (v.alive && ['roles', 'night', 'vote'].includes(v.phase)) buzz([80, 60, 80]); }
  if (v.phase === 'audience') {
    app.innerHTML = `<div class="panel"><h2>You're in the audience</h2><p class="say">${v.playing ? `A game of ${esc(v.game)} is in progress.` : 'The room is full.'} You'll get a seat in the next game.</p>
      <p class="muted">Cheer them on! Your reactions float across the TV.</p>
      <div class="reacts">${v.reactions.map(e => `<button class="reactbtn" data-e="${e}">${e}</button>`).join('')}</div>
      <p class="muted small">Playing: ${v.players.map(esc).join(', ')}</p><button class="btn ghost" id="leave">Leave room</button></div>`;
    app.querySelectorAll('[data-e]').forEach(b => (b.onclick = () => { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); room?.send({ t: 'react', pid, e: b.dataset.e }); }));
    app.querySelector('#leave').onclick = leave;
    return;
  }
  if (v.phase === 'kicked') { clearInterval(hello); room?.close(); room = null; app.innerHTML = `<div class="panel"><h2>You were removed</h2><p class="say">The host removed you from this room.</p></div>`; return; }
  if (v.phase === 'full') { app.innerHTML = `<div class="panel"><h2>That room is full</h2><button class="btn" id="back">Try another code</button></div>`; app.querySelector('#back').onclick = leave; return; }
  if (v.phase === 'lobby') {
    app.innerHTML = `<div class="panel"><h2>You're in, ${esc(v.me || name)}</h2>${v.byHost ? '<p class="note">The host set your name.</p>' : v.fixed ? `<p class="note">${v.me && name && v.me.toLowerCase().startsWith(name.toLowerCase()) ? 'Someone already had that name, so you got a number.' : 'We tidied up your name.'}</p>` : ''}<p class="say">Watch the TV. The game starts when the host is ready.</p>
      <p class="muted">Game: ${esc(v.game)} · ${v.players.length} playing</p>
      <div class="roster">${v.players.map(n => `<div class="chip">${esc(n)}</div>`).join('')}</div>
      <button class="btn ghost" id="leave">Leave room</button></div>`;
    app.querySelector('#leave').onclick = leave;
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  app.replaceChildren(wrap);
  (GAMES[v.game] || GAMES.werewolf).renderPhone(v, wrap, send);
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

// Keep the phone awake during a game, where the browser allows it.
let wake = null;
async function stayAwake() { try { if (!wake && 'wakeLock' in navigator && document.visibilityState === 'visible') { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => (wake = null)); } } catch { wake = null; } }
document.addEventListener('visibilitychange', () => { if (room) stayAwake(); });

async function join() {
  stayAwake();
  const key = 'pg-pid-' + code;
  pid = store.get(key) || uid();
  store.set(key, pid);
  app.innerHTML = `<div class="panel"><h2>Joining ${esc(code)}…</h2><p class="muted">Make sure the TV is showing this room code.</p></div>`;
  room = await openRoom(code, onMessage, s => {
    statusEl.textContent = s === 'live' ? `Room ${code} · ${name}` : s === 'connecting' ? 'Connecting…' : 'Connection lost, retrying…';
    statusEl.dataset.s = s;
  });
  if (!keys) { try { keys = await newKeys(); if (keys) store.set('pg-keys', keys); } catch { keys = null; } }
  const ping = () => room?.send({ t: 'hello', pid, name, pub: keys?.pub });
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
