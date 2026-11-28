# Party Night design rules

Ten rules every game is held to. Tall Tales is the reference game. Each rule says where it is enforced: "shared"
means one piece of code does it for every game; "per game" means each game has to do it itself.

1. **A reveal is a sequence, never a single frame.** Show the answer, pop in who picked it one at a time, then the
   verdict, then the points. Each beat has its own sound. *Per game.* Use `data-beat="1..n"` on elements (the TV
   shows them in order, 1.1 s apart) or time them yourself as Tall Tales does.
2. **Nothing gives the result away early.** Score chips, captions, phones and the narrator wait for the last beat.
   *Shared* for score chips and phones (`holdScores` in js/tv.js: in any phase named reveal/result/score/answer/
   roundEnd/tally/show, chips keep the old totals and phones are not updated until the beats finish). *Per game* for
   captions and narration. A game that times its own reveal sets `meta.ownReveal`.
3. **Points are an event.** Big type on the thing that earned them, then they land on the player's chip: the chip
   bumps, "+N" rises off it, the points sound plays. *Shared* for the chip (`holdScores`); *per game* for the big
   call on the thing that earned them.
4. **The screen never changes size or rebuilds while you look at it.** Reserve room for what is coming (empty
   slots), draw pop-ups over the layout, update only the part that changed. *Shared*: the stage fit measures layout
   height only. *Per game*: slots and partial updates.
5. **The question gets the room.** Who has finished is a tick on each score chip, not a list mid-screen; what people
   must read from the couch is the biggest thing on the TV. *Shared* (`decorate` in js/tv.js turns status lists into
   ticks).
6. **Turn changes are announced.** *Shared* for any game whose heading reads "Name's turn" (`turnBanner`). Games
   that show turns another way (seats round a table) do it themselves.
7. **The phone always says exactly what to do now.** One plain sentence, with an example where it helps. Never
   "nothing to do" above "your turn". *Per game.*
8. **No sound plays the same way twice running.** *Shared*: cue sounds rotate through stand-ins (`SOUND_KIN`), short
   effects shift in pitch, and recorded extra takes (`name-2.mp3`…) are picked at random. Inside a game, rotate
   between sounds for a repeated moment.
9. **Bots never decide for a person.** They wait and follow, or stay out. *Per game* (`botAct`).
10. **Don't start with a blank page.** Offer ideas to tap, with "write your own" as the option. *Per game.*

Also (standard practice, see AUDIT.md for status): readable from three metres; every wait shows who we are waiting
for; a player who drops can rejoin where they were; a round never stalls on one person (timers and host skip);
nothing needs colour alone; safe area for TV overscan; input answers within a tenth of a second; first game
playable in under a minute.
