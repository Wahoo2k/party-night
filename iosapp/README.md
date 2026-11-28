# Party Night for iPhone and iPad

A thin app shell around the website, the same idea as the Android apps in `tvapp/`. It opens `start.html`, which
offers "Join a game", "Be the screen" and "No shared screen".

This folder holds only the one source file that matters (`App.js`). The project around it is created with Expo so it
picks up whatever Expo version is current, and it is built in Expo's cloud, so no Mac build is needed.

**Not yet built or run.** Nothing here has been compiled; treat the first build as the test.

## Steps (about 20 minutes, needs the Expo and Apple developer accounts)

1. `npx create-expo-app@latest partynight-ios --template blank`
2. `cd partynight-ios && npx expo install react-native-webview expo-keep-awake`
3. Replace the new project's `App.js` with the `App.js` from this folder.
4. In `app.json` set: `"name": "Party Night"`, `"slug": "party-night"`, `"orientation": "default"`,
   `"ios": { "bundleIdentifier": "com.toolshedapps.partynight", "supportsTablet": true }`.
5. `npx eas-cli build --platform ios --profile preview` (sign in when asked; let it manage the certificates).
6. `npx eas-cli submit --platform ios` to send the build to TestFlight.

## Before the App Store

- Apple can reject apps that are only a website in a wrapper. Things that help: the three-way start page, keeping the
  screen awake, working as the shared screen on an iPad. Be ready to explain that in the review notes.
- Selling packs inside the app normally has to go through Apple's own purchase system. Check the current rules before
  turning on sales in the app; until then the app should not show prices or a buy button.
- Motion games (Shake It) ask for motion permission from a tap; that works inside the app's web view on current iOS,
  but confirm on a real phone.
