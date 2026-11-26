// Shared helpers for the TV and phone pages.

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
export const cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

let voiceOn = store.get('pg-voice') ?? true;
export const voice = {
  get on() { return voiceOn; },
  set on(v) { voiceOn = v; store.set('pg-voice', v); if (!v) try { speechSynthesis.cancel(); } catch {} },
};
export function say(text) {
  if (!voiceOn || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 0.9;
    speechSynthesis.speak(u);
  } catch {}
}

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
  let stars = '';
  for (let i = 0; i < 80; i++) stars += `<circle cx="${(R() * 1200) | 0}" cy="${(R() * 170) | 0}" r="${(R() * 1.6 + 0.6).toFixed(1)}" fill="#fff" style="opacity:calc(var(--star)*${(R() * 0.7 + 0.3).toFixed(2)})"/>`;
  let houses = '';
  [[150, 214, 70, 60], [240, 226, 56, 48], [700, 220, 64, 56], [790, 230, 48, 44], [1010, 216, 72, 58]].forEach(([x, y, w, h]) => {
    houses += `<path d="M${x} ${y}h${w}v${300 - y}h-${w}Z M${x - 8} ${y}l${w / 2 + 8} -${h * 0.6} ${w / 2 + 8} ${h * 0.6}Z" style="fill:var(--house)"/><rect x="${x + w / 2 - 7}" y="${y + 16}" width="14" height="16" rx="2" style="fill:var(--lamp)"/>`;
  });
  let pines = '';
  for (let i = 0; i < 16; i++) { const x = R() * 1200, s = 0.6 + R() * 0.9; pines += `<use href="#pine" transform="translate(${x.toFixed(0)} ${252 - s * 20}) scale(${s.toFixed(2)})"/>`; }
  svg.innerHTML = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="1" style="stop-color:var(--sky2)"/></linearGradient><path id="pine" d="M0 0 22 40H8L26 70H6L30 100H-30L-6 70H-26L-8 40H-22Z" style="fill:var(--hill2)"/></defs><rect width="1200" height="300" fill="url(#g)"/>${stars}<circle cx="930" cy="90" r="54" style="fill:var(--moon)"/><path d="M0 230Q300 170 600 220T1200 200V300H0Z" style="fill:var(--hill1)"/>${houses}${pines}<path d="M0 268Q400 240 800 262T1200 256V300H0Z" style="fill:var(--hill2)"/>`;
}
