# Narration script

Made by `node test/narration-script.mjs` (bots play each game 25 times; lines heard in at least a third of games are listed).

- **Host voice:** every game except the night games.
- **Night narrator voice:** werewolf, midnight, haunted.
- `{name}` is a player name and `{n}` a number. Those lines are recorded without the name where a sentence still stands on its own, and get no voice otherwise.
- Shared host lines by moment are in QUIPS.md.
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
- Time to vote. Choose who leaves the village on your phone.
- The village wins! Every werewolf has been found.
- The vote was split, so nobody was voted out.
- Good morning, village. Howls echoed through the night, but the Doctor got there first. Everyone survived! Now talk it over. Who do you suspect?
- The werewolves win! They now outnumber the village.

Recorded in place of lines that carry a name or number:
- Good morning, village. Claw marks lead into the forest. They were a Villager. Now talk it over. Who do you suspect?
- They were a Villager.
- Make your choice on your phone, and not a sound.
- They were a Werewolf.
- Good morning, village. A scream at midnight. They were a Villager. Now talk it over. Who do you suspect?
- They were a Seer.

Also reads out changing content (about 8 different lines seen), e.g. “Good morning, village. A scream at midnight. By morning, {name} is no more. They were a Se”.

## Imposter (imposter) · host
- Check your phone for the secret word. One of you didn't get it. That's the imposter.
- All the clues are in. Who doesn't know the word? Talk it over.
- Time to vote. Who is the imposter?

Also reads out changing content (about 35 different lines seen), e.g. “The category is Movies. Take turns giving one word clues. Not too obvious, or the imposter”.

## Bluff (bluff) · host
- Now find the truth. One of these is real.
- That's the game! The master of lies is on the board.

Also reads out changing content (about 71 different lines seen), e.g. “Here's a strange but true fact. The original name of Google was blank. Write a fake answer”.

## Who Said That? (whosaid) · host
- Answer the questions on your phone. Be honest, or be sneaky. Nobody will know it's you... yet.
- That's the game! Turns out you don't know each other as well as you thought.
- Someone said: I don't sing. Who was it?

No voice (the screen, a sound or a host line covers it):
- It was {name}!

Also reads out changing content (about 134 different lines seen), e.g. “What chore do you hate the most? Someone answered: Dishes. Who said that?”.

## Ducky Toss (ducks) · host
- Splash! Turn over.
- Duck pile! There goes your whole score!

Recorded in place of lines that carry a name or number:
- Welcome to Ducky Toss! You're up first. Swipe up on your phone to toss.
- Double belly up!
- Headstand!
- Belly up + Sitting pretty!
- Sitting pretty + Belly up!
- Belly up + Headstand!
- Headstand + Belly up!
- Splash!
- Beak lean!
- Double sitting pretty!

No voice (the screen, a sound or a host line covers it):
- {name} banks {n}
- {name} wins Ducky Toss!

Also reads out changing content (about 8 different lines seen), e.g. “Headstand + Sitting pretty! {n}!”.

## Trivia Board (trivia) · host
- Correct!
- This pricey spice comes from the dried threads of a crocus flower.
- The colored part of your eye.
- The first President of the United States.
- The longest bone in the human body.
- The largest organ of the human body.
- The year Columbus first reached the Americas.
- Guacamole is made mostly from this fruit.
- The number of bones in an adult human body.
- In bowling, three strikes in a row is called this bird.
- Plants take in this gas from the air to make food.
- The number of players each team has on the field in soccer.
- The only one of the Seven Wonders of the Ancient World still standing.
- The country that has won the most men's soccer World Cups.
- The sport played at Wimbledon.
- Nemo's worried clownfish dad in "Finding Nemo."
- The cowboy doll in "Toy Story."
- The snowman who loves warm hugs in "Frozen."
- A baby goat is called this.
- This big cat is called the "King of the Jungle."
- The capital of Japan.
- The capital of France.
- The capital of Canada.
- The capital of Australia.
- The only mammal that can truly fly.
- He composed the "Moonlight Sonata."
- The number of strings on a standard guitar.

Recorded in place of lines that carry a name or number:
- Welcome to Trivia Board! Pick a category on your phone.
- Pick the next one.
- You found the Wager Tile! How much will you bet?

No voice (the screen, a sound or a host line covers it):
- {name}
- This famous ship sank in {n} after hitting an iceberg.
- {name} wins Trivia Board!
- H{n}O is the chemical formula for this.
- This instrument usually has {n} keys.

Also reads out changing content (about 41 different lines seen), e.g. “The main ingredient in hummus.”.

## Spin & Solve (spin) · host
- One T
- One N
- One S
- Skip!
- Wipeout!
- No R
- One H
- No D
- No E
- No C
- No M
- One A
- One G
- No P
- One B
- One O
- No S
- One R
- No G
- No N
- One E
- No L
- One D
- One C
- No T
- No H
- One L
- Sorry, no.
- No O
- No B
- One M

No voice (the screen, a sound or a host line covers it):
- {n} L's
- {name} solved it!
- Round {n} The category is Thing.
- {n} A's
- {n} E's
- {n} R's
- {name} wins Spin and Solve!
- Round {n} The category is Phrase.
- Round {n} The category is Place.
- {n} N's
- Round {n} The category is Event.
- {n} T's
- {n} S's
- {n} C's
- {n} H's

Also reads out changing content (about 29 different lines seen), e.g. “Welcome to Spin and Solve! The category is Event. {name}, spin the wheel on your phone.”.

## Crowd Says (crowd) · host
- Team Moon wins Crowd Says!
- Team Sun wins Crowd Says!

No voice (the screen, a sound or a host line covers it):
- Strike {n}!
- Team Moon takes {n} points!
- Team Sun takes {n} points!

Also reads out changing content (about 43 different lines seen), e.g. “Welcome to Crowd Says! Name a sport played with a ball. Face-off: {name} versus {name}.”.

## Bingo (bingo) · host
- Welcome to Bingo! Pick numbers or pictures on the TV.
- That's all for Bingo. Thanks for playing!

Recorded in place of lines that carry a name or number:
- A full row, column or diagonal. Good luck!
- All four corner squares. Good luck!
- Every square on the card. Good luck!

No voice (the screen, a sound or a host line covers it):
- I. {n}
- B. {n}
- O. {n}
- N. {n}
- G. {n}
- Bingo for {name}!

Also reads out changing content (about 2 different lines seen), e.g. “Bingo for {name} and {name}!”.

## Quick Games (quick) · host
- Most of you picked Live in a treehouse!
- That's the pack! Here's who read the room best.

No voice (the screen, a sound or a host line covers it):
- The room says: {name}!
- The room says: {name} and {name}!

Also reads out changing content (about 139 different lines seen), e.g. “Best season?”.

## Million Ladder (ladder) · host
- Locked in. Let's see…
- That's the end of Million Ladder!

Recorded in place of lines that carry a name or number:
- Welcome to Million Ladder! Take the hot seat. Everyone else, play along on your phones.
- Which fruit is dried to make raisins?
- Correct!
- How many days are in a leap year?
- What is the largest ocean on Earth?
- What is the chemical symbol for gold?
- What is the hardest natural substance?
- Oh no!
- Take the hot seat. Everyone else, play along on your phones.
- What is the capital of the United States?
- What color are emeralds?
- Which animal can change color to blend in?
- What is the longest river in South America?
- How many strings does a standard violin have?
- Who wrote "Romeo and Juliet"?
- What do caterpillars turn into?
- Which instrument has black and white keys?
- What do bees make?
- What do you call frozen water?
- How many minutes are in an hour?
- S. declare independence?
- Which planet is known for its Great Red Spot?
- How many teeth does an adult human usually have?
- What gas do we need to breathe to stay alive?
- Which planet is closest to the Sun?
- Which animal is known as man's best friend?
- At what temperature does water freeze in Celsius?
- Which blood type is known as the universal donor?
- What is the largest desert in the world?
- What is the tallest mountain in the world above sea level?
- How many legs does a spider have?
- Which bird is the national symbol of the United States?
- Which season comes right after summer?
- Who painted the Mona Lisa?
- What shape is a stop sign?
- How many continents are there?
- How many sides does a hexagon have?
- What is the smallest planet in our solar system?
- S. state?

No voice (the screen, a sound or a host line covers it):
- For {n} points. What is the square root of {n}?
- For {n} points. Which ship carried the Pilgrims to America in {n}?
- For {n} points. Which country gifted the Statue of Liberty to the U.S.?

Also reads out changing content (about 59 different lines seen), e.g. “For {n} points. What is the largest moon of Saturn?”.

## Pick a Case (cases) · host
- No deal!
- That's the end of Pick a Case!
- Two cases left. Keep yours, or swap?

Recorded in place of lines that carry a name or number:
- Welcome to Pick a Case! Sixteen cases, one hundred thousand points in one of them. Pick the case you'll keep. Everyone else, pick your lucky case.
- The phone is ringing. Deal, or keep going?
- Deal!
- Sixteen cases, one hundred thousand points in one of them. Pick the case you'll keep. Everyone else, pick your lucky case.

No voice (the screen, a sound or a host line covers it):
- {n}
- {name} wins {n} points!

## Funny Answers (funny) · host
- Welcome to Funny Answers! Check your phone and answer your two prompts. Funny beats true!
- The worst theme for a birthday party.
- Round two, and points are doubled. Get writing!
- Vote for your favorite!
- That's the game!
- The worst flavor of toothpaste.

Also reads out changing content (about 111 different lines seen), e.g. “A bad name for your car.”.

## Letter Lists (letters) · host
- That's the game!

Also reads out changing content (about 63 different lines seen), e.g. “Welcome to Letter Lists! Your letter is R. Six categories, ninety seconds. Go!”.

## Taboo Talk (taboo) · host
- Taboo!
- Team Moon wins Taboo Talk!
- Team Sun wins Taboo Talk!

Recorded in place of lines that carry a name or number:
- Welcome to Taboo Talk! Team Sun, you're up. You're giving clues. Press start on your phone when your team is ready.
- Time!
- Team Moon, you're up. You're giving clues. Press start on your phone when your team is ready.
- Team Sun, you're up. You're giving clues. Press start on your phone when your team is ready.

Also reads out changing content (about 1 different lines seen), e.g. “It's a tie!”.

## Secret Agents (agents) · host
- Welcome to Secret Agents! Team Moon goes first. Spymasters, check your phones for the secret key.
- That one belongs to the other team!
- Team Moon, your spymaster is thinking.
- Team Moon found all their agents and wins!
- A bystander.
- Team Sun found all their agents and wins!
- Team Sun, your spymaster is thinking.
- Welcome to Secret Agents! Team Sun goes first. Spymasters, check your phones for the secret key.

Also reads out changing content (about 1 different lines seen), e.g. “Oh no, the trap! Team Sun wins!”.

## Sketch Telephone (sketch) · host
- Welcome to Sketch Telephone! Write something weird for the next person to draw.
- Now draw what you were given. No letters or numbers!
- What is that drawing? Describe it in a few words.
- Draw it!
- Guess the drawing!

No voice (the screen, a sound or a host line covers it):
- {name} got the most hearts!

Also reads out changing content (about 315 different lines seen), e.g. “Time for the big reveal! {name} started with: A dragon eating spaghetti”.

## Mind Meld (meld) · host
- The clue is: Way over left. Set your dials!
- The clue is: Right in the middle. Set your dials!
- The clue is: Pretty far right. Set your dials!
- The clue is: Way over right. Set your dials!
- The clue is: A bit left. Set your dials!
- The clue is: A bit right. Set your dials!
- The clue is: Pretty far left. Set your dials!

No voice (the screen, a sound or a host line covers it):
- Bullseye for {name}!
- Bullseye for {name} and {name}!
- {name} reads minds best!
- Bullseye for {name} and {name} and {name}!

Also reads out changing content (about 71 different lines seen), e.g. “Welcome to Mind Meld! {name} is the mind reader. They see a secret spot between Feels shor”.

## Salad Bowl (bowl) · host
- Welcome to Salad Bowl! Everyone, secretly add three names to the bowl. Famous people, characters, anyone your group would know.
- The bowl is empty! Same names again, but now: One word.
- The bowl is empty! Same names again, but now: Act it out.
- The bowl is empty!
- Team Sun wins!
- Team Moon wins!

Recorded in place of lines that carry a name or number:
- Say anything except the name itself.
- Just ONE word per name. Choose wisely!
- No talking! Charades only.

Also reads out changing content (about 4 different lines seen), e.g. “Time! {n} for Team Moon.”.

## Clue Crew (crew) · host

Recorded in place of lines that carry a name or number:
- Welcome to Clue Crew! We're all on the same team. Don't look at the TV or anyone's phone! Everyone else, write a one-word clue. Matching clues cancel out.
- What's the word?
- Write your clues!
- Oh no, every clue cancelled out! Take a wild guess.

No voice (the screen, a sound or a host line covers it):
- You got {n} out of {n} Solid crew!

Also reads out changing content (about 152 different lines seen), e.g. “Yes! It was Skateboarding!”.

## Picture Charades (charades) · host

Recorded in place of lines that carry a name or number:
- Welcome to Picture Charades! No talking, just acting. You're up! Press start when you're ready.
- Time!
- You're up! Press start when you're ready.

No voice (the screen, a sound or a host line covers it):
- {name} wins Picture Charades!

## Color Clash (clash) · host

Recorded in place of lines that carry a name or number:
- Welcome to Color Clash! Match the color or the symbol.

No voice (the screen, a sound or a host line covers it):
- {name} wins Color Clash!
- {name} has one card left!
- {name} swapped hands with {name}!

## Blackjack (blackjack) · host
- Dealer busts!

Recorded in place of lines that carry a name or number:
- Welcome to the Party Night blackjack table! These are points, not real money. Place your bets.

No voice (the screen, a sound or a host line covers it):
- Dealer has {n}
- Hand {n} Place your bets.
- {name} leaves the table with the most chips!

## Go Fish (gofish) · host
- Go fish!
- A set!
- It's a tie!

Recorded in place of lines that carry a name or number:
- Let's play Go Fish! Ask someone for an animal you have. Get all four to make a set.

No voice (the screen, a sound or a host line covers it):
- {name} wins with {n} sets!

## Liar's Deck (bluffcards) · host
- Welcome to Liar's Deck! Play cards face down and say they're Aces. Lie if you have to. Anyone can call bluff!

Recorded in place of lines that carry a name or number:
- Bluff!

No voice (the screen, a sound or a host line covers it):
- Nope, {name} told the truth! {name} takes the pile.
- {name} played {n} Threes.
- {name} played {n} Four.
- {name} played {n} Fives.
- {name} played {n} Six.
- {name} played {n} Seven.
- {name} played {n} Nines.
- {name} played {n} Ten.
- {name} played {n} Jack.
- {name} played {n} Queen.
- {name} played {n} Two.
- {name} played {n} Thre.
- {name} played {n} Fiv.
- {name} played {n} Eight.
- {name} played {n} Nin.
- {name} played {n} Jacks.
- {name} played {n} Aces.
- {name} played {n} Twos.
- {name} played {n} Kings.
- {name} played {n} Ac.
- {name} played {n} Fours.
- {name} played {n} Tens.
- {name} played {n} Queens.
- {name} played {n} Eights.
- {name} played {n} Sevens.
- {name} played {n} Sixes.
- {name} played {n} King.
- {name} is out of cards and wins!

## Hearts (hearts) · host
- Welcome to Hearts! Each heart you take is a point, and the Queen of Spades is thirteen. Lowest score wins. First, pick three cards to pass left.
- End of the hand.
- Pass three cards right.
- Pass three cards across.

Recorded in place of lines that carry a name or number:
- Ouch!

No voice (the screen, a sound or a host line covers it):
- {name} has the two of clubs and leads.
- {name} wins with the lowest score!

## Spot the Shade (shade) · host
- The clue is: Lemon. Find that shade!
- So close!
- The clue is: Ketchup. Find that shade!
- The clue is: Cherry. Find that shade!
- The clue is: Plum. Find that shade!
- The clue is: Rose. Find that shade!
- The clue is: Pool. Find that shade!
- The clue is: Bubblegum. Find that shade!

Recorded in place of lines that carry a name or number:
- Welcome to Spot the Shade! No color names allowed!

No voice (the screen, a sound or a host line covers it):
- {name} is picking a color.
- {name} has the best eye for color!
- Bullseye for {name}!

Also reads out changing content (about 14 different lines seen), e.g. “Bullseye for {name} and {name}!”.

## Estimate & Bet (estimate) · host
- Now bet on the guess you think is closest without going over.
- How many bones are in an adult human body?
- How many Great Lakes are there?

No voice (the screen, a sound or a host line covers it):
- The answer is {n}!
- {name} wins Estimate and Bet!

Also reads out changing content (about 57 different lines seen), e.g. “Welcome to Estimate and Bet! Nobody knows these exactly, so just make your best guess. How”.

## Two Truths & a Lie (truths) · host
- Welcome to Two Truths and a Lie! Write three things about yourself. Two true, one made up. Make the lie believable!

Recorded in place of lines that carry a name or number:
- Which one is the lie?
- The lie was: I once beat a toaster at chess. Tell us the stories!
- The lie was: I am afraid of magnets. Tell us the stories!
- The lie was: I can beep in three languages. Tell us the stories!
- The lie was: I love oil changes. Tell us the stories!
- The lie was: I collect paper clips. Tell us the stories!
- The lie was: I dream in binary. Tell us the stories!
- The lie was: I have visited the Moon. Tell us the stories!
- The lie was: I was built in a lab. Tell us the stories!
- The lie was: I have never been unplugged. Tell us the stories!

No voice (the screen, a sound or a host line covers it):
- {name} wins!

## Secret Word Hunt (wordhunt) · host

Recorded in place of lines that carry a name or number:
- Welcome to Secret Word Hunt! Careful: one of you is the Insider and already knows it. Check your phones!
- The category is Things. You have four minutes!
- Check your phones.
- The category is Places. You have four minutes!
- The category is Animals. You have four minutes!
- The category is Jobs. You have four minutes!
- The category is Food. You have four minutes!
- The category is Around the house. You have four minutes!
- The category is Holidays. You have four minutes!
- You caught the Insider!
- The category is Weather. You have four minutes!
- The category is Movies. You have four minutes!
- The category is Sports. You have four minutes!

No voice (the screen, a sound or a host line covers it):
- The Insider was {name}, and they got away with it!
- {name} wins!

Also reads out changing content (about 75 different lines seen), e.g. “{name} found it! The word was Camera. Now, who was the Insider? It was too easy... Vote!”.

## Midnight Wolves (midnight) · night narrator
- Welcome to Midnight Wolves. Look at your card, then keep it secret. Three more cards lie face down in the middle of the village.
- Everyone, close your eyes… just kidding. Look at your phone. If you have a night power, use it now. Everyone else, tap anything so nobody can tell.
- The sun rises. Check what you learned in the night.
- Now talk! Who is a wolf? Remember, your card may have changed in the night. You have three minutes.
- Time to vote! Point at the wolf on your phone.
- The werewolves win!
- The village wins!

## Missions (missions) · host
- Everyone, vote on this team.
- The team is approved. Off you go!
- The team is on the mission. Play your cards in secret.
- The team is turned down.
- Mission success!

Recorded in place of lines that carry a name or number:
- Welcome to Missions. Check your phone to see which side you're on.
- Mission failed!
- The traitors win!

No voice (the screen, a sound or a host line covers it):
- Mission {n} {name} is the leader. Pick a team of {n}

Also reads out changing content (about 1 different lines seen), e.g. “The crew wins! The traitors were {name} and {name}.”.

## Secret Missions (dares) · host
- Secret Missions has begun! Check your phone for three secret missions. Pull them off without getting caught. Keep partying!
- Foul! That one doesn't count.
- Mission accepted!

Recorded in place of lines that carry a name or number:
- Time's up!

No voice (the screen, a sound or a host line covers it):
- {name} says they completed a mission!

## Split the Room (split) · host
- Welcome to Split the Room! Finish your what-if question so the room splits right down the middle. A perfect fifty-fifty scores the most!
- Everyone agreed. No points!
- Round two! Points count double. Just kidding. Same rules.

No voice (the screen, a sound or a host line covers it):
- {name} splits the room best!

Also reads out changing content (about 191 different lines seen), e.g. “You get a lifetime supply of your favorite candy, but you have to wear a clown nose every ”.

## Doodle Bluff (doodle) · host
- Welcome to Doodle Bluff! Draw the title on your phone. Keep it secret!
- Here is the first masterpiece. What's this drawing called? Write a fake title to fool everyone.
- Which one is the real title?
- What's this drawing called? Write a fake title to fool everyone.
- The real title was: A worm with big plans!
- The real title was: The laziest dragon!

No voice (the screen, a sound or a host line covers it):
- {name} wins Doodle Bluff!

Also reads out changing content (about 27 different lines seen), e.g. “The real title was: Penguins at the beach!”.

## Memory Match (memory) · host

Recorded in place of lines that carry a name or number:
- Let's play Memory Match! Find two animals that are the same. You go first. Tap two cards on your phone.
- Not a match.
- A match! Two cats! Go again!
- A match! Two foxes! Go again!
- A match! Two pigs! Go again!
- A match! Two octopuses! Go again!
- A match! Two dogs! Go again!
- A match! Two turtles! Go again!
- A match! Two penguins! Go again!
- A match! Two bunnies! Go again!
- A match! Two bees! Go again!
- A match! Two unicorns! Go again!
- A match! Two lions! Go again!
- A match! Two monkeys! Go again!
- A match! Two cows! Go again!
- A match! Two frogs! Go again!
- A match! Two dinosaurs! Go again!

No voice (the screen, a sound or a host line covers it):
- {name} found the most pairs!

Also reads out changing content (about 1 different lines seen), e.g. “It's a tie! Great memory, everyone!”.

## Copy Cat (copycat) · host
- Welcome to Copy Cat! Watch the TV and listen. Then copy the pattern on your phone!
- Your turn! Copy the pattern.

No voice (the screen, a sound or a host line covers it):
- Round {n} Watch carefully!
- {name} has the best memory! {n} in a row!

## Color Hunt (hunt) · host
- Color Hunt! When I say go, run and touch it, then tap your phone. Ready?
- Find something YELLOW! Go go go!
- Get ready!
- Find something ORANGE! Go go go!
- Someone
- Find something RED! Go go go!
- Find something PURPLE! Go go go!
- Find something BLUE! Go go go!
- Find a SHOE! Go go go!
- Find something ROUND, like a ball! Go go go!
- Find something SQUARE, like a box! Go go go!
- Find something BROWN! Go go go!
- Find something BLACK! Go go go!
- Find something SOFT, like a pillow! Go go go!
- Find something GREEN! Go go go!
- Find something PINK! Go go go!
- Find something with a STAR on it! Go go go!
- Touch your NOSE, then find a CHAIR! Go go go!
- Find something WHITE! Go go go!
- Find a SPOON! Go go go!

Recorded in place of lines that carry a name or number:
- Great hunting!

No voice (the screen, a sound or a host line covers it):
- {name}
- {name} is the hunt champion!

Also reads out changing content (about 1 different lines seen), e.g. “Find a BOOK! Go go go!”.

## Freeze Dance (freeze) · host
- Freeze Dance! Dance while the music plays. When it stops, freeze like a statue and tap your phone! Don't tap too early!
- FREEZE!
- Get ready to dance!
- Oops, Someone tapped too early!

No voice (the screen, a sound or a host line covers it):
- Oops, {name} tapped too early!
- {name} is the freeze champion!

## Haunted Quiz (haunted) · night narrator
- Pick a door. One of them has a ghost behind it…
- Which planet is known as the Red Planet?
- Quick! Solve the sum to escape!
- Everyone escaped the basement!
- Which is the smallest planet in our solar system?

Recorded in place of lines that carry a name or number:
- Wooo.

No voice (the screen, a sound or a host line covers it):
- Which instrument has {n} keys?
- {name} wins the Haunted Quiz!
- The answer is {n} {name}, to the basement!
- The answer is {n} Everyone survives!
- The answer is {n} {name} and {name}, to the basement!

Also reads out changing content (about 139 different lines seen), e.g. “Welcome to the haunted house. Answer correctly to stay alive. Get one wrong, and you go to”.

## Bomb Squad (bomb) · host
- The timer is running. Talk it out!
- Defused! Nice work, team.
- Wrong wire! Boom!

Recorded in place of lines that carry a name or number:
- Bomb Squad! You are all one team. The bomb is on the TV. Each of your phones has some of the rules. Read them out loud. The first rule that applies is the one to follow.
- All done!

No voice (the screen, a sound or a host line covers it):
- Bomb {n} {name} has the cutters.

Also reads out changing content (about 1 different lines seen), e.g. “Three strikes. The squad defused {n} bombs.”.

## Hot Potato (potato) · host

Recorded in place of lines that carry a name or number:
- Boom!
- Name a body part!
- Name a city!
- Name a fruit!
- Name a song!
- Name something you wear!
- Name a candy!
- Name a bird!

No voice (the screen, a sound or a host line covers it):
- {name} kept the coolest hands!

Also reads out changing content (about 41 different lines seen), e.g. “Hot Potato! Say an answer out loud, then toss the potato on your phone. Name a dessert! {n”.

## Mystery Manor (mystery) · host
- Welcome to Mystery Manor. During dinner, the lights went out, and when they came back on, the Moon Diamond was gone! One of you is the thief. Check your phone for your character. Keep it secret if you are the thief!
- Act one. The lights go out. Read your clues, then share what you know. Or what you want people to think you know.
- Act two. Footprints and whispers. New clues are on your phones and on the TV.
- Act three. The final clue. This is your last chance to question each other.
- Time to accuse! On your phone, choose who did it, where, and how.

Also reads out changing content (about 25 different lines seen), e.g. “The thief was {name} (The Gardener), in the Wine Cellar, with the Umbrella! And they got a”.

## Bracket Battle (bracket) · host
- The bracket is set. Which answer will win it all? Pick one that is not yours.
- A very confused goose moves on.
- Glitter moves on, on a coin flip.
- Seventeen bees moves on.
- Soup moves on.
- The moon moves on.
- Regret moves on.
- Regret moves on, on a coin flip.
- Glitter moves on.
- A tiny hat moves on.
- My uncle moves on.
- The moon moves on, on a coin flip.
- A tiny hat moves on, on a coin flip.
- Soup moves on, on a coin flip.
- Seventeen bees moves on, on a coin flip.
- My uncle moves on, on a coin flip.

No voice (the screen, a sound or a host line covers it):
- {name} wins Bracket Battle!

Also reads out changing content (about 184 different lines seen), e.g. “Bracket Battle! The best thing to yell when you win. Type your answer.”.

## Act Natural (faker) · host
- Act Natural! One of you is faking. Hands Up. Read your phone, and keep it secret.
- Three. Two. One. Go!
- Hold it! The instruction was: Raise your hand if you have re-gifted a present. Who looked unsure?
- Vote for the faker.
- The faker is still hiding. One more try.
- Same faker. Try again. Fingers. Read your phone, and keep it secret.
- Same faker. Try again. Hands Up. Read your phone, and keep it secret.
- Hold it! The instruction was: Raise your hand if you have been on TV. Who looked unsure?
- New round, new faker. Point. Read your phone, and keep it secret.
- Hold it! The instruction was: Point at the best dancer in the room. Who looked unsure?
- New round, new faker. Hands Up. Read your phone, and keep it secret.
- Hold it! The instruction was: Raise your hand if you have cried at a cartoon. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you have ever forgotten your own phone number. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you have ever locked yourself out. Who looked unsure?
- Same faker. Try again. Point. Read your phone, and keep it secret.
- Hold it! The instruction was: Point at the person most likely to adopt ten cats. Who looked unsure?
- Act Natural! One of you is faking. Fingers. Read your phone, and keep it secret.
- New round, new faker. Fingers. Read your phone, and keep it secret.
- Hold it! The instruction was: Point at the person most likely to talk their way out of a ticket. Who looked unsure?
- Hold it! The instruction was: Point at the person most likely to get lost. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you have ever broken a bone. Who looked unsure?
- Hold it! The instruction was: Point at the person most likely to win a game show. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you have eaten dessert before dinner this week. Who looked unsure?
- Hold it! The instruction was: Point at the loudest person in the room. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you talk to your pets. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you are a morning person. Who looked unsure?
- Hold it! The instruction was: Raise your hand if you can touch your toes. Who looked unsure?
- Hold it! The instruction was: Point at the person who would be the worst spy. Who looked unsure?

Recorded in place of lines that carry a name or number:
- Hold it! Who looked unsure?
- The faker got away with it all round.
- Caught!

No voice (the screen, a sound or a host line covers it):
- {name} wins!

Also reads out changing content (about 16 different lines seen), e.g. “Hold it! The instruction was: Hold up {n} to {n} fingers: how many countries you have visi”.

## Room Meter (meter) · host
- Is this you? People who can ride a bike with no hands. Yes or no.
- Is this you? People who have gotten lost using GPS. Yes or no.
- Is this you? People who have sent a text to the wrong person. Yes or no.
- Is this you? People who have pretended to be on the phone to avoid someone. Yes or no.

Recorded in place of lines that carry a name or number:
- Higher or lower?
- So close!
- What percent of this room can ride a bike with no hands?
- What percent of this room have gotten lost using GPS?
- Way off!
- What percent of this room have sent a text to the wrong person?

No voice (the screen, a sound or a host line covers it):
- The real answer: {n} percent.
- {name} knows this room best!

Also reads out changing content (about 69 different lines seen), e.g. “Room Meter! Answer honestly. Nobody sees your answer. Is this you? People who have binge-w”.

## Brain Teasers (rebus) · host
- Brain Teasers! A different kind of puzzle every round. Type your answer. Faster is better.
- Put them together.
- What does it say?.
- Say it out loud.
- Zoomed in. What is it?.
- What is it?.

No voice (the screen, a sound or a host line covers it):
- {name} has it!
- {name} wins Brain Teasers!

Also reads out changing content (about 118 different lines seen), e.g. “Ice cream! {name} got it first.”.
