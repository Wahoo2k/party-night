# Narration script

Made by `node test/narration-script.mjs` (bots play each game 25 times; lines heard in at least a third of games are listed).

- **Host voice:** every game except the night games.
- **Night narrator voice:** werewolf, midnight, haunted.
- `{name}` is a player name and `{n}` a number: these lines need re-wording or splitting before they can be recorded.
- Questions, prompts and typed answers that are read out are not listed (they change every game).

## Shared lines (host)
- Final round!
- Thirty seconds left.
- {name} jumps in!
- Time's up!
- And the winner is…
- It's a tie!
- Tonight's awards.

## Shared lines (night narrator)
- Good evening, villagers.
- Night falls on the village. Somewhere in the dark, the wolves are hungry.

## Werewolf (werewolf) · night narrator
- Welcome to the village. Something is hunting among you. Check your phone for your secret role, and keep it hidden.
- Night falls on the village. Look only at your own phone, and stay silent. Werewolves, choose your victim. Seer, choose someone to investigate. Doctor, choose someone to protect. Everyone else, pick who you suspect.
- Good morning, village. Howls echoed through the night, but the Doctor got there first. Everyone survived! Now talk it over. Who do you suspect?
- Time to vote. Choose who leaves the village on your phone.
- The vote was split, so nobody was voted out.
- The werewolves win! They now outnumber the village.
- The village wins! Every werewolf has been found.

Needs a name or number:
- Night {n} The village sleeps. Make your choice on your phone, and not a sound.
- Good morning, village. A scream at midnight. By morning, {name} is no more. They were a Villager. Now talk it over. Who do you suspect?
- The village voted out {name}. They were a Villager.
- Good morning, village. The village wakes to find {name} gone. Claw marks lead into the forest. They were a Villager. Now talk it over. Who do you suspect?
- The village voted out {name}. They were a Werewolf.
- The village voted out {name}. They were a Doctor.

Also reads out changing content (about 8 different lines seen), e.g. “Good morning, village. The rooster crows, but {name} does not answer. They were a Villager”.

## Imposter (imposter) · host
- Check your phone for the secret word. One of you didn't get it. That's the imposter.
- All the clues are in. Who doesn't know the word? Talk it over.
- Time to vote. Who is the imposter?

Also reads out changing content (about 33 different lines seen), e.g. “The category is Things. Take turns giving one word clues. Not too obvious, or the imposter”.

## Bluff (bluff) · host
- Now find the truth. One of these is real.
- That's the game! The master of lies is on the board.

Also reads out changing content (about 78 different lines seen), e.g. “Here's a strange but true fact. Mr. Potato Head was the first toy ever advertised on blank”.

## Who Said That? (whosaid) · host
- Answer the questions on your phone. Be honest, or be sneaky. Nobody will know it's you... yet.
- That's the game! Turns out you don't know each other as well as you thought.
- Someone said: Loading the dishwasher. Who was it?

Needs a name or number:
- It was {name}!

Also reads out changing content (about 150 different lines seen), e.g. “What's the longest you've gone without sleep, and why? Someone answered: A long flight. Wh”.

## Ducky Toss (ducks) · host
- Splash! Turn over.

Needs a name or number:
- Welcome to Ducky Toss! First to {n} points wins. {name}, you're up first. Swipe up on your phone to toss.
- Sitting pretty + Headstand! {n}!
- {name} banks {n}
- Double sitting pretty! {n} points!
- Beak lean! {n}!
- Double belly up! {n} points!
- Belly up + Headstand! {n}!
- Headstand! {n}!
- Splash! But the last duck keeps {n}
- Belly up + Sitting pretty! {n}!
- Sitting pretty + Belly up! {n}!
- {name} wins Ducky Toss!
- Headstand + Belly up! {n}!
- Headstand + Sitting pretty! {n}!

Also reads out changing content (about 6 different lines seen), e.g. “Belly up + Beak lean! {n}!”.

## Trivia Board (trivia) · host
- Correct!
- Guacamole is made mostly from this fruit.
- The only one of the Seven Wonders of the Ancient World still standing.
- The main ingredient in hummus.
- This pricey spice comes from the dried threads of a crocus flower.
- Water freezes at this many degrees Fahrenheit.
- The first President of the United States.
- Plants take in this gas from the air to make food.
- The year Columbus first reached the Americas.
- The center of an atom.
- The cowboy doll in "Toy Story."
- French fries are traditionally made from this vegetable.
- The snowman who loves warm hugs in "Frozen."
- The capital of Japan.
- The capital of France.
- The rat who becomes a chef in "Ratatouille."
- The capital of Canada.
- Nemo's worried clownfish dad in "Finding Nemo."
- A word that means the opposite of another word.
- A word that reads the same backward and forward, like "racecar."
- The singer known as the "King of Pop."
- He composed the "Moonlight Sonata."
- A word made by rearranging another word's letters, like "listen" and "silent."
- The number of bones in an adult human body.
- The largest organ of the human body.
- The capital of Australia.

Needs a name or number:
- Welcome to Trivia Board! {name}, pick a category on your phone.
- H{n}O is the chemical formula for this.
- {name}
- {name}, pick the next one.
- This famous ship sank in {n} after hitting an iceberg.
- You found the Wager Tile! {name}, how much will you bet?
- {name} wins Trivia Board!
- This instrument usually has {n} keys.

Also reads out changing content (about 40 different lines seen), e.g. “The sport played at Wimbledon.”.

## Spin & Solve (spin) · host
- One T
- One N
- No S
- No H
- One L
- One D
- No C
- No M
- One G
- Skip!
- No P
- No B
- No F
- No Y
- One E
- No N
- One S
- One H
- No D
- No A
- No G
- One Y
- Wipeout!
- No R
- One B
- No E
- No L
- One M
- One R
- One A
- Sorry, no.
- No T

Needs a name or number:
- {n} R's
- {name} solved it!
- Round {n} The category is Event.
- {n} O's
- {n} L's
- {name} wins Spin and Solve!
- {n} T's
- {n} C's
- {n} E's
- {n} S's
- Round {n} The category is Phrase.
- {n} A's
- {n} N's

Also reads out changing content (about 37 different lines seen), e.g. “Welcome to Spin and Solve! The category is Animal. {name}, spin the wheel on your phone.”.

## Crowd Says (crowd) · host
- Team Sun wins Crowd Says!
- Team Moon wins Crowd Says!

Needs a name or number:
- Team Sun takes {n} points!
- Strike {n}!
- Team Moon takes {n} points!

Also reads out changing content (about 42 different lines seen), e.g. “Welcome to Crowd Says! Name something people are afraid of. Face-off: {name} versus {name}”.

## Bingo (bingo) · host
- Welcome to Bingo! Pick numbers or pictures on the TV.
- That's all for Bingo. Thanks for playing!

Needs a name or number:
- Round {n}: Any line. A full row, column or diagonal. Good luck!
- G. {n}
- I. {n}
- B. {n}
- N. {n}
- O. {n}
- Bingo for {name} and {name}!
- Round {n}: Four corners. All four corner squares. Good luck!
- Bingo for {name}!
- Round {n}: Full card. Every square on the card. Good luck!

Also reads out changing content (about 1 different lines seen), e.g. “Bingo for {name} and {name} and {name}!”.

## Quick Games (quick) · host
- That's the pack! Here's who read the room best.
- Most of you picked Dishes!

Needs a name or number:
- The room says: {name}!
- The room says: {name} and {name}!

Also reads out changing content (about 136 different lines seen), e.g. “Best way to spend a rainy day?”.

## Million Ladder (ladder) · host
- Locked in. Let's see…
- That's the end of Million Ladder!

Needs a name or number:
- Welcome to Million Ladder! {name}, take the hot seat. Everyone else, play along on your phones.
- For {n} points. What do caterpillars turn into?
- Correct! {n} points.
- For {n} points. What do bees make?
- For {n} points. Which animal is known as man's best friend?
- {name}, take the hot seat. Everyone else, play along on your phones.
- For {n} points. Which planet is closest to the Sun?
- For {n} points. What do you call frozen water?
- For {n} points. Which fruit is dried to make raisins?
- For {n} points. What is the tallest mountain in the world above sea level?
- For {n} points. How many teeth does an adult human usually have?
- For {n} points. Which country gifted the Statue of Liberty to the U.S.?
- For {n} points. Which season comes right after summer?
- For {n} points. Which bird is the national symbol of the United States?
- For {n} points. Which instrument has black and white keys?
- For {n} points. What is the square root of {n}?
- For {n} points. The Grand Canyon is in which U.S. state?
- For {n} points. Who painted the Mona Lisa?
- For {n} points. How many days are in a leap year?
- For {n} points. What shape is a stop sign?
- For {n} points. What is the capital of the United States?
- For {n} points. How many strings does a standard violin have?
- For {n} points. What is the smallest planet in our solar system?
- For {n} points. Who wrote "Romeo and Juliet"?
- For {n} points. What color are emeralds?
- For {n} points. Which animal can change color to blend in?
- For {n} points. How many sides does a hexagon have?
- For {n} points. What gas do we need to breathe to stay alive?
- For {n} points. In what year did the U.S. declare independence?
- Oh no! The answer was {n}
- For {n} points. How many legs does a spider have?
- For {n} points. What is the largest ocean on Earth?
- For {n} points. How many minutes are in an hour?
- For {n} points. Which language has the most native speakers?
- For {n} points. How many continents are there?
- For {n} points. Which planet is known for its Great Red Spot?
- For {n} points. What is the chemical symbol for gold?
- For {n} points. What is the longest river in South America?

Also reads out changing content (about 63 different lines seen), e.g. “For {n} points. Which ship carried the Pilgrims to America in {n}?”.

## Pick a Case (cases) · host
- No deal!
- Two cases left. Keep yours, or swap?
- That's the end of Pick a Case!

Needs a name or number:
- Welcome to Pick a Case! {name}, sixteen cases, one hundred thousand points in one of them. Pick the case you'll keep. Everyone else, pick your lucky case.
- {n}
- The phone is ringing. The buyer offers {n} points. Deal, or keep going?
- Deal! {name} takes {n} Their case had {n}
- {name}, sixteen cases, one hundred thousand points in one of them. Pick the case you'll keep. Everyone else, pick your lucky case.
- {name} wins {n} points!

## Funny Answers (funny) · host
- Welcome to Funny Answers! Check your phone and answer your two prompts. Funny beats true!
- Round two, and points are doubled. Get writing!
- Final round! Everyone answers the same prompt. The title of a movie about tonight.
- Vote for your favorite!
- That's the game!

Also reads out changing content (about 113 different lines seen), e.g. “What aliens think of Earth after one day.”.

## Letter Lists (letters) · host
- That's the game!

Also reads out changing content (about 66 different lines seen), e.g. “Welcome to Letter Lists! Your letter is N. Six categories, ninety seconds. Go!”.

## Taboo Talk (taboo) · host
- Taboo!
- Team Sun wins Taboo Talk!
- Team Moon wins Taboo Talk!

Needs a name or number:
- Welcome to Taboo Talk! Team Sun, you're up. {name}, you're giving clues. Press start on your phone when your team is ready.
- Time! Team Sun got {n}
- Team Moon, you're up. {name}, you're giving clues. Press start on your phone when your team is ready.
- Time! Team Moon got {n}
- Team Sun, you're up. {name}, you're giving clues. Press start on your phone when your team is ready.

## Secret Agents (agents) · host
- Welcome to Secret Agents! Team Sun goes first. Spymasters, check your phones for the secret key.
- A bystander.
- Team Sun, your spymaster is thinking.
- That one belongs to the other team!
- Team Moon, your spymaster is thinking.
- Team Sun found all their agents and wins!
- Welcome to Secret Agents! Team Moon goes first. Spymasters, check your phones for the secret key.
- Team Moon found all their agents and wins!

Also reads out changing content (about 2 different lines seen), e.g. “Oh no, the trap! Team Sun wins!”.

## Sketch Telephone (sketch) · host
- Welcome to Sketch Telephone! Write something weird for the next person to draw.
- Now draw what you were given. No letters or numbers!
- What is that drawing? Describe it in a few words.
- Draw it!
- Guess the drawing!

Needs a name or number:
- {name} got the most hearts!

Also reads out changing content (about 312 different lines seen), e.g. “Time for the big reveal! {name} started with: A sandwich running a marathon”.

## Mind Meld (meld) · host
- The clue is: Pretty far left. Set your dials!
- The clue is: A bit right. Set your dials!
- The clue is: Pretty far right. Set your dials!
- Mind meld! Everyone was close!
- The clue is: Right in the middle. Set your dials!
- The clue is: Way over left. Set your dials!
- The clue is: Way over right. Set your dials!
- The clue is: A bit left. Set your dials!

Needs a name or number:
- Bullseye for {name}!
- Bullseye for {name} and {name}!
- {name} reads minds best!
- Bullseye for {name} and {name} and {name}!

Also reads out changing content (about 66 different lines seen), e.g. “Welcome to Mind Meld! {name} is the mind reader. They see a secret spot between Bad movie ”.

## Salad Bowl (bowl) · host
- Welcome to Salad Bowl! Everyone, secretly add three names to the bowl. Famous people, characters, anyone your group would know.
- The bowl is empty! Same names again, but now: One word.
- The bowl is empty! Same names again, but now: Act it out.
- The bowl is empty!
- Team Moon wins!
- Team Sun wins!

Needs a name or number:
- Round {n}: Describe it. Say anything except the name itself. Team Moon, {name} is up.
- Round {n}: One word. Just ONE word per name. Choose wisely! Team Sun, {name} is up.
- Round {n}: Act it out. No talking! Charades only. Team Moon, {name} is up.
- Round {n}: Describe it. Say anything except the name itself. Team Sun, {name} is up.
- Round {n}: One word. Just ONE word per name. Choose wisely! Team Moon, {name} is up.
- Round {n}: Act it out. No talking! Charades only. Team Sun, {name} is up.

Also reads out changing content (about 2 different lines seen), e.g. “Time! {n} for Team Sun.”.

## Clue Crew (crew) · host

Needs a name or number:
- Welcome to Clue Crew! We're all on the same team. {name}, don't look at the TV or anyone's phone! Everyone else, write a one-word clue. Matching clues cancel out.
- {n} clue made it. {name}, what's the word?
- {name} is guessing. Write your clues!
- {n} clues made it. {name}, what's the word?
- Oh no, every clue cancelled out! {name}, take a wild guess.
- You got {n} out of {n} Solid crew!
- You got {n} out of {n} Not bad. Try again?

Also reads out changing content (about 168 different lines seen), e.g. “Nope, it was Hanukkah. That costs us an extra card.”.

## Picture Charades (charades) · host

Needs a name or number:
- Welcome to Picture Charades! No talking, just acting. {name}, you're up! Press start when you're ready.
- Time! {n} guessed.
- {name}, you're up! Press start when you're ready.
- {name} wins Picture Charades!

## Color Clash (clash) · host

Needs a name or number:
- Welcome to Color Clash! Match the color or the symbol. {name} goes first.
- {name} wins Color Clash!
- {name} swapped hands with {name}!
- {name} has one card left!

## Blackjack (blackjack) · host
- Dealer busts!

Needs a name or number:
- Welcome to the Party Night blackjack table! Everyone starts with {n} chips. These are points, not real money. Place your bets.
- Hand {n} Place your bets.
- Dealer has {n}
- {name} leaves the table with the most chips!

## Go Fish (gofish) · host
- Go fish!
- A set!

Needs a name or number:
- Let's play Go Fish! Ask someone for an animal you have. Get all four to make a set. {name} goes first.
- {name} wins with {n} sets!

Also reads out changing content (about 1 different lines seen), e.g. “It's a tie!”.

## Liar's Deck (bluffcards) · host
- Welcome to Liar's Deck! Play cards face down and say they're Aces. Lie if you have to. Anyone can call bluff!

Needs a name or number:
- Bluff! {name} was lying and takes the pile.
- {name} played {n} Two.
- {name} played {n} Thre.
- {name} played {n} Four.
- {name} played {n} Fiv.
- {name} played {n} Eights.
- {name} played {n} Tens.
- Nope, {name} told the truth! {name} takes the pile.
- {name} played {n} Jack.
- {name} played {n} Queen.
- {name} played {n} Fives.
- {name} played {n} Seven.
- {name} played {n} Eight.
- {name} played {n} Nin.
- {name} played {n} Ten.
- {name} played {n} Kings.
- {name} played {n} Sevens.
- {name} played {n} Queens.
- {name} played {n} King.
- {name} played {n} Ac.
- {name} played {n} Threes.
- {name} played {n} Aces.
- {name} played {n} Twos.
- {name} played {n} Fours.
- {name} played {n} Six.
- {name} is out of cards and wins!
- {name} played {n} Sixes.
- {name} played {n} Nines.
- {name} played {n} Jacks.

## Hearts (hearts) · host
- Welcome to Hearts! Each heart you take is a point, and the Queen of Spades is thirteen. Lowest score wins. First, pick three cards to pass left.
- End of the hand.
- Pass three cards right.
- Pass three cards across.

Needs a name or number:
- {name} has the two of clubs and leads.
- Ouch! {name} takes the Queen of Spades!
- {name} wins with the lowest score!

Also reads out changing content (about 2 different lines seen), e.g. “{name} shot the moon! {name} wins with the lowest score!”.

## Spot the Shade (shade) · host
- The clue is: Plum. Find that shade!
- So close!
- The clue is: Lemon. Find that shade!
- The clue is: Cherry. Find that shade!
- The clue is: Pool. Find that shade!
- The clue is: Pumpkin. Find that shade!
- The clue is: Mint. Find that shade!
- The clue is: Denim. Find that shade!

Needs a name or number:
- Welcome to Spot the Shade! {name} sees a secret color and will give a clue. No color names allowed!
- {name} is picking a color.
- Bullseye for {name}!
- {name} has the best eye for color!

Also reads out changing content (about 14 different lines seen), e.g. “The clue is: Bubblegum. Find that shade!”.

## Estimate & Bet (estimate) · host
- Now bet on the guess you think is closest without going over.
- How many pounds are in a U.S. ton?
- How many time zones does Russia have?

Needs a name or number:
- The answer is {n}!
- {name} wins Estimate and Bet!

Also reads out changing content (about 60 different lines seen), e.g. “Welcome to Estimate and Bet! Nobody knows these exactly, so just make your best guess. How”.

## Two Truths & a Lie (truths) · host
- Welcome to Two Truths and a Lie! Write three things about yourself. Two true, one made up. Make the lie believable!

Needs a name or number:
- {name}'s turn. Which one is the lie?
- The lie was: I have visited the Moon. {name}, tell us the stories!
- The lie was: I can beep in three languages. {name}, tell us the stories!
- The lie was: I once beat a toaster at chess. {name}, tell us the stories!
- The lie was: I am afraid of magnets. {name}, tell us the stories!
- The lie was: I love oil changes. {name}, tell us the stories!
- {name} wins!
- The lie was: I collect paper clips. {name}, tell us the stories!
- The lie was: I dream in binary. {name}, tell us the stories!
- The lie was: I have never been unplugged. {name}, tell us the stories!
- The lie was: I was built in a lab. {name}, tell us the stories!

## Secret Word Hunt (wordhunt) · host

Needs a name or number:
- Welcome to Secret Word Hunt! {name} is the Host and picks a secret word. Careful: one of you is the Insider and already knows it. Check your phones!
- The category is Jobs. Ask {name} yes or no questions. You have four minutes!
- The Insider was {name}, and they got away with it!
- {name} is the Host this round. Check your phones.
- The category is Holidays. Ask {name} yes or no questions. You have four minutes!
- The category is Sports. Ask {name} yes or no questions. You have four minutes!
- {name} wins!
- The category is Movies. Ask {name} yes or no questions. You have four minutes!
- The category is Things. Ask {name} yes or no questions. You have four minutes!
- The category is Animals. Ask {name} yes or no questions. You have four minutes!
- The category is Around the house. Ask {name} yes or no questions. You have four minutes!

Also reads out changing content (about 76 different lines seen), e.g. “{name} found it! The word was Chef. Now, who was the Insider? It was too easy... Vote!”.

## Midnight Wolves (midnight) · night narrator
- Welcome to Midnight Wolves. Look at your card, then keep it secret. Three more cards lie face down in the middle of the village.
- Everyone, close your eyes… just kidding. Look at your phone. If you have a night power, use it now. Everyone else, tap anything so nobody can tell.
- The sun rises. Check what you learned in the night.
- Now talk! Who is a wolf? Remember, your card may have changed in the night. You have three minutes.
- Time to vote! Point at the wolf on your phone.
- The village wins!
- The werewolves win!

## Missions (missions) · host
- Everyone, vote on this team.
- The team is approved. Off you go!
- The team is on the mission. Play your cards in secret.
- Mission success!
- The team is turned down.

Needs a name or number:
- Welcome to Missions. {n} of you are secret traitors. Check your phone to see which side you're on.
- Mission {n} {name} is the leader. Pick a team of {n}
- Mission failed! {n} fail card.
- The traitors win! The traitors were {name} and {name}.
- Mission failed! {n} fail cards.
- The crew wins! The traitors were {name} and {name}.

Also reads out changing content (about 1 different lines seen), e.g. “The team is turned down. That's {n} in a row. Careful, five and the traitors win!”.

## Secret Missions (dares) · host
- Secret Missions has begun! Check your phone for three secret missions. Pull them off without getting caught. Keep partying!
- Foul! That one doesn't count.
- Mission accepted!

Needs a name or number:
- {name} says they completed a mission!
- Time's up! {name} completed the most missions!

## Split the Room (split) · host
- Welcome to Split the Room! Finish your what-if question so the room splits right down the middle. A perfect fifty-fifty scores the most!
- Round two! Points count double. Just kidding. Same rules.
- Everyone agreed. No points!

Needs a name or number:
- {name} splits the room best!

Also reads out changing content (about 190 different lines seen), e.g. “You get a robot that does all your chores, but you lose your sense of taste. Do you buy it”.

## Doodle Bluff (doodle) · host
- Welcome to Doodle Bluff! Draw the title on your phone. Keep it secret!
- Here is the first masterpiece. What's this drawing called? Write a fake title to fool everyone.
- Which one is the real title?
- What's this drawing called? Write a fake title to fool everyone.
- The real title was: A dog's dream job!
- The real title was: The laziest dragon!
- The real title was: A sad hot dog!
- The real title was: A volcano taking a bath!
- The real title was: A sock's great escape!

Needs a name or number:
- {name} wins Doodle Bluff!

Also reads out changing content (about 25 different lines seen), e.g. “The real title was: Dinner with a dinosaur!”.

## Memory Match (memory) · host
- It's a tie! Great memory, everyone!

Needs a name or number:
- Let's play Memory Match! Find two animals that are the same. {name}, you go first. Tap two cards on your phone.
- Not a match. {name}'s turn next!
- A match! Two dinosaurs! Go again, {name}!
- A match! Two pigs! Go again, {name}!
- A match! Two foxs! Go again, {name}!
- A match! Two octopuss! Go again, {name}!
- A match! Two dogs! Go again, {name}!
- A match! Two frogs! Go again, {name}!
- A match! Two lions! Go again, {name}!
- A match! Two monkeys! Go again, {name}!
- A match! Two penguins! Go again, {name}!
- A match! Two cows! Go again, {name}!
- A match! Two turtles! Go again, {name}!
- A match! Two unicorns! Go again, {name}!
- A match! Two cats! Go again, {name}!
- A match! Two bunnys! Go again, {name}!
- {name} found the most pairs!

Also reads out changing content (about 1 different lines seen), e.g. “A match! Two bees! Go again, {name}!”.

## Copy Cat (copycat) · host
- Welcome to Copy Cat! Watch the TV and listen. Then copy the pattern on your phone!
- Your turn! Copy the pattern.

Needs a name or number:
- Round {n} Watch carefully!
- {name} has the best memory! {n} in a row!

## Color Hunt (hunt) · host
- Color Hunt! When I say go, run and touch it, then tap your phone. Ready?
- Find something ORANGE! Go go go!
- Get ready!
- Find something WHITE! Go go go!
- Someone
- Find a SPOON! Go go go!
- Find something PURPLE! Go go go!
- Find something YELLOW! Go go go!
- Find a BOOK! Go go go!
- Find something SOFT, like a pillow! Go go go!
- Find something PINK! Go go go!
- Touch your NOSE, then find a CHAIR! Go go go!
- Find a SHOE! Go go go!
- Find something with a STAR on it! Go go go!
- Find something RED! Go go go!
- Find something BLACK! Go go go!
- Find something SQUARE, like a box! Go go go!
- Find something ROUND, like a ball! Go go go!
- Find something BLUE! Go go go!
- Find something GREEN! Go go go!

Needs a name or number:
- {name}
- {name} was first! Great hunting!
- {name} is the hunt champion!

Also reads out changing content (about 1 different lines seen), e.g. “Find something BROWN! Go go go!”.

## Freeze Dance (freeze) · host
- Freeze Dance! Dance while the music plays. When it stops, freeze like a statue and tap your phone! Don't tap too early!
- FREEZE!
- Get ready to dance!
- Oops, Someone tapped too early!

Needs a name or number:
- Oops, {name} tapped too early!
- {name} is the freeze champion!

## Haunted Quiz (haunted) · night narrator
- Pick a door. One of them has a ghost behind it…
- Quick! Solve the sum to escape!
- Everyone escaped the basement!
- What is the hardest natural substance?
- How many players are on a basketball court for one team?
- What color do you get by mixing blue and yellow?
- What gas do plants take in from the air?

Needs a name or number:
- {name} is now a ghost. Wooo.
- The answer is {n} Everyone survives!
- The answer is {n} {name} and {name}, to the basement!
- {name} wins the Haunted Quiz!
- {name} and {name} are now a ghost. Wooo.
- The answer is {n} {name}, to the basement!

Also reads out changing content (about 140 different lines seen), e.g. “Welcome to the haunted house. Answer correctly to stay alive. Get one wrong, and you go to”.

## Bomb Squad (bomb) · host
- The timer is running. Talk it out!
- Wrong wire! Boom!
- Defused! Nice work, team.

Needs a name or number:
- Bomb Squad! You are all one team. The bomb is on the TV. Each of your phones has some of the rules. Read them out loud. The first rule that applies is the one to follow. {name} is the only one who can cut.
- Bomb {n} {name} has the cutters.
- All done! The squad defused {n} of {n} bombs!

Also reads out changing content (about 1 different lines seen), e.g. “Three strikes. The squad defused {n} bombs.”.

## Hot Potato (potato) · host

Needs a name or number:
- Boom! {name} got burned!
- Name a dessert! {name} starts.
- Name something cold! {name} starts.
- Name a candy! {name} starts.
- {name} kept the coolest hands!
- Name an animal! {name} starts.
- Name a breakfast food! {name} starts.
- Name a movie! {name} starts.

Also reads out changing content (about 41 different lines seen), e.g. “Hot Potato! Say an answer out loud, then toss the potato on your phone. Name a body part! ”.

## Mystery Manor (mystery) · host
- Welcome to Mystery Manor. During dinner, the lights went out, and when they came back on, the Moon Diamond was gone! One of you is the thief. Check your phone for your character. Keep it secret if you are the thief!
- Act one. The lights go out. Read your clues, then share what you know. Or what you want people to think you know.
- Act two. Footprints and whispers. New clues are on your phones and on the TV.
- Act three. The final clue. This is your last chance to question each other.
- Time to accuse! On your phone, choose who did it, where, and how.

Also reads out changing content (about 24 different lines seen), e.g. “The thief was {name} (The Pilot), in the Library, with the Fishing rod! And they got away ”.

## Bracket Battle (bracket) · host
- The bracket is set. Which answer will win it all? Pick one that is not yours.
- Soup moves on.
- Soup moves on, on a coin flip.
- Seventeen bees moves on.
- Seventeen bees moves on, on a coin flip.
- Regret moves on.
- The moon moves on.
- The moon moves on, on a coin flip.
- A tiny hat moves on.
- My uncle moves on, on a coin flip.
- My uncle moves on.
- Glitter moves on, on a coin flip.
- A very confused goose moves on.
- Round one. Glitter, or Soup?
- A very confused goose moves on, on a coin flip.
- Glitter moves on.
- Regret moves on, on a coin flip.

Needs a name or number:
- {name} wins Bracket Battle!

Also reads out changing content (about 179 different lines seen), e.g. “Bracket Battle! The best rule for a treehouse. Type your answer.”.

## Act Natural (faker) · host
- Act Natural! One of you is faking. Fingers. Read your phone, and keep it secret.
- Three. Two. One. Go!
- Vote for the faker.
- The faker is still hiding. One more try.
- Same faker. Try again. Point. Read your phone, and keep it secret.
- Hold it! The instruction was: Point at the person who would last longest without their phone. Who looked unsure?
- New round, new faker. Point. Read your phone, and keep it secret.
- Hold it! The instruction was: Point at the person with the best laugh. Who looked unsure?
- Hold it! The instruction was: Point at the best cook in the room. Who looked unsure?
- Same faker. Try again. Hands Up. Read your phone, and keep it secret.
- Hold it! The instruction was: Raise your hand if you have eaten dessert before dinner this week. Who looked unsure?
- Hold it! The instruction was: Point at the person most likely to adopt ten cats. Who looked unsure?
- Same faker. Try again. Fingers. Read your phone, and keep it secret.
- Hold it! The instruction was: Point at the best dancer in the room. Who looked unsure?
- Hold it! The instruction was: Point at the person most likely to survive in the wild. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you have cried at a cartoon. Who looked unsure?
- New round, new faker. Hands Up. Read your phone, and keep it secret.
- Hold it! The instruction was: Raise your hand if you can touch your toes. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you have ever broken a bone. Who looked unsure?
- New round, new faker. Fingers. Read your phone, and keep it secret.
- Hold it! The instruction was: Raise your hand if you have ever locked yourself out. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you have ever forgotten your own phone number. Who looked unsure?
- Act Natural! One of you is faking. Point. Read your phone, and keep it secret.
- Hold it! The instruction was: Raise your hand if you are a morning person. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you talk to your pets. Who looked unsure?
- Hold it! The instruction was: Point at the person most likely to become famous. Who looked unsure?
- Hold it! The instruction was: Point at the person most likely to talk their way out of a ticket. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you have been on TV. Who looked unsure?
- Hold it! The instruction was: Point at the person who takes the longest to get ready. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you like pineapple on pizza. Who looked unsure?

Needs a name or number:
- Hold it! The instruction was: Hold up {n} to {n} fingers: how much you like karaoke. Who looked unsure?
- The faker got away with it all round. It was {name}!
- Hold it! The instruction was: Hold up {n} to {n} fingers: how many countries you have visited ({n} means {n} or more). Who looked unsure?
- Caught! {name} was faking it.
- Hold it! The instruction was: Hold up {n} to {n} fingers: how good a driver you are. Who looked unsure?
- Hold it! The instruction was: Hold up {n} to {n} fingers: how many cups of coffee or tea you have a day. Who looked unsure?
- Hold it! The instruction was: Hold up {n} to {n} fingers: how many siblings you have. Who looked unsure?
- {name} wins!
- Hold it! The instruction was: Hold up {n} to {n} fingers: how many hours of sleep you got last night ({n} means {n} or more). Who looked unsure?
- Hold it! The instruction was: Hold up {n} to {n} fingers: how messy your room is right now. Who looked unsure?
- Hold it! The instruction was: Hold up {n} to {n} fingers: how spicy you like your food. Who looked unsure?
- Hold it! The instruction was: Hold up {n} to {n} fingers: how much you like camping. Who looked unsure?
- Hold it! The instruction was: Hold up {n} to {n} fingers: how many times you hit snooze. Who looked unsure?
- Hold it! The instruction was: Hold up {n} to {n} fingers: how much you like scary movies. Who looked unsure?

Also reads out changing content (about 11 different lines seen), e.g. “Hold it! The instruction was: Point at the person most likely to win a game show. Who look”.

## Room Meter (meter) · host
- Is this you? People who have laughed so hard they snorted. Yes or no.

Needs a name or number:
- {name} says {n} percent. Higher or lower?
- The real answer: {n} percent.
- {name}, what percent of this room have pretended to be on the phone to avoid someone?
- The real answer: {n} percent. So close!
- {name}, what percent of this room have laughed so hard they snorted?
- {name} knows this room best!
- The real answer: {n} percent. Way off!
- Is this you? People who have stayed up past {n} a.m. this week. Yes or no.

Also reads out changing content (about 75 different lines seen), e.g. “Room Meter! Answer honestly. Nobody sees your answer. Is this you? People who have gone a ”.

## Brain Teasers (rebus) · host
- Brain Teasers! A different kind of puzzle every round. Type your answer. Faster is better.
- Say it out loud.
- What does it say?.
- What is it?.
- Zoomed in. What is it?.
- Put them together.

Needs a name or number:
- {name} has it!
- {name} wins Brain Teasers!

Also reads out changing content (about 124 different lines seen), e.g. “Tuesday! {name} got it first.”.
