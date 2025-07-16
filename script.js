 * The main engine and controller for the Nous game.
 * - Initializes the game.
 * - Listens for user input from the controller.
 * - Coordinates actions between the State and UI modules.
 */

document.addEventListener('DOMContentLoaded', () => {
  const controller = document.getElementById('controller');

  // --- Game Initialization ---
  function init() {
    UI.updateScreen('welcome');
    console.log('[INIT]: Nous initialized. Welcome.');
  }

  // --- Event Listener ---
  controller.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
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
      case 'start-game':
case 'start-game':
  UI.showParticipantEntry(); // prompt input
  break;
        UI.updateScreen('game-lobby');
        UI.updateDisplayValues(currentState);
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
        UI.updateScreen('round-lobby');
        break;

      // --- Round Lobby Actions ---
      case 'end-round':
        console.log('[ACTION]: Ending round (placeholder).');
        UI.updateScreen('game-lobby');
        break;
      case 'double-points':
        console.log('[ACTION]: Using 1 Thread to double next points (placeholder).');
        break;
      case 'start-question':
        UI.showQuestion({
          title: 'Mind, Past',
          text: 'Which philosopher wrote "Critique of Pure Reason"?',
          choices: {
            A: 'Nietzsche',
            B: 'Kant',
            C: 'Socrates'
          }
        });
        UI.updateScreen('question');
        break;

      // --- Answer Selection ---
      case 'answer-a':
      case 'answer-b':
      case 'answer-c':
        evaluateAnswer(action);
        break;

      // --- Post Result Actions ---
      case 'accept-result':
        UI.updateScreen('round-lobby');
        break;
      case 'challenge-result':
        console.log('[ACTION]: Disagree triggered — increment Audacity (placeholder).');
        UI.updateScreen('round-lobby');
        break;
    }
  }

  // --- Sample Answer Evaluation ---
  function evaluateAnswer(action) {
    const isCorrect = action === 'answer-b'; // Kant
    UI.showResult({
      correct: isCorrect,
      question: 'Which philosopher wrote "Critique of Pure Reason"?',
      answer: isCorrect ? 'Immanuel Kant' : 'Incorrect choice',
      explanation: 'Kant\'s work is a cornerstone of modern philosophy.',
      outcomeText: isCorrect ? 'The thread holds.' : 'A strand slips through your fingers...'
    });
    UI.updateScreen('result');
  }

  // --- Start the Game ---
  init();
});
