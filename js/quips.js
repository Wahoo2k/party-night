// The host's personality: short lines grouped by moment, shared by every game. Dry and teasing, never about a named
// player, so each one can be recorded once. Three voices: the host, a gentler set for kids' games, and the night narrator.
export const QUIPS = {
  host: {
    start: ["Phones out. Dignity optional.", "Let's begin. Try to look like you know what you're doing.", "Here we go. Remember, it's only a game. A game you could lose.", "Everybody ready? Too late, we're starting.", "Good luck. Some of you will need it more than others.", "Let's play. May the least confused person win.", "Settle in. This is where friendships get tested.", "And we're off. No pressure, but everyone is watching.", "Deep breath. Thumbs ready. Let's go.", "Welcome back to your regularly scheduled bad decisions."],
    waiting: ["No rush. The rest of us will just age quietly.", "Still waiting on a few of you. Take your time. We have snacks.", "Somebody is thinking very hard. It's adorable.", "The clock is ticking, and so is everyone's patience.", "If you're waiting for inspiration, it isn't coming.", "A few of you are still typing. Novelists, apparently.", "We can all see who's holding things up. No names.", "Any day now. Truly, any day.", "Some of you finished ages ago. Some of you are still reading the question.", "Fun fact: you can just pick one."],
    thirty: ["Thirty seconds left.", "Thirty seconds. Panic accordingly.", "Half a minute. Wrap it up.", "Thirty seconds. This is not a drill.", "Thirty seconds left. Bold choices only.", "Thirty seconds. Whatever you've got, send it.", "The clock says thirty. The clock does not negotiate."],
    timesup: ["Time's up!", "And that's time. Whatever you had is what you've got.", "That's it. The clock has spoken.", "Time's up. I hope you're proud of that.", "And stop. No, really, stop.", "Time. If you didn't answer, that was also an answer.", "Hands off the screens. We're done here.", "The buzzer wins again."],
    reveal: ["Let's see who's about to regret their choices.", "Moment of truth. Brace yourselves.", "Let's find out what you people did.", "The results are in. Some of you should sit down.", "Here comes the part where we judge each other.", "Let's see how that went. I have concerns.", "Time to face the consequences.", "Drumroll, please. Actually, I'll handle it.", "Let's look at the damage.", "Alright. Nobody look smug yet."],
    allright: ["Everyone got that one. Don't get used to it.", "A clean sweep. I'm almost impressed.", "All correct. The questions will get harder. I'll see to it.", "Everybody's right. How suspicious.", "Full marks all round. Enjoy this feeling while it lasts."],
    allwrong: ["A perfect score, if the goal was zero.", "Nobody got it. Not one of you. Incredible.", "Wrong, wrong, and also wrong.", "That's a clean sweep of incorrect.", "Well. At least you were all wrong together.", "Zero for everyone. Very fair, really.", "I've seen better guesses from a houseplant.", "No points awarded. None deserved."],
    tie: ["A tie. Nobody's happy. Perfect.", "It's a tie. You'll just have to share. Gross.", "Dead even. How deeply unsatisfying.", "A tie! Settle it in the parking lot.", "Tied. Somebody is going to demand a rematch.", "It's a draw. Everybody wins, which means nobody does."],
    runaway: ["Somebody's been practicing. Suspicious.", "We have a runaway leader. Everyone else, do something.", "One of you is making this look easy. Rude.", "That lead is getting embarrassing for the rest of you.", "Somebody call for help. This is a rout.", "The gap is growing. So is the resentment."],
    close: ["It's close. Uncomfortably close.", "Neck and neck. Somebody's about to be very annoyed.", "Anyone's game. Try not to choke.", "A point or two in it. No pressure at all.", "This is tight. Be nice to each other. For now."],
    lastplace: ["And at the bottom, someone who is here for the snacks.", "Last place is still a place.", "Somebody has to be last. Thank you for your service.", "The view from the bottom is very relaxing, I'm told.", "Down at the bottom, a brave soul with nothing left to lose."],
    final: ["Final round!", "Final round. Make it count.", "Last round. This is where it all falls apart.", "Final round! Points are still up for grabs. Grab them.", "One round left. Heroes and villains will be decided.", "Last chance. No one remembers who led at halftime.", "Final round. Leave nothing in the tank."],
    gameover: ["That's the game. Friendships may resume.", "And that's that. Shake hands. Or don't.", "Game over. Somebody's going to bring this up for weeks.", "That's a wrap. The scoreboard never lies.", "Done! Winners gloat, losers demand a rematch.", "That's the game. Please collect your dignity on the way out.", "And we're finished. What a journey. What a mess.", "It's over. You can all relax your thumbs."],
    winner: ["A worthy champion. Barely.", "Take a bow. A small one.", "The crown is yours. Try to be humble about it.", "Well played. Everyone else, better luck next time.", "A deserved win. I checked.", "Enjoy it. They'll be coming for you next game."],
    pause: ["Paused. Go on, get your snacks.", "We'll wait. We're very patient. Mostly.", "Paused. Nobody peek at anyone's phone.", "Taking a break. The clock is holding its breath.", "Paused. Hydrate. Stretch. Plot."],
    resume: ["And we're back.", "Break's over. Faces forward.", "Back to it. Where were we? Oh yes. Chaos.", "Resuming. I hope you used that time wisely.", "And we're live again."],
    join: ["A new challenger appears.", "Somebody new just walked in. Act natural.", "Fresh competition. Lovely.", "Welcome aboard. You've missed nothing important.", "One more for the pile. Welcome."],
    lobby: ["Whenever you're ready. No, really, take your time.", "Pick a game. They're all good. I made sure.", "Still deciding? It's a party game, not a mortgage.", "I'll just wait here. In the TV. Alone.", "Somebody grab the remote and be brave.", "The room code is right there. It isn't going to scan itself."],
    again: ["Again? Bold. Let's go.", "A rematch. Somebody has a score to settle.", "Round two. Same people, new grudges.", "Back for more. I respect it."],
    awards: ["And now, the awards nobody asked for.", "Time to hand out some trophies. Imaginary ones.", "Let's honor tonight's heroes. And everyone else.", "The votes are in. By which I mean I decided."],
  },
  kids: {
    start: ["Ready, set, here we go!", "Let's play! This is going to be fun.", "Eyes on the screen, everybody!", "Wiggle your fingers. It's game time!", "Here we go! Do your best!"],
    waiting: ["Take your time. We're cheering for you!", "Almost there! A few more friends to go.", "Still thinking? That's okay!", "We're waiting. Nice and patient."],
    thirty: ["Thirty seconds left!", "Thirty seconds. You can do it!", "Hurry, hurry! Thirty seconds!"],
    timesup: ["Time's up!", "Ding ding! That's time.", "And stop! Great job, everyone.", "Time! Hands in the air!"],
    reveal: ["Let's see how everybody did!", "Drumroll, please!", "Ready for the big reveal?", "Here it comes!"],
    allright: ["Everybody got it! High fives all round!", "Wow, you all knew that one!"],
    allwrong: ["Ooh, that one was tricky!", "Nobody got it. That's okay, try the next one!"],
    tie: ["It's a tie! You both win!", "A tie! Everybody cheer!"],
    final: ["Final round!", "Last round. Give it everything!", "One more round. Let's finish strong!"],
    gameover: ["That's the game! Great playing, everyone!", "All done! Give yourselves a big clap.", "The end! You were all amazing."],
    winner: ["Hooray for our winner!", "What a champion!", "Take a bow, superstar!"],
    pause: ["Paused. Snack break!", "We'll wait right here."],
    resume: ["And we're back!", "Let's keep going!"],
    join: ["A new friend is here!", "Welcome! Come and play!"],
    again: ["Again! Again!", "One more time. Let's go!"],
  },
  night: {
    start: ["Draw the curtains. The night is about to begin.", "Gather close. Not everyone here can be trusted.", "The village is quiet. It will not stay that way.", "Sit down, friends. One of you is lying already."],
    waiting: ["The night is patient. I am less so.", "Someone is still deciding. The dark does not mind waiting.", "Choose, villagers. The moon is watching.", "Take your time. The wolves certainly are."],
    thirty: ["Thirty seconds left.", "Thirty seconds. Then the talking ends.", "Half a minute of daylight remains.", "Thirty seconds. Choose your words, and your enemies."],
    timesup: ["Time's up!", "The talking is over. Now you must choose.", "Silence. The time for arguments has passed.", "Enough. The village must decide."],
    reveal: ["Let us see what the night has done.", "The truth walks in. Not everyone will like it.", "Now we learn who to mourn. And who to blame."],
    tie: ["The village could not agree. How convenient, for some.", "A split vote. The guilty breathe a little easier."],
    final: ["Final round!", "One last night. Sleep lightly.", "This is the end of it, one way or another."],
    gameover: ["And so the story ends. Lock your doors anyway.", "The village will remember this night. Some of it.", "It is over. You may stop looking at each other like that."],
    pause: ["The night holds still.", "We wait. The dark is in no hurry."],
    resume: ["The night goes on.", "Where were we? Ah yes. Suspicion."],
    join: ["A stranger arrives in the village.", "Another soul joins us. How brave."],
  },
};
const NIGHT_GAMES = ['werewolf', 'midnight', 'haunted'];
const bags = {};
// One line for a moment, never repeating until that moment's lines have all been heard.
export function quip(moment, { game = '', kids = false, rnd = Math.random } = {}) {
  const set = NIGHT_GAMES.includes(game) ? 'night' : kids ? 'kids' : 'host';
  const pool = QUIPS[set][moment] || QUIPS.host[moment];
  if (!pool) return '';
  const k = set + ':' + moment;
  if (!bags[k]?.length) bags[k] = pool.map((_, i) => i).sort(() => rnd() - 0.5);
  return pool[bags[k].pop()];
}
