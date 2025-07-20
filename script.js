// The main engine and controller for the Nous game.
// Initializes the game.
// Listens for user input from the controller.
// Coordinates actions between the State and UI modules.

document.addEventListener('DOMContentLoaded', () => {
  const controller = document.getElementById('controller');
  const FateEngine = window.Fate || {};

  // --- Game Initialization ---
  async function init() {
    await State.loadData();
    const resumed = State.loadGame();
    if (resumed) {
      UI.updateDisplayValues(State.getState());
      UI.updateScreen(State.getState().currentScreen || 'game-lobby');
    } else {
      UI.updateScreen('welcome');
      attachWelcomeKeys();
    }
    console.log('[INIT]: Nous initialized.');
  }

  // --- Event Listener ---
  controller.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    const action = btn?.dataset.action;
    if (action) {
      handleAction(action);
    }
  });

  function onWelcomeKeyDown(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
    }
    if (event.key === 'ArrowUp') handleAction('welcome-up');
    else if (event.key === 'ArrowDown') handleAction('welcome-down');
    else if (event.key === 'Enter') handleAction('welcome-select');
  }

  function attachWelcomeKeys() {
    document.addEventListener('keydown', onWelcomeKeyDown);
  }

  function detachWelcomeKeys() {
    document.removeEventListener('keydown', onWelcomeKeyDown);
  }

  // Automatically persist progress when the page unloads
  window.addEventListener('beforeunload', () => {
    State.saveGame();
  });

  // --- Central Action Handler ---
  function handleAction(action) {
    console.log(`[ACTION]: ${action}`);
    const currentState = State.getState(); // placeholder until implemented

    switch (action) {
      // --- Navigation ---
      case 'welcome-up':
        UI.moveWelcomeSelection('up');
        break;
      case 'welcome-down':
        UI.moveWelcomeSelection('down');
        break;
      case 'welcome-select': {
        const choice = UI.getWelcomeSelection();
        if (choice === 'Play') {
          handleAction('start-game');
        } else if (choice === 'Rules') {
          handleAction('go-rules');
        } else if (choice === 'Options') {
          handleAction('go-options');
        }
        break;
      }
      case 'start-game':
        detachWelcomeKeys();
        UI.showParticipantEntry();
        break;
      case 'participants-up':
        UI.adjustParticipantCount(1);
        break;
      case 'participants-down':
        UI.adjustParticipantCount(-1);
        break;
      case 'participants-confirm': {
        const count = UI.confirmParticipants();
        State.initializeGame(count);
        UI.updateDisplayValues(State.getState());
        setTimeout(() => {
          UI.updateScreen('game-lobby');
          UI.updateDisplayValues(State.getState());
        }, 2000);
        break;
      }
      case 'go-rules':
        UI.updateScreen('rules');
        break;
      case 'go-options':
        UI.updateScreen('options');
        break;
      case 'back-to-welcome':
        UI.updateScreen('welcome');
        attachWelcomeKeys();
        break;
      case 'return-to-lobby':
        UI.updateScreen('game-lobby');
        break;
      case 'restart-game':
        console.log('[ACTION]: Restarting game (placeholder).');
        UI.updateScreen('welcome');
        attachWelcomeKeys();
        break;
      case 'quit-game':
        console.log('[ACTION]: Quit game (placeholder).');
        break;
      case 'save-reading':
        console.log('[ACTION]: Save reading (placeholder).');
        break;

      // --- Game Lobby Actions ---
      case 'save-and-quit':
        State.saveGame();
        UI.updateScreen('welcome');
        attachWelcomeKeys();
        break;
      case 'tempt-fate': {
        const card = FateEngine.draw();           // random DYN card
        if (!card) break;
        State.setCurrentFateCard(card);           // remember for the choice
        UI.showFateCard(card);
        UI.showFateChoices(FateEngine.getButtonLabels());
        UI.updateScreen('fate-card');            // show the Fate screen
        break;
      }
      case 'next-round':
        State.startNewRound();
        UI.updateDisplayValues(State.getState());
        UI.updateScreen('round-lobby');
        break;

      // --- Round Lobby Actions ---
      case 'end-round':
        const success = State.cutThread();
        UI.updateDisplayValues(State.getState());
        let fateSummary = '';
        if (typeof FateEngine.resolveRound === 'function') {
          const tally = { A: 0, B: 0, C: 0 };
          State.getState().answeredThisRound.forEach(r => { tally[r.letter] = (tally[r.letter] || 0) + 1; });
          const fateRes = FateEngine.resolveRound(tally, success);
          State.applyFateResults(fateRes);
          State.resetRound();
          const parts = [];
          if (fateRes.roundScoreMultiplier && fateRes.roundScoreMultiplier !== 1) {
            parts.push(`round score x${fateRes.roundScoreMultiplier}`);
          }
          if (fateRes.roundScoreDelta) {
            const sign = fateRes.roundScoreDelta > 0 ? '+' : '';
            parts.push(`${sign}${fateRes.roundScoreDelta} round pts`);
          }
          if (fateRes.scoreDelta) {
            const sign = fateRes.scoreDelta > 0 ? '+' : '';
            parts.push(`${sign}${fateRes.scoreDelta} score`);
          }
          fateSummary = parts.length ? `Fate resolves: ${parts.join(', ')}` : '';
        }
        UI.updateDisplayValues(State.getState());
        if (success) {
          UI.updateScreen('game-lobby');
        } else {
          UI.showFailure(State.getState().roundScore);
          UI.updateScreen('failure');
        }
        if (fateSummary) UI.showFateResult(fateSummary);
        break;
      case 'double-points':
        if (State.spendThreadToWeave()) {
          State.shuffleNextCategory();
          UI.updateDisplayValues(State.getState());
        } else {
          console.log('[ACTION]: Not enough Thread to weave.');
        }
        break;
      case 'start-question':
        State.pullThread();
        UI.updateDisplayValues(State.getState());
        const q = State.getNextQuestion();
        if (q) {
          UI.showQuestion({
            title: q.title,
            text: q.text,
            choices: {
              A: q.answers[0].text,
              B: q.answers[1].text,
              C: q.answers[2].text
            }
          });
          UI.updateScreen('question');
        } else {
          alert('The thread has nothing left to reveal.');
          UI.updateScreen('round-lobby');
        }
        break;

      // --- Answer Selection ---
      case 'answer-a':
      case 'answer-b':
      case 'answer-c':
        const letter = action.split('-')[1].toUpperCase();
        evaluateAnswer(letter);
        break;

      case 'fate-a':
      case 'fate-b':
      case 'fate-c': {
        const idxMap = { 'fate-a': 0, 'fate-b': 1, 'fate-c': 2 };
        const flavor = State.chooseFateOption(idxMap[action]);
        UI.showFateResult(flavor);
        UI.updateDisplayValues(State.getState());
        UI.updateScreen('game-lobby');
        break;
      }

      // --- Post Result Actions ---
      case 'accept-result':
        UI.updateDisplayValues(State.getState());
        if (State.getState().thread <= 0) {
          UI.showFailure(State.getState().roundScore);
          State.endRound(false);
          UI.updateScreen('failure');
        } else {
          UI.updateScreen('round-lobby');
        }
        break;
      case 'challenge-result':
        console.log('[ACTION]: Disagree triggered — increment Audacity (placeholder).');
        UI.updateScreen('round-lobby');
        break;
    }
  }

  // --- Answer Evaluation ---
  function evaluateAnswer(letter) {
    const qid = State.getState().currentQuestion?.questionId;
    if (qid) State.recordAnswer(qid, letter);
    const result = State.evaluateAnswer(letter);
    if (result) {
      UI.showResult(result);
      UI.updateScreen('result');
    }
  }

  // --- Start the Game ---
  init();
  window.handleAction = handleAction;
});
