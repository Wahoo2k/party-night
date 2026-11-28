# Sound effects and music to replace

Every sound today is synthesized in `js/sfx.js`. Each row is one recorded file to generate; the name is the one the code already uses, so a file named `<name>.mp3` in `audio/sfx/` can replace it directly. "Uses" is how many places in the code play it.

## Effects
| Name | Uses | What it is for | Prompt to generate |
|---|---|---|---|
| join | 56 | A player joins; a new phase starts | Short bright two-note chime, friendly, like a doorbell ding for a game show, under 1 second |
| win | 53 | A win or a correct result | Short triumphant brass sting with sparkle, game show winner, about 1.5 seconds |
| vote | 40 | Voting or a question phase opens | Short suspenseful rising synth whoosh into a soft hit, about 1 second |
| drumroll | 33 | Before a reveal | Snare drumroll building for 2 seconds ending in a cymbal crash |
| safe | 15 | Good news, nobody lost | Gentle warm harp glissando upward, relief, about 1.5 seconds |
| stamp | 10 | A result stamped on screen | Heavy rubber stamp thud on paper, single hit |
| tick | 9 | Last ten seconds of a clock | Single dry clock tick, wooden, very short |
| death | 9 | Someone is out; a bomb goes off | Low dramatic orchestral hit with a short falling tail, cartoonish not scary, about 1.5 seconds |
| lose | 7 | A loss or wrong answer | Comedic descending trombone "wah wah", about 1.5 seconds |
| gasp | 6 | Crowd reaction to a shock | Small studio audience gasping in surprise, 1 second |
| groan | 4 | Crowd reaction to bad luck | Small studio audience groaning "ohhh" in sympathy, 1.5 seconds |
| cheer | 3 | Crowd reaction to a win | Small studio audience cheering and clapping, 3 seconds, fades out |
| laugh | 1 | Crowd reaction to a joke | Small studio audience laughing warmly, 2 seconds |
| night | 4 | Night falls (night games) | Soft wind, a distant owl hoot and a low drone, 3 seconds |
| dawn | 3 | Morning comes (night games) | A rooster crow with gentle morning birdsong, 2.5 seconds |
| whoosh | 3 | Something flies across the screen | Quick airy whoosh, left to right, under half a second |
| pop | 3 | Items pop onto the screen | Soft cartoon bubble pop, very short |
| cup-shake | 1 | GOAT Toss: the cup is shaken before a toss | Small wooden game pieces rattling in a leather dice cup, quick shake, under 1 second |
| thud | 1 | GOAT Toss: a goat bounces on the table | Small wooden toy knocking once on a wooden table, dry single hit, very short |
| bleat | 1 | GOAT Toss: a goat lands | Single short goat bleat, friendly cartoonish baa, under 1 second |
| fanfare | 3 | Final round, the winner revealed | Short royal trumpet fanfare, bright, 2 seconds |
| points | 2 | Points landing on a phone | Quick ascending coin-collect sparkle, under 1 second |
| lockin | 2 | An answer locked in | Soft satisfying click with a tiny chime, very short |

## Game-specific effects
| Name | Uses | What it is for | Prompt to generate |
|---|---|---|---|
| gavel | 1 | Going Once: a lot is sold | A wooden auction gavel banging twice on a block, sharp and dry, 1 second |
| coins | 2 | Gold Rush: gold found | A handful of gold coins pouring and jingling into a pile, bright, 1.5 seconds |
| chest | 1 | Gold Rush: chests appear | A heavy wooden treasure chest lid creaking open with a soft magical shimmer, 2 seconds |
| buzzer | 3 | A wrong answer | A short low game-show wrong-answer buzzer, single hit, under 1 second |
| scribble | 1 | Doodle Dash: drawing starts | A pencil scribbling quickly on paper, 1.5 seconds |
| heartbreak | 1 | Last One Standing: a life is lost | A short cartoon glass crack with a sad descending two-note tone, 1 second |
| swoosh-steal | 1 | Gold Rush: someone is robbed | A quick cartoon swipe whoosh followed by a cheeky cash-register ding, 1 second |
| splat | 1 | Rock Paper Showdown: throws land | Three quick hand slaps on a table in a row, 1 second |

## Name That Sound
Everyday sounds the players have to recognize. Plain, dry recordings with no music.

| Name | Uses | What it is for | Prompt to generate |
|---|---|---|---|
| guess-dog | 1 | Name That Sound: a dog barking | A medium-sized dog barking three times, close up, clean recording, 2 seconds |
| guess-cat | 1 | Name That Sound: a cat meowing | A house cat meowing twice, clear and close, 2 seconds |
| guess-doorbell | 1 | Name That Sound: a doorbell | A classic two-tone ding-dong doorbell, 2 seconds |
| guess-zipper | 1 | Name That Sound: a zipper | A jacket zipper being zipped up and then down, close up, 2 seconds |
| guess-popcorn | 1 | Name That Sound: popcorn popping | Popcorn popping in a pot, rapid pops, 3 seconds |
| guess-toilet | 1 | Name That Sound: a toilet flushing | A toilet flushing, 3 seconds |
| guess-microwave | 1 | Name That Sound: a microwave beeping | A microwave oven finishing: three electronic beeps, 2 seconds |
| guess-carhorn | 1 | Name That Sound: a car horn | A car horn honking twice, 2 seconds |
| guess-keyboard | 1 | Name That Sound: typing on a keyboard | Fast typing on a computer keyboard, 3 seconds |
| guess-sneeze | 1 | Name That Sound: a sneeze | A person sneezing loudly once, achoo, 1.5 seconds |
| guess-rooster | 1 | Name That Sound: a rooster | A rooster crowing cock-a-doodle-doo once, 3 seconds |
| guess-bowling | 1 | Name That Sound: a bowling strike | A bowling ball rolling down the lane and striking all the pins, 3 seconds |
| guess-basketball | 1 | Name That Sound: a basketball bouncing | A basketball being dribbled on a gym floor, steady bounces, 3 seconds |
| guess-sodacan | 1 | Name That Sound: a soda can opening | A soda can tab being cracked open with a fizz, 2 seconds |
| guess-velcro | 1 | Name That Sound: velcro | A strip of velcro being ripped apart, 1.5 seconds |
| guess-door | 1 | Name That Sound: a creaky door | An old wooden door creaking slowly open, 3 seconds |
| guess-blender | 1 | Name That Sound: a blender | A kitchen blender running at high speed, 3 seconds |
| guess-hairdryer | 1 | Name That Sound: a hair dryer | A handheld hair dryer blowing, switched on then off, 3 seconds |
| guess-cow | 1 | Name That Sound: a cow | A cow mooing once, long and low, 2 seconds |
| guess-frog | 1 | Name That Sound: a frog | A frog croaking ribbit several times by a pond, 3 seconds |
| guess-owl | 1 | Name That Sound: an owl | An owl hooting hoo-hoo at night, 3 seconds |
| guess-train | 1 | Name That Sound: a train horn | A freight train horn blowing two long blasts, 3 seconds |
| guess-alarm | 1 | Name That Sound: an alarm clock | A digital alarm clock beeping insistently, 2 seconds |
| guess-sizzle | 1 | Name That Sound: something frying | Bacon sizzling in a frying pan, 3 seconds |
| guess-horse | 1 | Name That Sound: a horse galloping | A horse galloping on a dirt track, hoofbeats, 3 seconds |
| guess-duck | 1 | Name That Sound: a duck | A duck quacking four times, 2 seconds |
| guess-kettle | 1 | Name That Sound: a kettle whistling | A stovetop kettle whistling as it boils, rising, 3 seconds |
| guess-snore | 1 | Name That Sound: someone snoring | A person snoring loudly in their sleep, two snores, 3 seconds |

## Music and stings
Nothing here is synthesized except the two thinking beds and the night ambience; the others are silent until a file exists. Loops must be seamless. The game already plays each one at the right moment and lowers music under the narrator.

| File name | When it plays | Prompt to generate |
|---|---|---|
| music-lobby | Game list and join screen, looping | Upbeat playful party lobby music, ukulele, hand claps, light synth bass, cheerful and a bit cheeky, 90 seconds, seamless loop |
| bed-think | While a timer runs, looping | Light quiz-show thinking music, pizzicato strings and soft marimba, 100 bpm, 30 seconds, seamless loop |
| bed-think-comic | While a timer runs in comic-style games, looping | Bouncy cartoon caper music, pizzicato strings, wah-muted trumpet, bongos and a tuba bass line, cheeky and light, 105 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-think-paper | While a timer runs in writing and guessing games, looping | Warm acoustic cafe music, fingerpicked guitar, upright bass, brushed snare and a little soft whistling, relaxed and friendly, 95 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-think-sketch | While a timer runs in drawing games, looping | Playful tinkering music, xylophone, ukulele, clarinet and light shaker, curious and gentle, 100 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-think-kids | While a timer runs in kids' games, looping | Bright toy-box music, glockenspiel, toy piano, hand claps and a bouncy bass, happy and simple, 110 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-think-show | While a timer runs in game-show games, looping | Retro TV game-show thinking music, Hammond organ, vibraphone, walking bass, light drums and small brass stabs, 110 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-think-noir | While a timer runs in spy and mystery games, looping | Sneaky spy jazz, upright bass, finger snaps, brushed drums, muted trumpet and vibraphone, sly and quiet, 90 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-think-teams | While a timer runs in team games, looping | Sporty upbeat funk, drumline snare, hand claps, slap bass and short brass riffs, energetic but not loud, 112 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-think-felt | While a timer runs in card games, looping | Smooth casino lounge music, piano trio with soft saxophone and brushed drums, easy and classy, 85 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-think-night | While a timer runs in night games, during the day scenes, looping | Mysterious storybook village music, music box, harp, low strings and a soft clarinet, uneasy but calm, 80 bpm. Background music for people talking and thinking over it: steady, no big build, no intro or outro, starts and ends on the same groove, 75 seconds, seamless loop |
| bed-hurry | Last ten seconds of a timer, looping | Urgent ticking quiz music, faster, rising tension, 15 seconds, seamless loop |
| bed-night | Night phases in the night games, looping | Quiet eerie storybook night ambience, crickets, soft music box, distant wind, 60 seconds, seamless loop |
| music-win | Under the winners' podium, once | Triumphant celebratory fanfare with drums and brass that settles into a happy groove, 10 seconds |
| sting-comic | First title card of comic-style games | Punchy 3 second cartoon brass and slide-whistle sting |
| sting-paper | Writing and guessing games | Warm 3 second acoustic guitar and typewriter-bell sting |
| sting-sketch | Drawing games | Playful 3 second xylophone and pencil-scribble sting |
| sting-kids | Kids' games | Bright 3 second toy piano and kazoo sting |
| sting-show | Game-show games | Big 3 second game-show brass and drum sting with applause tail |
| sting-noir | Spy and mystery games | Sneaky 3 second upright bass, finger snaps and muted trumpet sting |
| sting-teams | Team games | Sporty 3 second whistle, drumline and crowd-shout sting |
| sting-felt | Card games | Smooth 3 second lounge piano and shuffled-cards sting |
| sting-night | Night games | Dark 3 second low strings swell with a wolf howl |
