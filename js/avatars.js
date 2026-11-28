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
const idx = i => ((Math.round(i) % COUNT) + COUNT) % COUNT;
export const colorOf = i => COLORS[(idx(i) * 5 + 2) % COLORS.length];
export function avatar(i, mood = 'neutral') {
  const n = idx(i), m = MOODS.includes(mood) ? mood : 'neutral';
  const [path, fx, fy, fs] = SHAPES[n % SHAPES.length], mouths = MOUTH[m];
  return `<svg xmlns="http://www.w3.org/2000/svg" class="avatar ${m}" viewBox="-6 -4 132 136"><defs>${CLAY}</defs><path d="${path}" fill="${colorOf(n)}" filter="url(#clay)"/><g transform="translate(${fx} ${fy}) scale(${fs})">${EYES[(n * 7 + 1) % EYES.length](m)}${BROWS[m]}${mouths[(n * 11 + 3) % mouths.length]}</g></svg>`;
}
const urls = new Map();
export function avatarUrl(i, mood = 'neutral') {
  const k = idx(i) + mood; let u = urls.get(k);
  if (!u) { u = 'data:image/svg+xml,' + encodeURIComponent(avatar(i, mood)); urls.set(k, u); }
  return u;
}
