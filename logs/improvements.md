# Improvements Log
- Added external questions.json and asynchronous loader for dynamic trivia.
- Hooked state and UI to pull random questions and process answers.
- Added setParticipants export and initialization on confirm to prevent lobby errors when starting a game.
- Updated UI display to use roundsToWin and currentCategory, removed unused rounds state.
- Triggered game initialization on start-game and participant confirmation so UI resets cleanly.
- Calculated thread length from roundsToWin and roundsWon for consistent gameplay.
- Configured package.json for Jest with jsdom environment to enable testing of browser scripts.
