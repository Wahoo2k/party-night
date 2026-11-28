// Player characters: chunky little clay figures. Each is a lump of modelling clay in a bold color, pressed into a
// shape (a block, a star, a drop, a mitten…), with a simple face stuck on. Shape, color and face are stepped through
// at different rates, so 20 seats get 20 plainly different characters. They have moods (happy, sad, wow) so a
// character can react to what happens to its player. The clay look (rounded, lit from the top left, a little
// rough) comes from SVG lighting filters, so there are no image files and it is sharp at any size.
//   avatar(i, mood)     -> SVG markup
//   avatarUrl(i, mood)  -> the same as a data: address for an <img>, remembered, so redrawing a screen costs nothing
const INK = '#221a3a';
const COLORS = ['#7b5cff', '#2f8cff', '#19b7e6', '#2fbf71', '#d8d23a', '#ff9a2e', '#ff5f52', '#e456c7', '#9aa3b2', '#a8693d', '#16b8a2', '#ffcf3f'];
// Each shape sits in a 120-wide, 120-tall box and carries where its face goes: [path, face x, face y, face scale].
const SHAPES = [
  ['M30 18h60c9 0 14 6 13 15l-5 62c-1 9-7 14-16 14H36c-9 0-15-5-16-14l-4-62c-1-9 4-15 14-15z', 60, 62, 1],                                   // block
  ['M60 12c9 0 12 14 20 18s24 0 28 10-10 18-12 28 6 26-2 32-22-6-34-6-26 12-34 6 0-22-2-32-16-18-12-28 20-6 28-10 11-18 20-18z', 60, 64, 0.82], // star
  ['M60 10c6 0 12 10 22 28 10 17 16 30 14 46-3 18-18 28-36 28s-33-10-36-28c-2-16 4-29 14-46C48 20 54 10 60 10z', 60, 72, 0.95],               // drop
  ['M58 12l40 22c7 4 10 10 9 18l-6 42c-1 9-8 14-17 14H38c-9 0-16-5-17-14l-6-42c-1-8 2-14 9-18l28-20c2-2 4-2 6-2z', 60, 66, 1],             // gem
  ['M24 34l10-22 16 16h20l16-16 10 22c6 10 8 22 8 34 0 26-16 42-44 42S16 94 16 68c0-12 2-24 8-34z', 60, 68, 1],                             // eared
  ['M78 12c-30 2-52 22-52 52s22 46 50 44c12-1 22-6 28-14-10 4-26 2-36-10s-12-30-6-44c4-10 10-18 16-28z', 52, 62, 0.72],                     // moon
  ['M34 30c0-10 8-16 18-16s16 6 18 14c2-4 8-8 16-6 10 2 14 10 14 20v44c0 14-10 24-24 24H44c-14 0-24-10-24-24V46c0-8 6-14 14-16z', 60, 70, 0.98], // mitten
  ['M60 10l42 24c6 3 8 8 8 14v30c0 6-2 11-8 14l-42 22-42-22c-6-3-8-8-8-14V48c0-6 2-11 8-14z', 60, 62, 0.98],                              // hexagon
  ['M60 14c26 0 46 12 46 34 0 10-6 16-6 26 0 22-16 36-40 36s-40-14-40-36c0-10-6-16-6-26 0-22 20-34 46-34z', 60, 64, 1.02],                 // potato
  ['M60 12c14 0 22 10 26 24 16 2 26 14 26 30 0 20-16 42-52 42S8 86 8 66c0-16 10-28 26-30 4-14 12-24 26-24z', 60, 70, 1],                   // hill
];
const eyeball = (x, y, r, px, py) => `<circle cx="${x}" cy="${y + 1.5}" r="${r}" fill="#0004"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + px}" cy="${y + py}" r="${r * 0.5}" fill="${INK}"/><circle cx="${x + px - r * 0.16}" cy="${y + py - r * 0.18}" r="${r * 0.14}" fill="#fff"/>`;
const look = m => (m === 'sad' ? [0, 2.6] : m === 'wow' ? [0, -1] : m === 'happy' ? [0, 0.5] : [1.4, 0.8]);
// Faces are drawn around (0,0) and moved onto the shape.
const EYES = [
  m => { const [x, y] = look(m); return eyeball(-13, -8, 9, x, y) + eyeball(13, -8, 9, -x, y); },
  m => { const [x, y] = look(m); return eyeball(-13, -9, 11, x, y) + eyeball(14, -6, 7, -x, y); },
  m => { const [x, y] = look(m); return eyeball(0, -9, 14, x * 1.5, y); },
  m => (m === 'happy' ? `<path d="M-22 -6q8-9 16 0M6 -6q8-9 16 0" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>` : `<ellipse cx="-13" cy="-8" rx="4.2" ry="${m === 'wow' ? 7.5 : 5.5}" fill="${INK}"/><ellipse cx="13" cy="-8" rx="4.2" ry="${m === 'wow' ? 7.5 : 5.5}" fill="${INK}"/>`),
  m => { const [x, y] = look(m); return eyeball(-20, -6, 7.5, x, y) + eyeball(0, -13, 7.5, 0, y) + eyeball(20, -6, 7.5, -x, y); },
  m => { const [x, y] = look(m); return eyeball(-13, -8, 9, x, y + 1) + eyeball(13, -8, 9, -x, y + 1) + `<path d="M-24 -13h22M2 -13h22" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`; },   // half shut
];
const MOUTH = {
  neutral: ['<path d="M-10 12q10 7 20 0" fill="none" stroke="#221a3a" stroke-width="4.5" stroke-linecap="round"/>', '<path d="M-9 14h18" stroke="#221a3a" stroke-width="4.5" stroke-linecap="round"/>', '<path d="M-10 13q6-4 11 0t10-3" fill="none" stroke="#221a3a" stroke-width="4.5" stroke-linecap="round"/>'],
  happy: ['<path d="M-15 8h30c0 12-7 18-15 18s-15-6-15-18z" fill="#221a3a"/><path d="M-8 20q8-6 16 0-8 6-16 0z" fill="#ff7b8a"/>', '<path d="M-14 9q14 14 28 0" fill="none" stroke="#221a3a" stroke-width="5" stroke-linecap="round"/>', '<path d="M-15 8h30c0 12-7 18-15 18s-15-6-15-18z" fill="#221a3a"/><path d="M-12 8h24v5h-24z" fill="#fff"/>'],
  sad: ['<path d="M-11 18q11-10 22 0" fill="none" stroke="#221a3a" stroke-width="4.5" stroke-linecap="round"/>', '<path d="M-11 16q5-5 11 0t11-1" fill="none" stroke="#221a3a" stroke-width="4.5" stroke-linecap="round"/>'],
  wow: ['<ellipse cx="0" cy="16" rx="8" ry="10" fill="#221a3a"/>', '<ellipse cx="0" cy="15" rx="6" ry="6.5" fill="#221a3a"/>'],
};
const BROWS = { neutral: '', happy: '', sad: `<path d="M-24 -22l16 5M24 -22l-16 5" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`, wow: `<path d="M-23 -24q8-5 16 0M7 -24q8-5 16 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` };
// The clay: a rounded, lit surface (soft shading from a blurred copy of the shape), a rough texture, a highlight.
const CLAY = `<filter id="clay" x="-15%" y="-15%" width="130%" height="140%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b"/>
<feDiffuseLighting in="b" surfaceScale="9" diffuseConstant="1.15" lighting-color="#fff" result="d"><feDistantLight azimuth="235" elevation="52"/></feDiffuseLighting>
<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="4" result="n"/>
<feDiffuseLighting in="n" surfaceScale="1.6" diffuseConstant="1.05" lighting-color="#fff" result="t"><feDistantLight azimuth="235" elevation="62"/></feDiffuseLighting>
<feComposite in="d" in2="t" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="dt"/>
<feComposite in="SourceGraphic" in2="dt" operator="arithmetic" k1="1.05" k2="0.12" k3="0" k4="0" result="lit"/>
<feSpecularLighting in="b" surfaceScale="7" specularConstant="0.7" specularExponent="22" lighting-color="#fff" result="s"><feDistantLight azimuth="235" elevation="58"/></feSpecularLighting>
<feComposite in="s" in2="lit" operator="arithmetic" k1="0" k2="0.5" k3="1" k4="0" result="ls"/>
<feComposite in="ls" in2="SourceAlpha" operator="in" result="body"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="sh"/><feOffset in="sh" dy="6" result="sho"/><feComponentTransfer in="sho" result="shadow"><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
<feMerge><feMergeNode in="shadow"/><feMergeNode in="body"/></feMerge></filter>`;

export const MOODS = ['neutral', 'happy', 'sad', 'wow'];
export const COUNT = 120;
// The odd ones out: a devil, a werewolf and friends. Each is a clay figure like the rest, with extra clay parts
// (horns, ears, a stem) and its own face details. They are numbered from 1000 up.
//   shape: which SHAPES outline, or its own [path, face x, face y, face scale]; color; back/front: extra clay parts
//   behind and on top of the body; eyes: which EYES, or its own drawing; extra(m): flat details over the face.
const dot = (x, y, rx, ry, fill = INK) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const fangs = '<path d="M-9 13l3 9 3-9zM3 13l3 9 3-9z" fill="#fff" stroke="#221a3a" stroke-width="1.5" stroke-linejoin="round"/>';
const glow = (c, m) => { const y = m === 'sad' ? -6 : -8; return `<ellipse cx="-13" cy="${y}" rx="8" ry="${m === 'wow' ? 8 : 6}" fill="${c}"/><ellipse cx="13" cy="${y}" rx="8" ry="${m === 'wow' ? 8 : 6}" fill="${c}"/>${dot(-12, y, 2.2, 4.5)}${dot(12, y, 2.2, 4.5)}`; };
const SPECIALS = [
  { name: 'devil', shape: 3, color: '#e23b3b', back: '<path d="M26 34C14 26 10 12 16 2c6 10 14 14 24 16zM94 34c12-8 16-22 10-32-6 10-14 14-24 16z" fill="#8f1d1d"/>', eyes: m => glow('#ffd60a', m), extra: m => `<path d="M-24 -18l18 7M24 -18l-18 7" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M-5 30l5 12 5-12z" fill="#8f1d1d" stroke="${INK}" stroke-width="2"/>` },
  { name: 'werewolf', shape: 4, color: '#8a7663', front: '<path d="M30 30l6-10 8 12zM90 30l-6-10-8 12z" fill="#f2a7b0"/><path d="M10 70l-10 4 10 4-8 8 12 0zM110 70l10 4-10 4 8 8-12 0z" fill="#8a7663"/><ellipse cx="60" cy="84" rx="20" ry="14" fill="#c9b8a4"/>', eyes: m => glow('#ffd60a', m), extra: m => `${dot(0, 6, 5, 3.5)}${fangs}<path d="M-24 -20l18 6M24 -20l-18 6" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` },
  { name: 'alien', shape: ['M60 8c30 0 50 20 50 46 0 30-22 62-50 62S10 84 10 54C10 28 30 8 60 8z', 60, 60, 1], color: '#7ed957', back: '<path d="M38 20L26 0M82 20L94 0" stroke="#4fa32e" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="25" cy="-1" r="6" fill="#ff5fa2"/><circle cx="95" cy="-1" r="6" fill="#ff5fa2"/>', eyes: m => `<path d="M-30 -14q16-10 24 4-4 14-16 10t-8-14zM30 -14q-16-10-24 4 4 14 16 10t8-14z" fill="${INK}"/><circle cx="-20" cy="-10" r="3" fill="#fff"/><circle cx="14" cy="-10" r="3" fill="#fff"/>` },
  { name: 'vampire', shape: 8, color: '#d9d2ee', front: '<path d="M16 46C12 22 32 10 60 10s48 12 44 36c-10-12-22-16-30-14l-14 16-14-16c-8-2-20 2-30 14z" fill="#2a2140"/>', eyes: m => glow('#ff4d4d', m), extra: () => fangs },
  { name: 'robot', shape: 0, color: '#93a7bb', back: '<path d="M60 20V2" stroke="#5d6e80" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="0" r="7" fill="#ff5f52"/><rect x="4" y="52" width="14" height="24" rx="5" fill="#5d6e80"/><rect x="102" y="52" width="14" height="24" rx="5" fill="#5d6e80"/>', eyes: m => `<rect x="-24" y="-17" width="18" height="${m === 'sad' ? 10 : 16}" rx="3" fill="#0e2233"/><rect x="6" y="-17" width="18" height="${m === 'sad' ? 10 : 16}" rx="3" fill="#0e2233"/><rect x="-20" y="-13" width="10" height="${m === 'sad' ? 4 : 8}" rx="2" fill="#4de3ff"/><rect x="10" y="-13" width="10" height="${m === 'sad' ? 4 : 8}" rx="2" fill="#4de3ff"/>`, mouth: m => `<rect x="-16" y="8" width="32" height="${m === 'wow' ? 16 : 11}" rx="3" fill="#0e2233"/>${[-10, -4, 2, 8].map(x => `<path d="M${x} 9v${m === 'wow' ? 14 : 9}" stroke="#93a7bb" stroke-width="2"/>`).join('')}${m === 'happy' ? '<path d="M-16 8q16 10 32 0" fill="none" stroke="#4de3ff" stroke-width="2.5"/>' : ''}` },
  { name: 'skull', shape: ['M60 8c28 0 48 18 48 44 0 16-8 26-14 32v20c0 8-6 12-14 12H40c-8 0-14-4-14-12V84c-6-6-14-16-14-32C12 26 32 8 60 8z', 60, 58, 1], color: '#f1ead9', eyes: m => `${dot(-15, -6, 11, m === 'wow' ? 14 : 12)}${dot(15, -6, 11, m === 'wow' ? 14 : 12)}${m === 'happy' ? '<circle cx="-13" cy="-8" r="3" fill="#ffd60a"/><circle cx="17" cy="-8" r="3" fill="#ffd60a"/>' : ''}`, mouth: m => `<path d="M-4 12l4-9 4 9z" fill="${INK}"/><path d="M-18 ${m === 'sad' ? 30 : 26}q18 ${m === 'happy' ? 12 : m === 'sad' ? -8 : 3} 36 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>${[-10, -3, 4, 11].map(x => `<path d="M${x} 24v9" stroke="${INK}" stroke-width="2.5"/>`).join('')}` },
  { name: 'ghost', shape: ['M60 8c26 0 44 20 44 46v58c-6 6-10-6-16-6s-8 10-14 10-8-10-14-10-8 10-14 10-8-10-14-10-10 12-16 6V54C16 28 34 8 60 8z', 60, 54, 1], color: '#f5f7ff', eyes: m => `${dot(-13, -8, 6.5, m === 'wow' ? 11 : m === 'happy' ? 6 : 9)}${dot(13, -8, 6.5, m === 'wow' ? 11 : m === 'happy' ? 6 : 9)}`, mouth: m => (m === 'happy' ? '<path d="M-10 10q10 10 20 0z" fill="#221a3a"/>' : dot(0, m === 'sad' ? 16 : 14, m === 'wow' ? 8 : 5.5, m === 'wow' ? 11 : m === 'sad' ? 4 : 7)) },
  { name: 'pumpkin', shape: 9, color: '#ff8c1f', back: '<path d="M54 22c-2-10 2-18 10-22l6 6c-6 4-6 10-4 16z" fill="#3f8f2e"/>', eyes: m => `<path d="M-24 -4l10-16 10 16zM4 -4l10-16 10 16z" fill="${INK}"/>${m === 'happy' || m === 'wow' ? '<path d="M-17 -6l3-5 3 5zM11 -6l3-5 3 5z" fill="#ffd60a"/>' : ''}`, mouth: m => (m === 'sad' ? `<path d="M-20 24l7-8 6 6 7-8 7 8 6-6 7 8z" fill="${INK}"/>` : `<path d="M-22 8l8 6 6-6 8 6 8-6 6 6 8-6c0 ${m === 'wow' ? 22 : 14}-10 ${m === 'wow' ? 24 : 18}-22 ${m === 'wow' ? 24 : 18}s-22-4-22-${m === 'wow' ? 24 : 18}z" fill="${INK}"/>`) },
  { name: 'zombie', shape: 0, color: '#9bc26b', front: '<path d="M70 20l20 0 4 14-10 6-8-8z" fill="#ef8fa0"/>', eyes: m => `${eyeball(-13, -8, 11, 0, m === 'sad' ? 3 : 1)}<path d="M7 -14l12 12M19 -14l-12 12" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`, extra: () => `<path d="M-30 6h14M-27 2v8M-21 2v8" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` },
  { name: 'pirate', shape: 8, color: '#e0b184', front: '<path d="M14 44C12 22 32 12 60 12s48 10 46 32c-28-10-64-10-92 0z" fill="#d6303f"/><path d="M100 40l16 4-8 4 8 10-18-8z" fill="#d6303f"/><circle cx="36" cy="28" r="3" fill="#fff"/><circle cx="60" cy="22" r="3" fill="#fff"/><circle cx="84" cy="28" r="3" fill="#fff"/>', eyes: m => `${eyeball(-13, -4, 9, 1, m === 'sad' ? 3 : 1)}<path d="M2 -6h22v8c0 8-22 8-22 0z" fill="${INK}"/><path d="M-30 -14L30 -8" stroke="${INK}" stroke-width="3"/>`, extra: () => '<path d="M-16 26q8 6 16 0 8 6 16 0" fill="none" stroke="#5d3a1f" stroke-width="5" stroke-linecap="round" transform="translate(0 -22)"/>' },
  { name: 'ninja', shape: 8, color: '#2b2f4a', front: '<path d="M18 44h84v22H18z" fill="#f2c9a0"/><path d="M12 34h96v10H12z" fill="#d6303f"/><path d="M104 36l18-8-6 12 8 8-18-4z" fill="#d6303f"/>', eyes: m => `<g transform="translate(0 0)">${m === 'happy' ? `<path d="M-22 -8q8-8 16 0M6 -8q8-8 16 0" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>` : `${dot(-13, -8, 4.5, m === 'wow' ? 7 : 5)}${dot(13, -8, 4.5, m === 'wow' ? 7 : 5)}<path d="M-24 ${m === 'sad' ? -20 : -17}l16 ${m === 'sad' ? 1 : 5}M24 ${m === 'sad' ? -20 : -17}l-16 ${m === 'sad' ? 1 : 5}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`}</g>`, mouth: () => '' },
  { name: 'cyclops', shape: 1, color: '#a05cff', back: '<path d="M40 20l-6-18 16 10zM80 20l6-18-16 10z" fill="#ffe08a"/>', eyes: m => eyeball(0, -6, 17, m === 'sad' ? 0 : 2, m === 'sad' ? 5 : 1), mouth: m => `<path d="M-14 ${m === 'sad' ? 24 : 18}q14 ${m === 'happy' ? 14 : m === 'sad' ? -8 : 6} 28 0" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M-8 ${m === 'sad' ? 20 : 21}l3-7 3 7zM3 ${m === 'sad' ? 20 : 21}l3-7 3 7z" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` },
];
export const SPECIAL_COUNT = SPECIALS.length;
const idx = i => ((Math.round(i) % COUNT) + COUNT) % COUNT;
const special = i => (i >= 1000 ? SPECIALS[(Math.round(i) - 1000) % SPECIALS.length] : null);
export const colorOf = i => (special(i) ? special(i).color : COLORS[(idx(i) * 5 + 2) % COLORS.length]);
export const nameOf = i => (special(i) ? special(i).name : '');
export function avatar(i, mood = 'neutral') {
  const m = MOODS.includes(mood) ? mood : 'neutral', sp = special(i), n = sp ? 0 : idx(i);
  const [path, fx, fy, fs] = sp ? (Array.isArray(sp.shape) ? sp.shape : SHAPES[sp.shape]) : SHAPES[n % SHAPES.length], mouths = MOUTH[m];
  const eyes = sp ? (typeof sp.eyes === 'function' ? sp.eyes(m) : EYES[sp.eyes || 0](m)) : EYES[(n * 7 + 1) % EYES.length](m);
  const mouth = sp && sp.mouth ? sp.mouth(m) : mouths[(sp ? SPECIALS.indexOf(sp) : n * 11 + 3) % mouths.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" class="avatar ${m}" viewBox="-6 -8 132 140"><defs>${CLAY}</defs><g filter="url(#clay)">${sp?.back || ''}<path d="${path}" fill="${colorOf(i)}"/>${sp?.front || ''}</g><g transform="translate(${fx} ${fy}) scale(${fs})">${eyes}${sp ? '' : BROWS[m]}${mouth}${sp?.extra ? sp.extra(m) : ''}</g></svg>`;
}
const urls = new Map();
export function avatarUrl(i, mood = 'neutral') {
  const k = Math.round(i) + mood; let u = urls.get(k);
  if (!u) { u = 'data:image/svg+xml,' + encodeURIComponent(avatar(i, mood)); urls.set(k, u); }
  return u;
}
