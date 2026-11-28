// Player characters: odd little blobs with googly eyes, built from parts (body, eyes, mouth, something on top), so
// every seat gets a different one and none of them is an emoji. avatar(i) returns an SVG string for character i.
const BODIES = [
  'M50 8c22 0 38 16 38 40 0 26-14 44-38 44S12 74 12 48C12 24 28 8 50 8z',                        // egg
  'M22 14h56c8 0 12 6 12 14v44c0 12-8 20-20 20H30c-12 0-20-8-20-20V28c0-8 4-14 12-14z',          // loaf
  'M50 6c10 0 16 8 20 20l16 44c4 12-4 22-16 22H30c-12 0-20-10-16-22l16-44C34 14 40 6 50 6z',     // gumdrop
  'M30 8h40c12 0 18 8 18 18 0 8-4 12-4 20s6 14 6 24c0 14-10 22-24 22H34c-14 0-24-8-24-22 0-10 6-16 6-24s-4-12-4-20c0-10 6-18 18-18z', // peanut
  'M50 10c26 0 42 12 42 32 0 12-6 18-6 28 0 14-14 22-36 22s-36-8-36-22c0-10-6-16-6-28 0-20 16-32 42-32z',                              // potato
  'M36 6h28c10 0 16 6 16 16v56c0 10-6 16-16 16H36c-10 0-16-6-16-16V22c0-10 6-16 16-16z',         // pill
];
const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#cc5de8', '#ff922b', '#20c997', '#f06595', '#748ffc', '#94d82d'];
const eye = (x, y, r, px = 0, py = 0) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#1b1147" stroke-width="2.5"/><circle cx="${x + px}" cy="${y + py}" r="${r * 0.45}" fill="#1b1147"/>`;
const EYES = [
  () => eye(38, 42, 9, 2, 1) + eye(62, 42, 9, -2, 1),                                   // looking at each other
  () => eye(36, 40, 11, 0, 3) + eye(64, 44, 7, 0, 2),                                   // one big, one small
  () => eye(50, 40, 14, 3, 2),                                                           // one eye
  () => `<path d="M28 42q10-9 20 0M52 42q10-9 20 0" fill="none" stroke="#1b1147" stroke-width="4" stroke-linecap="round"/>`,   // happy shut
  () => eye(38, 42, 9, 0, -3) + eye(62, 42, 9, 0, -3) + `<path d="M27 36h22M51 36h22" stroke="#1b1147" stroke-width="5" stroke-linecap="round"/>`,   // unimpressed
  () => `<rect x="24" y="33" width="24" height="18" rx="5" fill="#fff" stroke="#1b1147" stroke-width="3"/><rect x="52" y="33" width="24" height="18" rx="5" fill="#fff" stroke="#1b1147" stroke-width="3"/><path d="M48 41h4" stroke="#1b1147" stroke-width="3"/><circle cx="38" cy="43" r="3.5" fill="#1b1147"/><circle cx="62" cy="43" r="3.5" fill="#1b1147"/>`,   // glasses
  () => eye(34, 44, 8, -2, 0) + eye(50, 36, 8, 0, -2) + eye(66, 44, 8, 2, 0),            // three eyes
];
const MOUTHS = [
  '<path d="M36 64q14 12 28 0" fill="none" stroke="#1b1147" stroke-width="4" stroke-linecap="round"/>',
  '<path d="M38 68h24" stroke="#1b1147" stroke-width="4" stroke-linecap="round"/>',
  '<ellipse cx="50" cy="68" rx="8" ry="9" fill="#1b1147"/><ellipse cx="50" cy="72" rx="5" ry="4" fill="#ff8787"/>',
  '<path d="M34 62h32v6c0 8-8 12-16 12s-16-4-16-12z" fill="#1b1147"/><path d="M38 62h24v5H38z" fill="#fff"/>',
  '<path d="M38 68q8-6 14 0t14-2" fill="none" stroke="#1b1147" stroke-width="4" stroke-linecap="round"/>',
  '<path d="M40 70q10-10 20 0" fill="none" stroke="#1b1147" stroke-width="4" stroke-linecap="round"/>',
];
const TOPS = [
  '',
  '<path d="M30 12h40l-4-22H34z" fill="#1b1147"/><path d="M22 12h56" stroke="#1b1147" stroke-width="6" stroke-linecap="round"/><path d="M33 4h34" stroke="#e03131" stroke-width="5"/>',   // top hat
  '<path d="M50-14l16 28H34z" fill="#fcc419" stroke="#1b1147" stroke-width="2.5"/><circle cx="50" cy="-14" r="5" fill="#f06595"/>',   // party hat
  '<path d="M50 10V-6" stroke="#1b1147" stroke-width="3"/><circle cx="50" cy="-9" r="6" fill="#ff6b6b" stroke="#1b1147" stroke-width="2.5"/>',   // antenna
  '<path d="M40 10q-6-16 6-18M50 9q0-18 8-20M60 10q8-12 2-20" fill="none" stroke="#1b1147" stroke-width="4" stroke-linecap="round"/>',   // three hairs
  '<path d="M26 56q12-10 24 0 12-10 24 0-6 10-24 4-18 6-24-4z" fill="#1b1147"/>',   // mustache (sits low, over the mouth line)
  '<path d="M20 16q30-22 60 0l-4 6q-26-14-52 0z" fill="#1b1147"/><path d="M74 14l16 6-14 4z" fill="#1b1147"/>',   // cap
  '<path d="M34 88l16-8 16 8-16 8z" fill="#e03131" stroke="#1b1147" stroke-width="2.5"/><circle cx="50" cy="88" r="4" fill="#1b1147"/>',   // bow tie
];
// Character number i: the parts are stepped through at different rates so neighbors never share more than one part.
export function avatar(i, size = 100) {
  const n = ((i % 240) + 240) % 240, body = BODIES[n % BODIES.length], color = COLORS[n % COLORS.length];
  const e = EYES[(n * 3 + 1) % EYES.length](), m = MOUTHS[(n * 5 + 2) % MOUTHS.length], t = TOPS[(n * 7 + 3) % TOPS.length];
  return `<svg class="avatar" viewBox="-4 -24 108 128" width="${size}" height="${Math.round(size * 128 / 108)}" aria-hidden="true"><path d="${body}" fill="${color}" stroke="#1b1147" stroke-width="3.5" stroke-linejoin="round"/>${e}${m}${t}</svg>`;
}
export const AVATAR_COLORS = COLORS;
