// Game registry. Every game module exports:
//   meta {id, name, min, max, blurb}
//   setup(players) -> state          act(state, pid, action) -> state
//   hostAct(state, action) -> state  tick(state) -> state        narration(state) -> string
//   tvView(state) / phoneView(state, pid)   renderTV(view, el) / renderPhone(view, el, send)
// Later: an `owned` list from the player's account decides which games unlock.
import * as werewolf from './werewolf.js';
import * as imposter from './imposter.js';
import * as bluff from './bluff.js';

export const GAMES = { werewolf, imposter, bluff };

export const COMING_SOON = [
  { name: 'Who Said That?', blurb: 'Answer questions about yourselves, then guess whose answer is whose.' },
  { name: 'Trivia Board', blurb: 'Pick a category and point value, then race to buzz in on your phone.' },
  { name: 'Spin & Solve', blurb: 'Spin the wheel on your phone, call letters and solve the puzzle.' },
  { name: 'Crowd Says', blurb: 'Guess the most popular answers. Three strikes and you\'re out.' },
];
