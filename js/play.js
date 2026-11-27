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
let myFace = null;

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
  // The TV moved to a new room and is taking everyone with it.
  if (m && m.t === 'move' && room && /^[A-Z]{4}$/.test(m.code || '')) { store.del('pg-pid-' + code); code = m.code; store.set('pg-code', code); try { room.close(); } catch {} room = null; lastView = ''; heard = 0; return void setTimeout(join, 900); }
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
  document.body.classList.toggle('nodraw', !!v._nodraw);
  if (v._me) { myFace = v._me; document.body.style.setProperty('--me', v._me[1]); if (statusEl.dataset.s === 'live') statusEl.textContent = `${v._me[0]} ${v.me || name} · ${code}`; }
  // In a game the header shrinks to one line with the game's name and art, and the phone takes the game's colors.
  const inGame = !!v.game && !['lobby', 'audience', 'kicked', 'full'].includes(v.phase) && !!GAMES[v.game];
  document.body.classList.toggle('ingame', inGame);
  document.body.dataset.theme = inGame ? v._theme || '' : '';
  const titleEl = document.querySelector('.title');
  if (titleEl) { titleEl.textContent = inGame ? v._name || 'Party Night' : 'Party Night'; document.querySelector('.scene').style.setProperty('--cover', inGame ? `url(art/${v.game}.jpg)` : 'none'); }
  const key = v.phase + (v.round || '');
  const isNew = key !== lastPhaseSeen;
  if (isNew) { app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter'); }
  document.body.classList.toggle('night', v.phase === 'night');
  document.body.classList.toggle('day', ['day', 'vote', 'verdict'].includes(v.phase));
  if (key !== lastPhaseSeen) { lastPhaseSeen = key; if (v.alive && ['roles', 'night', 'vote'].includes(v.phase)) buzz([80, 60, 80]); }
  if (v.phase === 'audience') {
    app.innerHTML = `<div class="panel"><h2>You're in the audience</h2><p class="say">${v.playing ? `A game of ${esc(v.game)} is in progress.` : 'The room is full.'} You'll get a seat in the next game.</p>
      ${v.ask ? `<div class="audask"><p class="muted">Audience vote</p><p class="tq small">${esc(v.ask.q)}</p>${v.ask.options.map(o => `<button class="btn ${v.ask.picked === o.v ? '' : 'ghost'}" data-aud="${esc(o.v)}">${esc(o.label)}</button>`).join('')}</div>` : ''}
      <p class="muted">Cheer them on! Your reactions float across the TV.</p>
      <div class="reacts">${v.reactions.map(e => `<button class="reactbtn" data-e="${e}">${e}</button>`).join('')}</div>
      <p class="muted small">Playing: ${v.players.map(esc).join(', ')}</p><button class="btn ghost" id="leave">Leave room</button></div>`;
    app.querySelectorAll('[data-e]').forEach(b => (b.onclick = () => { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); room?.send({ t: 'react', pid, e: b.dataset.e }); }));
    app.querySelectorAll('[data-aud]').forEach(b => (b.onclick = () => send({ type: 'aud', pick: b.dataset.aud })));
    app.querySelector('#leave').onclick = leave;
    return;
  }
  if (v.phase === 'kicked') { clearInterval(hello); room?.close(); room = null; app.innerHTML = `<div class="panel"><h2>You were removed</h2><p class="say">The host removed you from this room.</p></div>`; return; }
  if (v.phase === 'full') { app.innerHTML = `<div class="panel"><h2>That room is full</h2><button class="btn" id="back">Try another code</button></div>`; app.querySelector('#back').onclick = leave; return; }
  if (v.phase === 'intro') {
    // The game is being explained on the TV: the same steps here, and a Ready button.
    localStore.set('pg-seen-' + v.game, 1);
    app.innerHTML = `<div class="panel pintro"><p class="introkick">How to play</p><h2>${esc(v._name)}</h2><ol>${(v._how || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol>${v.ready ? '<div class="actbar wait"><b>✅ You\'re ready</b><span>Waiting for everyone else. Watch the TV.</span></div>' : '<button class="btn big" id="rdy">✅ Got it. I\'m ready!</button>'}${v._remote && v.ready ? '<button class="btn ghost" data-rm="start">👑 Start now</button>' : ''}</div>`;
    const r = app.querySelector('#rdy'); if (r) r.onclick = () => { r.disabled = true; send({ type: '_ready' }); };
    app.querySelectorAll('[data-rm]').forEach(b => (b.onclick = () => send({ type: '_host', a: b.dataset.rm })));
    document.getElementById('helpbtn')?.remove();
    return;
  }
  if (v.phase === 'lobby') {
    app.innerHTML = `<div class="panel"><h2>You're in, ${esc(v.me || name)}</h2>${v.byHost ? '<p class="note">The host set your name.</p>' : v.fixed ? `<p class="note">${v.me && name && v.me.toLowerCase().startsWith(name.toLowerCase()) ? 'Someone already had that name, so you got a number.' : 'We tidied up your name.'}</p>` : ''}<p class="say">Watch the TV. The game starts when the host is ready.</p>
      <p class="muted">Game: ${esc(v.game)} · ${v.players.length} playing</p>
      <div class="roster">${v.players.map(n => `<div class="chip">${esc(n)}</div>`).join('')}</div>
      ${v.faces ? `<div class="facepick"><p class="muted">Pick your animal</p><div class="faces">${v.faces.map((f, i) => `<button class="facebtn ${v._me && v._me[0] === f ? 'on' : ''}" data-face="${i}" ${v.taken.includes(f) ? 'disabled' : ''}>${f}</button>`).join('')}</div><button class="btn ghost" id="wave">👋 Wave at the TV</button></div>` : ''}
      ${v.canPrompt ? `<form id="pf" class="audask"><p class="muted">✍️ Add your own prompt for Funny Answers (${v.myPrompts.length}/3)</p>${v.myPrompts.map(t => `<p class="small">“${esc(t)}”</p>`).join('')}${v.myPrompts.length < 3 ? '<input id="pt" maxlength="70" placeholder="The worst thing to say at…" autocomplete="off"><button class="btn ghost">Add</button>' : ''}</form>` : ''}
      ${v._remote ? `<div class="remote"><p class="muted">👑 You're the remote</p><button class="btn" data-rm="start" ${v.canStart ? '' : 'disabled'}>Start the game</button></div>` : ''}
      <button class="btn ghost" id="leave">Leave room</button></div>`;
    app.querySelector('#leave').onclick = leave;
    app.querySelectorAll('[data-face]').forEach(b => (b.onclick = () => room?.send({ t: 'face', pid, i: +b.dataset.face })));
    const wv = app.querySelector('#wave'); if (wv) wv.onclick = () => { room?.send({ t: 'react', pid, e: '👋' }); wv.classList.remove('hit'); void wv.offsetWidth; wv.classList.add('hit'); };
    app.querySelector('#pf')?.addEventListener('submit', e => { e.preventDefault(); const t = app.querySelector('#pt')?.value.trim(); if (t) room?.send({ t: 'suggest', pid, text: t }); });
    app.querySelectorAll('[data-rm]').forEach(b => (b.onclick = () => send({ type: '_host', a: b.dataset.rm })));
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  app.replaceChildren(wrap);
  (GAMES[v.game] || GAMES.werewolf).renderPhone(v, wrap, send);
  polish(v, wrap, isNew);
  document.getElementById('hostfab')?.remove();
  if (v._remote) {
    // Host controls live in a corner button, away from the play buttons, so nobody skips a round by mistake.
    const r = document.createElement('div'); r.id = 'hostfab'; r.className = remoteOpen ? 'open' : '';
    r.innerHTML = `<div class="hostmenu">${v.phase === 'over' ? '<button class="btn small" data-rm="again">Play again</button><button class="btn ghost small" data-rm="lobby">All games</button>' : `<button class="btn small" data-rm="next">Next ⏭</button><button class="btn ghost small" data-rm="pause">${v._paused ? 'Resume ▶' : 'Pause ⏸'}</button>`}</div><button class="hostbtn" aria-label="Host controls">👑</button>`;
    document.body.append(r);
    r.querySelector('.hostbtn').onclick = () => { remoteOpen = !remoteOpen; r.classList.toggle('open', remoteOpen); };
    r.querySelectorAll('[data-rm]').forEach(b => (b.onclick = () => { send({ type: '_host', a: b.dataset.rm }); remoteOpen = false; r.classList.remove('open'); }));
  }
}

// A short two-note chime when it becomes your move. Phones only allow sound after a tap, so the first tap anywhere
// (joining counts) unlocks it.
let actx = null;
addEventListener('pointerdown', () => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume?.(); } catch {} }, { passive: true });
function chime() {
  if (!actx || actx.state !== 'running') return;
  try { [[660, 0], [880, 0.12]].forEach(([f, t]) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.18, actx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.22); o.connect(g).connect(actx.destination); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.25); }); } catch {}
}

// Phone polish shared by every game: a buzz and a banner when it becomes your turn to do something, a nudge to
// watch the TV when there's nothing to tap, your points the moment you score, and your place at the end.
let couldAct = false, lastGain = 0, lastPlace = '', remoteOpen = false;
function polish(v, wrap, isNew) {
  const canAct = !!wrap.querySelector('button:not([disabled]):not(#leave), input:not([disabled]), textarea, canvas, [data-pad], svg.pad');
  // A bar across the top of every screen says, in one line, whether it is your move and what to do.
  const help = (GAMES[v.game] || {}).phoneHelp?.(v) || null;
  const go = help ? !help.wait && canAct : canAct;
  if (go && !couldAct && !v._paused) { buzz([60, 40, 60]); chime(); }
  if (v.phase !== 'over' && v.phase !== 'spectate') {
    const bar = document.createElement('div');
    bar.className = 'actbar ' + (go ? 'go' : 'wait');
    bar.innerHTML = `<b>${go ? '👉 Your move' : '📺 Watch the TV'}</b><span>${esc(help?.now || (go ? 'Do the step below. Everyone is waiting on you!' : 'Nothing to do on your phone right now.'))}</span>`;
    wrap.prepend(bar);
    // Nothing to tap: show where you stand and let you cheer, instead of an empty screen.
    if (!go) {
      const st = v._stand, nth = st && (['', '1st', '2nd', '3rd'][st.n] || st.n + 'th');
      wrap.insertAdjacentHTML('beforeend', `<div class="idle">${st ? `<div class="idlestand"><b>${nth}</b><span>of ${st.of}</span><em>${st.score.toLocaleString()} pts</em></div>` : ''}<p class="muted small">Cheer on the TV</p><div class="reacts">${(v._reacts || []).map(e => `<button class="reactbtn" data-e="${e}">${e}</button>`).join('')}</div></div>`);
      wrap.querySelectorAll('.idle [data-e]').forEach(b => (b.onclick = () => { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); room?.send({ t: 'react', pid, e: b.dataset.e }); }));
    }
  }
  helpButton(v, help, isNew);
  couldAct = canAct;
  if (v._final && isNew) toast('Final round!', 'gold');
  if (v._gain && v._gain.id !== lastGain) { lastGain = v._gain.id; toast('+' + v._gain.n.toLocaleString(), 'gain'); buzz([30, 30, 30, 30, 120]); }
  if (v._place && v.phase === 'over') {
    const key = v._place.n + '/' + v._place.of;
    const nth = ['', '1st', '2nd', '3rd'][v._place.n] || v._place.n + 'th';
    wrap.insertAdjacentHTML('afterbegin', `<div class="myplace p${Math.min(v._place.n, 4)}"><b>${v._place.n === 1 ? '🏆 ' : ''}${nth}</b><span>of ${v._place.of}</span></div>`);
    if (key !== lastPlace) { lastPlace = key; if (v._place.n === 1) buzz([80, 60, 80, 60, 200]); }
  } else lastPlace = '';
}

// "How to play" is one tap away on every screen, and opens by itself the first time someone plays a game.
function helpButton(v, help, isNew) {
  let btn = document.getElementById('helpbtn');
  if (!v.game || !v._how) { btn?.remove(); return; }
  if (!btn) { btn = Object.assign(document.createElement('button'), { id: 'helpbtn', textContent: '❓ How to play' }); document.body.append(btn); }
  const open = () => {
    document.getElementById('helpsheet')?.remove();
    const sh = document.createElement('div'); sh.id = 'helpsheet';
    sh.innerHTML = `<div class="hs"><h2>${esc(v._name || 'How to play')}</h2>${help?.role ? `<button class="hsrole hid" id="hsrole"><span class="cover">🤫 Tap to show your secret role tips (hide your screen first)</span><span class="secret">${esc(help.role)}${help.goal ? `<br><br>🎯 ${esc(help.goal)}` : ''}</span></button>` : ''}<h3>How a round goes</h3><ol>${(help?.steps || v._how).map(x => `<li>${esc(x)}</li>`).join('')}</ol><p class="muted">Your phone always shows a bar at the top: <b>👉 Your move</b> means tap something now. <b>📺 Watch the TV</b> means wait.</p><button class="btn" id="hsok">Got it</button></div>`;
    document.body.append(sh);
    sh.querySelector('#hsok').onclick = () => sh.remove();
    const hr = sh.querySelector('#hsrole'); if (hr) hr.onclick = () => hr.classList.toggle('hid');
    sh.onclick = e => { if (e.target === sh) sh.remove(); };
  };
  btn.onclick = open;
  const key = 'pg-seen-' + v.game;
  if (isNew && !localStore.get(key) && (!params.has('local') || params.has('help'))) { localStore.set(key, 1); open(); }   // automated tests skip the pop-up unless they ask for it
}
function toast(text, cls) {
  const t = Object.assign(document.createElement('div'), { className: 'ptoast ' + cls, textContent: text });
  document.body.append(t); setTimeout(() => t.remove(), 1900);
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
document.addEventListener('visibilitychange', () => { if (room) stayAwake(); if (document.visibilityState === 'visible') comeBack(); });
addEventListener('online', () => comeBack());
// Unlocking the phone or getting signal back: say hello straight away, and reconnect from scratch if the TV doesn't answer.
let backTimer = 0;
function comeBack() {
  if (!room || !code || !name) return;
  const asked = Date.now();
  room.send({ t: 'hello', pid, name, pub: keys?.pub });
  clearTimeout(backTimer);
  backTimer = setTimeout(() => { if (heard >= asked || !room) return; statusEl.textContent = 'Reconnecting…'; try { room.close(); } catch {} room = null; lastView = ''; join(); }, 4000);
}

// One-phone remote play: a player who can't see the TV can put its picture above their controls.
let tvOn = !!store.get('pg-showtv') || params.has('remote');
function tvBox() {
  let btn = document.getElementById('tvbtn');
  if (!room || !code) { btn?.remove(); document.getElementById('tvbox')?.remove(); return; }
  if (!btn) { btn = Object.assign(document.createElement('button'), { id: 'tvbtn' }); btn.onclick = () => { tvOn = !tvOn; store.set('pg-showtv', tvOn); tvBox(); }; document.body.append(btn); }
  btn.textContent = tvOn ? '📺 Hide TV' : '📺 Show TV';
  let box = document.getElementById('tvbox');
  const want = `watch.html?code=${code}&embed=1${params.has('local') ? '&local=1' : ''}`;
  if (!tvOn) { box?.remove(); return; }
  if (box && box.dataset.src !== want) { box.remove(); box = null; }
  if (!box) {
    box = Object.assign(document.createElement('div'), { id: 'tvbox' }); box.dataset.src = want;
    box.innerHTML = `<iframe src="${want}" allow="autoplay" title="The TV screen"></iframe>`;
    app.before(box);
    const fit = () => { const f = box.firstChild; if (f) { f.style.transform = `scale(${box.clientWidth / 1280})`; } };
    fit(); addEventListener('resize', fit); new ResizeObserver(fit).observe(box);
  }
}
setInterval(tvBox, 1500);

async function join() {
  stayAwake();
  const key = 'pg-pid-' + code;
  pid = store.get(key) || uid();
  store.set(key, pid);
  app.innerHTML = `<div class="panel"><h2>Joining ${esc(code)}…</h2><p class="muted">Make sure the TV is showing this room code.</p></div>`;
  room = await openRoom(code, onMessage, s => {
    statusEl.textContent = s === 'live' ? `${myFace ? myFace[0] + ' ' : ''}${name} · ${code}` : s === 'connecting' ? 'Connecting…' : 'Connection lost, retrying…';
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
