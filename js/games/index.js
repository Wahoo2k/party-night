// Game registry. Every game module exports:
//   meta {id, name, min, max, blurb}
//   setup(players) -> state          act(state, pid, action) -> state
//   hostAct(state, action) -> state  tick(state) -> state        narration(state) -> string
//   tvView(state) / phoneView(state, pid)   renderTV(view, el) / renderPhone(view, el, send)
// Later: an `owned` list from the player's account decides which games unlock.
import * as werewolf from './werewolf.js';

export const GAMES = { werewolf };

export const COMING_SOON = [
  { name: 'Price Guesser', blurb: 'Guess the price of real products. Closest without going over wins.' },
  { name: 'Family Fact Trivia', blurb: 'Questions written from your own group\'s answers.' },
  { name: 'Celebrity', blurb: 'Describe, one word, then act it out. Same names, three rounds.' },
];
