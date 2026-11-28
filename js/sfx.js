import { tap } from './tap.js';
import { rec } from './recorded.js';
// Sound effects synthesized with Web Audio, so there are no audio files to load or license.
import { store, DEMO } from './ui.js';

let ctx = null;
let master = null;
let on = DEMO ? false : store.get('pg-sfx') ?? true;
let ambient = null;

// Browsers only allow audio after a click or key press, so unlock on the first one.
function unlock() {
  if (ctx) { ctx.state === 'suspended' && ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  } catch { ctx = null; }
}
['pointerdown', 'keydown'].forEach(e => addEventListener(e, unlock, { passive: true }));

export const sfx = {
  get on() { return on; },
  set on(v) { on = v; store.set('pg-sfx', v); if (!v) stopAmbient(); },
};

const ready = () => on && ctx && ctx.state === 'running';
const now = () => ctx.currentTime;

function tone({ type = 'sine', f0, f1 = f0, t = 0, dur = 0.3, vol = 0.4, attack = 0.01, curve = 'exp', dest = master }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  const s = now() + t;
  o.frequency.setValueAtTime(f0, s);
  if (f1 !== f0) curve === 'exp' ? o.frequency.exponentialRampToValueAtTime(f1, s + dur) : o.frequency.linearRampToValueAtTime(f1, s + dur);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(vol, s + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  o.connect(g).connect(dest);
  o.start(s);
  o.stop(s + dur + 0.05);
  return o;
}

function noise({ t = 0, dur = 0.2, vol = 0.3, freq = 1200, q = 1, type = 'bandpass' }) {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  const s = now() + t;
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(vol, s + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
  src.connect(f).connect(g).connect(master);
  src.start(s);
}

// A wolf howl: a rising then falling sine with vibrato, plus a softer echo.
function howl(t = 0, scale = 1, vol = 0.35) {
  const o = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  const g = ctx.createGain();
  const s = now() + t;
  o.type = 'sine';
  o.frequency.setValueAtTime(330 * scale, s);
  o.frequency.exponentialRampToValueAtTime(620 * scale, s + 0.6);
  o.frequency.setValueAtTime(620 * scale, s + 1.4);
  o.frequency.exponentialRampToValueAtTime(380 * scale, s + 2.4);
  lfo.frequency.value = 5.5;
  lg.gain.value = 9;
  lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(vol, s + 0.35);
  g.gain.setValueAtTime(vol, s + 1.6);
  g.gain.exponentialRampToValueAtTime(0.0001, s + 2.5);
  o.connect(g).connect(master);
  o.start(s); lfo.start(s);
  o.stop(s + 2.6); lfo.stop(s + 2.6);
}

// A crowd of villagers, made from shaped noise: used for the reaction beat after a reveal.
function crowd({ t = 0, dur = 1.4, vol = 0.22, lo = 700, hi = 2600, rise = true }) {
  for (let i = 0; i < 7; i++) noise({ t: t + i * (dur / 9), dur: dur * 0.55, vol: vol * (rise ? 0.5 + i / 12 : 1 - i / 10), freq: lo + ((hi - lo) * (rise ? i : 6 - i)) / 6, q: 0.8 });
}
const SOUNDS = {
  cheer() { crowd({}); [784, 988, 1175, 1568].forEach((f, i) => tone({ type: 'triangle', f0: f, t: 0.15 + i * 0.09, dur: 0.5, vol: 0.12 })); },
  groan() { crowd({ dur: 1.1, vol: 0.16, lo: 300, hi: 900, rise: false }); tone({ type: 'sawtooth', f0: 220, f1: 130, dur: 0.9, vol: 0.1, curve: 'lin' }); },
  gasp() { noise({ dur: 0.35, vol: 0.25, freq: 2400, q: 0.6 }); noise({ t: 0.05, dur: 0.5, vol: 0.12, freq: 1200, q: 0.5 }); },
  laugh() { for (let i = 0; i < 6; i++) { noise({ t: i * 0.13, dur: 0.09, vol: 0.16, freq: 1100 + (i % 2) * 500, q: 1.2 }); tone({ type: 'triangle', f0: 520 - i * 30, t: i * 0.13, dur: 0.08, vol: 0.08 }); } },
  stamp() { tone({ type: 'sine', f0: 140, f1: 60, dur: 0.22, vol: 0.5 }); noise({ dur: 0.12, vol: 0.3, freq: 300, type: 'lowpass' }); },
  whoosh() { noise({ dur: 0.35, vol: 0.2, freq: 900, q: 0.4 }); tone({ type: 'sine', f0: 300, f1: 1400, dur: 0.3, vol: 0.05 }); },
  pop() { tone({ type: 'sine', f0: 500, f1: 1100, dur: 0.09, vol: 0.25 }); },
  lockin() { tone({ type: 'triangle', f0: 740, dur: 0.07, vol: 0.14 }); tone({ type: 'triangle', f0: 1110, t: 0.06, dur: 0.1, vol: 0.12 }); },
  points() { [660, 880, 1320].forEach((f, i) => tone({ type: 'triangle', f0: f, t: i * 0.07, dur: 0.25, vol: 0.16 })); },
  fanfare() { [523, 523, 659, 784, 1047].forEach((f, i) => tone({ type: 'square', f0: f, t: [0, 0.16, 0.32, 0.48, 0.72][i], dur: i === 4 ? 1.1 : 0.15, vol: 0.13 })); [262, 330, 392].forEach(f => tone({ type: 'triangle', f0: f, t: 0.72, dur: 1.1, vol: 0.1 })); },
  night() { howl(0, 1, 0.32); howl(0.5, 0.85, 0.14); tone({ type: 'sine', f0: 110, dur: 3, vol: 0.12, attack: 0.8 }); },
  dawn() { // rooster-ish crow then a bright chime
    tone({ type: 'sawtooth', f0: 500, f1: 900, dur: 0.18, vol: 0.18 });
    tone({ type: 'sawtooth', f0: 900, f1: 1100, t: 0.18, dur: 0.5, vol: 0.18, curve: 'lin' });
    tone({ type: 'sawtooth', f0: 1100, f1: 600, t: 0.68, dur: 0.35, vol: 0.15 });
    [784, 988, 1175].forEach((f, i) => tone({ type: 'triangle', f0: f, t: 1.2 + i * 0.12, dur: 1, vol: 0.2 }));
  },
  death() { [196, 185, 147].forEach((f, i) => tone({ type: 'triangle', f0: f, t: i * 0.45, dur: 0.9, vol: 0.3 })); noise({ t: 0, dur: 0.5, vol: 0.15, freq: 200, type: 'lowpass' }); },
  safe() { [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f0: f, t: i * 0.1, dur: 0.6, vol: 0.22 })); },
  vote() { tone({ type: 'square', f0: 880, dur: 0.12, vol: 0.12 }); tone({ type: 'square', f0: 660, t: 0.15, dur: 0.18, vol: 0.12 }); },
  drumroll() { for (let i = 0; i < 26; i++) noise({ t: i * 0.06, dur: 0.08, vol: 0.12 + i * 0.008, freq: 180, q: 0.7 }); noise({ t: 1.6, dur: 0.6, vol: 0.4, freq: 120, type: 'lowpass' }); },
  tick() { tone({ type: 'square', f0: 1400, dur: 0.05, vol: 0.08 }); },
  join() { tone({ type: 'triangle', f0: 660, dur: 0.12, vol: 0.2 }); tone({ type: 'triangle', f0: 990, t: 0.1, dur: 0.2, vol: 0.2 }); },
  win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ type: 'square', f0: f, t: i * 0.14, dur: i === 5 ? 0.9 : 0.16, vol: 0.12 })); },
  lose() { howl(0, 1.1, 0.35); [392, 370, 349, 330].forEach((f, i) => tone({ type: 'triangle', f0: f, t: 0.6 + i * 0.35, dur: 0.6, vol: 0.2 })); },
};

const lastTake = {};
const VARY = new Set(['pop', 'stamp', 'tick', 'lockin', 'points', 'vote', 'join', 'safe', 'whoosh', 'lose', 'death', 'thud', 'bleat', 'cup-shake']);
export function play(name) {
  if (!quiet.on) tap.fn?.('play', [name]);
  if (!ready()) return;
  // A recorded effect, when one has been made for this name; the synthesized one otherwise.
  if (rec.sfx.has(name)) {
    // A sound can have extra takes on file (fanfare-2, fanfare-3…). One is picked at random, never the same twice running.
    const takes = [name]; for (let i = 2; rec.sfx.has(`${name}-${i}`); i++) takes.push(`${name}-${i}`);
    let pick = takes[Math.floor(Math.random() * takes.length)];
    if (takes.length > 1 && pick === lastTake[name]) pick = takes[(takes.indexOf(pick) + 1) % takes.length];
    lastTake[name] = pick;
    // Short effects also shift a little in pitch and speed each time, so a pop heard twenty times is never quite
    // the same pop. Longer, musical pieces (fanfares, stings, crowd sounds) are left as recorded.
    try { const a = new Audio(`audio/sfx/${pick}.mp3`); a.volume = 0.8; if (VARY.has(name)) { a.preservesPitch = false; a.playbackRate = 0.9 + Math.random() * 0.22; } a.play().catch(() => {}); return; } catch {}
  }
  if (!SOUNDS[name]) return;
  try { SOUNDS[name](); } catch {}
}

// Quiet crickets under the night phase.
export function startAmbient() {
  if (startLoop('bed-night')) return;
  if (!ready() || ambient) return;
  const id = setInterval(() => {
    if (!ready()) return;
    const t = Math.random() * 0.4;
    for (let i = 0; i < 3; i++) tone({ type: 'sine', f0: 4200 + Math.random() * 300, t: t + i * 0.07, dur: 0.04, vol: 0.025 });
  }, 900);
  ambient = id;
}
export function stopAmbient() { clearInterval(ambient); ambient = null; stopLoop('bed-night'); }

// Phones: a short buzz when it's your turn (Android; iPhones ignore it).
export const buzz = (p = 120) => { try { navigator.vibrate?.(p); } catch {} };

// A single note, for games that play tunes or patterns.
// While the lobby's game preview is running, the games' own notes and music stay silent.
export const quiet = { on: false };
export function note(f, dur = 0.35, t = 0, type = 'triangle', vol = 0.35) { if (ready() && !quiet.on) tone({ type, f0: f, dur, t, vol }); }

// A bouncy dance loop (Freeze Dance). Pentatonic melody over a simple bass and a click beat.
let music = null;
export function startMusic(seed = 0) {
  stopMusic();
  if (quiet.on) return;
  // Four tunes at four speeds, picked by the round, so Freeze Dance isn't the same song every time (one is slow motion).
  const TUNES = [
    { ms: 200, mel: [523, 587, 659, 784, 880, 784, 659, 587, 523, 659, 784, 1047, 880, 784, 659, 523], bass: [131, 131, 165, 165, 196, 196, 175, 175] },
    { ms: 170, mel: [659, 784, 880, 988, 880, 784, 659, 587, 659, 880, 988, 1175, 988, 880, 784, 659], bass: [110, 110, 147, 147, 165, 165, 147, 147] },
    { ms: 240, mel: [392, 494, 587, 494, 440, 523, 659, 523, 392, 494, 587, 784, 659, 587, 494, 392], bass: [98, 98, 131, 131, 147, 147, 98, 98] },
    { ms: 330, mel: [523, 494, 440, 392, 440, 494, 523, 659, 587, 523, 494, 440, 392, 440, 494, 523], bass: [131, 131, 110, 110, 87, 87, 98, 98] },
  ];
  const { mel, bass, ms } = TUNES[Math.abs(seed) % TUNES.length];
  let i = seed % 16;
  music = setInterval(() => {
    if (!ready()) return;
    if (i % 2 === 0) tone({ type: 'square', f0: bass[(i >> 1) % 8], dur: 0.22, vol: 0.12 });
    if ((i * 7 + seed) % 3 !== 0) tone({ type: 'triangle', f0: mel[(i * 5 + seed) % 16], dur: 0.2, vol: 0.18 });
    if (i % 4 === 0) noise({ dur: 0.05, vol: 0.12, freq: 4000, type: 'highpass' });
    i++;
  }, ms);
}
export function stopMusic() { clearInterval(music); music = null; }

// A quiet thinking-music bed for phases where people are typing, drawing or deciding.
// 'hurry' is the same tune, faster and brighter, for the last ten seconds.
let bed = null, bedKind = '';
const BED = { think: { ms: 420, notes: [392, 0, 494, 587, 0, 494, 392, 0, 440, 0, 523, 659, 0, 523, 440, 0], bass: [98, 98, 110, 110] }, hurry: { ms: 210, notes: [523, 659, 784, 659, 523, 659, 784, 988, 587, 698, 880, 698, 587, 698, 880, 1047], bass: [131, 131, 147, 147] } };
export function startBed(kind = 'think') {
  if (rec.sfx.has('bed-' + kind)) { stopLoop(kind === 'think' ? 'bed-hurry' : 'bed-think'); clearInterval(bed); bed = null; bedKind = kind; startLoop('bed-' + kind); return; }
  if (bedKind === kind && bed) return;
  stopBed();
  const b = BED[kind] || BED.think;
  let i = 0;
  bedKind = kind;
  bed = setInterval(() => {
    if (!ready()) return;
    const f = b.notes[i % 16];
    if (f) tone({ type: 'sine', f0: f, dur: 0.32, vol: 0.07 }), tone({ type: 'triangle', f0: f * 2, dur: 0.12, vol: 0.025 });
    if (i % 4 === 0) tone({ type: 'sine', f0: b.bass[(i >> 2) % 4], dur: 0.5, vol: 0.09 });
    i++;
  }, b.ms);
}
export function stopBed() { clearInterval(bed); bed = null; bedKind = ''; stopLoop('bed-think'); stopLoop('bed-hurry'); }

// Recorded music. Each loop is a file in audio/sfx/ (listed in the manifest); with no file, nothing plays, except the
// thinking bed and night ambience, which keep their synthesized versions until recorded ones exist.
const loops = {};
let ducked = false;
const level = name => (name.startsWith('bed-') ? 0.35 : 0.5) * (ducked ? 0.35 : 1);
export function startLoop(name) {
  if (!ready() || !rec.sfx.has(name) || loops[name]) return !!loops[name];
  // Music can have extra takes on file too (music-lobby-2, bed-think-3…): each time a loop starts it is a different one.
  const takes = [name]; for (let i = 2; rec.sfx.has(`${name}-${i}`); i++) takes.push(`${name}-${i}`);
  let pick = takes[Math.floor(Math.random() * takes.length)];
  if (takes.length > 1 && pick === lastTake['loop:' + name]) pick = takes[(takes.indexOf(pick) + 1) % takes.length];
  lastTake['loop:' + name] = pick;
  try { const a = new Audio(`audio/sfx/${pick}.mp3`); a.loop = true; a.volume = level(name); a.play().catch(() => {}); loops[name] = a; return true; } catch { return false; }
}
export function stopLoop(name) { const a = loops[name]; if (a) { try { a.pause(); } catch {} delete loops[name]; } }
// Music drops under the narrator while a line is spoken.
export function duck(on) { ducked = !!on; for (const [n, a] of Object.entries(loops)) a.volume = level(n); }
tap.duck = duck;

// When the TV app goes to the background (another app is opened) or the page is hidden, everything goes silent:
// music and beds pause, effects and the narrator stop. It all picks up again when the page is back in front.
let hushed = false;
export function hush(on) {
  if (!!on === hushed) return; hushed = !!on;
  try { if (ctx) on ? ctx.suspend() : ctx.resume(); } catch {}
  for (const a of Object.values(loops)) { try { on ? a.pause() : a.play().catch(() => {}); } catch {} }
  const v = window.__voiceNow; try { if (v && !v.ended) on ? v.pause() : v.play().catch(() => {}); } catch {}
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => hush(document.hidden));
  window.partyHush = hush;   // the TV app calls this from its own pause and resume
}
