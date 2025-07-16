/**
 * state.js
 * Manages the game's internal state.
 */

const State = (() => {
  // Base default settings, to be overridden at runtime
  const defaultSettings = {
    roundsToWin: 3,
    difficulty: 'standard',
  };

  let gameState = {
    currentScreen: 'welcome',
    lives: 0,               // Set dynamically
    score: 0,
    roundsToWin: defaultSettings.roundsToWin,
    roundsWon: 0,
    roundNumber: 1,
    roundScore: 0,
    thread: 0,              // Set per round
    divinations: [],
    audacity: 0,
    currentCategory: 'Mind, Past',
    difficulty: defaultSettings.difficulty
  };

const setParticipants = (count) => {
  gameState.participants = count;
  gameState.lives = count + 1;
  gameState.rounds = 3; // wins required to finish
};

  // --- Stubs for Game Data ---
  const divinationDeck = [
    "A choice made in haste will ripple outwards.",
    "Doubt is a shadow that you cast yourself.",
    "The path of least resistance leads to the steepest fall."
  ];

  const questionDeck = [
    {
      title: 'Mind, Past',
      text: 'Which philosopher wrote "Critique of Pure Reason"?',
      choices: { A: 'Nietzsche', B: 'Kant', C: 'Socrates' },
      correct: 'B'
    }
  ];

  // --- Public Methods ---

  const initializeGame = (participantCount = 1) => {
    gameState.lives = participantCount + 1;
    gameState.roundsToWin = defaultSettings.roundsToWin;
    gameState.roundsWon = 0;
    gameState.roundNumber = 1;
    gameState.score = 0;
    gameState.roundScore = 0;
    gameState.thread = 4; // Can be scaled to round or difficulty later
    gameState.divinations = [];
    gameState.audacity = 0;
    gameState.currentCategory = 'Mind, Past';
  };

  const getState = () => ({ ...gameState });

  const setState = (newState) => {
    gameState = { ...gameState, ...newState };
  };

  const resetGame = () => {
    initializeGame(gameState.lives - 1); // Retain original player count
  };

  const drawDivination = () => {
    const drawn = divinationDeck[Math.floor(Math.random() * divinationDeck.length)];
    gameState.divinations.push(drawn);
    return drawn;
  };

  const startNewRound = () => {
    gameState.roundNumber++;
    gameState.roundScore = 0;
    gameState.thread = gameState.rounds + 1; // thread = remaining round wins + 1
  };

  const endRound = (won = false) => {
    if (won) {
      gameState.roundsWon++;
      gameState.score += gameState.roundScore;
    } else {
      gameState.lives--;
    }
    gameState.roundScore = 0;
  };

  const spendThreadToWeave = () => {
    if (gameState.thread > 0) {
      gameState.thread--;
      return true;
    }
    return false;
  };

  const shuffleNextCategory = () => {
    const categories = ['Mind, Present', 'Body, Future', 'Soul, Past'];
    gameState.currentCategory = categories[Math.floor(Math.random() * categories.length)];
  };

  const getNextQuestion = () => {
    return questionDeck[0]; // Replace with random or category filter
  };

  const evaluateAnswer = (choice) => {
    const question = questionDeck[0];
    const isCorrect = choice === question.correct;
    if (isCorrect) {
      gameState.roundScore += 10;
    } else {
      gameState.thread--;
    }
    return {
      correct: isCorrect,
      question: question.text,
      answer: question.choices[choice],
      explanation: 'Kant\'s work is a cornerstone of modern philosophy.',
      outcomeText: isCorrect ? 'The thread holds.' : 'The thread frays.'
    };
  };

  const incrementAudacity = () => {
    gameState.audacity++;
  };

  const loseRoundPoints = () => {
    gameState.roundScore = 0;
  };

  const hasWonGame = () => {
    return gameState.roundsWon >= gameState.roundsToWin;
  };

  const isOutOfLives = () => {
    return gameState.lives <= 0;
  };

  return {
    initializeGame,
    getState,
    setState,
    resetGame,
    drawDivination,
    startNewRound,
    endRound,
    spendThreadToWeave,
    shuffleNextCategory,
    getNextQuestion,
    evaluateAnswer,
    incrementAudacity,
    loseRoundPoints,
    hasWonGame,
    isOutOfLives
  };
})();
