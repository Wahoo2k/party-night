// What a bot draws. Bots used to scribble; now they have a small sketchbook of simple things they can actually draw,
// and they draw the one that fits the words they were given ("a cat in a tuxedo" gets the cat). Anything they have
// no drawing for still gets a scribble. Strokes are {c: color index, w: width index, p: [x, y, …]} on a 0-255 square.
const circle = (cx, cy, r, n = 18, a0 = 0, a1 = Math.PI * 2) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push(cx + r * Math.cos(a), cy + r * Math.sin(a)); } return p; };
const S = (c, p, w = 1) => ({ c, w, p });
// colors: 1 ink, 2 red, 3 orange, 4 green, 5 blue, 6 purple, 7 brown
const face = (cx, cy, r) => [S(1, circle(cx - r * 0.35, cy - r * 0.15, 2, 4), 2), S(1, circle(cx + r * 0.35, cy - r * 0.15, 2, 4), 2), S(1, circle(cx, cy + r * 0.1, r * 0.4, 8, 0.2, Math.PI - 0.2))];
export const ART = {
  sun: () => [S(3, circle(128, 128, 46), 2), ...Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return S(3, [128 + 62 * Math.cos(a), 128 + 62 * Math.sin(a), 128 + 92 * Math.cos(a), 128 + 92 * Math.sin(a)]); })],
  moon: () => [S(3, circle(128, 128, 72), 2), S(3, circle(104, 104, 12, 8)), S(3, circle(150, 138, 16, 8)), S(3, circle(112, 160, 8, 8))],
  star: () => [S(3, Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI * 4 / 5; return [128 + 90 * Math.cos(a), 128 + 90 * Math.sin(a)]; }).flat(), 1)],
  heart: () => [S(2, [128, 200, 60, 130, 50, 90, 75, 62, 105, 62, 128, 92, 151, 62, 181, 62, 206, 90, 196, 130, 128, 200], 2)],
  house: () => [S(7, [60, 210, 60, 120, 196, 120, 196, 210, 60, 210]), S(2, [44, 124, 128, 50, 212, 124], 2), S(5, [112, 210, 112, 160, 144, 160, 144, 210]), S(5, [76, 136, 100, 136, 100, 158, 76, 158, 76, 136])],
  tree: () => [S(7, [118, 220, 118, 150, 138, 150, 138, 220], 2), S(4, circle(128, 105, 58), 2), S(4, circle(100, 120, 30)), S(4, circle(160, 118, 30))],
  flower: () => [S(4, [128, 230, 128, 140], 2), S(4, [128, 190, 160, 170]), ...Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return S(2, circle(128 + 34 * Math.cos(a), 100 + 34 * Math.sin(a), 20, 10)); }), S(3, circle(128, 100, 14, 10), 2)],
  fish: () => [S(5, [...circle(118, 128, 58, 16).map((v, i) => (i % 2 ? 128 + (v - 128) * 0.62 : v))], 2), S(5, [176, 128, 222, 92, 222, 164, 176, 128], 2), S(1, circle(92, 118, 3, 4), 2)],
  cat: () => [S(1, circle(128, 138, 62), 1), S(1, [78, 100, 72, 50, 108, 82]), S(1, [178, 100, 184, 50, 148, 82]), ...face(128, 138, 62), S(1, [70, 150, 30, 144]), S(1, [70, 160, 32, 170]), S(1, [186, 150, 226, 144]), S(1, [186, 160, 224, 170])],
  dog: () => [S(7, circle(128, 138, 58), 1), S(7, [76, 108, 52, 150, 74, 176], 2), S(7, [180, 108, 204, 150, 182, 176], 2), ...face(128, 138, 58), S(2, [120, 176, 128, 196, 136, 176])],
  car: () => [S(2, [30, 170, 30, 140, 70, 136, 96, 100, 164, 100, 190, 136, 226, 140, 226, 170, 30, 170], 2), S(1, circle(78, 176, 20, 12), 2), S(1, circle(178, 176, 20, 12), 2), S(5, [104, 110, 100, 134, 158, 134, 154, 110])],
  boat: () => [S(7, [40, 160, 70, 206, 186, 206, 216, 160, 40, 160], 2), S(1, [128, 160, 128, 50], 1), S(2, [128, 56, 196, 140, 128, 140]), S(5, [20, 220, 50, 212, 80, 220, 110, 212, 140, 220, 170, 212, 200, 220, 236, 212])],
  cloud: () => [S(5, circle(90, 140, 34)), S(5, circle(130, 116, 44)), S(5, circle(174, 140, 34)), S(5, [70, 170, 196, 170], 2)],
  rain: () => [...[S(5, circle(90, 100, 30)), S(5, circle(130, 82, 38)), S(5, circle(172, 100, 30))], ...[70, 105, 140, 175].map(x => S(5, [x, 150, x - 12, 190], 1)), ...[88, 123, 158].map(x => S(5, [x, 200, x - 12, 236], 1))],
  snowman: () => [S(1, circle(128, 190, 44)), S(1, circle(128, 118, 32)), S(1, circle(128, 66, 22)), S(3, [128, 66, 156, 72]), S(1, circle(120, 60, 2, 4), 2), S(1, circle(136, 60, 2, 4), 2), S(7, [96, 112, 54, 86]), S(7, [160, 112, 202, 86])],
  balloon: () => [S(2, circle(128, 100, 56).map((v, i) => (i % 2 ? 100 + (v - 100) * 1.15 : v)), 2), S(1, [128, 166, 122, 196, 134, 216, 124, 244])],
  mountain: () => [S(7, [20, 210, 96, 70, 140, 150, 172, 104, 236, 210, 20, 210], 2), S(1, [76, 106, 96, 124, 112, 100])],
  bird: () => [S(1, [50, 110, 88, 84, 128, 118, 168, 84, 206, 110], 2), S(1, [150, 170, 172, 154, 190, 172, 208, 154, 226, 170])],
  apple: () => [S(2, circle(128, 142, 60), 2), S(7, [128, 86, 136, 54], 2), S(4, [136, 62, 172, 46, 150, 76, 136, 62])],
  pizza: () => [S(3, [128, 40, 46, 210, 210, 210, 128, 40], 2), S(2, circle(120, 120, 10, 8), 2), S(2, circle(150, 170, 10, 8), 2), S(2, circle(96, 178, 10, 8), 2), S(7, [50, 216, 206, 216], 2)],
  cup: () => [S(5, [70, 80, 84, 210, 172, 210, 186, 80, 70, 80], 2), S(5, circle(196, 140, 30, 10, -Math.PI / 2, Math.PI / 2)), S(1, [104, 60, 98, 36]), S(1, [128, 60, 134, 36]), S(1, [152, 60, 146, 36])],
  ghost: () => [S(1, [70, 220, 70, 120, ...circle(128, 120, 58, 12, Math.PI, Math.PI * 2), 186, 220, 162, 200, 144, 220, 128, 200, 110, 220, 92, 200, 70, 220], 1), S(1, circle(108, 112, 6, 6), 2), S(1, circle(148, 112, 6, 6), 2), S(1, circle(128, 148, 10, 8))],
  person: () => [S(1, circle(128, 60, 26)), S(1, [128, 86, 128, 160], 1), S(1, [128, 104, 86, 134]), S(1, [128, 104, 170, 134]), S(1, [128, 160, 98, 226]), S(1, [128, 160, 158, 226])],
  crown: () => [S(3, [50, 190, 40, 90, 88, 140, 128, 70, 168, 140, 216, 90, 206, 190, 50, 190], 2), S(2, circle(128, 166, 8, 6), 2)],
  rocket: () => [S(5, [128, 30, 96, 110, 96, 190, 160, 190, 160, 110, 128, 30], 2), S(2, [96, 160, 62, 210, 96, 190]), S(2, [160, 160, 194, 210, 160, 190]), S(3, [112, 196, 128, 240, 144, 196]), S(1, circle(128, 110, 14, 10))],
  key: () => [S(3, circle(84, 128, 34), 2), S(3, [118, 128, 220, 128], 2), S(3, [186, 128, 186, 156]), S(3, [208, 128, 208, 150])],
};
// Words that mean one of the drawings above.
const ALIASES = { kitten: 'cat', tiger: 'cat', lion: 'cat', puppy: 'dog', wolf: 'dog', bear: 'dog', shark: 'fish', whale: 'fish', goldfish: 'fish', sunny: 'sun', beach: 'sun', night: 'moon', castle: 'house', home: 'house', cabin: 'house', igloo: 'house', forest: 'tree', garden: 'flower', rose: 'flower', bus: 'car', truck: 'car', taxi: 'car', convertible: 'car', ship: 'boat', pirate: 'boat', canoe: 'boat', sail: 'boat', storm: 'rain', thunder: 'rain', lightning: 'rain', umbrella: 'rain', snow: 'snowman', party: 'balloon', birthday: 'balloon', volcano: 'mountain', hill: 'mountain', duck: 'bird', chicken: 'bird', owl: 'bird', penguin: 'bird', pigeon: 'bird', fruit: 'apple', cheese: 'pizza', coffee: 'cup', tea: 'cup', mug: 'cup', drink: 'cup', haunted: 'ghost', spooky: 'ghost', zombie: 'ghost', vampire: 'ghost', king: 'crown', queen: 'crown', princess: 'crown', astronaut: 'rocket', alien: 'rocket', space: 'rocket', spaceship: 'rocket', man: 'person', woman: 'person', baby: 'person', wizard: 'person', ninja: 'person', chef: 'person', clown: 'person', knight: 'person', cowboy: 'person', superhero: 'person', grandma: 'person', love: 'heart', door: 'key', lock: 'key' };
// The drawing that fits these words, or null. The first word with a drawing wins, so "a cat on the moon" is a cat.
export function artFor(text) {
  for (const w of String(text || '').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)) { const k = ART[w] ? w : ART[w.replace(/s$/, '')] ? w.replace(/s$/, '') : ALIASES[w] || ALIASES[w.replace(/s$/, '')]; if (k) return k; }
  return null;
}
// A bot's drawing for some words: its sketchbook drawing with a slightly unsteady hand, or null if it has none.
export function botArt(text, rnd = Math.random) {
  const k = artFor(text); if (!k) return null;
  const dx = (rnd() - 0.5) * 16, dy = (rnd() - 0.5) * 16, sc = 0.9 + rnd() * 0.15;
  return ART[k]().map(st => ({ c: st.c, w: st.w, p: st.p.map((v, i) => Math.max(2, Math.min(253, Math.round(128 + (v - 128) * sc + (i % 2 ? dy : dx) + (rnd() - 0.5) * 4)))) }));
}
