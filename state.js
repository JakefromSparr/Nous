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
    notWrongCount: 0,
    roundPassed: false,
    divinations: [],
    audacity: 0,
    currentCategory: 'Mind, Past',
    difficulty: defaultSettings.difficulty,
    currentQuestion: null,
    // --- Difficulty tracking ---
    difficultyLevel: 1,
    correctAnswersThisDifficulty: 0,
    answeredQuestionIds: new Set()
  };

const setParticipants = (count) => {
  gameState.participants = count;
  gameState.lives = count + 1;
};

  // --- Stubs for Game Data ---
  const divinationDeck = [
    "A choice made in haste will ripple outwards.",
    "Doubt is a shadow that you cast yourself.",
    "The path of least resistance leads to the steepest fall."
  ];

  let questionDeck = [];

  const loadQuestions = async () => {
    try {
      const response = await fetch('questions/questions.json');
      if (!response.ok) throw new Error('Failed to load questions');
      questionDeck = await response.json();
    } catch (err) {
      console.error('[LOAD QUESTIONS]', err);
    }
  };

  // --- Public Methods ---

  const initializeGame = (participantCount = 1) => {
    gameState.lives = participantCount + 1;
    gameState.roundsToWin = defaultSettings.roundsToWin;
    gameState.roundsWon = 0;
    gameState.roundNumber = 1;
    gameState.score = 0;
    gameState.roundScore = 0;
    const remainingWins = gameState.roundsToWin - gameState.roundsWon;
    gameState.thread = remainingWins + 1; // thread = remaining round wins + 1
    gameState.divinations = [];
    gameState.audacity = 0;
    gameState.notWrongCount = 0;
    gameState.roundPassed = false;
    gameState.currentCategory = 'Mind, Past';
    gameState.currentQuestion = null;
    gameState.difficultyLevel = 1;
    gameState.correctAnswersThisDifficulty = 0;
    gameState.answeredQuestionIds = new Set();
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
    const remainingWins = gameState.roundsToWin - gameState.roundsWon;
    gameState.thread = remainingWins + 1; // thread = remaining round wins + 1
    gameState.notWrongCount = 0;
    gameState.roundPassed = false;
    gameState.currentCategory = 'Mind, Past';
  };

  const endRound = (won = false) => {
    if (won) {
      gameState.roundsWon++;
      gameState.score += gameState.roundScore;
    } else {
      gameState.lives--;
    }
    gameState.roundScore = 0;
    gameState.notWrongCount = 0;
    gameState.roundPassed = false;
  };

  const spendThreadToWeave = () => {
    if (gameState.thread > 0) {
      gameState.thread--;
      return true;
    }
    return false;
  };

  const pullThread = () => {
    gameState.thread--;
  };

  const cutThread = () => {
    const success = gameState.notWrongCount >= 3 && gameState.thread > 0;
    endRound(success);
    if (!success) {
      loseRoundPoints();
    }
    return success;
  };

  const shuffleNextCategory = () => {
    const categories = ['Mind, Present', 'Body, Future', 'Soul, Past'];
    gameState.currentCategory = categories[Math.floor(Math.random() * categories.length)];
  };

  const advanceDifficulty = () => {
    if (gameState.difficultyLevel < 3) {
      gameState.difficultyLevel++;
      gameState.correctAnswersThisDifficulty = 0;
      console.log(`[DIFFICULTY]: Advanced to level ${gameState.difficultyLevel}`);
    }
  };

  const getNextQuestion = () => {
    if (questionDeck.length === 0) {
      console.warn('[QUESTION]: Deck is empty');
      return null;
    }

    const { difficultyLevel, answeredQuestionIds } = gameState;

    const minId = (difficultyLevel - 1) * 10 + 1;
    const maxId = difficultyLevel * 10 - 1;

    let available = questionDeck.filter(q =>
      q.questionId >= minId &&
      q.questionId <= maxId &&
      !answeredQuestionIds.has(q.questionId)
    );

    if (available.length === 0) {
      advanceDifficulty();
      const newMin = (gameState.difficultyLevel - 1) * 10 + 1;
      const newMax = gameState.difficultyLevel * 10 - 1;
      available = questionDeck.filter(q =>
        q.questionId >= newMin &&
        q.questionId <= newMax &&
        !answeredQuestionIds.has(q.questionId)
      );
    }

    if (available.length === 0) {
      console.warn('[QUESTION]: No available questions for any difficulty.');
      return null;
    }

    const idx = Math.floor(Math.random() * available.length);
    const q = available[idx];
    gameState.currentQuestion = q;
    return q;
  };

  const evaluateAnswer = (choice) => {
    const question = gameState.currentQuestion;
    if (!question) {
      console.warn('[EVAL]: No current question');
      return null;
    }
    // Mark this question as answered
    gameState.answeredQuestionIds.add(question.questionId);
    const idxMap = { A: 0, B: 1, C: 2 };
    const idx = idxMap[choice] ?? 0;
    const selected = question.answers[idx];
    const cls = selected.answerClass;

    let isCorrect = false;
    if (cls === 'Typical') {
      isCorrect = true;
      gameState.roundScore += 2;
      gameState.notWrongCount++;
      gameState.correctAnswersThisDifficulty++;
    } else if (cls === 'Revelatory') {
      isCorrect = true;
      gameState.roundScore += 1;
      gameState.thread += 1;
      gameState.notWrongCount++;
      gameState.correctAnswersThisDifficulty++;
    } else {
      gameState.thread -= 1;
    }

    if (gameState.correctAnswersThisDifficulty > 3) {
      advanceDifficulty();
    }

    if (gameState.notWrongCount >= 3) {
      gameState.roundPassed = true;
    }

    return {
      correct: isCorrect,
      question: question.text,
      answer: selected.text,
      explanation: selected.explanation,
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
    loadQuestions,
    getState,
    setState,
    setParticipants,
    resetGame,
    drawDivination,
    startNewRound,
    endRound,
    spendThreadToWeave,
    pullThread,
    cutThread,
    shuffleNextCategory,
    getNextQuestion,
    evaluateAnswer,
    incrementAudacity,
    loseRoundPoints,
    hasWonGame,
    isOutOfLives
  };
})();
