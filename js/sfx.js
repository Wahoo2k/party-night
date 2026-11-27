// Sound effects synthesized with Web Audio, so there are no audio files to load or license.
import { store } from './ui.js';

let ctx = null;
let master = null;
let on = store.get('pg-sfx') ?? true;
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

const SOUNDS = {
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

export function play(name) {
  if (!ready() || !SOUNDS[name]) return;
  try { SOUNDS[name](); } catch {}
}

// Quiet crickets under the night phase.
export function startAmbient() {
  if (!ready() || ambient) return;
  const id = setInterval(() => {
    if (!ready()) return;
    const t = Math.random() * 0.4;
    for (let i = 0; i < 3; i++) tone({ type: 'sine', f0: 4200 + Math.random() * 300, t: t + i * 0.07, dur: 0.04, vol: 0.025 });
  }, 900);
  ambient = id;
}
export function stopAmbient() { clearInterval(ambient); ambient = null; }

// Phones: a short buzz when it's your turn (Android; iPhones ignore it).
export const buzz = (p = 120) => { try { navigator.vibrate?.(p); } catch {} };

// A single note, for games that play tunes or patterns.
export function note(f, dur = 0.35, t = 0, type = 'triangle', vol = 0.35) { if (ready()) tone({ type, f0: f, dur, t, vol }); }

// A bouncy dance loop (Freeze Dance). Pentatonic melody over a simple bass and a click beat.
let music = null;
export function startMusic(seed = 0) {
  stopMusic();
  const mel = [523, 587, 659, 784, 880, 784, 659, 587, 523, 659, 784, 1047, 880, 784, 659, 523];
  const bass = [131, 131, 165, 165, 196, 196, 175, 175];
  let i = seed % 16;
  music = setInterval(() => {
    if (!ready()) return;
    if (i % 2 === 0) tone({ type: 'square', f0: bass[(i >> 1) % 8], dur: 0.22, vol: 0.12 });
    if ((i * 7 + seed) % 3 !== 0) tone({ type: 'triangle', f0: mel[(i * 5 + seed) % 16], dur: 0.2, vol: 0.18 });
    if (i % 4 === 0) noise({ dur: 0.05, vol: 0.12, freq: 4000, type: 'highpass' });
    i++;
  }, 200);
}
export function stopMusic() { clearInterval(music); music = null; }
