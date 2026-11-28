// TV / host page: owns the room, the player list and the game state.
import { GAMES, COMING_SOON, SHELVES, NIGHTS } from './games/index.js';
import { openRoom } from './net.js';
import { SHOP, locked, refreshOwn, owned, accountUrl, PARTY_FN, PARTY_KEY } from './own.js';
import { PACKS, PRICES, packOf } from './packs.js';
import { esc, store, DEMO, newCode, say, sayLow, voiceContext, fitScreen, stageFit, keepFitted, voice, voices, enableDpad, autofocus, drawScene, titleCard, confetti, clawMarks } from './ui.js';
import { art, thumb } from './art.js';
import { play, sfx, startAmbient, stopAmbient, startBed, stopBed, startLoop, stopLoop, quiet } from './sfx.js';
import { newKeys, cleanPub, samePub, sharedKey, seal, unseal } from './secure.js';
import { cleanAct, textsIn, maskView, maskLine } from './content.js';
import { settleName, cleanName, isRude, uniqueName, funName, MAX_NAME } from './names.js';
import { tap } from './tap.js';
import { quip } from './quips.js';

const app = document.getElementById('app');
const statusEl = document.getElementById('status');
keepFitted(app);
// Host buttons on the TV fade away after a few seconds without a key press or mouse move, so the screen shows only the game.
{ let qt = 0; const wake = () => { document.body.classList.remove('quiet'); clearTimeout(qt); qt = setTimeout(() => document.body.classList.add('quiet'), 5000); }; ['keydown', 'pointermove', 'pointerdown'].forEach(e => addEventListener(e, wake, { passive: true })); wake(); }
drawScene(document.getElementById('sky'));
enableDpad();

// Saved so a TV refresh doesn't lose the game.
let host = store.get('pg-host') || { code: newCode(), players: [], gameId: 'werewolf', state: null };
// A room left over from another day starts fresh: new code, empty seats, same settings.
if (host.at && Date.now() - host.at > 12 * 3600 * 1000) host = { ...host, code: newCode(), players: [], audience: [], state: null, queue: [], night: null, screen: 'menu', paused: 0 };
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

import('./fresh.js').then(m => m.watchFresh(() => !!document.querySelector('.hub'))).catch(() => {});
const game = () => GAMES[host.gameId];
// A host line for a moment, in the right voice for the game on screen (kids' games get the gentle set).
const hostLine = m => quip(m, { game: host.gameId, kids: !!host.settings.kids || !!game()?.meta.kids });
// Banter: an optional host line that never interrupts the game's own narration.
const banter = (m, chance = 1) => { if (host.settings.banter !== false && !host.paused && Math.random() < chance) sayLow(hostLine(m)); };
let saidLead = false, lastInput = Date.now(), lastIdle = 0;
['keydown', 'pointerdown'].forEach(e => addEventListener(e, () => (lastInput = Date.now()), { passive: true }));
const save = () => { host.at = Date.now(); store.set('pg-host', host); };
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
// Between rounds: a short standings screen, so the race is felt all game and not only at the podium. Rows start in
// the order from the last time it was shown, then slide to the new order.
let stand = { game: '', round: 0, order: [], scores: {} };
function standings(v) {
  const list = Array.isArray(v.scores) && v.scores.length >= 2 && v.scores[0]?.name && typeof v.scores[0].score === 'number' ? v.scores : null;
  if (stand.game !== host.gameId || !list || (v.round || 0) < stand.round) { stand = { game: host.gameId, round: v.round || 0, order: [], scores: {} }; return; }
  if (!(v.round > stand.round) || v.phase === 'over') return;
  const done = stand.round; stand.round = v.round;
  if (!done || !list.some(p => p.score) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const now = [...list].sort((a, b) => b.score - a.score).slice(0, 8), before = [...now].sort((a, b) => (stand.order.indexOf(a.name) + 1 || 99) - (stand.order.indexOf(b.name) + 1 || 99));
  const max = Math.max(1, now[0].score), face = n => host.players.find(p => p.name === n)?.face;
  const row = (p, i) => { const f = face(p.name), gain = p.score - (stand.scores[p.name] || 0); return `<div class="strow" data-n="${esc(p.name)}" style="--i:${i}"><i style="--pc:${f?.[1] || '#232a5c'}">${f?.[0] || '🙂'}</i><b>${esc(p.name)}</b><div class="stbar"><span style="width:${Math.max(3, (100 * p.score) / max)}%"></span></div><em>${p.score.toLocaleString()}</em>${gain > 0 ? `<small>+${gain.toLocaleString()}</small>` : '<small></small>'}</div>`; };
  const el = document.createElement('div'); el.className = 'standings'; el.dataset.theme = THEME_OF[host.gameId] || '';
  el.innerHTML = `<h2>After round ${done}</h2><div class="strows" style="--n:${now.length}">${before.map(row).join('')}</div>`;
  document.body.append(el);
  tap.fn?.('ceremony', ['standings', el.dataset.theme, `<h2>After round ${done}</h2><div class="strows" style="--n:${now.length}">${now.map(row).join('')}</div>`, 0, 5200]);
  if (sfx.on) play('whoosh');
  setTimeout(() => { now.forEach((p, i) => el.querySelector(`[data-n="${CSS.escape(p.name)}"]`)?.style.setProperty('--i', i)); if (sfx.on) play('pop'); }, 1300);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 5200);
  el.onclick = () => el.remove();
  stand.order = now.map(p => p.name); stand.scores = Object.fromEntries(list.map(p => [p.name, p.score]));
}

// After the podium: one clear choice of what happens next, instead of two small buttons inside the game's last screen.
const joinHost = () => { try { const u = new URL(joinUrl()); return (u.host + u.pathname).replace(/\/play\.html$/, '').replace(/\/$/, ''); } catch { return location.host; } };
function suggestNext() {
  if (host.queue?.length) return host.queue[0];
  const n = host.players.length, ok = id => id !== host.gameId && GAMES[id] && n >= GAMES[id].meta.min && n <= GAMES[id].meta.max && !(host.settings.kids && GAMES[id].meta.kids === false);
  const shelf = SHELVES.find(s => s.games?.includes(host.gameId) && s.id !== 'featured') || SHELVES[0];
  const pool = [...(shelf.games || []), ...SHELVES[0].games].filter(ok);
  return pool.find(id => !host.played?.[id]) || pool[0] || null;
}
function afterParty() {
  const nx = suggestNext(), G = nx && GAMES[nx];
  const t = host.tally, night = t?.games.length > 1 ? Object.entries(t.by).filter(e => e[1].pts).sort((a, b) => b[1].pts - a[1].pts).slice(0, 5) : [];
  app.insertAdjacentHTML('beforeend', `<div class="after">
    <button class="endcard" data-host="again"><span class="aart">${thumb(host.gameId, ICONS[host.gameId])}</span><span class="atext"><small>Same game</small><b>Play again</b></span></button>
    ${G ? `<button class="endcard next" data-host="playnext:${nx}"><span class="aart">${thumb(nx, ICONS[nx])}</span><span class="atext"><small>Up next</small><b>${esc(G.meta.name)}</b></span></button>` : ''}
    <button class="endcard" data-host="lobby"><span class="aart all">🎲</span><span class="atext"><small>Something else</small><b>All games</b></span></button>
    ${night.length ? `<p class="anight"><b>Tonight</b> ${night.map(([n, r], i) => `${i ? '· ' : '👑 '}${esc(n)} <b>${r.pts}</b>`).join(' ')}</p>` : ''}</div>`);
}

// Reveal beats. A game marks parts of a result with data-beat="1", "2", ... and they appear one at a time, each with
// a sound, instead of all at once. data-beat-class adds a class at that moment instead (to color a row that is already
// showing). The timing is kept per phase, so a redraw in the middle doesn't restart or skip the sequence.
const BEAT_FIRST = 900, BEAT_GAP = 1100;
let beats = { key: '', start: 0, timers: [], last: 0 };
function runBeats() {
  const els = host.state ? [...app.querySelectorAll('[data-beat]')] : [];
  if (!els.length) { beats.last = 0; return; }
  const s = host.state, key = [host.gameId, s.phase, s.round, s.n, s.step, s.turn, s.idx, s.q, s.i, s.k].join('|');
  if (key !== beats.key) { beats.timers.forEach(clearTimeout); beats = { key, start: Date.now(), timers: [], last: 0 }; }
  beats.timers.forEach(clearTimeout); beats.timers = [];
  const top = Math.max(...els.map(e => +e.dataset.beat || 1));
  beats.last = beats.start + BEAT_FIRST + (top - 1) * BEAT_GAP;
  for (const el of els) {
    const n = +el.dataset.beat || 1, due = beats.start + BEAT_FIRST + (n - 1) * BEAT_GAP, cls = el.dataset.beatClass;
    const show = fresh => { if (cls) el.classList.add(...cls.split(' ')); else el.classList.remove('beat-off'); if (fresh) { el.classList.add('beat-in'); if (sfx.on) play(n === top ? 'lockin' : 'pop'); shareScreen(); } };
    if (Date.now() >= due) { show(false); continue; }
    if (!cls) el.classList.add('beat-off');
    beats.timers.push(setTimeout(() => { if (el.isConnected) show(true); }, due - Date.now()));
  }
}

// Self-running rounds. When the TV is showing a "Next" button and nobody has anything left to do on their phone,
// the game moves on by itself after a short read. The host can still press Next sooner, or pause.
// Phases where a real person has to get ready (a new actor, a new team, a talk) are left to the host.
const HOLD = /turn|ready|brief|setup|choose|talk|day|discuss|pass|lobby|roles/i;
let auto = { key: '', at: 0, quiet: 0 }, refitA = 0, refitB = 0;
function autoNext() {
  const btn = host.state && !host.intro ? app.querySelector('.stage [data-host=next]') : null, s = host.state, G = btn && game();
  const hold = !btn || host.settings.auto === false || host.paused || s.phase === 'over' || s.deadline > Date.now() ||
    (G.meta.hold ? G.meta.hold.includes(s.phase) : HOLD.test(s.phase)) ||
    host.players.some(p => { try { return G.botAct?.(G.phoneView(s, p.pid, Date.now())); } catch { return false; } });
  if (hold) { auto.quiet = 0; if (btn) delete btn.dataset.count; return; }
  const key = [host.gameId, s.phase, s.round, s.n, s.step, s.turn, s.idx, s.q].join('|');
  if (key !== auto.key) { const words = app.querySelector('.stage .panel')?.textContent.length || 0; auto = { key, quiet: 0, at: Date.now() + Math.min(14000, 6500 + Math.max(0, words - 120) * 30) * (host.settings.relaxed ? 1.5 : 1) }; }
  if (beats.last) auto.at = Math.max(auto.at, beats.last + 3500);   // never move on before the reveal has finished
  const left = Math.ceil((auto.at - Date.now()) / 1000);
  btn.dataset.count = Math.max(0, left);
  if (left <= 0 && ++auto.quiet >= 2) { auto.key = ''; hostAction('next'); }   // two checks in a row, so one slow phone isn't cut off
}
setInterval(() => { if (host.state && !host.paused) autoNext(); }, 500);

// Design rules 2 and 3 (see DESIGN.md), for every game at once.
// Nothing gives the result away early: when a reveal starts, the score chips keep showing what everyone had until
// the reveal has played out (its last beat, or a few seconds), and phones are not told the outcome before then.
// Points are an event: when the new scores land, each chip that changed counts to its new number, shows "+N" and
// the points sound plays. Outside a reveal (points scored mid-turn) the same thing happens straight away.
const REVEALISH = /reveal|result|score|answer|roundEnd|tally|show/i;
let scoreShow = { game: '', key: '', vals: {}, until: 0, gains: {}, timer: 0 };
const scoreKeyOf = s => [host.gameId, s.phase, s.round, s.n, s.step, s.turn, s.idx, s.q, s.k, s.m].join('|');
function holdScores() {
  const rows = host.state ? [...app.querySelectorAll('.stage > .scores .srow')] : [];
  if (!rows.length) return;
  const nmOf = r => (r.querySelector('span') || r).textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim();
  const read = r => { const b = r.querySelector('b'); if (!b) return null; b.querySelectorAll('small').forEach(x => x.remove());   /* a game's own small "+N" gives way to the shared one */ const t = [...b.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue)); const m = t?.nodeValue.match(/[-−]?[\d,]+/); if (!m) return null; const shownNow = +m[0].replace(/,/g, '').replace('−', '-'); if (b.dataset.real === undefined || +b.dataset.shown !== shownNow) { b.dataset.real = shownNow; b.dataset.fmt = m[0].includes(',') ? ',' : ''; b.dataset.minus = m[0].startsWith('−') ? '−' : '-'; } return { r, b, t, raw: m[0], v: +b.dataset.real, name: nmOf(r) }; };   // the chip's true score is remembered on it, since the number on screen may be the held one
  const cur = rows.map(read).filter(Boolean);
  if (!cur.length) return;
  const now = Date.now(), key = scoreKeyOf(host.state), ss = scoreShow;
  if (ss.game !== host.gameId || !Object.keys(ss.vals).length || cur.every(c => c.v === 0)) { clearTimeout(ss.timer); scoreShow = { game: host.gameId, key, vals: Object.fromEntries(cur.map(c => [c.name, c.v])), until: 0, gains: {}, timer: 0 }; return; }
  const changed = cur.filter(c => ss.vals[c.name] !== undefined && c.v !== ss.vals[c.name]);
  if (changed.length && !ss.until) {
    const wait = key !== ss.key && REVEALISH.test(host.state.phase) && !game().meta.ownReveal ? (() => { const top = Math.max(0, ...[...app.querySelectorAll('[data-beat]')].map(e => +e.dataset.beat || 1)); return top ? BEAT_FIRST + (top - 1) * BEAT_GAP + 500 : 2600; })() : 0;
    ss.until = now + wait;
    if (wait) { phoneHold = ss.until; clearTimeout(ss.timer); ss.timer = setTimeout(() => { phoneHold = 0; holdScores(); sendViews(); }, wait + 30); }
  }
  ss.key = key;
  if (ss.until && now >= ss.until) {
    let any = false;
    for (const c of cur) { const was = ss.vals[c.name]; if (was !== undefined && was !== c.v) { ss.gains[c.name] = { d: c.v - was, at: now }; any = true; } ss.vals[c.name] = c.v; }
    ss.until = 0;
    if (any && sfx.on) play('points');
  }
  for (const c of cur) {
    const held = ss.vals[c.name];
    const show = held === undefined ? c.v : held, txt = (show < 0 ? c.b.dataset.minus : '') + (c.b.dataset.fmt || Math.abs(show) >= 1000 ? Math.abs(show).toLocaleString() : String(Math.abs(show)));
    if (txt !== c.raw) c.t.nodeValue = c.t.nodeValue.replace(c.raw, txt);
    c.b.dataset.shown = show;
    const g = ss.gains[c.name], el = g ? now - g.at : 9e9;
    c.r.querySelector('.sgain')?.remove();
    if (el < 2600) { const tag = document.createElement('small'); tag.className = 'sgain ' + (g.d < 0 ? 'neg' : ''); tag.textContent = (g.d > 0 ? '+' : '−') + Math.abs(g.d).toLocaleString(); tag.style.animationDelay = `-${el}ms`; c.r.append(tag); c.r.classList.add('sbump'); c.r.style.setProperty('--bump', `-${el}ms`); }
    else c.r.classList.remove('sbump');
  }
}
let phoneHold = 0; window.__ss = () => ({ ...scoreShow, now: Date.now(), phoneHold });

// Design rule 6: when play passes to someone else, say so. Any game whose heading reads "Name's turn" gets a banner
// sweeping across the screen and a sound when the name changes. (GOAT Toss draws its own over the table.)
let turnSeen = { game: '', who: '' }, turnSounds = 0;
function turnBanner() {
  if (!host.state || host.gameId === 'ducks') return;
  const m = [...app.querySelectorAll('.stage h2')].map(h => h.textContent.trim().match(/^(.{1,24})'s turn$/)).find(Boolean);
  if (!m) return;
  const who = m[1], first = turnSeen.game !== host.gameId;
  if (!first && who === turnSeen.who) return;
  turnSeen = { game: host.gameId, who };
  if (first) return;   // the opening turn is already announced by the game's title card
  document.querySelector('.turnflag')?.remove();
  const el = document.createElement('div'); el.className = 'turnflag'; el.innerHTML = '<div class="gturn in"><small>Up next</small><b></b></div>'; el.querySelector('b').textContent = who;
  document.body.append(el); setTimeout(() => el.remove(), 2000);
  if (sfx.on) play(['whoosh', 'join', 'lockin'][turnSounds++ % 3]);
}

// Survey games: when a round ends, the answers real players typed are sent (as text only, no names, no room) so the
// boards can be rebuilt from what people really say. Off in test mode, in the website demo, or when the host turns it off.
let surveySent = '';
function shareSurvey() {
  const G = game(), s = host.state;
  if (!s || !G.surveyLog || host.settings.share === false || tq.has('local') || DEMO) return;
  let r = null; try { r = G.surveyLog(s); } catch { return; }
  if (!r || !r.answers.length) return;
  const key = [host.gameId, host.code, s.round, r.key].join('|');
  if (key === surveySent) return;
  surveySent = key;
  const answers = r.answers.filter(a => a.t && !isRude(a.t)).slice(0, 40);
  if (answers.length) fetch(PARTY_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: PARTY_KEY }, body: JSON.stringify({ action: 'survey', q: r.q, answers }) }).catch(() => {});
}

function decorate() {
  holdScores(); turnBanner(); shareSurvey();
  const list = [...host.players].sort((a, b) => b.name.length - a.name.length);
  // A list of names that only says who has finished does not need the middle of the screen: on the stage, each
  // player's score chip at the bottom gets a tick (or a pencil while they are still busy) and the list is hidden.
  const sc = app.querySelector('.stage > .scores');
  if (sc && host.state) app.querySelectorAll('.stage .roster, .stage .pickrow').forEach(r => {
    const chips = [...r.querySelectorAll('.chip')], nm = el => el.textContent.replace(/[✓🔒]|✏️?/gu, '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
    if (!chips.length || r.closest('.mwwin')) return;
    const info = chips.map(c => { const t = c.textContent, done = /[✓🔒]/u.test(t) || c.classList.contains('skdone') || c.classList.contains('locked'); return { name: nm(c), done, mark: done || /✏/u.test(t) || c.classList.contains('waiting') }; });
    const rows = [...sc.querySelectorAll('.srow')], find = n => rows.find(x => nm(x.querySelector('span') || x) === n);
    if (!info.some(x => x.mark) || !info.every(x => find(x.name))) return;
    info.forEach(x => find(x.name).classList.add(x.done ? 'sdone' : 'swait'));
    r.classList.add('asbadge');
  });
  app.querySelectorAll('.srow > span:first-child, .pod > b, .roster .chip, .ccseat > b, .gfseat > b, .hseat > b, .bjseat > b, .mmcast b, .ccplayers b').forEach(el => {
    if (el.querySelector('.pface')) return;
    const text = el.textContent.replace(/^[^\p{L}\p{N}]+/u, '');
    const p = list.find(x => text === x.name || text.startsWith(x.name + ' ') || text.startsWith(x.name));
    if (!p?.face) return;
    if (p.away && host.state) el.classList.add('away');
    const i = document.createElement('i');
    i.className = 'pface'; i.textContent = p.face[0]; i.style.setProperty('--pc', p.face[1]);
    el.prepend(i);
  });
}

// Phones say hello every few seconds while their page is open. A player who goes quiet is marked away after half a
// minute; in the lobby they lose their seat after two minutes (they get it back the moment their phone returns).
const tq = new URLSearchParams(location.search);   // ?away= and ?gone= (seconds) shorten the waits for tests
const lastSeen = {}, AWAY_MS = (+tq.get('away') || 30) * 1000, GONE_MS = (+tq.get('gone') || 120) * 1000, bootAt = Date.now();
const idleFor = p => Date.now() - (lastSeen[p.pid] || bootAt - GONE_MS + Math.min(20000, GONE_MS));   // after a TV restart, 20 seconds to check back in
setInterval(() => {
  let ch = false;
  for (const p of [...host.players]) {
    if (p.bot) continue;
    const idle = idleFor(p), away = idle > AWAY_MS;
    if (!!p.away !== away) { p.away = away; ch = true; }
    if (!host.state && idle > GONE_MS) { host.players = host.players.filter(x => x !== p); ch = true; }
  }
  const n = host.audience.length;
  host.audience = host.audience.filter(a => idleFor(a) <= GONE_MS);
  if (ch || n !== host.audience.length) changed();
}, 5000);
const REACTIONS = ['👏', '😂', '😱', '🔥', '❤️', '👎'];
const isAudience = pid => host.audience.some(a => a.pid === pid);
// The rules each game shows on the TV, kept so every phone can open them at any time.
const howCache = {};
function rulesFor(id) {
  if (howCache[id]) return howCache[id];
  if (GAMES[id].meta.how) return (howCache[id] = GAMES[id].meta.how);   // a game can spell out its own steps
  try {
    const G = GAMES[id], n = Math.max(G.meta.min, Math.min(G.meta.max, host.players.length || G.meta.min));
    const ps = Array.from({ length: n }, (_, i) => ({ pid: 'r' + i, name: host.players[i]?.name || 'Player ' + (i + 1) }));
    const tmp = document.createElement('div'), cls = document.body.className;
    G.renderTV({ ...G.tvView(G.setup(ps, Math.random, null, {}), Date.now()), fresh: false }, tmp);
    document.body.className = cls;
    const li = [...tmp.querySelectorAll('.how li')].map(x => x.textContent.trim()).filter(Boolean);
    if (li.length) howCache[id] = li;
  } catch {}
  return howCache[id] || [GAMES[id].meta.blurb];
}
// The intro: before the first game of a title, the TV explains it and waits for every phone to tap Ready.
const wantsIntro = () => host.settings.howto && !host.played?.[host.gameId] && host.players.some(p => !p.bot) && (!tq.has('local') || tq.has('intro'));
const introReady = () => host.players.filter(p => !p.bot && !p.away).every(p => host.intro?.ready[p.pid]);
function renderIntro() {
  const id = host.intro.id, m = GAMES[id].meta, rules = rulesFor(id), first = !host.intro.shown;
  host.intro.shown = true;
  const humans = host.players.filter(p => !p.bot);
  app.innerHTML = `<div class="intro ${first ? 'enter' : ''}">
    <div class="introart">${art(id, ICONS[id])}</div>
    <div class="introtext"><p class="introkick">How to play</p><h2>${esc(m.name)}</h2><p class="introfacts">${m.best ? `<span>⭐ Best with ${m.best}</span>` : ''}${m.mins ? `<span>⏱ About ${m.mins} min</span>` : ''}${m.mood ? `<span>${esc(m.mood)}</span>` : ''}</p><ol class="introsteps">${rules.map((r, i) => `<li style="--i:${i}">${esc(r)}</li>`).join('')}</ol></div>
    <div class="introready"><div class="introchips">${humans.map(p => `<span class="introchip ${host.intro.ready[p.pid] ? 'ok' : ''} ${p.away ? 'away' : ''}"><i style="--pc:${p.face?.[1] || '#232a5c'}">${p.face?.[0] || '🙂'}</i>${esc(p.name)}${host.intro.ready[p.pid] ? ' ✅' : ''}</span>`).join('')}</div>
      <p class="introhint">Read the steps, then tap <b>✅ Ready</b> on your phone. The game starts when everyone is ready.</p>
      <div class="row"><button class="btn" data-host="start">Start now</button><button class="btn ghost" data-host="lobby">← Back</button></div></div>
  </div>`;
}
function howFor() {
  const li = [...app.querySelectorAll('.how li')].map(x => x.textContent.trim()).filter(Boolean);
  if (li.length) howCache[host.gameId] = li;
  return howCache[host.gameId] || [game().meta.blurb];
}
function viewFor(pid) {
  if (isAudience(pid)) {
    const me = host.audience.find(a => a.pid === pid);
    return { phase: 'audience', me: me.name, game: game().meta.name, playing: !!host.state, players: host.players.map(p => p.name), reactions: REACTIONS, ask: host.state && game().audienceView ? maskView(game().audienceView(host.state, pid) || null, host.hidden) : null };
  }
  if (!host.state && host.intro) {
    const me = host.players.find(p => p.pid === pid) || {};
    return { phase: 'intro', game: host.intro.id, _name: GAMES[host.intro.id].meta.name, _how: rulesFor(host.intro.id), ready: !!host.intro.ready[pid], _me: me.face, ...(pid === remotePid() ? { _remote: true } : {}) };
  }
  if (!host.state) {
    const me = host.players.find(p => p.pid === pid) || {};
    return { phase: 'lobby', ...(game().meta.teams ? { _teams: TEAM_NAMES.map((name, k) => ({ name, members: host.players.filter(p => teamPick()[p.pid] === k).map(p => p.name) })), _team: teamPick()[pid], _teamName: teamName(teamPick()[pid]) } : {}), faces: FACES.map(f => f[0]), taken: host.players.filter(p => p.pid !== pid).map(p => p.face?.[0]), ...(host.tally?.games.length ? { _night: nightCard() } : {}), _reacts: REACTIONS, players: host.players.map(p => p.name), game: game().meta.name, me: me.name, fixed: !!me.fixed, byHost: !!me.locked, _me: me.face, ...(pid === remotePid() ? { _remote: true, canStart: host.players.length >= game().meta.min } : {}), ...(game().meta.id === 'funny' ? { canPrompt: true, myPrompts: (host.custom || []).filter(c => c.pid === pid).map(c => c.text) } : {}) };
  }
  return { ...maskView(game().phoneView(host.state, pid), host.hidden), game: host.gameId, _name: game().meta.name, _how: howFor(), _as: host.players.find(p => p.pid === pid)?.name, _me: host.players.find(p => p.pid === pid)?.face, ...(host.paused ? { _paused: true } : {}), ...(gains[pid] ? { _gain: gains[pid] } : {}), ...(places[pid] ? { _place: places[pid] } : {}), ...(stands[pid] && !game().meta.secret ? { _stand: stands[pid] } : {}), _theme: THEME_OF[host.gameId] || '', _reacts: REACTIONS, ...(finalRound ? { _final: true } : {}), ...(host.blurDraw ? { _nodraw: true } : {}), ...(pid === remotePid() ? { _remote: true } : {}) };
}

// Each phone hears about its own points the moment they land, and its finishing place at the end.
let gains = {}, places = {}, stands = {}, lastScore = {}, gainId = 0, finalRound = false, finalSaid = false;
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
    if (list.some(x => x.score)) stands[p.pid] = { n: list.filter(x => x.score > row.score).length + 1, of: list.length, score: row.score };   // shown on the idle phone
    if (over && host.gameId !== 'imposter' && list.some(x => x.score !== list[0].score)) places[p.pid] = { n: list.filter(x => x.score > row.score).length + 1, of: list.length };
  });
}
// Which round is the last one, for the games that count rounds on screen.
const ROUNDS_OF = { quick: v => [v.n, v.total], potato: v => [v.r, v.of], hunt: v => [v.r, v.of], freeze: v => [v.r, v.of], meld: v => [v.turn, v.turns], charades: v => [v.turn, v.turns], taboo: v => [v.turn, v.turns], crew: v => [v.card, v.cards], doodle: v => [v.k, v.of], whosaid: v => [v.i + 1, v.total], bingo: v => [v.round, v.rounds], trivia: v => [v.n, v.total], copycat: () => null, meter: v => [v.q, v.of], faker: v => [v.r, v.of], rebus: v => [v.r, v.of] };
function checkFinal() {
  const f = host.state && ROUNDS_OF[host.gameId], r = f ? f(game().tvView(host.state, Date.now())) : null;
  finalRound = !!(r && r[1] > 2 && r[0] === r[1] && host.state.phase !== 'over');
  document.body.classList.toggle('finalround', finalRound);
  if (finalRound && !finalSaid) { finalSaid = true; if (sfx.on) play('fanfare'); setTimeout(() => say(hostLine('final')), 300); flash('gold'); }
}

// Extra buttons beside Pause: End game (press twice), and Hide drawing in the drawing games.
let endArmed = 0;
function vetoExtras() {
  const vbar = document.getElementById('vetobar');
  if (!vbar || !host.state) return;
  if (!vbar.querySelector('[data-host=endgame]')) vbar.insertAdjacentHTML('afterbegin', `<button class="btn ghost small" data-host="endgame">${Date.now() - endArmed < 4000 ? 'Press Back or OK again to end' : '✕ End game'}</button>`);
  if (['sketch', 'doodle'].includes(host.gameId) && !vbar.querySelector('[data-host=blurdraw]')) vbar.insertAdjacentHTML('afterbegin', `<button class="btn ghost small" data-host="blurdraw">🙈 ${host.blurDraw ? 'Show' : 'Hide'} drawing</button>`);
}
// The phone remote: one player's phone (the first to join, unless turned off) can press Next, Pause and Start for the TV.
const remotePid = () => (host.settings.remote === false ? null : host.players.find(p => !p.bot)?.pid || null);

function sendViews(force) {
  if (!room) return;
  if (!force && phoneHold && Date.now() < phoneHold && !host.paused) return;   // a reveal is still playing on the TV: phones hear the outcome when it has finished
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
    if (key !== lastPhase) {
      lastPhase = key; fresh = true; host.blurDraw = false;
      if (/reveal|result|scores/.test(host.state.phase)) {
        // Once a game, the host remarks on a runaway leader or a very close race; otherwise an occasional lead-in.
        const l = scoreList(), a = l?.[0]?.score, b = l?.[1]?.score;
        if (!saidLead && l && l.length >= 3 && a >= 4 && (a - b) / a > 0.45) { saidLead = true; banter('runaway'); }
        else if (!saidLead && l && l.length >= 3 && a >= 6 && (a - b) / a < 0.05 && a !== b) { saidLead = true; banter('close'); }
        else banter('reveal', 0.3);
      }
      announce();
    }
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

// Design rule 8: the same moment never sounds the same twice running. A cue's sound is swapped for one of its
// stand-ins, in turn. Title cards and the big game-over fanfare keep their own sound.
const SOUND_KIN = { join: ['join', 'whoosh', 'lockin'], vote: ['vote', 'stamp', 'pop'], safe: ['safe', 'points', 'lockin'], stamp: ['stamp', 'pop', 'lockin'], tick: ['tick', 'pop'], lose: ['lose', 'death', 'sting-comic'], lockin: ['lockin', 'stamp', 'pop'] };
const kinTurn = {};
const vary = (name, title) => { const kin = !title && SOUND_KIN[name]; if (!kin) return name; kinTurn[name] = ((kinTurn[name] ?? -1) + 1) % kin.length; return kin[kinTurn[name]]; };
// Sound effect first, then the narrator once it has played.
let sayTimer = null;
function announce() {
  const g = game(), s = host.state;
  const c = g.cue ? g.cue(s) : null;
  clearTimeout(sayTimer);
  stopAmbient();
  if (c && sfx.on) {
    play(vary(c.sound, c.title));
    if (c.after) setTimeout(() => play(vary(c.after)), c.wait - 500);
    if (c.ambient) setTimeout(startAmbient, c.wait);
  }
  const line = g.narration(s);
  // Game over with a score table: the shared winners' ceremony replaces the game's own title card.
  if (s.phase === 'over' && host.gameId !== 'imposter' && ceremony()) {
    sayTimer = setTimeout(() => say(maskLine(line, host.hidden)), 4200);
    const l = scoreList(); setTimeout(() => { if (host.state?.phase === 'over') banter(l && l[0].score === l[1]?.score ? 'tie' : 'winner'); }, 8000);
    return;
  }
  if (s.phase === 'over') setTimeout(() => { if (host.state?.phase === 'over') banter('gameover'); }, 4500);
  if (c?.title && introArt && sfx.on) play('sting-' + (THEME_OF[host.gameId] || 'night'));   // each game family opens with its own short theme
  if (c?.title) titleCard(c.title, c.sub, `${c.tone || ''} th-${THEME_OF[host.gameId] || 'night'}`, introArt ? art(host.gameId, ICONS[host.gameId]) : ''); if (c?.title) introArt = false;
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
  lastSeen[m.pid] = Date.now();
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
      play('join'); say(hostLine('join'));
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
  } else if (m.t === 'teamname') {
    // A player names their own team (join screen only). Same family filter as player names.
    const k = teamPick()[m.pid], name = String(m.name || '').replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!host.state && game().meta.teams && (k === 0 || k === 1) && name.length >= 2 && !isRude(name) && teamName(k) !== name) { (host.teamNames ||= [null, null])[k] = name; lastSent = {}; if (sfx.on) play('lockin'); changed(); }
  } else if (m.t === 'team') {
    // A player picks a side for a team game. They can switch freely until the game starts.
    if (!host.state && game().meta.teams && host.players.some(x => x.pid === m.pid) && (m.team === 0 || m.team === 1) && teamPick()[m.pid] !== m.team) { host.teamPick[m.pid] = m.team; lastSent = {}; if (sfx.on) play('pop'); changed(); }
  } else if (m.t === 'face') {
    // A player picks their own animal in the lobby (first come, first served).
    const p = host.players.find(x => x.pid === m.pid), f = FACES[m.i | 0];
    if (p && f && !host.state && !host.players.some(x => x !== p && x.face?.[0] === f[0])) { p.face = f; lastSent[m.pid] = null; if (sfx.on) play('pop'); changed(); }
  } else if (m.t === 'react' && (REACTIONS.includes(m.e) || m.e === '👋')) {
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
  if (rawAct?.type === '_ready') { if (host.intro && host.players.some(p => p.pid === pidFrom)) { host.intro.ready[pidFrom] = 1; if (introReady()) startGame(); else changed(); } return; }
  if (rawAct?.type === '_host') { if (pidFrom === remotePid() && (['next', 'pause', 'start', 'again', 'lobby'].includes(rawAct.a) || (host.state && (game().meta.remoteActs || []).includes(rawAct.a)))) hostAction(rawAct.a); return; }
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
  tap.fn?.('react', [e, name]);
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
function flash(kind, inner) {
  if (!inner) tap.fn?.('flash', [kind]);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (kind === 'shake') { app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake'); return setTimeout(() => app.classList.remove('shake'), 700); }
  if (kind === 'boom') flash('shake', true);
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
    // Position inside the score list itself, so moving or rescaling the whole stage doesn't count as a rank change.
    const k = el.firstElementChild?.textContent || '', x = el.offsetLeft, y = el.offsetTop;
    next[k] = [x, y];
    const was = rowAt[k], dx = was ? was[0] - x : 0, dy = was ? was[1] - y : 0;
    if ((Math.abs(dy) > 4 || Math.abs(dx) > 4) && el.animate) { el.animate([{ transform: `translate(${dx}px,${dy}px)`, boxShadow: '0 0 0 3px #8fe0c4' }, { transform: 'none', boxShadow: '0 0 0 0 #8fe0c400' }], { duration: 800, easing: 'cubic-bezier(.2,.9,.3,1)' }); }
  });
  rowAt = next;
}
let menuAt = null;   // the card in focus on the hub: { row, game }
try { menuAt = JSON.parse(sessionStorage.getItem('pg-menu-at')); } catch {}   // survives the page reloading itself for a new version
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
  const flat = tie && list.every(p => val(p) === val(list[0]));   // nobody pulled ahead at all
  const rankOf = i => list.findIndex(p => val(p) === val(list[i])) + 1;   // tied players share a step
  const top = list.slice(0, 3);
  el.innerHTML = `<h2>${flat ? 'A dead heat!' : tie ? "It's a tie!" : 'And the winner is…'}</h2><div class="cpods">${[1, 0, 2].filter(i => top[i]).map(i => { const f = face(top[i].name); return `<div class="cpod c${i + 1} r${rankOf(i)}"><i style="--pc:${f?.[1] || '#232a5c'}">${f?.[0] || '🏅'}</i><b>${esc(top[i].name)}</b><span>${val(top[i])}</span><em>${rankOf(i)}</em></div>`; }).join('')}</div><p>Press any button to continue</p>`;
  document.body.append(el);
  tap.fn?.('ceremony', [el.className, el.dataset.theme, el.innerHTML, 3300, 11000]);
  if (sfx.on && host.settings.music) setTimeout(() => play('music-win'), 3600);
  // While the ceremony is up it swallows remote presses, so OK closes it instead of also pressing Play again underneath.
  const t0 = Date.now();
  const key = e => { e.preventDefault(); e.stopImmediatePropagation(); if (Date.now() - t0 > 4500) close(); };
  const close = () => { tap.fn?.('ceremonyOff', []); el.classList.add('out'); setTimeout(() => el.remove(), 500); removeEventListener('keydown', key, true); };
  el.onclick = close; addEventListener('keydown', key, true); ceremonyOff = () => { tap.fn?.('ceremonyOff', []); el.remove(); removeEventListener('keydown', key, true); ceremonyOff = null; };
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
  else if (Array.isArray(v.winners)) winners = v.winners.filter(n => host.players.some(p => p.name === n));
  winners.forEach(n => { row(n).wins++; row(n).pts = (row(n).pts || 0) + 3; });
  if (list && host.gameId !== 'imposter') list.slice(0, 3).forEach((p, i) => { if (!winners.includes(p.name)) row(p.name).pts = (row(p.name).pts || 0) + (i === 1 ? 2 : 1); });
  t.games.push({ game: game().meta.name, winners });
  save();
}
// What a phone needs to draw tonight's results as a picture to keep.
function nightCard() {
  const t = host.tally, face = n => host.players.find(p => p.name === n)?.face?.[0] || '';
  const top = Object.entries(t.by).sort((a, b) => (b[1].pts || 0) - (a[1].pts || 0) || b[1].wins - a[1].wins).map(([n, r]) => [n, r.pts || 0, face(n)]);
  return { date: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), top, games: t.games.map(g => [g.game, g.winners.join(' & ')]), count: t.games.length };
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
  el.innerHTML = `<h2>Tonight's awards</h2><div class="nawards">${awards.map(([title, n, note], i) => { const f = face(n); return `<div class="naward" style="animation-delay:${0.4 + i * 0.9}s"><small>${title}</small><i style="--pc:${f?.[1] || '#232a5c'}">${f?.[0] || '🏅'}</i><b>${esc(n)}</b><span>${esc(note)}</span></div>`; }).join('')}</div><div class="nlist">${t.games.map(g => `<span><b>${esc(g.game)}</b> ${g.winners.length ? esc(g.winners.join(' & ')) : '—'}</span>`).join('')}</div><p>📸 Everyone can save tonight's results from their phone, back on the menu. Press any button to close.</p>`;
  document.body.append(el);
  tap.fn?.('ceremony', [el.className, '', el.innerHTML, 0, 0]);
  const t0 = Date.now();
  const key = e => { e.preventDefault(); e.stopImmediatePropagation(); if (Date.now() - t0 > 1500) close(); };
  const close = () => { tap.fn?.('ceremonyOff', []); el.remove(); removeEventListener('keydown', key, true); };
  el.onclick = close; addEventListener('keydown', key, true); ceremonyOff = () => { el.remove(); removeEventListener('keydown', key, true); ceremonyOff = null; };
  if (sfx.on) { play('fanfare'); setTimeout(() => play('cheer'), 600); }
  setTimeout(confetti, 500);
  say(hostLine('awards') + ' ' + awards.map(a => `${a[0].replace(/^\S+ /, '')}: ${a[1]}.`).join(' '));
}

// Team games: everyone has a side from the moment they sit down (alternating, so the sides start even) and can
// change it on their phone until the game starts.
const TEAM_DEFAULT = ['Team Sun', 'Team Moon'], TEAM_ICON = ['☀️', '🌙'];
// A team can give itself a name on the join screen; until it does it is Team Sun or Team Moon.
const teamName = k => host.teamNames?.[k] || TEAM_DEFAULT[k];
const TEAM_NAMES = { map: fn => [0, 1].map(k => fn(`${TEAM_ICON[k]} ${teamName(k)}`, k)) };
function teamPick() {
  const t = (host.teamPick ||= {});
  for (const pid of Object.keys(t)) if (!host.players.some(p => p.pid === pid)) delete t[pid];
  for (const p of host.players) if (t[p.pid] !== 0 && t[p.pid] !== 1) { const c = [0, 1].map(k => host.players.filter(x => t[x.pid] === k).length); t[p.pid] = c[0] <= c[1] ? 0 : 1; }
  return t;
}
function startGame(again) {
  if (locked(host.gameId)) { host.screen = 'gather'; return changed(); }   // not bought: the join screen shows how to unlock it
  // First time this room plays the game: explain it and wait for everyone before anything starts.
  if (!host.intro && !again && wantsIntro()) { host.intro = { id: host.gameId, ready: {}, at: Date.now() }; if (sfx.on) play('whoosh'); return changed(); }   // the game's own theme sting plays when it actually starts
  host.intro = null;
  host.paused = 0;
  // The audience gets promoted into open seats for the next game.
  while (host.audience.length && host.players.length < game().meta.max) host.players.push(host.audience.shift());
  const prev = host.state && host.state.game === host.gameId ? host.state : host.lastByGame?.[host.gameId];
  host.state = game().setup(host.players, Math.random, prev, { short: !!host.settings.short, ...(host.opts?.[host.gameId] || {}), ...(game().meta.teams ? { teams: { ...teamPick() }, teamNames: [teamName(0), teamName(1)] } : {}), custom: (host.custom || []).map(c => c.text) });
  if (host.gameId === 'funny') host.custom = [];
  introArt = true;
  lastEventId = 0; popped.clear(); gains = {}; places = {}; stands = {}; lastScore = {}; finalRound = false; finalSaid = false;
  host.played = { ...(host.played || {}), [host.gameId]: (host.played?.[host.gameId] || 0) + 1 }; host.counted = false;
  lastPhase = ''; saidLead = false;
  changed();
  setTimeout(() => banter(again ? 'again' : 'start'), 400);
}

function hostAction(a) {
  if (a === 'start') return startGame();
  if (a === 'again') return startGame(true);
  if (a.startsWith('night:')) { const nt = NIGHTS.find(x => x.id === a.slice(6)); if (nt) { host.queue = nt.games.slice(1); host.night = nt.id; host.gameId = nt.games[0]; host.screen = 'gather'; save(); } return changed(); }
  if (a === 'endnight') { host.queue = []; host.night = null; save(); return render(); }
  if (a === 'lobby' && host.intro && !host.state) { host.intro = null; host.screen = 'gather'; save(); return changed(); }
  if (a.startsWith('playnext:') && GAMES[a.slice(9)]) { host.lastByGame = { ...(host.lastByGame || {}), [host.gameId]: host.state }; host.state = null; ceremonyOff?.(); if (host.queue?.[0] === a.slice(9)) host.queue.shift(); host.gameId = a.slice(9); host.screen = 'gather'; stopAmbient(); document.body.classList.remove('day'); return changed(); }
  if (a === 'lobby') { menuAt = null; host.lastByGame = { ...(host.lastByGame || {}), [host.gameId]: host.state }; host.state = null; ceremonyOff?.(); if (host.queue?.length) { host.gameId = host.queue.shift(); host.screen = 'gather'; } else { host.night = null; host.screen = 'menu'; } stopAmbient(); document.body.classList.remove('day'); return changed(); }
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
    if (!host.paused) { host.paused = Date.now(); stopAmbient(); say(hostLine('pause')); }
    else { const ms = Date.now() - host.paused; shiftTimes(host.state, ms); stretchedFor += ms; host.paused = 0; say(hostLine('resume')); }
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
  if (a === 'autonext') { host.settings.auto = host.settings.auto === false; save(); return render(); }
  if (a === 'share') { host.settings.share = host.settings.share === false; save(); return render(); }
  if (a === 'banter') { host.settings.banter = host.settings.banter === false; save(); return render(); }
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
    const used = new Set(host.players.map(p => (DEMO ? 'Bot ' : '') + p.name));
    const name = BOT_NAMES.find(n => !used.has(n)) || 'Bot ' + (host.players.length + 1);
    host.players.push({ pid: 'bot-' + Math.random().toString(36).slice(2, 8), name: DEMO ? name.replace(/^Bot /, '') : name, bot: true });
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
let pickTimer = 0;
function runBots() {
  const g = game();
  if (!host.state || !g.botAct) return;
  const now = Date.now();
  let acted = false;
  for (const p of host.players) {
    if (!p.bot) continue;
    const a = g.botAct(g.phoneView(host.state, p.pid));
    const key = host.state.phase + host.state.round;
    // Some bots only act on a coin flip. A 'no' before their wait is up must not restart the wait, or they'd never act.
    if (!a) { if (!botWait[p.pid] || botWait[p.pid].key !== key || now >= botWait[p.pid].at) delete botWait[p.pid]; continue; }
    if (!botWait[p.pid] || botWait[p.pid].key !== key) botWait[p.pid] = { key, at: now + (DEMO ? 1200 + Math.random() * 2600 : 2000 + Math.random() * 6000) };
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
const ICONS = { pindrop: '📍', topspot: '🥇', werewolf: '🐺', imposter: '🕵️', bluff: '🤥', whosaid: '💬', ducks: '🐐', trivia: '🧠', spin: '🎡', crowd: '📊', bingo: '🎱', quick: '⚡', ladder: '🪜', cases: '💼', funny: '😂', letters: '🔤', taboo: '🚫', agents: '🕶️', sketch: '✏️', meld: '🧿', bowl: '🥗', crew: '🤝', charades: '🎭', clash: '🃏', blackjack: '♠️', gofish: '🐟', bluffcards: '🎴', hearts: '♥️', shade: '🎨', estimate: '🎯', truths: '🤞', wordhunt: '🔎', midnight: '🌙', missions: '🗝️', dares: '😈', split: '✂️', doodle: '🖼️', memory: '🧩', copycat: '🐱', hunt: '🌈', freeze: '🧊', haunted: '👻', bomb: '💣', potato: '🥔', mystery: '💎', bracket: '🏆', faker: '🤫', meter: '📈', rebus: '🧩' };

// Each game lives in its own visual world: a color scheme, a background and a headline typeface. Games not listed keep the night village.
const THEME_OF = {};
Object.entries({
  comic: ['funny', 'bracket', 'split', 'dares', 'bluffcards', 'topspot'], paper: ['bluff', 'truths', 'whosaid', 'meter', 'letters', 'pindrop'], sketch: ['sketch', 'doodle', 'shade'],
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
  if (q('#pvname')) { q('#pvname').textContent = m.name; q('#pvicon').innerHTML = thumb(id, ICONS[id]); q('#pvblurb').textContent = m.blurb; q('#pvtags').innerHTML = `<span>👥 ${m.min}–${m.max} players</span>${m.best ? `<span>⭐ Best with ${m.best}</span>` : ''}${m.mins ? `<span>⏱ About ${m.mins} min</span>` : ''}${m.mood ? `<span>${esc(m.mood)}</span>` : ''}${m.kids ? '<span>🧒 Little kids</span>' : ''}`; }
  previewStep(true);
}
function previewStep(first) {
  const el = app.querySelector('.pvstage');
  if (!el || !pv || host.state) return;
  if (!el.offsetParent) return;   // the preview box isn't shown on this screen size: don't play a game nobody can see
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

// Players in the menu's top bar: only whole names are shown; the rest become a "+3" count, so a name is never cut off by the buttons.
let hubRowsKey = '';
function fitJoined() {
  const jd = app.querySelector('.joined');
  if (jd) { const edge = jd.getBoundingClientRect().right, faces = [...jd.querySelectorAll('.jface')]; let hid = 0; faces.forEach(f => { if (f.getBoundingClientRect().right > edge - 1) { f.hidden = true; hid++; } }); if (hid) { let k = faces.length - hid; const more = document.createElement('span'); more.className = 'jmore'; jd.append(more); const fit = () => { more.textContent = `+${faces.length - k}`; return more.getBoundingClientRect().right <= edge; }; while (!fit() && k > 0) faces[--k].hidden = true; } }
}
function renderLobby() {
  const g = game();
  const n = host.players.length;
  const need = Math.max(0, g.meta.min - n);
  const url = joinUrl();
  const screen = host.screen || 'menu';
  const nightbar = (() => { const nt = NIGHTS.find(x => x.id === host.night); return nt ? `<div class="nightbar"><b>${nt.icon} ${esc(nt.name)}</b><span>Now: <b>${esc(g.meta.name)}</b>${host.queue?.length ? ` · Then: ${host.queue.map(id => esc(GAMES[id].meta.name)).join(' → ')}` : ' · last game'}</span></div>` : ''; })();
  if (screen === 'menu') {
    // The hub: a big hero for the game in focus (its painted cover behind, a live preview beside), and rows of cover
    // cards underneath, one row per kind of game. The remote moves through the cards; rows slide, nothing scrolls by hand.
    if (!GAMES[host.gameId]) host.gameId = 'werewolf';
    const rows = SHELVES.filter(f => f.games).map(f => ({ id: f.id, name: f.name, games: f.games.filter(id => GAMES[id]) }));
    if (!menuAt || !rows.some(r => r.id === menuAt.row && r.games.includes(menuAt.game))) { const r = rows.find(x => x.games.includes(host.gameId)) || rows[0]; menuAt = { row: r.id, game: r.games.includes(host.gameId) ? host.gameId : r.games[0] }; }
    const card = (id, row) => { const m = GAMES[id].meta; return `<button class="gcard ${menuAt.row === row && menuAt.game === id ? 'on' : ''}" data-game="${id}" data-row="${row}"><span class="gimg">${thumb(id, ICONS[id])}</span><b>${esc(m.name)}</b><small class="gfacts">${m.min}–${m.max} · ${m.mins} min</small>${locked(id) ? '<small class="glock" title="Locked">🔒</small>' : ''}${m.kids ? '<small class="gbadge">🧒</small>' : ''}${watching() && SAME_ROOM.includes(id) ? '<small class="sameroom">🏠 same room</small>' : ''}</button>`; };
    const barHtml = `<div class="joinbox">${host.settings.streamer ? '' : `<div class="qr">${qr(joinUrl())}</div>`}<div class="jtext"><small>${n ? 'Join on your phone' : 'Scan to join, or go to'}</small><span class="jurl">${esc(joinHost())}</span><b class="code mini">${host.settings.streamer ? '••••' : host.code}</b></div></div>
        <div class="joined">${host.players.length ? host.players.map(p => `<span class="jface ${p.away ? 'away' : ''}" style="--pc:${p.face?.[1] || '#232a5c'}"><i>${p.face?.[0] || '🙂'}</i><em>${esc(p.name)}</em></span>`).join('') : '<span class="jwait">Waiting for the first player…</span>'}</div>
        <div class="herobtns"><button class="btn ghost small" data-host="settings">⚙ Settings</button>${tq.has('local') || host.players.some(p => p.bot) ? '<button class="btn ghost small" data-host="addbot">🤖 Add a bot</button>' : ''}${host.tally?.games.length ? '<button class="btn ghost small" data-host="awards">🏆 Awards</button>' : ''}</div>`;
    const rowsHtml = `${rows.map(r => `<div class="grow" data-row="${r.id}"><h3>${esc(r.name)}</h3><div class="rail">${r.games.map(id => card(id, r.id)).join('')}</div></div>`).join('')}
      <div class="grow" data-row="nights"><h3>🌙 Ready-made nights</h3><div class="rail">${NIGHTS.map(x => `<button class="gcard night" data-host="night:${x.id}"><span class="gimg nightimg"><i>${x.icon}</i></span><b>${esc(x.name)}</b><small class="nightsub">${esc(x.blurb)}</small></button>`).join('')}</div></div>`;
    // Someone joining, leaving or dozing off only changes the top bar. If the game rows are the same as what is on
    // screen, just the bar is swapped: the rows keep their place, their pictures and the highlight (no jump to the top).
    const rowsKey = rowsHtml.replace(/class="gcard on"/g, 'class="gcard "');
    const oldBar = app.querySelector('.hub .herobar');
    if (oldBar && hubRowsKey === rowsKey) {
      const had = document.activeElement?.closest?.('.herobar') ? document.activeElement.dataset.host : null;
      oldBar.innerHTML = barHtml; fitJoined();
      if (had) (oldBar.querySelector(`[data-host="${had}"]`) || app.querySelector('.gcard.on'))?.focus({ preventScroll: true });
      host.players.forEach(p => seen.add(p.pid));
      return;
    }
    hubRowsKey = rowsKey;
    app.innerHTML = `<div class="hub">
    <section class="hero" id="hero">
      <div class="heroinfo">
        <div id="pvtags" class="pvtags"></div>
        <h2 id="pvname"></h2>
        <p id="pvblurb"></p>
        <div class="heroact"><span class="playhint">▶ Press OK to play</span><span id="pvicon" hidden></span></div>
      </div>
      <div class="pvbox"><div class="pvstage" inert aria-hidden="true"></div><span class="pvlabel">Live preview</span></div>
      <div class="herobar">
      ${barHtml}</div>
    </section>
    <section class="grows" id="grows">
      ${rowsHtml}
    </section>
  </div>`;
    const hero = app.querySelector('#hero');
    // Bring a card's row to the top of the rows area and the card itself toward the middle of its row.
    const show = (c, smooth) => {
      const row = c.closest('.grow'), rail = c.closest('.rail'), box = app.querySelector('#grows'), behavior = smooth && !document.body.classList.contains('lite') ? 'smooth' : 'instant';
      box.scrollTo({ top: Math.max(0, row.offsetTop - 2), behavior });
      rail.scrollTo({ left: Math.max(0, c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2), behavior });
    };
    const pickNow = id => { hero.style.setProperty('--art', `url("${new URL(`art/${id}.jpg`, location.href).href}")`); if (pv?.id !== id || !app.querySelector('.pvstage').firstChild) { host.gameId = id; previewGame(id); } };
    // Moving along a row: the highlight and a click sound answer at once; the big picture and the live preview wait
    // until the highlight rests, so holding an arrow key never queues up a dozen picture loads.
    const pick = (id, now) => { clearTimeout(pickTimer); if (now) return pickNow(id); if (pv && pv.id !== id && sfx.on) play('pop'); pickTimer = setTimeout(() => { if (app.contains(hero)) pickNow(id); }, 240); };
    app.querySelectorAll('.gcard[data-game]').forEach(c => {
      c.onfocus = () => { menuAt = { row: c.dataset.row, game: c.dataset.game }; try { sessionStorage.setItem('pg-menu-at', JSON.stringify(menuAt)); } catch {} app.querySelectorAll('.gcard.on').forEach(x => x.classList.remove('on')); c.classList.add('on'); show(c, true); pick(c.dataset.game); };
      c.onmousemove = () => { if (pv?.id !== c.dataset.game) pick(c.dataset.game); };   // a real mouse move only: a row scrolling under a resting pointer must not change the game shown
    });
    app.querySelectorAll('.gcard.night').forEach(c => (c.onfocus = () => show(c, true)));
    pick(menuAt.game, true);
    const cur = app.querySelector('.gcard.on');
    if (cur) { show(cur, false); const ae = document.activeElement; if (!ae?.closest?.('.hub') || !ae.offsetParent) cur.focus({ preventScroll: true }); }   // back from a game: land on the game's card, not on whatever was last pressed
    fitJoined();
    host.players.forEach(p => seen.add(p.pid));
    return;
  }
  if (screen === 'settings') {
    app.innerHTML = `<div class="lobby one"><section class="panel settings"><h2>Settings</h2>
      <div class="setgrid">
        <div class="setgroup"><h3>Sound</h3>
          <button class="setrow ${voice.on ? 'on' : ''}" data-host="voice"><span><b>Narrator</b><small>The host voice that runs the show</small></span><em>${voice.on ? 'On' : 'Off'}</em></button>
          <button class="setrow ${host.settings.music ? 'on' : ''}" data-host="music"><span><b>Music</b><small>Background music in the lobby and games</small></span><em>${host.settings.music ? 'On' : 'Off'}</em></button>
          <button class="setrow ${sfx.on ? 'on' : ''}" data-host="sfx"><span><b>Sound effects</b><small>Buzzers, drumrolls and cheers</small></span><em>${sfx.on ? 'On' : 'Off'}</em></button>
          <button class="setrow ${host.settings.banter !== false ? 'on' : ''}" data-host="banter"><span><b>Host jokes</b><small>Extra one-liners between moments</small></span><em>${host.settings.banter === false ? 'Off' : 'On'}</em></button>
        </div>
        <div class="setgroup"><h3>Pace</h3>
          <button class="setrow ${host.settings.auto !== false ? 'on' : ''}" data-host="autonext"><span><b>Rounds move on by themselves</b><small>Turn off to press Next yourself</small></span><em>${host.settings.auto === false ? 'Off' : 'On'}</em></button>
          <button class="setrow ${host.settings.relaxed ? 'on' : ''}" data-host="relaxed"><span><b>Relaxed timers</b><small>Everyone gets 50% more time</small></span><em>${host.settings.relaxed ? 'On' : 'Off'}</em></button>
          <button class="setrow" data-host="short"><span><b>Game length</b><small>Short games for a quick night</small></span><em>${host.settings.short ? 'Short' : 'Full'}</em></button>
          <button class="setrow ${host.settings.howto ? 'on' : ''}" data-host="howto"><span><b>How-to screens</b><small>Explain each game the first time</small></span><em>${host.settings.howto ? 'First time' : 'Off'}</em></button>
        </div>
        <div class="setgroup"><h3>Room</h3>
          <button class="setrow ${host.settings.kids ? 'on' : ''}" data-host="kids"><span><b>Kids mode</b><small>Family-safe prompts only</small></span><em>${host.settings.kids ? 'On' : 'Off'}</em></button>
          <button class="setrow" data-host="remote"><span><b>Phone remote</b><small>Who can press Next and Pause from a phone</small></span><em>${remotePid() ? esc(host.players.find(p => p.pid === remotePid()).name) : host.settings.remote === false ? 'off' : 'first to join'}</em></button>
          <button class="setrow ${host.settings.share !== false ? 'on' : ''}" data-host="share"><span><b>Improve the surveys</b><small>Send the answers typed in survey games, with no names, to make the boards real</small></span><em>${host.settings.share === false ? 'Off' : 'On'}</em></button>
          <button class="setrow" data-host="streamer"><span><b>Room code</b><small>Hide it when sharing your screen</small></span><em>${host.settings.streamer ? 'Hidden' : 'Shown'}</em></button>
          <button class="setrow" data-host="newcode"><span><b>New room</b><small>Everyone has to join again</small></span><em>Change</em></button>
        </div>
      </div>
      <details class="settest" ${host.players.some(p => p.bot) ? 'open' : ''}><summary>Testing tools</summary><div class="row">
        <button class="btn ghost" data-host="testvoice">Test voice</button>
        <button class="btn ghost" data-host="addbot">Add a test bot</button><p class="muted small">Bots fill seats so you can try a game alone. They can't really draw or think, so leave them out of a real game night.</p>
        ${host.players.some(p => p.bot) ? '<button class="btn ghost" data-host="clearbots">Remove bots</button>' : ''}
        <span class="muted">Bots fill empty seats for testing. They play at random.</span>
      </div></details>
      <div class="row"><button class="btn" data-host="menu">← Back to games</button></div>
    </section></div>`;
    host.players.forEach(p => seen.add(p.pid));
    return;
  }
  // A game this TV hasn't unlocked: say what it belongs to and how to get it. The QR opens the account page on a
  // phone with this TV's id in it, so paying there unlocks it here. The TV checks every few seconds while this shows.
  if (locked(host.gameId)) {
    const m = game().meta, pack = packOf(host.gameId), money = n => '$' + n.toFixed(2), own = owned();
    app.innerHTML = `<div class="lobby gather unlock"><section class="panel join">
        <h2>Unlock on your phone</h2><div class="qr">${qr(accountUrl(pack?.id))}</div>
        <p class="muted">Scan to sign in and buy.<br>This TV unlocks by itself a few seconds later.</p>
        ${own.linked ? '<p class="muted small">This TV is linked to an account that doesn\'t have this game yet.</p>' : ''}
      </section>
      <section class="panel unlockinfo"><div class="unlockhead"><span class="unlockart">${art(host.gameId, ICONS[host.gameId])}</span>
        <div><p class="introkick">🔒 ${esc(pack?.name || 'Locked')}</p><h2>${esc(m.name)}</h2><p class="lead">${esc(m.blurb)}</p></div></div>
        <div class="unlockways">
          <div><b>${money(PRICES.pack)}</b><span>${esc(pack?.name || 'This pack')}: ${pack?.games.length || ''} games, yours to keep</span></div>
          <div><b>${money(PRICES.everything)}</b><span>Everything: all ${PACKS.length} packs, yours to keep</span></div>
          <div><b>${money(PRICES.passMonth)}<small>/month</small></b><span>Party Pass: every game, plus new ones</span></div>
        </div>
        <p class="muted small">Only the host buys. Players never pay.</p>
        <div class="row"><button class="btn" data-host="menu">← Back to games</button></div>
      </section></div>`;
    watchUnlock();
    return;
  }
  app.innerHTML = `<div class="lobby gather">
    <section class="panel join">
      <h2>Join on your phone</h2>
      <p class="muted">Go to <b class="url">${esc(url.replace(/\?.*/, '').replace(/^https?:\/\//, '').replace(/\/play\.html$/, ''))}</b><br>and enter room code</p>
      <div class="code">${host.code}</div>
      <p class="muted">or scan</p>
      <div class="qr">${qr(url)}</div>
      <p class="muted remoteline">Someone far away? They join the same way, then tap <b>📺 Show TV</b> on their phone, or open <b>${esc(watchUrl().replace(/\?.*/, '').replace(/^https?:\/\//, ''))}</b> on a laptop.${watching() && SAME_ROOM.includes(host.gameId) ? ' <b>🏠 This game needs everyone in the same room.</b>' : ''}</p>
    </section>
    <section class="panel">
      ${(() => {
        // Seats around the campfire: everyone who has joined, plus open seats waiting to be filled.
        const total = Math.max(n, Math.min(g.meta.max, 8));
        const seat = (i, inner, cls, attrs = '') => { const a = ((i + 0.5) / total) * Math.PI * 2 - Math.PI / 2; return `<${attrs ? 'button' : 'div'} class="seat ${cls}" ${attrs} style="left:${(50 + 42 * Math.cos(a)).toFixed(1)}%;top:${(52 + 35 * Math.sin(a)).toFixed(1)}%;--d:${(i * 0.37) % 2}s">${inner}</${attrs ? 'button' : 'div'}>`; };
        return `<div class="ring n${Math.min(total, 12)}"><div class="fireflies">${Array.from({ length: 14 }, (_, k) => `<i style="left:${(k * 37) % 100}%;top:${(k * 53) % 100}%;animation-delay:${-(k * 0.9)}s"></i>`).join('')}</div>
          <div class="ringmid">${art(host.gameId, ICONS[host.gameId])}<h2>${esc(g.meta.name)}</h2><p>${n ? `${n} player${n === 1 ? '' : 's'} in` : 'Grab a seat!'}${need ? ` · need ${need} more` : ''}</p><button class="btn" data-host="start" ${need ? 'disabled' : ''}>${need ? 'Waiting…' : g.meta.teams ? 'Lock teams and start' : "Everybody's in!"}</button>${g.meta.teams && n ? `<div class="teamline">${TEAM_NAMES.map((nm, k) => `<span class="tl${k}">${esc(nm)} <b>${host.players.filter(p => teamPick()[p.pid] === k).length}</b></span>`).join('')}<small>Pick your team on your phone</small></div>` : ''}</div>
          ${Array.from({ length: total }, (_, i) => { const p = host.players[i]; return p
            ? seat(i, `<i style="--pc:${p.face?.[1] || '#232a5c'}">${p.face?.[0] || '🙂'}</i><b>${esc(p.name)}</b>${i === 0 ? '<em>👑</em>' : ''}`, `taken ${g.meta.teams ? 'tm' + teamPick()[p.pid] : ''} ${p.bot ? 'bot' : ''} ${p.away ? 'away' : ''} ${seen.has(p.pid) ? '' : 'pop'} ${editing === p.pid ? 'on' : ''}`, `data-host="edit:${esc(p.pid)}" title="Rename or remove"`)
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

// Remote screens: anyone far away can open watch.html with the room code and see this TV. The picture travels as the
// drawn page plus the sounds and effects, on its own channel so phones in the room never carry it.
let screenRoom = null, lastScreen = '', screenTimer = null, screenSeq = 0;
const watchers = {};
const watching = () => { const now = Date.now(); return Object.values(watchers).filter(t => now - t < 25000).length; };
tap.fn = (name, args) => { if (screenRoom && watching()) screenRoom.send({ t: 'fx', name, args }); };
function shareScreen(force) {
  if (!screenRoom || !watching()) return;
  clearTimeout(screenTimer);
  screenTimer = setTimeout(() => {
    const clone = app.cloneNode(true);
    clone.querySelectorAll('.pvstage').forEach(e => (e.innerHTML = ''));   // the lobby's moving preview stays on the TV
    clone.querySelectorAll('.clock').forEach(c => (c.textContent = ''));     // each screen runs its own clock from the deadline
    const b = document.body;
    const meta = { cls: b.className, theme: b.dataset.theme || '', game: b.dataset.game || '', deadline: host.state?.deadline || 0, paused: !!host.paused, bar: !document.getElementById('tbar')?.hidden, status: statusEl.textContent };
    const html = clone.innerHTML, key = html + JSON.stringify(meta);
    if (!force && key === lastScreen) return;
    lastScreen = key;
    screenRoom.send({ t: 'screen', n: ++screenSeq, now: Date.now(), html, ...meta });
  }, force ? 0 : host.state ? 120 : 900);
}
function onScreenMsg(m) {
  if (!m || m.t !== 'watch' || typeof m.pid !== 'string') return;
  const isNew = !watchers[m.pid] || Date.now() - watchers[m.pid] > 25000;
  watchers[m.pid.slice(0, 40)] = Date.now();
  if (isNew && !host.state) render();
  if (isNew || m.need) shareScreen(true);
}
setInterval(() => shareScreen(), 1000);
const watchUrl = () => { const u = new URL('watch.html', location.href); u.search = ''; u.searchParams.set('code', host.code); if (new URLSearchParams(location.search).has('local')) u.searchParams.set('local', '1'); return u.toString(); };
// Games that only work when everyone is in the same room.
const SAME_ROOM = ['charades', 'faker', 'freeze', 'hunt', 'dares'];

function render() {
  voiceContext(host.players.map(p => p.name), host.state ? host.gameId : '');
  if (host.intro && host.state) host.intro = null;
  if (!host.state && host.intro) renderIntro();
  else if (!host.state) renderLobby();
  else { const v = tvView(); lastViewKey = viewKey(v); v.fresh = fresh; game().renderTV(v, app); if (fresh) wordsIn(); if (v.phase === 'over') afterParty(); decorate(); pops(fresh); guideTip(); slideScores(); cardPops(fresh); standings(v); }
  document.body.classList.toggle('night', host.state?.phase === 'night');
  // How-to screens show in full the first time a room plays a game, then get out of the way.
  quiet.on = !host.state;
  const onStage = host.state || host.intro;
  document.body.dataset.theme = onStage ? THEME_OF[host.gameId] || '' : '';
  document.body.dataset.game = onStage ? host.gameId : '';
  document.documentElement.style.overflow = onStage ? 'hidden' : '';   // a game screen never scrolls or widens the page
  document.body.classList.toggle('inlobby', !onStage);
  document.body.classList.toggle('onstage', !!onStage);
  document.body.classList.toggle('hubmode', !onStage && (host.screen || 'menu') === 'menu');
  // Lobby music plays on the menu and the join screen, and stops when a game starts.
  if (!onStage && host.settings.music && sfx.on) startLoop('music-lobby'); else stopLoop('music-lobby');
  document.body.classList.toggle('streamer', !!host.settings.streamer);
  document.body.classList.toggle('nodraw', !!host.blurDraw);
  document.body.classList.toggle('nohow', !host.settings.howto || (host.played?.[host.gameId] || 0) > 1);
  const badge = document.getElementById('aud') || Object.assign(document.createElement('div'), { id: 'aud' });
  if (!badge.isConnected) document.body.append(badge);
  badge.hidden = !host.audience.length && !watching();
  badge.textContent = [host.audience.length ? `👥 ${host.audience.length} watching` : '', watching() ? `📺 ${watching()} remote screen${watching() === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ');
  // The join code stays on screen all game, so anyone can join late or get back in after a dropped connection.
  let jq = document.getElementById('joinqr');
  if (!jq) { jq = Object.assign(document.createElement('div'), { id: 'joinqr' }); document.body.append(jq); }
  jq.hidden = !onStage || !!host.settings.streamer;
  if (!jq.hidden && jq.dataset.code !== host.code) { jq.dataset.code = host.code; jq.innerHTML = `<div class="qr">${qr(joinUrl())}</div><span>Join or rejoin<b>${host.code}</b></span>`; }
  let vb = document.getElementById('vetobar');
  if (!vb) { vb = Object.assign(document.createElement('div'), { id: 'vetobar' }); document.body.append(vb); }
  vb.hidden = !host.state;
  host.hidden = host.hidden || [];
  const isHidden = t => host.hidden.some(h => h.toLowerCase() === t.toLowerCase());
  vb.innerHTML = vetoOpen && host.state ? `<div class="vetopanel"><h3>Hide an answer</h3><p class="muted small">Tap anything players typed to hide it from the TV, phones and narrator. Tap again to show it.</p><div class="vetolist">${recentTexts.map((x, i) => `<button class="btn ghost ${isHidden(x.t) ? 'on' : ''}" data-host="hide:${i}">${isHidden(x.t) ? '🙈 ' : ''}${esc(x.t)} <small class="muted">${esc(x.name)}</small></button>`).join('') || '<p class="muted">Nothing typed yet.</p>'}</div><button class="btn" data-host="veto">Done</button></div>` : `<button class="btn ghost vetobtn" data-host="pause">${host.paused ? '▶ Resume' : '⏸ Pause'}</button><button class="btn ghost vetobtn" data-host="veto">🙈 Hide an answer</button>${host.paused ? '<div class="pausecover"><b>Paused</b><span>Press Resume when everyone is back</span></div>' : ''}`;
  vetoExtras();
  vb.querySelectorAll('[data-host]').forEach(b => (b.onclick = () => hostAction(b.dataset.host)));
  app.querySelectorAll('[data-host]').forEach(b => (b.onclick = () => hostAction(b.dataset.host)));
  runBeats();
  autoNext();
  app.querySelectorAll('[data-game]').forEach(b => (b.onclick = () => { host.gameId = b.dataset.game; host.screen = 'gather'; host.queue = []; host.night = null; if (sfx.on) play('lockin'); flash('wipe'); changed(); }));
  app.querySelectorAll('[data-shelf]').forEach(b => (b.onclick = () => { host.shelf = b.dataset.shelf; save(); render(); }));
  if (!app.querySelector('.hub')) autofocus(app);
  // Scores sit along the bottom as a row of players when the game has a plain score list beside its panel.
  const stg = app.querySelector('.stage'), sc = stg && stg.children.length === 2 && stg.lastElementChild.matches('.scores') && !stg.lastElementChild.querySelector('.tscore') ? stg.lastElementChild : null;
  if (sc && onStage) { stg.classList.add('railed'); sc.classList.toggle('many', sc.querySelectorAll('.srow').length > 8); }
  stageFit(app, !!onStage);
  // Entrance animations and late-loading fonts change the height a moment after drawing: fit again once they settle.
  clearTimeout(refitA); clearTimeout(refitB);
  if (onStage) { refitA = setTimeout(() => stageFit(app, true), 700); refitB = setTimeout(() => stageFit(app, true), 3600); }
  shareScreen();
}

async function connect() {
  room?.close();
  lastSent = {};
  render();
  screenRoom?.close(); screenRoom = null;
  openRoom(host.code + '-tv', onScreenMsg).then(r => (screenRoom = r)).catch(() => {});
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
  // Music runs under the whole game, not only while a clock is counting: a turn-based game (GOAT Toss) or a screen
  // without a timer used to fall silent. Night scenes keep their own sounds; a few games make their own music.
  const wantsBed = s && !host.paused && s.phase !== 'over' && host.settings.music && sfx.on && !OWN_AUDIO.includes(host.gameId) && !document.body.classList.contains('night');
  if (!live) { barFor = 0; if (wantsBed) startBed('think'); else stopBed(); return; }
  if (s.deadline !== barFor) { barFor = s.deadline; barTotal = Math.max(1000, s.deadline - now); tbar.firstChild.style.transition = 'none'; tbar.firstChild.style.width = '100%'; void tbar.offsetWidth; }
  const left = s.deadline - now;
  tbar.firstChild.style.transition = 'width 1s linear';
  tbar.firstChild.style.width = Math.max(0, (100 * (left - 1000)) / barTotal) + '%';
  tbar.classList.toggle('hurry', left <= 10000);
  if (wantsBed) startBed(barTotal >= 12000 && left <= 10000 ? 'hurry' : 'think'); else stopBed();
}
setInterval(timerBar, 1000);

setInterval(() => {
  if (!host.state || host.paused) return;
  runBots();
  const before = JSON.stringify(host.state), expired = host.state.deadline && Date.now() >= host.state.deadline && !SECRET.includes(host.gameId), wasPhase = host.state.phase;
  game().tick(host.state, Date.now());
  if (JSON.stringify(host.state) !== before) { if (expired && host.state.phase !== wasPhase && host.state.phase !== 'over') banter('timesup', 0.5); return changed(); }
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
      if (left === 30) say(hostLine('thirty'));
      if (left === 14 && barTotal >= 40000) banter('waiting', 0.35);
    }
  }
}, 1000);

try { speechSynthesis.addEventListener('voiceschanged', () => { if (!host.state) render(); }); } catch {}

if (host.state) lastPhase = host.state.phase + host.state.round;
// What this TV owns: asked once at start, again whenever the menu is opened, and every few seconds on the unlock screen.
let unlockTimer = 0;
function watchUnlock() {
  if (unlockTimer) return;
  unlockTimer = setInterval(async () => {
    if (!(host.screen === 'gather' && !host.state && locked(host.gameId))) { clearInterval(unlockTimer); unlockTimer = 0; return; }
    await refreshOwn();
    if (!locked(host.gameId)) { clearInterval(unlockTimer); unlockTimer = 0; if (sfx.on) play('fanfare'); render(); }
  }, 4000);
}
if (SHOP) refreshOwn().then(() => { if (!host.state) render(); });

// The TV app's Back button asks this first. True means "handled": we stepped back a screen. During a game, and on the
// menu, it answers false and the app shows its own "press Back again to leave".
window.partyBack = () => {
  if (vetoOpen) { hostAction('veto'); return true; }
  if (!host.state && !host.intro && host.screen && host.screen !== 'menu') { hostAction('menu'); return true; }
  // In a game, Back is the way out: the first press asks ("Press Back again to end"), a second within four seconds ends it.
  if (host.state) { hostAction('endgame'); return true; }
  if (host.intro) { hostAction('lobby'); return true; }
  return false;
};

// TV boxes and smart TVs have weak graphics chips. On them the page drops its most expensive effects (blurs, soft
// shadows on moving pieces, the drifting background shapes); the games look the same otherwise.
if (/PartyNightTV|Android TV|GoogleTV|AFT[A-Z]|BRAVIA|SmartTV|SMART-TV|Tizen|Web0S|webOS|Roku|CrKey/i.test(navigator.userAgent) || tq.has('lite')) document.body.classList.add('lite');

connect();

// Demo mode for the website: bots play one game on a loop, with no host. See DEMO in ui.js.
if (DEMO && GAMES[DEMO]) {
  document.body.classList.add('demo');
  Object.assign(host, { gameId: DEMO, screen: 'gather', players: [] });
  Object.assign(host.settings, { howto: false, music: false });
  const m = GAMES[DEMO].meta, n = Math.max(m.min, Math.min(m.max, 6, (+String(m.best || '').match(/\d+/)?.[0] || 4) + 1));
  for (let i = 0; i < n; i++) hostAction('addbot');
  setTimeout(() => hostAction('start'), 500);
  let key = '', since = Date.now();
  setInterval(() => {
    const s = host.state, now = Date.now();
    if (!s) return;
    const k = s.phase + '|' + s.round + '|' + (s.eventId || '') + '|' + (s.deadline || 0);
    if (k !== key) { key = k; since = now; return; }
    if (s.phase === 'over') { if (now - since > 9000) { since = now; hostAction('again'); } return; }
    // A screen that waits for the host (a Ready button, a new turn) is moved on after a short read.
    const waiting = app.querySelector('.stage [data-host=next]') && !(s.deadline > now);
    if ((waiting && now - since > 7000) || now - since > 14000) { since = now; hostAction('next'); }   // long talks and timers are cut short
  }, 1000);
}

// A quiet lobby gets an occasional nudge from the host.
setInterval(() => { const now = Date.now(); if (!host.state && host.players.length && now - lastInput > 90000 && now - lastIdle > 240000) { lastIdle = now; banter('lobby'); } }, 20000);

// The intro never holds a room hostage: after 75 seconds the game starts anyway.
setInterval(() => { if (host.intro && !host.state && Date.now() - host.intro.at > 75000) startGame(); }, 3000);
