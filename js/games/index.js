// Game registry. Every game module exports:
//   meta {id, name, min, max, blurb}
//   setup(players) -> state          act(state, pid, action) -> state
//   hostAct(state, action) -> state  tick(state) -> state        narration(state) -> string
//   tvView(state) / phoneView(state, pid)   renderTV(view, el) / renderPhone(view, el, send)
// Later: an `owned` list from the player's account decides which games unlock.
import * as werewolf from './werewolf.js';
import * as imposter from './imposter.js';

export const GAMES = { werewolf, imposter };

export const COMING_SOON = [
  { name: 'Bluff', blurb: 'Write a fake answer to a strange true fact, then sniff out the real one.' },
  { name: 'Who Said That?', blurb: 'Answer questions about yourselves, then guess whose answer is whose.' },
];
