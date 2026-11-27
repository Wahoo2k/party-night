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
