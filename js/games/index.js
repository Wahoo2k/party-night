// Game registry. Every game module exports:
//   meta {id, name, min, max, blurb}
//   setup(players) -> state          act(state, pid, action) -> state
//   hostAct(state, action) -> state  tick(state) -> state        narration(state) -> string
//   tvView(state) / phoneView(state, pid)   renderTV(view, el) / renderPhone(view, el, send)
// Later: an `owned` list from the player's account decides which games unlock.
import * as werewolf from './werewolf.js';
import * as imposter from './imposter.js';
import * as bluff from './bluff.js';
import * as whosaid from './whosaid.js';
import * as ducks from './ducks.js';
import * as trivia from './trivia.js';
import * as spin from './spin.js';
import * as crowd from './crowd.js';
import * as bingo from './bingo.js';
import * as quick from './quick.js';
import * as ladder from './ladder.js';
import * as cases from './cases.js';
import * as funny from './funny.js';
import * as letters from './letters.js';

export const GAMES = { werewolf, imposter, bluff, whosaid, ducks, trivia, spin, crowd, bingo, quick, ladder, cases, funny, letters };

export const COMING_SOON = [
  { name: 'Taboo Talk', blurb: 'Describe the word without saying the forbidden ones.' },
  { name: 'Secret Agents', blurb: 'Spymasters give one-word clues to find their team\'s words.' },
  { name: 'Sketch Telephone', blurb: 'Draw, guess, redraw. Watch the message fall apart.' },
];
