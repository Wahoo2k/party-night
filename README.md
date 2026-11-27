# Party Night

Party games on the TV with phones as controllers. No app install for players.

- `tv.html` – open on the TV (or the computer plugged into it). Shows a room code and QR code, runs the game.
- `play.html` – open on each phone. Join with the room code and a name.
- `index.html` – picks between the two.

## How it works
The TV is the host and owns all game state. Phones send actions and render what the TV sends back.
Messages travel over a Supabase Realtime broadcast channel per room (`js/net.js`); no database tables are used.
The TV saves its state in localStorage, so a refresh keeps the game, and phones re-sync automatically.

Games live in `js/games/` and share one interface (see `js/games/index.js`), so new games plug into the same lobby.

## Live
https://wahoo2k.github.io/party-night/ (GitHub Pages from `main`, root)

## Config
`js/config.js` holds the Supabase URL and publishable key. It currently shares the mixwise project.

## Testing
- `node test/engine.test.js` – simulates 2,000 random Werewolf games against the rules engine.
- Add `?local=1` to the URL to skip Supabase and use BroadcastChannel between tabs of one browser.
- `node test/bots.mjs` – one phone plus four bots, real timers.
- `node test/e2e.mjs` – plays a full game in headless Chrome (TV + 6 phones) in local mode; needs a static server on port 8765.

## Known limits (prototype)
- Messages between the TV and each phone are encrypted per player (`js/secure.js`), so players can't read each other's
  roles or answers on the shared channel. The TV itself still holds every secret, so whoever controls the TV page can see them.
- Werewolf only; Price Guesser, Family Fact Trivia and Celebrity are listed as coming soon.

## Shared kit (what every game gets for free)

- One countdown bar, thinking music, crowd reactions, lock-in sounds, flashes and shake (`js/tv.js`, `js/sfx.js`).
- Title cards with four transitions, a gold wipe between untitled phases, sliding scoreboards, a drifting backdrop.
- Winners' ceremony for any game whose TV view has a sorted `scores` list; end-of-night awards from the lobby.
- Phones: "Your move!" banner, points pop-up, finishing place, fast reconnect. The phone page can be added to the home screen.
- Optional hooks a game can export: `guide(s)` (first-game coach), `addPlayer(s, p)` (join mid-game), `audienceView` / `audienceAct` (audience voting), `meta.options` (lobby options), `cueEvent` with `fx` and `react`.
- Mark an element `data-pop="unique-key"` to make it punch in the first time it appears.

See `BACKLOG.md` for what's next.
