# Party Night backlog

Things decided to do later, in rough priority order within each group. Updated 26 Nov 2026.

## Needs Tom
- **Playtest on the onn box** with real phones. Check: TV text size, music and reaction volume, timer bar at the top edge, the campfire lobby from the couch, wake lock and reconnect on real phones.
- **Recorded narrator.** Sign up for a voice service, record the 260 lines in `audio/script.json` and `audio/script-games.json`, then wire them in.
- **Dedicated Supabase project** on a paid plan (currently shares the free "mixwise" project).
- **Attorney review** of names, look and kids' privacy before any store listing.
- **Renames to decide:** Bluff → "Tall Tales", Quick Games → "Show of Hands", Missions → "Inside Job".

## Platform
- **Phone apps (iPhone and Android)** as an optional extra to the browser, wrapped from the same code. Main gains: vibration on iPhones, steadier connection, no browser bars. The phone page can already be added to the home screen.
- **Google TV app** wrapper and Play Store listing; then other TV platforms.
- **Purchases:** free tier plus a one-time unlock paid by the host only.
- **Louder animated backgrounds** per game, if the current drifting shapes feel too quiet on the TV.
- **Joining mid-game** in more games (now: Quick Games, Hot Potato, Color Hunt, Freeze Dance).
- **Double points on the last round** in more games (now: Quick Games; Funny Answers already escalates).
- **More game options** using the lobby options row (house rules for more card games, round counts).

## Games
- **Balance of the hidden-role games** (Midnight Wolves, Missions, Word Hunt, Mystery) once real players have tried them. Bot results are not a guide.
- **Split the Room:** keep separate from Quick Games unless playtests say otherwise.
- **Content:** more prompts everywhere; Word Hunt, Truths, Shade and Ladder don't yet remember what a room has seen.
- **Bluff facts:** five were checked against web results; the rest were reviewed from general knowledge only.
- **Illustrated card art** in place of emoji.
- **Clue Crew** hard mode; **Color Clash** stacking rule; **Salad Bowl** funny-misses recap.
- **Second half of the narrator script** added to the Narration Script doc.

## From the evaluation report, still open
- **New games for the gaps:** Two of a Kind (two players), Name That Noise (sound game for kids), Village Fair (a 30-minute mixed playlist with one score).
- **Game Show pack rebuild** on one shared trivia bank.
- **Written cases for Mystery Manor;** more Bomb Squad modules and Haunted Quiz mini-games.
- **Translation readiness:** move game text out of the code; screen-reader labels; high-contrast mode.
- **Content:** the six bank-driven launch games were expanded but not confirmed at three times their original size.
- **Player-written prompts** for Quick Games (Funny Answers has them).
- **Recap card** for Who Said That (Sketch Telephone can save a drawing and a whole chain).
- **A short web address.**
- **The report's nine open questions** (launch size, family or adult lead, hours, budget, testers, cross-store accounts, Mystery Manor theme, Blackjack and Hearts, final name).

## Puzzle ideas parked
- **Real photos** for the mystery-picture puzzles (blurred, pixelated, zoomed). Today they use emoji; photos need licensed images.
- **Art auction game** and **live drawing duel** (the last two of the Jackbox-favorites gaps).

## Painted art
- **Done:** painted covers for 24 games (all featured games plus Bracket Battle, Act Natural, Room Meter, Brain Teasers), and the full Werewolf set (backdrop, four role portraits, two ending scenes). Files are in `art/` at about 1600 px.
- **Covers still to make (23):** bluff, trivia, spin, crowd, ladder, cases, letters, agents, blackjack, gofish, bluffcards, hearts, shade, estimate, truths, wordhunt, missions, dares, split, memory, haunted, bomb, mystery.
- **In-game art still to make:** a backdrop for each game world, role cards for Midnight Wolves, picture cards for Charades / Memory Match / Go Fish / Bingo, photo-style images for the Brain Teasers mystery pictures, and ending scenes.
- **How it's done:** generate in Canva through the connector, then move the full-size files into `art/` through Chrome. Prompts and file names are in `art/PROMPTS.md`.

## Art still to do (Nov 27, after the full art pass)
- Done: covers for all 47 games, theme backdrops, Midnight Wolves role cards, animal picture cards (Memory Match, Go Fish), 26 mystery photos (Brain Teasers), winner scenes per theme.
- Not done: picture cards for Charades and Bingo (they are word and number games; would need a new picture mode), and a matched-style redo of the Midnight Wolves portraits.
- Check all art on a real TV and phones (only seen in desktop screenshots so far). art/ is about 23 MB; consider WebP if loading is slow on the onn box.

## Remote play (added Nov 27)
- Done: remote screen page (watch.html, mirrors the TV picture, sounds, title cards, clock), "📺 Show TV" on the phone page, same-room labels for Charades, Act Natural, Freeze Dance, Scavenger Hunt, Secret Missions once a remote screen is connected.
- Not done: built-in voice chat (decided against for now; use a video call), per-game phone layouts, hiding same-room games (they are labelled, not hidden).
- Not tested over the real network (only in local test mode); screen frames with drawings may be large. Move to a dedicated Supabase project before promoting it.

## Recorded audio (plan, Nov 27)
- Decision: one host voice for all games, a second "night narrator" for Werewolf, Midnight Wolves and Haunted Quiz. Generate once (ElevenLabs), ship files with the app, no live generation.
- Script: audio/SCRIPT.md (readable) and audio/lines.json (data), rebuilt by `node test/narration-script.mjs`.
- To do: re-word lines that need a player name; decide whether question banks get recorded; list of sound effects to replace; wire recorded files in with the browser voice as fallback.
- Nov 27: host lines written (js/quips.js, audio/QUIPS.md); name lines given a first automatic re-wording (audio/SCRIPT.md, needs a read-through: some leftovers are thin, e.g. "They were a Seer."); sound and music list with prompts in audio/SFX.md. Fifteen quip moments still need wiring, together with a recorded-audio player that queues lines and falls back to the browser voice.
- Nov 27 (later): narrator now plays recorded clips only, one clip per sentence (js/recorded.js, queue in js/ui.js). The browser voice has been removed entirely (Tom, Nov 27): no clip means no speech, so narration is silent until recordings ship. Recording list: audio/record-list.csv (about 4,000 clips, about 106,000 characters; host and night narrator). Not voiced: sentences with a player's name or typed text. Pick a Case, Crowd Says and Hot Take lists were still growing at 2,000 bot games, so a few rare sentences may be missing. Quip moments wired except everyone-right, everyone-wrong and last place (need per-game knowledge). Music loops still synthesized.
- Music plan (audio/SFX.md): lobby loop, thinking and hurry beds, night ambience, winner music, nine intro stings. All are wired to play when their file exists and to drop in volume under the narrator; none exist yet.
- Nov 27: TV page and remote screen always fit one screen (fitScreen in js/ui.js: compact layout first, then scale; test/fit-e2e.mjs measures all 47 games at four window sizes). On short laptop windows a few busy screens scale to about half size (Secret Missions, Trivia Board game over, Mystery Manor); those want their own tighter layouts. The All games list still scrolls inside its own panel.

## Full review and polish plan (Nov 27)
- Plan doc: https://claude.ai/artifact/EHzsA2u9oRpwcrL8E3GeuR (verdict, findings, bug list, six phases, twelve headliners, audio changes, open decisions).
- Capture script: `SHOTS=<folder> node test/review-shots.mjs funny,werewolf` plays each game with 4 bots and one phone and saves TV and phone pictures per phase.
- Recording stays on hold until the reveal sequencer and new intros exist.

## Polish plan, first pass built (Nov 27)
- Decisions (Tom): plan approved; 24 games at launch, all at headliner polish; self-running rounds by default; TV apps first, browser kept; no balloons anywhere; Ducky Toss becomes a legged animal (goats proposed) with better art.
- Built: full-screen stage (`stageFit` in js/ui.js: design widths 1040/1260/1500, scaled to fill, vw/vh sizes follow the design size through `--vw`/`--vh`), player rail (`.stage.railed`), TV host buttons fade after 5 s idle, self-running rounds (`autoNext` in js/tv.js; setting "Rounds move on by themselves"; per-game `meta.hold` lists phases that wait for the host), phone remote can send a game's own host choices (`meta.remoteActs`, used by Bingo), Funny Answers comic face-off with staged reveal, all-ages table theme replacing balloons.
- Fixed: Bluff phone spoiler, Ducky Toss phone bar, Bingo mode choice on the host phone, tie podium and "1st of 5" on a dead heat, join name field width. How-to sheet no longer pops up in automated tests unless `&help=1`.
- Waiting on Chrome: `art/bg-table.jpg` and `art/win-table.jpg` are generated in Canva (media MAHcIJ_sFnQ and MAHcIN_OemU) but not uploaded; a wood-tone gradient shows until they are.
- Next: reveal sequencer as a shared part (Funny Answers does it in CSS only), between-round scoreboard, end-of-game flow, then headliners 2 to 12; phone polish; goats rework. Self-running rounds need a real-people playtest (it relies on the bots' idea of "nothing left to do").
- Not rechecked after the stage change: the per-game browser tests other than funny, bluff, bingo, ducks, kids, intro, away, watch, remote.

## Polish plan, second pass (Nov 27)
- Table backdrop and winner scene uploaded (art/bg-table.jpg, art/win-table.jpg).
- Reveal beats (shared): mark result parts with `data-beat="1..n"` (or `data-beat-class` to add a class at that moment); `runBeats` in js/tv.js reveals them one at a time with a sound and holds the self-running countdown until 3.5 s after the last beat. Used by Funny Answers, Bracket Battle, Split the Room, Two Truths & a Lie, Who Said That?.
- Between-round standings (`standings` in js/tv.js): full-screen rank list for about 5 s when a game's round number goes up and it has a plain score list; rows slide to the new order. Mirrored to the remote screen as a still list.
- End of game (`afterParty`): Play again / Up next (night playlist first, then an unplayed game from the same shelf that fits the player count) / All games, plus tonight's leaders once two games are done. The games' own Play again and Back buttons are hidden on the stage.
- To do next: headliners 2 to 12 get their own screens; games' own last-screen podiums are now redundant with the rail and can go; standings only fire for games that expose `round` and `scores`.

## Headliners, first three plus GOAT Toss (Nov 27)
- Bluff: index-card answers, stamped lies, the truth lit last. Who Said That?: speech bubble over a line-up; the author's face lifts on the second beat. Both are CSS on the shared stage plus small markup.
- Ducky Toss is now GOAT Toss (id and file stay `ducks`). One painted goat piece (art/goat.png, cut out from a green-screen render) turned to six landings: spot side, plain side, hooves up (5), on all fours (5), nose dive (10), horn stand (15); same side twice 1; two alike x4; different sides "butt heads" and lose the turn; touching "goat pile" loses everything. Slower 2.6 s tumble with bounces across a table. Win line: "<name> is the G.O.A.T.!". New cover (art/ducks.jpg).
- A game can spell out its intro steps with `meta.how` (done for GOAT Toss, Funny Answers, Bluff, Who Said That?) and ask for one stage width with `--stage-w` on its `.stage`.
- Still to do from the twelve: Act Natural, Sketch Telephone, Doodle Bluff, Werewolf, Secret Agents, Taboo Talk, Trivia Board, Spin & Solve. Then twelve more for the launch 24, phone polish, and audio.
- GOAT Toss odds were kept from Ducky Toss (bust about 19%, average 5.7 points a toss, about 30 turns a game with bots); worth a feel-check with real players.

## Headliners 5 to 12 (Nov 27)
- Own screens for Act Natural (cue cards), Sketch Telephone (film strip), Doodle Bluff (gallery wall, brass plaques), Werewolf (a house per player; the window goes dark when they fall), Secret Agents (bigger grid), Taboo Talk (big clock and tally), Trivia Board (category board, full-stage clue), Spin & Solve (full-height wheel). All twelve headliners now have a screen of their own. These eight are CSS only on the shared stage.
- In-game "How to play" boxes are hidden on the stage (the intro screen covers it). Sketch-theme title card size fixed.
- Bug fixed: the end-screen cards reused the class name of Secret Agents' word tiles and broke that grid for about an hour on the live site; the end cards are now `.endcard`.
- Test notes: test/e2e.mjs (full Werewolf game) updated for the hub and end screen and passes. test/audience.mjs, imposter-e2e.mjs and phone-e2e.mjs still click the old in-game Play again / Back buttons and need the same update. The local test server can no longer be left running in the background here; scratch script with-server.sh starts and stops it per command.
- Not yet given a phase-by-phase look: Act Natural vote and result, Werewolf vote and verdict, Trivia Board wager and final, Spin & Solve round end. Needs a pass with real players or slower bots.
