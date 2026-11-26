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

export const GAMES = { werewolf, imposter, bluff, whosaid, ducks, trivia };

export const COMING_SOON = [
  { name: 'Spin & Solve', blurb: 'Spin the wheel on your phone, call letters and solve the puzzle.' },
  { name: 'Crowd Says', blurb: 'Guess the most popular answers. Three strikes and you\'re out.' },
];
