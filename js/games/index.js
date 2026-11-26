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
import * as taboo from './taboo.js';
import * as agents from './agents.js';
import * as sketch from './sketch.js';
import * as meld from './meld.js';
import * as bowl from './bowl.js';
import * as crew from './crew.js';
import * as charades from './charades.js';
import * as clash from './clash.js';
import * as blackjack from './blackjack.js';
import * as gofish from './gofish.js';
import * as bluffcards from './bluffcards.js';
import * as hearts from './hearts.js';

export const GAMES = { werewolf, imposter, bluff, whosaid, ducks, trivia, spin, crowd, bingo, quick, ladder, cases, funny, letters, taboo, agents, sketch, meld, bowl, crew, charades, clash, blackjack, gofish, bluffcards, hearts };

export const COMING_SOON = [
  { name: 'Spot the Shade', blurb: 'One-word clues, a wall of colors. Tap the exact shade.' },
  { name: 'Estimate & Bet', blurb: 'Guess the number, then bet on whoever is closest.' },
];
