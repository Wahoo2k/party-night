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
- Every phone in a room receives every phone's messages, so a determined player could read roles in browser dev tools.
  Fix later with per-player channels or server-side game logic.
- Werewolf only; Price Guesser, Family Fact Trivia and Celebrity are listed as coming soon.
