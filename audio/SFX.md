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
| fanfare | 3 | Final round, the winner revealed | Short royal trumpet fanfare, bright, 2 seconds |
| points | 2 | Points landing on a phone | Quick ascending coin-collect sparkle, under 1 second |
| lockin | 2 | An answer locked in | Soft satisfying click with a tiny chime, very short |

## Music and stings
Nothing here is synthesized except the two thinking beds and the night ambience; the others are silent until a file exists. Loops must be seamless. The game already plays each one at the right moment and lowers music under the narrator.

| File name | When it plays | Prompt to generate |
|---|---|---|
| music-lobby | Game list and join screen, looping | Upbeat playful party lobby music, ukulele, hand claps, light synth bass, cheerful and a bit cheeky, 90 seconds, seamless loop |
| bed-think | While a timer runs, looping | Light quiz-show thinking music, pizzicato strings and soft marimba, 100 bpm, 30 seconds, seamless loop |
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
