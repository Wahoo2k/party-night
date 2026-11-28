import { tap } from './tap.js';
import { rec, clipsFor, voiceFor } from './recorded.js';
// Shared helpers for the TV and phone pages.

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

// Demo mode (?demo=<game> on the TV page, used by the website): bots play one game on a loop. Nothing is saved or
// read from this browser, and it makes no sound, so it can't disturb a real room on the same device.
export const DEMO = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('demo') : null;
export const store = {
  get(k) { if (DEMO) return null; try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { if (DEMO) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { if (DEMO) return; try { localStorage.removeItem(k); } catch {} },
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
export const cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

// ---------- Narrator voice ----------
// Uses the device's built-in voices. Quality varies a lot by device, so rank them and
// pick the most natural English one, and let the host choose another.
let voiceOn = store.get('pg-voice') ?? true;
let chosen = store.get('pg-voice-name') || '';
const synth = () => (typeof speechSynthesis !== 'undefined' ? speechSynthesis : null);

function score(v) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (!/^en/i.test(v.lang)) return -100;
  if (/natural|neural|premium|enhanced|siri/.test(n)) s += 50;          // Edge/Windows neural, Apple premium/enhanced, Siri
  if (/google/.test(n)) s += 30;                                        // Chrome & Android Google voices
  if (/daniel|serena|ava|zoe|evan|nathan|tom|oliver|arthur|jamie|aria|guy|sonia|ryan/.test(n)) s += 15;
  if (/en-gb/i.test(v.lang)) s += 6;                                     // British narrators suit the spooky tone
  if (!v.localService) s += 4;
  if (/compact|espeak|zarvox|albert|bad news|bells|boing|bubbles|cellos|whisper|trinoids|wobble|jester|organ|superstar|grandpa|grandma|rocko|shelley|flo|eddy|reed|sandy/.test(n)) s -= 60; // novelty & low-quality voices
  return s;
}

export function voices() {
  const list = synth()?.getVoices() || [];
  return list.filter(v => score(v) > -100).sort((a, b) => score(b) - score(a));
}
function pickVoice() {
  const list = voices();
  return list.find(v => v.name === chosen) || list[0] || null;
}
try { synth()?.addEventListener?.('voiceschanged', () => {}); } catch {}

export const voice = {
  get on() { return voiceOn; },
  set on(v) { voiceOn = v; store.set('pg-voice', v); if (!v) try { synth()?.cancel(); } catch {} },
  get name() { return pickVoice()?.name || ''; },
  set name(n) { chosen = n; store.set('pg-voice-name', n); },
};

// The narrator. Lines play one at a time from a queue: a recorded clip when one exists for the line, the browser voice
// otherwise. Game narration is "high": it replaces anything waiting and cuts off older narration. Host banter is
// "low": it waits its turn, never interrupts, and is dropped if it can't start within a few seconds.
const queue = [];
let current = null;
function stopCurrent() {
  if (!current) return;
  try { current.audio?.pause(); } catch {}
  current = null; tap.duck?.(false);
}
function pump() {
  if (current) return;
  let item;
  while ((item = queue.shift())) { if (!item.low || Date.now() - item.at < 5000) break; }
  if (!item) return;
  current = item;
  tap.duck?.(true);
  const done = () => { if (current === item) { current = null; tap.duck?.(false); pump(); } };
  if (item.clips) {
    // One clip per sentence, played back to back.
    let i = 0;
    const next = () => {
      if (current !== item) return;
      if (i >= item.clips.length) return done();
      const a = (item.audio = new Audio(item.clips[i++]));
      window.__voiceNow = a;   // so the page can pause the narrator when it is hidden (see hush in sfx.js)
      a.onended = next; a.onerror = next;
      a.play().catch(next);
    };
    return next();
  }
  done();
}
export function say(text, force, low) {
  if (text) tap.fn?.('say', [String(text), !!low]);
  if (DEMO) return;
  if ((!voiceOn && !force) || !text) return;
  // Recorded clips only: a line with no recording is not spoken. The browser's own voice is never used.
  const clips = clipsFor(text);
  if (!clips.length) return;
  const item = { text: String(text), clips, low: !!low, at: Date.now() };
  if (low) { if (queue.length < 2) queue.push(item); }
  else {
    queue.length = 0;
    if (current && !current.low) stopCurrent();
    queue.push(item);
  }
  pump();
}
// Host banter: said only when the narrator is free.
export const sayLow = text => say(text, false, true);

// Arrow-key focus movement so the TV page works with a remote control (D-pad).
export function enableDpad(root = document) {
  root.addEventListener('keydown', e => {
    const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (!dir) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && dir[0]) return;
    const items = [...document.querySelectorAll('button:not([disabled]), [tabindex="0"], summary, input')].filter(el => el.offsetParent);
    if (!items.length) return;
    const cur = document.activeElement;
    if (!items.includes(cur)) { items[0].focus(); e.preventDefault(); return; }
    const a = cur.getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bestScore = Infinity;
    for (const el of items) {
      if (el === cur) continue;
      const b = el.getBoundingClientRect();
      const dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
      const along = dx * dir[0] + dy * dir[1];
      if (along <= 1) continue;
      const across = Math.abs(dx * dir[1] + dy * dir[0]);
      const score = along + across * 2;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) { best.focus(); e.preventDefault(); }
  });
}

// Focus the first sensible control after a re-render, unless the user is mid-typing.
export function autofocus(el) {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const b = el.querySelector('button.btn:not(.ghost):not([disabled])') || el.querySelector('button:not([disabled])');
  b?.focus({ preventScroll: true });
}

export function drawScene(svg) {
  let seed = 42;
  const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const starGroups = ['', '', ''];
  for (let i = 0; i < 90; i++) starGroups[i % 3] += `<circle cx="${(R() * 1200) | 0}" cy="${(R() * 170) | 0}" r="${(R() * 1.6 + 0.6).toFixed(1)}" fill="#fff" opacity="${(R() * 0.6 + 0.4).toFixed(2)}"/>`;
  const stars = starGroups.map((g, i) => `<g class="tw tw${i}">${g}</g>`).join('');
  let houses = '';
  [[150, 214, 70, 60], [240, 226, 56, 48], [700, 220, 64, 56], [790, 230, 48, 44], [1010, 216, 72, 58]].forEach(([x, y, w, h], i) => {
    houses += `<path d="M${x} ${y}h${w}v${300 - y}h-${w}Z M${x - 8} ${y}l${w / 2 + 8} -${h * 0.6} ${w / 2 + 8} ${h * 0.6}Z" style="fill:var(--house)"/><rect class="win w${i % 3}" x="${x + w / 2 - 7}" y="${y + 16}" width="14" height="16" rx="2" style="fill:var(--lamp)"/>`;
  });
  let pines = '';
  for (let i = 0; i < 16; i++) { const x = R() * 1200, s = 0.6 + R() * 0.9; pines += `<use href="#pine" transform="translate(${x.toFixed(0)} ${252 - s * 20}) scale(${s.toFixed(2)})"/>`; }
  let eyes = '';
  [[95, 262], [455, 258], [620, 266], [905, 260], [1140, 264]].forEach(([x, y], i) => {
    eyes += `<g class="eye e${i}" transform="translate(${x} ${y})"><ellipse cx="-5" cy="0" rx="2.6" ry="1.8"/><ellipse cx="5" cy="0" rx="2.6" ry="1.8"/></g>`;
  });
  // A wolf on the far hill, head up toward the moon.
  const wolf = `<g class="wolf" transform="translate(560 205)"><path d="M0 0c6-4 16-5 26-4l8-2 4-14 3 9 6-3-3 8 6 4-8 3-4 9c-2 6 0 14 3 19h-5l-4-12-12 2-3 10h-5l2-11-14 1-3 10h-5l2-12c-6-2-10-8-12-15l-6 4 3-7Z" style="fill:var(--house)"/></g>`;
  svg.innerHTML = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="1" style="stop-color:var(--sky2)"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient><path id="pine" d="M0 0 22 40H8L26 70H6L30 100H-30L-6 70H-26L-8 40H-22Z" style="fill:var(--hill2)"/></defs>
  <rect width="1200" height="300" fill="url(#g)"/><g class="stars">${stars}</g>
  <g class="moon"><circle cx="930" cy="90" r="120" fill="url(#glow)"/><circle cx="930" cy="90" r="54" style="fill:var(--moon)"/><circle cx="912" cy="78" r="9" fill="#000" opacity=".05"/><circle cx="948" cy="104" r="13" fill="#000" opacity=".04"/></g>
  <path d="M0 230Q300 170 600 220T1200 200V300H0Z" style="fill:var(--hill1)"/>${wolf}${houses}${pines}
  <g class="eyes">${eyes}</g>
  <g class="fog"><ellipse cx="300" cy="262" rx="420" ry="22"/><ellipse cx="1000" cy="270" rx="380" ry="18"/></g>
  <path d="M0 268Q400 240 800 262T1200 256V300H0Z" style="fill:var(--hill2)"/>`;
}

// Full-screen title card between phases.
export function titleCard(title, sub = '', tone = '', picture = '') {
  tap.fn?.('titleCard', [title, sub, tone, picture]);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelector('.tcard')?.remove();
  const el = document.createElement('div');
  // Each card arrives a different way (iris, sweep, curtain, diagonal), picked by its title so a game feels varied but not random.
  const kinds = ['iris', 'sweep', 'curtain', 'diag'];
  let h = 0; for (const ch of String(title)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  el.className = `tcard ${tone} tc-${kinds[h % kinds.length]}`;
  el.innerHTML = `<i class="tc-s s1"></i><i class="tc-s s2"></i><i class="tc-s s3"></i><div>${picture ? `<div class="tc-art">${picture}</div>` : ''}<h2>${String(title).split(' ').map((w, i) => `<span style="--i:${i}">${esc(w)}</span>`).join(' ')}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
  document.body.append(el);
  setTimeout(() => el.remove(), 3200);
}

// Confetti burst over the whole screen.
export function confetti(colors = ['#7fc8a9', '#f4e9c1', '#a9b8ff', '#ffcf6b', '#e2483d']) {
  tap.fn?.('confetti', []);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'fx';
  document.body.append(c);
  const W = (c.width = innerWidth * devicePixelRatio), H = (c.height = innerHeight * devicePixelRatio);
  const x = c.getContext('2d');
  const bits = Array.from({ length: 180 }, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 22, vy: -Math.random() * 26 - 8, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, s: (6 + Math.random() * 8) * devicePixelRatio, c: colors[Math.floor(Math.random() * colors.length)] }));
  const t0 = performance.now();
  const step = t => {
    x.clearRect(0, 0, W, H);
    for (const b of bits) { b.vy += 0.6; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr; x.save(); x.translate(b.x, b.y); x.rotate(b.r); x.fillStyle = b.c; x.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); x.restore(); }
    t - t0 < 4500 ? requestAnimationFrame(step) : c.remove();
  };
  requestAnimationFrame(step);
}

// Three claw slashes across the screen.
export function clawMarks() {
  tap.fn?.('clawMarks', []);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const d = document.createElement('div');
  d.className = 'claws';
  d.innerHTML = `<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">${[0, 1, 2].map(i => `<path d="M${260 + i * 150} 40 Q${330 + i * 150} 300 ${420 + i * 150} 560" style="animation-delay:${i * 0.12}s"/>`).join('')}</svg>`;
  document.body.append(d);
  setTimeout(() => d.remove(), 5000);
}

// The TV tells the narrator who is playing and which game is on, so recorded lines can be matched in the right voice.
export function voiceContext(names, game) { rec.names = names || []; rec.voice = voiceFor(game); }

// One screen, no scrolling: when what's drawn is taller than the window, the whole game area is scaled down just
// enough to fit (text re-wraps into the extra width that gives). Used by the TV page and the remote screen.
export function fitScreen(app) {
  if (!app) return 1;
  const fits = () => { const r = app.getBoundingClientRect(); return r.bottom <= innerHeight - 4 && r.right <= innerWidth + 1; };
  const b = document.body;
  app.style.zoom = ''; app.style.maxWidth = ''; app.style.width = ''; app.style.boxSizing = ''; b.classList.remove('compact');
  if (fits()) return 1;
  // First tighten the layout (smaller header, less padding, name lists side by side); only then scale down.
  b.classList.add('compact');
  if (fits()) return 1;
  // Shrinking frees width at the sides: let the game use it, so less shrinking is needed.
  // Then scale. Shrinking frees width at the sides, so try both letting the game spread into it (text and lists
  // re-flow wider and need less shrinking) and keeping its shape (better for boards that grow taller when wider).
  const search = spread => {
    const set = z => { app.style.zoom = z; app.style.maxWidth = spread ? 'none' : ''; app.style.width = spread ? 100 / z + '%' : ''; app.style.boxSizing = spread ? 'border-box' : ''; };
    let lo = 0.4, hi = 1;
    for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; set(mid); if (fits()) lo = mid; else hi = mid; }
    return { z: lo, set };
  };
  const a = search(true), k = search(false), best = a.z >= k.z ? a : k;
  best.set(best.z);
  return best.z;
}
// The stage: during a game the play area is laid out at a fixed design width and then scaled to fill the screen,
// up as well as down, so it looks the same on a TV box, a laptop and a big monitor. A few design widths are tried
// and the one that ends up largest on screen wins (tall boards prefer a wider layout).
let stageH = -1, stageRO = null;
let stageLast = null;
export function stageFit(app, on) {
  const st = app.style;
  // Content that grows or shrinks after it is drawn (a tip fading out, a list filling in) triggers a fresh fit.
  if (!stageRO && typeof ResizeObserver === 'function') { stageRO = new ResizeObserver(() => { if (document.body.classList.contains('onstage') && app.offsetHeight !== stageH) stageFit(app, true); }); stageRO.observe(app); }
  if (!on) { stageLast = null; st.transform = ''; st.width = ''; st.maxWidth = ''; st.position = ''; st.left = ''; st.top = ''; st.transformOrigin = ''; st.removeProperty('--vw'); st.removeProperty('--vh'); return fitScreen(app); }
  document.body.classList.remove('compact');
  st.zoom = ''; st.position = 'absolute'; st.left = '50%'; st.maxWidth = 'none'; st.transformOrigin = '50% 0'; st.transform = 'translateX(-50%)';
  const availW = innerWidth * 0.93, top = innerHeight * 0.05, availH = innerHeight * 0.9;
  // Sizes written in screen units (vw, vh) are measured against the design size inside the stage, not the real screen.
  const setUnits = w => { st.setProperty('--vw', w / 93 + 'px'); st.setProperty('--vh', (w / 0.93) * (innerHeight / innerWidth) / 100 + 'px'); };
  let best = null;
  // A game can ask for one design width (a wide table, say) with --stage-w on its .stage.
  const want = +getComputedStyle(app.firstElementChild || app).getPropertyValue('--stage-w') || 0;
  for (const w of want ? [want] : [1040, 1260, 1500]) {
    setUnits(w); st.width = w + 'px';
    // Layout height, not scroll height: something flying or popping in (a scaled-up stamp, a score chip changing places)
    // sticks out for a moment and must not make the whole stage shrink and jump for a frame.
    const h = Math.max(app.offsetHeight, 1), z = Math.min(availW / w, availH / h, 2.6);
    if (!best || z > best.z * 1.04) best = { w, h, z };   // biggest on screen wins; ties go to the narrower layout
  }
  setUnits(best.w); st.width = best.w + 'px';
  // Small changes in content height (a line of text more or less) don't re-zoom the stage: it only grows when there
  // is clearly more room, and always shrinks when it must, so the picture isn't seen breathing in and out.
  if (stageLast && stageLast.w === best.w && stageLast.iw === innerWidth && stageLast.ih === innerHeight && best.z >= stageLast.z && best.z < stageLast.z * 1.07) best.z = stageLast.z;
  // Keep clear of the join badge in the bottom-left corner: shrink just enough that the two don't overlap.
  const jq = document.getElementById('joinqr'), jr = jq && !jq.hidden ? jq.getBoundingClientRect() : null;
  if (jr && jr.width) {
    const left = (innerWidth - best.w * best.z) / 2, bottom = top + Math.max(0, availH - best.h * best.z) * 0.42 + best.h * best.z;
    if (left < jr.right + 8 && bottom > jr.top - 8) best.z = Math.min(best.z, Math.max((innerWidth - 2 * (jr.right + 8)) / best.w, (jr.top - 8 - top) / best.h));
  }
  // Short screens sit a little above the middle: the eye reads that as centered on a TV.
  st.top = Math.round(top + Math.max(0, availH - best.h * best.z) * 0.42) + 'px';
  st.transform = `translateX(-50%) scale(${best.z.toFixed(3)})`;
  stageH = app.offsetHeight;
  stageLast = { w: best.w, z: best.z, iw: innerWidth, ih: innerHeight };
  return best.z;
}
export function keepFitted(app) {
  let t = 0;
  const go = () => { clearTimeout(t); t = setTimeout(() => (document.body.classList.contains('onstage') ? stageFit(app, true) : fitScreen(app)), 30); };
  addEventListener('resize', go);
  app.addEventListener('load', go, true);   // pictures arriving late change the height
  return go;
}
