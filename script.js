// The main engine and controller for the Nous game.
// Initializes the game.
// Listens for user input from the controller.
// Coordinates actions between the State and UI modules.

document.addEventListener('DOMContentLoaded', () => {
  const controller = document.getElementById('controller');

  // --- Game Initialization ---
  async function init() {
    await State.loadQuestions();
    UI.updateScreen('welcome');
    console.log('[INIT]: Nous initialized. Welcome.');
  }

  // --- Event Listener ---
  controller.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    const action = btn?.dataset.action;
    if (action) {
      handleAction(action);
    }
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
        State.initializeGame(State.getState().participants || 1);
        UI.updateDisplayValues(State.getState());
        UI.showParticipantEntry(); // prompt input
        break;
      case 'go-rules':
        UI.updateScreen('rules');
        break;
      case 'go-options':
        UI.updateScreen('options');
        break;
      case 'back-to-welcome':
        UI.updateScreen('welcome');
        break;
      case 'return-to-lobby':
        UI.updateScreen('game-lobby');
        break;
      case 'restart-game':
        console.log('[ACTION]: Restarting game (placeholder).');
        UI.updateScreen('welcome');
        break;
      case 'quit-game':
        console.log('[ACTION]: Quit game (placeholder).');
        break;
      case 'save-reading':
        console.log('[ACTION]: Save reading (placeholder).');
        break;

      // --- Game Lobby Actions ---
      case 'save-and-quit':
        console.log('[ACTION]: Save and quit (placeholder).');
        break;
      case 'pull-divination':
        console.log('[ACTION]: Pulling divination (placeholder).');
        break;
      case 'next-round':
        State.startNewRound();
        UI.updateDisplayValues(State.getState());
        UI.updateScreen('round-lobby');
        break;

      // --- Round Lobby Actions ---
      case 'end-round':
        const success = State.cutThread();
        UI.updateDisplayValues(State.getState());
        if (success) {
          UI.updateScreen('game-lobby');
        } else {
          UI.showFailure(State.getState().roundScore);
          UI.updateScreen('failure');
        }
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
        }
        break;

      // --- Answer Selection ---
      case 'answer-a':
      case 'answer-b':
      case 'answer-c':
        const letter = action.split('-')[1].toUpperCase();
        evaluateAnswer(letter);
        break;

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
    const result = State.evaluateAnswer(letter);
    if (result) {
      UI.showResult(result);
      UI.updateScreen('result');
    }
  }

  // --- Start the Game ---
  init();
});
