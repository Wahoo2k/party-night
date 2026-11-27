# Party Night narrator script: the other 19 featured games

212 lines, about 11,500 characters. The Storyteller never says a player name or anything players typed; those stay on screen. Save each line as audio/<game>/<id>.mp3. Werewolf (48 lines) is in the Party Night Narration Script doc and audio/script.json.

## Shared lines (every game)

| Moment | When it plays | Line |
|---|---|---|
| `shared/lobby-1` | Lobby, first players join | Welcome to Party Night! Grab your phone, scan the code, and pull up a seat. |
| `shared/lobby-2` | variant | Evening, everyone. The village is open. Join on your phone and we'll get started. |
| `shared/pick-game-1` | Lobby, waiting for the host | Whenever you're ready, pick a game. I'll wait. I'm very patient. |
| `shared/thirty-1` | Thirty seconds left | Thirty seconds left. |
| `shared/thirty-2` | variant | Half a minute. No pressure. |
| `shared/ten-1` | Ten seconds left | Ten seconds! |
| `shared/times-up-1` | Timer ends | Time's up! Pencils down. Thumbs down. Everything down. |
| `shared/everyone-in-1` | All players have answered | That's everyone. Let's see what you've done. |
| `shared/paused-1` | Game paused | Paused. Go get a snack. I'll keep your seat warm. |
| `shared/resumed-1` | Game resumed | And we're back. |
| `shared/game-over-1` | Any game ends | And that's the game! Take a bow, all of you. |
| `shared/game-over-2` | variant | What a round. Some of you should be proud. You know who you are. |
| `shared/next-up-1` | Game night moves to the next game | Don't get too comfortable. The next game is ready. |
| `shared/goodnight-1` | Last game of a game night ends | That's the end of game night. Thank you for visiting the village. Come back soon. |

## Imposter

| Moment | When it plays | Line |
|---|---|---|
| `imposter/intro-1` | Game starts | Welcome to Imposter. Everyone gets the same secret word. Everyone except one of you. Check your phone, and keep a straight face. |
| `imposter/intro-2` | variant | One of you is about to pretend very, very hard. Look at your phone for the secret word. |
| `imposter/clues-1` | Clue round starts | Time for clues. One word each. Helpful enough to prove you know the word, vague enough that the imposter learns nothing. |
| `imposter/clues-fast-1` | Clue round, big group | Everyone, type one clue. They'll all appear together. |
| `imposter/lap2-1` | Second clue round | Once more around. Imposter, I hope you were listening. |
| `imposter/discuss-1` | Discussion starts | Now talk it over. Whose clue was a little too vague? Who's sweating? |
| `imposter/vote-1` | Vote starts | Time to vote. Point your finger, politely, on your phone. |
| `imposter/caught-1` | Imposter is voted out | Caught! But wait. The imposter gets one guess at the secret word. Get it right, and they steal the win. |
| `imposter/escaped-1` | Wrong person voted out | Oh dear. That was not the imposter. The real one has been smiling this whole time. |
| `imposter/stole-1` | Imposter guesses the word | They guessed it! Caught red-handed, and they still win. Outrageous. |
| `imposter/crew-wins-1` | Imposter guesses wrong | Wrong word! The crew wins. Well spotted, everyone. |

## Ducky Toss

| Moment | When it plays | Line |
|---|---|---|
| `ducks/intro-1` | Game starts | Welcome to Ducky Toss. Toss two rubber ducks, score points for how they land, and decide: bank it, or toss again? Get greedy, and you could lose it all. |
| `ducks/intro-2` | variant | Two ducks. One question. How lucky do you feel? |
| `ducks/your-turn-1` | A new turn starts | Next tosser, you're up. |
| `ducks/your-turn-2` | variant | Fresh ducks. Give them a toss. |
| `ducks/big-roll-1` | A rare high-scoring landing | Ooh! That's a rare one. Big points! |
| `ducks/bust-1` | Turn total lost | Splash! Both ducks belly-up. That turn's points are gone. |
| `ducks/bust-2` | variant | And that is why they say: bank it. |
| `ducks/banked-1` | Player banks points | Banked. Sensible. Boring, but sensible. |
| `ducks/close-1` | Someone nears the target | We have a leader closing in on the finish. Everyone else, time to take some risks. |
| `ducks/win-1` | Game ends | We have a Ducky Toss champion! The ducks salute you. |

## Hot Potato

| Moment | When it plays | Line |
|---|---|---|
| `potato/intro-1` | Game starts | Hot Potato! I'll give you a category. Say an answer out loud, then toss the potato on your phone. Whoever's holding it when it blows gets burned. |
| `potato/intro-2` | variant | This potato is hot, and it is ticking. Say an answer, pass it on, and hope. |
| `potato/go-1` | Round goes live | Go! |
| `potato/go-2` | variant | The potato is live! |
| `potato/boom-1` | Potato explodes | Boom! Somebody got burned. |
| `potato/boom-2` | variant | Kaboom. That's going to leave a mark. |
| `potato/next-1` | Next round | New category. Shake it off. |
| `potato/win-1` | Game ends | The coolest hands in the village! Well played. |

## Bingo

| Moment | When it plays | Line |
|---|---|---|
| `bingo/intro-1` | Game starts | It's Bingo time! Your card is on your phone. Tap the squares as I call them, and when you've got it, hit that Bingo button. |
| `bingo/intro-2` | variant | Eyes down, everyone. Let's play Bingo. |
| `bingo/pattern-line-1` | Pattern: a line | We're playing for one line. Any row, any column, or corner to corner. |
| `bingo/pattern-corners-1` | Pattern: four corners | This game is four corners. Just the corners. |
| `bingo/pattern-blackout-1` | Pattern: blackout | This one's a blackout. Every single square. Settle in. |
| `bingo/false-1` | A wrong Bingo call | Not quite! Check your card. We keep going. |
| `bingo/false-2` | variant | Ooh, a false alarm. Nice try. |
| `bingo/bingo-1` | A correct Bingo | Bingo! We have a winner! |
| `bingo/bingo-2` | variant | That's a Bingo! Somebody's been paying attention. |

## Quick Games

| Moment | When it plays | Line |
|---|---|---|
| `quick/intro-1` | Game starts | Quick Games! Fast questions, big opinions. There are no wrong answers. Only answers we'll judge you for. |
| `quick/intro-2` | variant | Let's find out what this room really thinks. |
| `quick/hot-1` | Hot Take round | Hot take! Pick your side, then guess what most of the room picked. |
| `quick/wyr-1` | Would You Rather round | Would you rather? Choose quickly. Overthinking is cheating. |
| `quick/mlt-1` | Most Likely To round | Most likely to! Vote for the person in this room who fits best. Be honest. They can take it. |
| `quick/reveal-split-1` | A close vote | Look at that. Split right down the middle. Feel free to argue. |
| `quick/reveal-landslide-1` | A one-sided vote | Well, that was not close. |
| `quick/win-1` | Game ends | That's Quick Games. You've all learned something about each other. Sorry about that. |

## Sketch Telephone

| Moment | When it plays | Line |
|---|---|---|
| `sketch/intro-1` | Game starts | Welcome to Sketch Telephone. Write something weird. The next person will have to draw it. |
| `sketch/intro-2` | variant | It starts with a few innocent words. It will not end that way. |
| `sketch/draw-1` | Drawing step | Now draw what you were given. No letters. No numbers. Just art. |
| `sketch/draw-2` | variant | Time to draw. Remember: confidence matters more than talent. |
| `sketch/guess-1` | Guessing step | What on earth is that drawing? Describe it in a few words. |
| `sketch/guess-2` | variant | Look at the masterpiece on your phone. What is it? |
| `sketch/reveal-1` | Reveal begins | Time for the big reveal. Let's see how it all fell apart. |
| `sketch/chain-start-1` | A new chain is shown | It started like this. |
| `sketch/chain-start-2` | variant | Here's the next one. It began so simply. |
| `sketch/chain-end-1` | A chain finishes | And that's where it ended up. Remarkable. |
| `sketch/chain-end-2` | variant | Nailed it. Sort of. |
| `sketch/hearts-1` | Reminder to give hearts | Tap the heart on your phone for the ones you love. |
| `sketch/win-1` | Game ends | And the most loved artist of the evening is on your screen. Frame that. |

## Salad Bowl

| Moment | When it plays | Line |
|---|---|---|
| `bowl/intro-1` | Game starts | Welcome to Salad Bowl. Everyone, secretly add three names to the bowl. Famous people, characters, anyone this group would know. |
| `bowl/intro-2` | variant | First, we fill the bowl. Three names each. Keep them secret. |
| `bowl/round1-1` | Round 1 starts | Round one: describe it. Say anything you like, except the name itself. |
| `bowl/round2-1` | Round 2 starts | Round two: one word. Same names, but you get exactly one word per name. Choose wisely. |
| `bowl/round3-1` | Round 3 starts | Round three: act it out. Same names again. No talking. Not a sound. |
| `bowl/ready-1` | A clue-giver is up | Clue-giver, press start when your team is ready. |
| `bowl/time-1` | Turn ends | Time! Hands off the bowl. |
| `bowl/empty-1` | Bowl is empty | The bowl is empty! Don't worry, the names are going back in. |
| `bowl/win-1` | Game ends | And the winning team takes the Salad Bowl. A real bowl is not included. |

## Funny Answers

| Moment | When it plays | Line |
|---|---|---|
| `funny/intro-1` | Game starts | Welcome to Funny Answers. You'll each get a couple of prompts. Write the funniest answer you can. Then the room decides who did it better. |
| `funny/intro-2` | variant | Time to be funny on purpose. Check your phone for your prompts. |
| `funny/vote-1` | A matchup is shown | Two answers enter. Vote for your favorite. |
| `funny/vote-2` | variant | Which one is funnier? Vote now. |
| `funny/sweep-1` | One answer gets every vote | A clean sweep! Every single vote. |
| `funny/sweep-2` | variant | Unanimous! That one's going on the fridge. |
| `funny/tie-1` | Votes are tied | A tie! You're both equally funny. Or equally not. |
| `funny/round2-1` | Round 2 starts | Round two. The points are doubled, so try twice as hard. |
| `funny/final-1` | Final round starts | Final round. Everyone answers the same prompt, and everyone votes. Triple points. |
| `funny/win-1` | Game ends | We have a winner. Officially the funniest person in the room. Don't let it go to your head. |

## Mind Meld

| Moment | When it plays | Line |
|---|---|---|
| `meld/intro-1` | Game starts | Welcome to Mind Meld. One of you sees a secret spot between two opposites, and gives a clue. Everyone else slides their dial to where they think it is. |
| `meld/intro-2` | variant | Let's find out how well you can read each other's minds. |
| `meld/clue-1` | Mind reader is thinking | Mind reader, check your phone. Give a clue that sits right on that secret spot. |
| `meld/guess-1` | Everyone sets dials | There's your clue. Talk it over, then set your dials. |
| `meld/reveal-1` | Target revealed | Let's see where it really was. |
| `meld/bullseye-1` | Someone hits the target | Bullseye! Right on the spot. |
| `meld/meld-1` | Everyone was close | Mind meld! You're all thinking as one. Slightly worrying. |
| `meld/miss-1` | Everyone was far off | Oh. Oh no. Not even close. We'll say no more about it. |
| `meld/win-1` | Game ends | And our best mind reader is revealed. Everyone else, guard your thoughts. |

## Doodle Bluff

| Moment | When it plays | Line |
|---|---|---|
| `doodle/intro-1` | Game starts | Welcome to Doodle Bluff. Each of you has a secret title. Draw it as well as you can. Nobody else knows what it is. |
| `doodle/intro-2` | variant | Artists, to your phones. Draw your secret title. No words allowed. |
| `doodle/fake-1` | A drawing is shown | Behold. What is this drawing called? Write a fake title that sounds like the real thing. |
| `doodle/fake-2` | variant | Here's our next masterpiece. Invent a title for it. |
| `doodle/pick-1` | Titles are listed | One of these titles is real. The rest are lies. Which is which? |
| `doodle/reveal-1` | Real title revealed | And the real title was... |
| `doodle/reveal-2` | variant | Let's see who was fooled. |
| `doodle/fooled-all-1` | A fake fools most players | That fake fooled almost everyone. Magnificent lying. |
| `doodle/win-1` | Game ends | And that's Doodle Bluff. Some fine art, and some very fine lies. |

## Who Said That?

| Moment | When it plays | Line |
|---|---|---|
| `whosaid/intro-1` | Game starts | Welcome to Who Said That. First, answer a few questions about yourself. Be honest. Then we'll see who really knows who. |
| `whosaid/intro-2` | variant | Let's find out how well you know each other. Start by answering on your phone. |
| `whosaid/guess-1` | An answer is shown | Here's an answer. Who said it? |
| `whosaid/guess-2` | variant | Somebody in this room wrote this. But who? |
| `whosaid/reveal-1` | Author revealed | And it was... |
| `whosaid/reveal-2` | variant | The truth comes out. |
| `whosaid/nobody-1` | Nobody guesses right | Nobody got that one! We have a mystery person among us. |
| `whosaid/everybody-1` | Everyone guesses right | Everyone got it. Some people are an open book. |
| `whosaid/win-1` | Game ends | And the person who knows this group best is on your screen. A little too well, perhaps. |

## Clue Crew

| Moment | When it plays | Line |
|---|---|---|
| `crew/intro-1` | Game starts | Welcome to Clue Crew. You're all on one team. One of you guesses the secret word. Everyone else writes a one-word clue. But be careful: matching clues cancel each other out. |
| `crew/intro-2` | variant | Tonight you win together or lose together. Guesser, no peeking at phones. |
| `crew/clue-1` | Clue writing | Write your clue. One word. Try to think of something nobody else will. |
| `crew/cancel-1` | Some clues cancel | Uh oh. Some of you had the same idea. Those clues are gone. |
| `crew/all-cancel-1` | Every clue cancels | Every clue cancelled! Guesser, you're on your own. Good luck. |
| `crew/guess-1` | Guesser guesses | Guesser, here's what survived. What's the word? |
| `crew/right-1` | Correct guess | Yes! That's the word! |
| `crew/right-2` | variant | Got it! Lovely teamwork. |
| `crew/wrong-1` | Wrong guess | Not the word. And that costs you an extra card. |
| `crew/pass-1` | Guesser passes | A pass. Sometimes that's the wise move. |
| `crew/end-great-1` | Game ends, high score | What a crew! You practically share a brain. |
| `crew/end-low-1` | Game ends, low score | Well. You tried. Maybe sit closer together next time. |

## Picture Charades

| Moment | When it plays | Line |
|---|---|---|
| `charades/intro-1` | Game starts | Welcome to Picture Charades. The actor's phone shows a picture. Act it out. No talking, no sounds. Everyone else, shout your guesses! |
| `charades/intro-2` | variant | It's charades! Actors, your picture is on your phone. Not a word. |
| `charades/ready-1` | An actor is up | Our next actor is up. Press start when you're ready. |
| `charades/ready-2` | variant | A new performer takes the stage. |
| `charades/go-1` | Turn starts | And... action! |
| `charades/got-1` | A card is guessed | Yes! |
| `charades/got-2` | variant | Got it! |
| `charades/time-1` | Turn ends | Time! Take a bow. |
| `charades/win-1` | Game ends | And the award for best performance goes to the name on your screen. Bravo! |

## Color Clash

| Moment | When it plays | Line |
|---|---|---|
| `clash/intro-1` | Game starts | Welcome to Color Clash. Match the color or the symbol on the top card. First to play every card wins. |
| `clash/intro-2` | variant | Cards are dealt. Match the color or the symbol, and be the first to empty your hand. |
| `clash/skip-1` | Skip is played | Skipped! Sorry about that. |
| `clash/reverse-1` | Reverse is played | Reverse! Back the other way. |
| `clash/draw2-1` | Draw Two is played | Draw two. Ouch. |
| `clash/wild4-1` | Wild Four is played | Draw four! That's just mean. |
| `clash/wild4-2` | variant | Four cards. There go your plans. |
| `clash/swap-1` | Swap Hands is played | Swap hands! Hand them over. |
| `clash/last-card-1` | A player has one card left | One card left! Somebody stop them! |
| `clash/win-1` | Game ends | Out of cards! We have a Color Clash winner. |

## Color Hunt

| Moment | When it plays | Line |
|---|---|---|
| `hunt/intro-1` | Game starts | Color Hunt! When I say go, run and touch what I ask for. Then tap your phone. Ready? |
| `hunt/intro-2` | variant | Hunters, get ready! Leave your phones on the couch, find it, then run back and tap. |
| `hunt/ready-1` | Before each hunt | Get ready... |
| `hunt/ready-2` | variant | Here it comes... |
| `hunt/red-1` | Hunt call | Find something red! Go go go! |
| `hunt/blue-1` | Hunt call | Find something blue! Go go go! |
| `hunt/green-1` | Hunt call | Find something green! Go go go! |
| `hunt/yellow-1` | Hunt call | Find something yellow! Go go go! |
| `hunt/orange-1` | Hunt call | Find something orange! Go go go! |
| `hunt/purple-1` | Hunt call | Find something purple! Go go go! |
| `hunt/white-1` | Hunt call | Find something white! Go go go! |
| `hunt/black-1` | Hunt call | Find something black! Go go go! |
| `hunt/pink-1` | Hunt call | Find something pink! Go go go! |
| `hunt/brown-1` | Hunt call | Find something brown! Go go go! |
| `hunt/round-1` | Hunt call | Find something round, like a ball! Go! |
| `hunt/soft-1` | Hunt call | Find something soft, like a pillow! Go! |
| `hunt/shoe-1` | Hunt call | Find a shoe! Go! |
| `hunt/book-1` | Hunt call | Find a book! Go! |
| `hunt/spoon-1` | Hunt call | Find a spoon! Go! |
| `hunt/star-1` | Hunt call | Find something with a star on it! Go! |
| `hunt/square-1` | Hunt call | Find something square, like a box! Go! |
| `hunt/chair-1` | Hunt call | Touch your nose, then find a chair! Go! |
| `hunt/first-1` | First player back | We have our first hunter back! Super fast! |
| `hunt/all-back-1` | Everyone found it | Everybody found it! Great hunting. |
| `hunt/win-1` | Game ends | The hunt is over! You were all amazing. Now put everything back. |

## Freeze Dance

| Moment | When it plays | Line |
|---|---|---|
| `freeze/intro-1` | Game starts | Freeze Dance! Dance while the music plays. When it stops, freeze like a statue and tap your phone. But don't tap too early! |
| `freeze/intro-2` | variant | Time to dance! When the music stops, you stop. Ready? |
| `freeze/dance-1` | Music starts | Dance! |
| `freeze/dance-2` | variant | Show me your best moves! |
| `freeze/freeze-1` | Music stops | Freeze! |
| `freeze/freeze-2` | variant | Stop! Nobody move! |
| `freeze/early-1` | Someone taps too early | Oops! Somebody tapped too early. Wait for the music to stop. |
| `freeze/win-1` | Game ends | What dancers! Our freeze champion is on the screen. Everybody take a bow. |

## Copy Cat

| Moment | When it plays | Line |
|---|---|---|
| `copycat/intro-1` | Game starts | Welcome to Copy Cat. Watch the lights and listen. Then copy the pattern on your phone. It gets longer every round. |
| `copycat/intro-2` | variant | Watch closely. I'm going to show you a pattern, and you're going to copy it. |
| `copycat/watch-1` | Pattern is shown | Watch carefully. |
| `copycat/watch-2` | variant | Eyes on the TV. |
| `copycat/your-turn-1` | Players copy | Your turn! Copy the pattern. |
| `copycat/all-right-1` | Everyone gets it | Everybody got it! Let's make it harder. |
| `copycat/lost-heart-1` | Someone misses | Oops, that cost a heart. Keep going! |
| `copycat/long-1` | Pattern reaches 8 | Eight in a row! This is getting serious. |
| `copycat/win-1` | Game ends | What a memory! Our Copy Cat champion is on the screen. |

## Midnight Wolves

| Moment | When it plays | Line |
|---|---|---|
| `midnight/intro-1` | Game starts | Welcome to Midnight Wolves. One night. One vote. Look at your card, and tell no one. Three more cards lie face down in the middle of the village. |
| `midnight/intro-2` | variant | Tonight will be short, and strange. Check your card. Remember it. It may not stay yours. |
| `midnight/night-1` | Night starts | Night falls. Everyone, look at your phone. If you have a power, use it now. If you don't, tap anyway, so nobody can tell. |
| `midnight/morning-1` | Morning | The sun rises. Read what you learned in the night. And remember: your card may have changed while you slept. |
| `midnight/day-1` | Discussion starts | Now talk. Who are you? Who were you? Somebody here is a wolf, and they will lie about it. |
| `midnight/vote-1` | Vote starts | One vote. Make it count. Who is the wolf? |
| `midnight/win-village-1` | Village wins | A wolf has been caught! The village wins. |
| `midnight/win-village-2` | variant | The village chose well. The wolf is found. |
| `midnight/win-wolves-1` | Wolves win | The wolves walk free. The village chose wrong. |
| `midnight/win-wolves-2` | variant | No wolf was caught. Sleep well. If you can. |
| `midnight/no-wolves-1` | No wolves, nobody voted out | There were no wolves at all. And you trusted each other. How lovely. The village wins. |

## Taboo Talk

| Moment | When it plays | Line |
|---|---|---|
| `taboo/intro-1` | Game starts | Welcome to Taboo Talk. Describe the word on your phone so your team can guess it. But don't say the forbidden words. The other team is watching. |
| `taboo/intro-2` | variant | Two teams. One rule: don't say the words in red. |
| `taboo/ready-1` | A clue-giver is up | Clue-giver, press start when your team is ready. Other team, fingers on your buzzers. |
| `taboo/got-1` | A word is guessed | Got it! |
| `taboo/buzz-1` | A forbidden word is caught | Taboo! |
| `taboo/buzz-2` | variant | Buzzed! That was a forbidden word. |
| `taboo/time-1` | Turn ends | Time! Switch teams. |
| `taboo/win-1` | Game ends | And that's the game. The winning team may now say whatever words they like. |
| `taboo/tie-1` | Game ends in a tie | It's a tie! Nobody wins. Or everybody does. Your choice. |
