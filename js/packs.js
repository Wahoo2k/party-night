// What is sold. One place for the free games, the packs and the prices, used by the website now and by the
// in-app unlock later. Game ids are the file names in js/games. Prices agreed with Tom on 27 Nov 2026.
export const FREE = ['ducks', 'quick', 'potato'];
export const PACKS = [
  { id: 'party', name: 'Party Pack', blurb: 'Write it, vote on it, laugh at it. The loud ones.', games: ['funny', 'bluff', 'whosaid', 'truths', 'bracket', 'split', 'faker', 'meter', 'dares'] },
  { id: 'family', name: 'Family Pack', blurb: 'No reading needed for most. Grandparents to grade-schoolers.', games: ['charades', 'bingo', 'memory', 'gofish', 'copycat', 'hunt', 'freeze', 'clash', 'bowl'] },
  { id: 'show', name: 'Game Show Pack', blurb: 'Buzzers, wheels, boards and big-money ladders.', games: ['trivia', 'spin', 'crowd', 'ladder', 'cases', 'estimate', 'rebus', 'letters', 'haunted', 'pindrop', 'topspot', 'lineup'] },
  { id: 'secret', name: 'Secret Roles Pack', blurb: 'Someone at the table is lying. Find out who.', games: ['werewolf', 'midnight', 'imposter', 'missions', 'wordhunt', 'agents', 'mystery', 'bomb'] },
  { id: 'cards', name: 'Cards & Creative Pack', blurb: 'Draw it, describe it, or play your hand.', games: ['sketch', 'doodle', 'shade', 'meld', 'crew', 'taboo', 'blackjack', 'hearts', 'bluffcards', 'oneword'] },
];
export const PRICES = { pack: 9.99, everything: 39.99, passMonth: 4.99, passYear: 29.99 };
export const packOf = id => (FREE.includes(id) ? { id: 'free', name: 'Free' } : PACKS.find(p => p.games.includes(id)) || null);

// The shop switch. While false every game is open to everyone; add ?shop=1 to the TV page to try the locks.
export const SELLING = false;
