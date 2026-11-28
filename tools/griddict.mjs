// Builds js/games/grid-dict.js, the word list for Word Storm, from the "wordlist-english" npm package (SCOWL word
// lists, sizes 10 to 50: everyday words). Run: npm i wordlist-english && node tools/griddict.mjs <path to node_modules>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { isRude } from '../js/names.js';
const require = createRequire(process.argv[2] + '/');
const w = require('wordlist-english');
const set = new Set();
for (const k of Object.keys(w)) { if (!/\/(10|20|35|40|50)$/.test(k)) continue; for (const x of w[k]) if (/^[a-z]{3,9}$/.test(x) && !isRude(x)) set.add(x); }
const list = [...set].sort();
fs.writeFileSync(new URL('../js/games/grid-dict.js', import.meta.url), `// Everyday English words of 3 to 9 letters, for Word Storm. Built by tools/griddict.mjs from the SCOWL word lists\n// (via the wordlist-english package). Do not edit by hand.\nexport default '${list.join(' ')}';\n`);
console.log(list.length, 'words');
