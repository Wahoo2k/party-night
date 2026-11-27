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
import * as shade from './shade.js';
import * as estimate from './estimate.js';
import * as truths from './truths.js';
import * as wordhunt from './wordhunt.js';
import * as midnight from './midnight.js';
import * as missions from './missions.js';
import * as dares from './dares.js';
import * as split from './split.js';
import * as doodle from './doodle.js';
import * as memory from './memory.js';
import * as copycat from './copycat.js';
import * as hunt from './hunt.js';
import * as freeze from './freeze.js';
import * as haunted from './haunted.js';
import * as bomb from './bomb.js';
import * as potato from './potato.js';
import * as mystery from './mystery.js';

export const GAMES = { werewolf, imposter, bluff, whosaid, ducks, trivia, spin, crowd, bingo, quick, ladder, cases, funny, letters, taboo, agents, sketch, meld, bowl, crew, charades, clash, blackjack, gofish, bluffcards, hearts, shade, estimate, truths, wordhunt, midnight, missions, dares, split, doodle, memory, copycat, hunt, freeze, haunted, bomb, potato, mystery };

// Lobby shelves. A game can sit on more than one.
export const SHELVES = [
  { id: 'all', name: 'All games' },
  { id: 'kids', name: '👶 Little kids', games: ['charades', 'gofish', 'bingo', 'ducks', 'memory', 'copycat', 'hunt', 'freeze'] },
  { id: 'party', name: '🎉 Party', games: ['funny', 'quick', 'split', 'whosaid', 'truths', 'bluff', 'dares', 'meld', 'bowl', 'taboo', 'charades', 'shade', 'potato'] },
  { id: 'trivia', name: '🧠 Trivia & game shows', games: ['trivia', 'spin', 'crowd', 'ladder', 'cases', 'estimate', 'haunted', 'letters'] },
  { id: 'secret', name: '🕵️ Secret roles', games: ['werewolf', 'midnight', 'imposter', 'missions', 'wordhunt', 'agents', 'mystery'] },
  { id: 'cards', name: '🃏 Cards', games: ['clash', 'blackjack', 'gofish', 'bluffcards', 'hearts'] },
  { id: 'draw', name: '🎨 Drawing', games: ['sketch', 'doodle'] },
  { id: 'team', name: '🤝 Teams & co-op', games: ['taboo', 'agents', 'crowd', 'bowl', 'crew', 'bomb'] },
];

export const COMING_SOON = [
];
