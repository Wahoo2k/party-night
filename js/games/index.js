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

export const GAMES = { werewolf, imposter, bluff, whosaid, ducks, trivia, spin, crowd, bingo, quick };

export const COMING_SOON = [
  { name: 'Million Ladder', blurb: 'Climb a ladder of harder questions. Use your lifelines wisely.' },
  { name: 'Pick a Case', blurb: 'Open cases, weigh the banker\'s offers. Deal or keep going?' },
];
