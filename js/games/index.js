// Game registry. Every game module exports:
//   meta {id, name, min, max, blurb}
//   setup(players) -> state          act(state, pid, action) -> state
//   hostAct(state, action) -> state  tick(state) -> state        narration(state) -> string
//   tvView(state) / phoneView(state, pid)   renderTV(view, el) / renderPhone(view, el, send)
// Later: an `owned` list from the player's account decides which games unlock.
import { HOW, FACTS } from './guide.js';
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
import * as bracket from './bracket.js';
import * as faker from './faker.js';
import * as meter from './meter.js';
import * as pindrop from './pindrop.js';
import * as topspot from './topspot.js';
import * as rebus from './rebus.js';

export const GAMES = { pindrop, topspot, werewolf, imposter, bluff, whosaid, ducks, trivia, spin, crowd, bingo, quick, ladder, cases, funny, letters, taboo, agents, sketch, meld, bowl, crew, charades, clash, blackjack, gofish, bluffcards, hearts, shade, estimate, truths, wordhunt, midnight, missions, dares, split, doodle, memory, copycat, hunt, freeze, haunted, bomb, potato, mystery , bracket, faker, meter, rebus};

// Intro steps and card facts live in one file (guide.js) and are folded into each game's meta here.
for (const [id, G] of Object.entries(GAMES)) {
  if (!G.meta.how && HOW[id]) G.meta.how = HOW[id];
  if (FACTS[id]) Object.assign(G.meta, { best: FACTS[id][0], mins: FACTS[id][1], mood: FACTS[id][2] });
}

// Lobby shelves. A game can sit on more than one.
// The 24 games out front at launch. Everything else sits on the "More games" row at the bottom.
export const LAUNCH = ['funny', 'bluff', 'whosaid', 'ducks', 'faker', 'sketch', 'doodle', 'werewolf', 'agents', 'taboo', 'trivia', 'spin', 'potato', 'quick', 'bracket', 'truths', 'meld', 'meter', 'crowd', 'rebus', 'clash', 'bowl', 'imposter', 'memory'];
export const SHELVES = [
  { id: 'featured', name: '⭐ Start here', games: ['funny', 'ducks', 'bluff', 'whosaid', 'werewolf', 'sketch', 'trivia', 'faker', 'doodle', 'agents', 'taboo', 'spin'] },
  { id: 'all', name: 'All games' },
  { id: 'party', name: '🎉 Party', games: ['quick', 'potato', 'bracket', 'truths', 'meld', 'meter', 'bowl', 'funny', 'bluff', 'whosaid', 'faker'] },
  { id: 'trivia', name: '🧠 Game shows & puzzles', games: ['trivia', 'spin', 'crowd', 'rebus', 'pindrop', 'topspot'] },
  { id: 'secret', name: '🕵️ Secret roles', games: ['werewolf', 'imposter', 'agents', 'faker'] },
  { id: 'family', name: '👨‍👩‍👧 Family & all ages', games: ['ducks', 'memory', 'clash', 'sketch', 'doodle', 'bowl', 'crowd'] },
  { id: 'kids', name: '👶 Little kids', games: ['ducks', 'memory', 'charades', 'bingo', 'gofish', 'copycat', 'hunt', 'freeze'] },
  { id: 'more', name: '➕ More games', games: Object.keys(GAMES).filter(id => !LAUNCH.includes(id)) },
];

export const COMING_SOON = [
];

// One-tap game nights: a short list of games played in order.
export const NIGHTS = [
  { id: 'family', name: 'Family night', icon: '👨‍👩‍👧‍👦', blurb: 'All ages, about 40 minutes', games: ['ducks', 'charades', 'sketch', 'crew'] },
  { id: 'party', name: 'Party', icon: '🎉', blurb: 'Teens and adults, about an hour', games: ['quick', 'funny', 'bowl', 'werewolf'] },
  { id: 'kids', name: 'Just the kids', icon: '👶', blurb: 'No reading needed, about 20 minutes', games: ['hunt', 'freeze', 'copycat', 'memory'] },
];
