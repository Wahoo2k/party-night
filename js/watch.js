// Remote screen: shows a room's TV picture, sounds and effects on a far-away laptop or phone. It only watches;
// players still use play.html to play. The TV sends its drawn page on the room's "-tv" channel.
import { openRoom } from './net.js';
import { esc, store, uid, cleanCode, drawScene, say, titleCard, confetti, clawMarks, fitScreen, keepFitted } from './ui.js';
import { play, sfx, startBed, stopBed } from './sfx.js';

const app = document.getElementById('app');
const statusEl = document.getElementById('status');
keepFitted(app);
drawScene(document.getElementById('sky'));
const params = new URLSearchParams(location.search);
const embed = params.has('embed');
const baseCls = 'tv watch' + (embed ? ' embed' : '');
document.body.className = baseCls + ' inlobby';
let code = cleanCode(params.get('code') || '');
const pid = store.get('pg-watch-id') || uid();
store.set('pg-watch-id', pid);

const tbar = Object.assign(document.createElement('div'), { id: 'tbar', hidden: true });
tbar.innerHTML = '<span></span>';
document.body.append(tbar);

let room = null, got = 0, lastNow = 0, offset = 0, deadline = 0, paused = false, barOn = false, barFor = 0, barTotal = 1, gameId = '', cer = null, beat = null;

function flash(kind, inner) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (kind === 'shake') { app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake'); return setTimeout(() => app.classList.remove('shake'), 700); }
  if (kind === 'boom') flash('shake', true);
  const el = Object.assign(document.createElement('div'), { className: 'fxflash ' + String(kind).replace(/[^a-z]/g, '') });
  document.body.append(el); setTimeout(() => el.remove(), 1000);
}
// Everything drawn here arrives over the network, so it is cleaned first: no scripts, frames or inline handlers.
function clean(html) {
  const t = document.createElement('template');
  t.innerHTML = String(html || '');
  t.content.querySelectorAll('script,iframe,object,embed,link,meta,base,style').forEach(e => e.remove());
  t.content.querySelectorAll('*').forEach(e => { for (const a of [...e.attributes]) if (/^on/i.test(a.name) || (/^(href|src|xlink:href|action|formaction)$/i.test(a.name) && /^\s*(javascript|data:text\/html)/i.test(a.value))) e.removeAttribute(a.name); });
  return t.innerHTML;
}
const text = x => String(x ?? '').replace(/[<>]/g, '');
function ceremonyOff() { cer?.el.remove(); cer?.timers.forEach(clearTimeout); cer = null; }
const FX = {
  play: n => { if (sfx.on && /^[a-z]+$/.test(n)) play(n); },
  say: (t, low) => say(text(t).slice(0, 400), false, !!low),
  titleCard: (a, b, c, d) => titleCard(text(a), text(b), text(c).replace(/[^a-z -]/g, ''), clean(d)),
  confetti: () => confetti(),
  clawMarks: () => clawMarks(),
  flash: k => flash(k),
  react: (e, name) => { const el = document.createElement('div'); el.className = 'react'; el.style.left = 8 + Math.random() * 84 + 'vw'; el.innerHTML = `<span>${esc(e)}</span><small>${esc(name)}</small>`; document.body.append(el); setTimeout(() => el.remove(), 3200); },
  ceremony: (cls, theme, html, firstAt, closeAt) => {
    ceremonyOff();
    const el = document.createElement('div'); el.className = String(cls).replace(/[^a-z ]/g, ''); el.dataset.theme = String(theme || '').replace(/[^a-z]/g, ''); el.innerHTML = clean(html);
    document.body.append(el);
    const timers = [];
    if (firstAt) timers.push(setTimeout(() => el.classList.add('first'), firstAt));
    if (closeAt) timers.push(setTimeout(ceremonyOff, closeAt));
    cer = { el, timers };
  },
  ceremonyOff,
};

function onMessage(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'fx' && got && FX[m.name]) { try { FX[m.name](...(Array.isArray(m.args) ? m.args : [])); } catch {} return; }
  if (m.t !== 'screen' || typeof m.html !== 'string') return;
  got = Date.now(); lastNow = m.now;
  offset = m.now - Date.now();
  app.innerHTML = clean(m.html);
  document.body.className = String(m.cls || '').replace(/[^\w -]/g, '').replace(/\btv\b/, baseCls);
  document.body.dataset.theme = String(m.theme || '').replace(/[^a-z]/g, '');
  document.body.dataset.game = gameId = String(m.game || '').replace(/[^a-z]/g, '');
  deadline = +m.deadline || 0; paused = !!m.paused; barOn = !!m.bar;
  statusEl.textContent = `${m.status || ''} · remote screen`;
  if (!gameId) ceremonyOff();
  fitScreen(app);
  tick();
}

// The clock and the countdown bar run here from the TV's deadline, adjusted for the difference between the two clocks.
function tick() {
  const now = Date.now() + offset, left = deadline - now;
  const clock = app.querySelector('.clock');
  if (clock && deadline) {
    const s = Math.max(0, Math.ceil(left / 1000));
    clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    clock.classList.toggle('hurry', s <= 10);
  }
  const live = barOn && !paused && left > 0 && !!clock;
  tbar.hidden = !live;
  if (!live) { barFor = 0; stopBed(); }
  else {
    if (deadline !== barFor) { barFor = deadline; barTotal = Math.max(1000, left); tbar.firstChild.style.transition = 'none'; tbar.firstChild.style.width = '100%'; void tbar.offsetWidth; }
    tbar.firstChild.style.transition = 'width 1s linear';
    tbar.firstChild.style.width = Math.max(0, (100 * (left - 1000)) / barTotal) + '%';
    tbar.classList.toggle('hurry', left <= 10000);
    if (sfx.on && gameId !== 'copycat' && barTotal >= 12000) startBed(left <= 10000 ? 'hurry' : 'think'); else stopBed();
  }
  if (got && Date.now() - got > 30000 && !document.getElementById('wlost')) statusEl.textContent = 'Waiting for the TV…';
}
setInterval(tick, 500);

async function connect() {
  app.innerHTML = `<div class="panel wjoin"><h2>Finding room ${esc(code)}…</h2><p class="muted">Make sure the TV page is open and showing this code.</p></div>`;
  room = await openRoom(code + '-tv', onMessage, s => { if (!got) statusEl.textContent = s === 'live' ? `Room ${code}` : s === 'connecting' ? 'Connecting…' : 'Connection lost, retrying…'; });
  const ping = () => room?.send({ t: 'watch', pid, need: !got || Date.now() - got > 20000 });
  ping();
  clearInterval(beat);
  let n = 0;
  beat = setInterval(() => { n++; if (!got || n % 4 === 0) ping(); }, 2000);
}

function form(err = '') {
  app.innerHTML = `<form class="panel wjoin" id="wf"><h2>Watch a game from far away</h2><p class="say">Enter the room code from the host's TV. This screen only shows the TV. To play, also join on your phone.</p>${err ? `<p class="note">${esc(err)}</p>` : ''}<input id="wc" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" value="${esc(code)}"><button class="btn">▶ Watch</button></form>`;
  app.querySelector('#wf').onsubmit = e => {
    e.preventDefault();
    code = cleanCode(app.querySelector('#wc').value);
    if (!code) return form('That code should be four letters.');
    const u = new URL(location.href); u.searchParams.set('code', code); history.replaceState(null, '', u);
    connect();
  };
}
// A press is needed before a browser will play sound, so the page always opens on a button (except inside the phone page).
embed && code ? connect() : form();
