import { starMild, cleanAct, textsIn, maskView, maskLine } from '../js/content.js';
import { isRude } from '../js/names.js';
import assert from 'node:assert';
assert.equal(starMild('You are so stupid'), 'You are so oops');
assert.equal(starMild('Shut up, Grandpa'), 'oops, Grandpa');
assert.equal(starMild('Scuttlebutt'), 'Scuttlebutt');   // whole words only
const a = cleanAct({ type: 'text', text: 'a dumb dog', strokes: [{ c: 1, p: [1, 2] }] }, true);
assert.equal(a.text, 'a oops dog'); assert.equal(a.type, 'text'); assert.deepEqual(a.strokes, [{ c: 1, p: [1, 2] }]);
assert.equal(cleanAct({ text: 'a dumb dog' }, false).text, 'a dumb dog');
assert.deepEqual(textsIn({ type: 'names', names: ['Santa', 'x', 'Tooth Fairy'] }), ['Santa', 'Tooth Fairy']);
const v = maskView({ phase: 'guess', list: [{ text: 'Guess' }, { text: 'Fine' }], clue: 'guess' }, ['guess']);
assert.equal(v.phase, 'guess'); assert.equal(v.list[0].text, '(hidden by host)'); assert.equal(v.clue, '(hidden by host)'); assert.equal(v.list[1].text, 'Fine');
assert.equal(maskLine('Tom guessed: Big Hat.', ['big hat']), 'Tom guessed: something.');
assert.ok(!isRude('My gay uncle'));
console.log('ok');
