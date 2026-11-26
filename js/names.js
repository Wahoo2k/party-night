// Player name hygiene: length, odd characters, duplicates, rude words, and fun random names.
// The TV (host) is the authority; phones use the same rules for instant feedback.

export const MAX_NAME = 12;

const ADJ = ['Sly', 'Brave', 'Shy', 'Odd', 'Bold', 'Wild', 'Lucky', 'Sleepy', 'Grumpy', 'Jolly', 'Witty', 'Quiet', 'Sneaky', 'Fuzzy', 'Dizzy', 'Spooky', 'Lost', 'Tiny', 'Clever', 'Gentle'];
const ANIMAL = ['Fox', 'Owl', 'Bear', 'Toad', 'Crow', 'Goat', 'Moth', 'Hare', 'Bat', 'Elk', 'Newt', 'Mole', 'Lynx', 'Wren', 'Yak', 'Pig', 'Duck', 'Cat', 'Hen', 'Ram'];

const pick = a => a[Math.floor(Math.random() * a.length)];

// A random two-word name that fits MAX_NAME and isn't already taken.
export function funName(taken = []) {
  const used = new Set(taken.map(n => n.toLowerCase()));
  for (let i = 0; i < 60; i++) {
    const n = `${pick(ADJ)} ${pick(ANIMAL)}`;
    if (n.length <= MAX_NAME && !used.has(n.toLowerCase())) return n;
  }
  return uniqueName('Mystery', taken);
}

const graphemes = s => {
  try { return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].map(x => x.segment); }
  catch { return Array.from(s); }
};

// Tidy what someone typed. Returns '' if nothing usable is left.
export function cleanName(raw) {
  let s = String(raw ?? '').normalize('NFKC');
  s = s.replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cn}\u2028\u2029]/gu, '');   // control, zero-width, direction tricks
  s = s.replace(/[\p{Mn}\p{Me}]{3,}/gu, '');                          // "zalgo" stacked accents
  s = s.replace(/[<>{}\[\]\\`]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  s = graphemes(s).slice(0, MAX_NAME).join('').trim();
  if (!/[\p{L}\p{N}\p{Extended_Pictographic}]/u.test(s)) return '';
  return s;
}

// Words caught anywhere in a name, even with spacing or l33t tricks.
const ALWAYS = ['fuck', 'fuk', 'shit', 'bitch', 'nigg', 'niga', 'fagg', 'whore', 'slut', 'penis', 'vagina', 'porn', 'rapist', 'nazi', 'hitler', 'retard', 'pussy', 'dildo', 'wank', 'boob', 'bastard', 'asshole', 'jizz', 'kkk'];
// Words only caught as a whole word, so names like Cassie, Dickens or Scunthorpe are fine.
const WORD = ['cunt', 'cunts', 'twat', 'ass', 'arse', 'dick', 'cock', 'tit', 'tits', 'fag', 'hoe', 'cum', 'sex', 'piss', 'crap', 'damn', 'butt', 'poop', 'rape', 'nude'];
// "gay" is blocked only because it gets used as an insult in kids' games; it isn't a rude word itself.

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '|': 'l' };
const flatten = s => s.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[0-9@$!|]/g, c => LEET[c] || c);

export function isRude(name) {
  const f = flatten(name);
  const squashed = f.replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1$1'); // "fuuuuck" -> "fuuck"
  const loose = squashed.replace(/(.)\1+/g, '$1');                        // and "fuck"
  if (ALWAYS.some(w => squashed.includes(w) || loose.includes(w))) return true;
  const words = f.split(/[^a-z]+/).filter(Boolean);
  return words.some(w => WORD.includes(w) || WORD.includes(w.replace(/(.)\1+/g, '$1')));
}

// "Tom" -> "Tom 2" if a Tom is already playing.
export function uniqueName(name, taken) {
  const used = new Set(taken.map(n => n.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  for (let i = 2; i < 100; i++) {
    const tail = ' ' + i;
    const base = graphemes(name).slice(0, MAX_NAME - tail.length).join('').trim();
    const n = base + tail;
    if (!used.has(n.toLowerCase())) return n;
  }
  return funName(taken);
}

// Everything the TV does to a requested name. Returns {name, changed}.
export function settleName(raw, taken) {
  let n = cleanName(raw);
  let changed = n !== String(raw ?? '').trim();
  if (!n || isRude(n)) { n = funName(taken); changed = true; }
  const u = uniqueName(n, taken);
  return { name: u, changed: changed || u !== n };
}
