/**
 * state.js
 * Manages the game's internal state.
 */

const CLASS_SCORES = {
  Typical:     { points: 2, thread: 0 },
  Revelatory:  { points: 1, thread: 1 },
  Wrong:       { points: 0, thread: -1 }
};

const TRAIT_MAP = {
  Typical:     { X: +1,  Y: 0,  Z: -1 },
  Revelatory:  { X: 0,   Y: +2, Z: +1 },
  Wrong:       { X: -1,  Y: -1, Z: 0  }
};

const State = (() => {
  // --- Game Data ---
  let questionDeck = [];
  let qEngine = null;

  // Basic fallback Fate Deck in case the external file fails to load
  const defaultFateDeck = [
    { id: "DIV001", type: 'DIV', text: "A choice made in haste will ripple outwards." },
    { id: "DIV002", type: 'DIV', text: "Doubt is a shadow that you cast yourself." },
    { id: "DIV003", type: 'DIV', text: "The path of least resistance leads to the steepest fall." },
    { id: "DYN001", type: 'DYN', text: "Whispers of Doubt: The next 'Wrong' answer costs an extra Thread." },
    { id: "DYN002", type: 'DYN', text: "Sudden Clarity: The first 'Revelatory' answer this round awards bonus points." },
    { id: "DYN003", type: 'DYN', text: "Shared Burden: If the Thread frays, all players feel the chill." },
    { id: "DYN005", type: 'DYN', text: "Scholar's Boon: Your knowledge protects you. Gain +1 Thread at the start of this round." }
  ];
  let fateCardDeck = [];
  let divinationDeck = [];

  // --- Game State ---
  let gameState = {
    currentScreen: 'welcome',
    lives: 0,
    score: 0,
    roundsToWin: 3,
    roundsWon: 0,
    roundNumber: 1,
    roundScore: 0,
    thread: 0,
    audacity: 0,
    difficultyLevel: 1,
    correctAnswersThisDifficulty: 0,
    answeredQuestionIds: new Set(),
    completedFateCardIds: new Set(),
    activeRoundEffects: [],
    currentFateCard: null,
    pendingFateCard: null,
    activeFateCard: null,
    currentQuestion: null,
    currentAnswers: [],
    notWrongCount: 0,
    currentCategory: 'Mind, Past',
    divinations: [],
    roundAnswerTally: { A: 0, B: 0, C: 0 },
    traits: { X: 0, Y: 0, Z: 0 },
    activePowerUps: [],
    answeredThisRound: []
  };

  // Load decks from local files and prepare the question engine.
  const loadData = async () => {
    try {
      const [{ default: fateDeck }, { default: questions }] = await Promise.all([
        import('./src/data/fateDeck.js'),
        import('./src/data/questionDeck.js')
      ]);
      fateCardDeck = [...fateDeck];
      questionDeck = [...questions];
      divinationDeck = [];
      if (typeof QuestionEngine !== 'undefined') {
        qEngine = new QuestionEngine(questionDeck);
      }
    } catch (err) {
      console.error('[LOAD DATA]', err);
      fateCardDeck = [];
      questionDeck = [];
      qEngine = null;
    }
  };

  // --- Game Lifecycle ---
  const initializeGame = (participantCount = 1) => {
    gameState = {
        ...gameState, // Keep some base settings
        lives: participantCount + 1,
        score: 0,
        roundsWon: 0,
        roundNumber: 1,
        roundScore: 0,
        thread: 4,
        audacity: 0,
        difficultyLevel: 1,
        correctAnswersThisDifficulty: 0,
        answeredQuestionIds: new Set(),
        completedFateCardIds: new Set(),
        activeRoundEffects: [],
        currentFateCard: null,
        pendingFateCard: null,
        activeFateCard: null,
        currentQuestion: null,
        currentAnswers: [],
        notWrongCount: 0,
        currentCategory: 'Mind, Past',
        divinations: [],
        roundAnswerTally: { A: 0, B: 0, C: 0 },
        traits: { X: 0, Y: 0, Z: 0 },
        activePowerUps: []
    };
  };

  const startNewRound = () => {
    gameState.roundNumber++;
    gameState.roundScore = 0;
    const remainingWins = gameState.roundsToWin - gameState.roundsWon;
    gameState.thread = remainingWins + 1;
    gameState.notWrongCount = 0;
    gameState.activeRoundEffects = [];
    gameState.roundAnswerTally = { A: 0, B: 0, C: 0 };
    gameState.activePowerUps = [];
    gameState.answeredThisRound = [];
    gameState.currentFateCard = null;
    gameState.currentCategory = 'Mind, Past';
    gameState.currentAnswers = [];

    // Activate any pending fate card for this round
    gameState.activeFateCard = gameState.pendingFateCard;
    if (
      gameState.activeFateCard &&
      (gameState.activeFateCard.id === 'DYN005' || gameState.activeFateCard.id === 'DYN004')
    ) {
      if (gameState.activeFateCard.id === 'DYN005') {
        gameState.thread++; // Scholar's Boon immediate effect
      }
    }
    gameState.pendingFateCard = null;
  };

  const endRound = (outcome = 'lose') => {
    resolveRoundEffects(); // Resolve fate card effects first

    switch (outcome) {
      case 'win':
        gameState.roundsWon++;
        gameState.score += gameState.roundScore;
        break;
      case 'lose':
        gameState.lives--;
        break;
      case 'escape':
        gameState.score += gameState.roundScore;
        gameState.roundScore = 0;
        break;
    }
    // ... rest of endRound logic
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
    endRound('escape');
    return true;
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


  // --- Fate Card Logic ---
  const drawFateCard = () => {
    if (gameState.pendingFateCard) {
      console.log('[FATE]: A fate is already pending.');
      return null;
    }
    const deck = fateCardDeck.length ? fateCardDeck : defaultFateDeck;
    const drawn = deck[Math.floor(Math.random() * deck.length)];
    gameState.pendingFateCard = drawn;
    return drawn;
  };

  const setCurrentFateCard = (card) => {
    gameState.currentFateCard = card;
  };

  const getCurrentFateCard = () => gameState.currentFateCard;

  const chooseFateOption = (index) => {
    const card = gameState.currentFateCard;
    if (!card) return null;
    const choice = card.choices[index];
    if (!choice) return null;
    const flavor = applyFateCardEffect({ ...choice.effect }, card.title);
    gameState.completedFateCardIds.add(card.id);
    gameState.currentFateCard = null;
    return flavor;
  };

  const applyFateCardEffect = (effect, title = '') => {
    if (!effect) return null;

    switch (effect.type) {
      case 'IMMEDIATE_SCORE':
        gameState.score += effect.value;
        break;
      case 'SCORE':
        gameState.roundScore += effect.value;
        break;
      case 'POWER_UP':
        gameState.activePowerUps.push(effect.power);
        break;
      default:
        // Any other effect is considered a round-long effect
        gameState.activeRoundEffects.push({ ...effect, cardTitle: title, count: 0 });
        break;
    }
    return effect.flavorText || null;
  };
  
  const resolveRoundEffects = () => {
    gameState.activeRoundEffects.forEach(effect => {
      switch (effect.type) {
        case 'ROUND_PREDICTION': {
          const tally = gameState.roundAnswerTally;
          const max = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
          if (max && max[1] > 0 && max[0] === effect.prediction) {
            if (effect.reward) {
              if (effect.reward.type === 'DOUBLE_ROUND_SCORE') {
                gameState.roundScore *= 2;
              } else if (effect.reward.type === 'SCORE') {
                gameState.score += effect.reward.value;
              }
            }
          }
          break;
        }
        case 'ROUND_MODIFIER':
          if (effect.reward && gameState.thread > 0) {
            if (effect.reward.type === 'SCORE') {
              gameState.score += effect.reward.value;
            }
          }
          break;
        case 'TALLY_ANSWERS':
          if (effect.count && effect.count > 0) {
            gameState.score += effect.count;
          }
          break;
      }
    });
    gameState.activeRoundEffects = [];
    gameState.roundAnswerTally = { A: 0, B: 0, C: 0 };
  };

  const shuffleArray = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };


  // --- Question Logic ---
  const getNextQuestion = () => {
    if (!qEngine) {
      console.warn('[QUESTION]: Engine unavailable');
      return null;
    }
    const q = qEngine.nextQuestion();
    if (!q) { console.warn('[QUESTION]: Deck exhausted'); return null; }
    gameState.currentQuestion = q;
    gameState.currentAnswers = q.answers.slice();

    shuffleArray(gameState.currentAnswers);

    if (gameState.activePowerUps.includes('REMOVE_WRONG_ANSWER')) {
      const wrongIdx = gameState.currentAnswers.findIndex(a => a.answerClass === 'Wrong');
      if (wrongIdx !== -1) {
        gameState.currentAnswers.splice(wrongIdx, 1);
      }
      gameState.activePowerUps = gameState.activePowerUps.filter(p => p !== 'REMOVE_WRONG_ANSWER');
    }
    return { ...gameState.currentQuestion, answers: gameState.currentAnswers };
  };

  const evaluateAnswer = (choice) => {
    gameState.roundAnswerTally[choice] = (gameState.roundAnswerTally[choice] || 0) + 1;
    // Check for active wager or tally effects
    gameState.activeRoundEffects.forEach(effect => {
      if (effect.type === 'APPLY_WAGER' && `answer-${choice.toLowerCase()}` === effect.target) {
        if (effect.reward.type === 'SCORE') {
          gameState.score += effect.reward.value;
        }
      } else if (effect.type === 'TALLY_ANSWERS' && choice.toUpperCase() === effect.target.toUpperCase()) {
        effect.count = (effect.count || 0) + 1;
      }
    });

    const question = gameState.currentQuestion;
    if (!question) {
      console.warn('[EVAL]: No current question');
      return null;
    }

    // Mark this question as answered
    gameState.answeredQuestionIds.add(question.questionId);
    const idxMap = { A: 0, B: 1, C: 2 };
    const idx = idxMap[choice] ?? 0;
    const selected = gameState.currentAnswers[idx];
    if (qEngine) qEngine.resolve(question.questionId, idx, { points: 0, thread: 0, traits: {} });
    const cls = selected.answerClass;
    let isCorrect = cls !== 'Wrong';
    let threadChange = CLASS_SCORES[cls]?.thread ?? 0;
    let scoreChange = CLASS_SCORES[cls]?.points ?? 0;

    if (isCorrect) {
      gameState.notWrongCount++;
      gameState.correctAnswersThisDifficulty++;
    }

    const traitDelta = selected.traits || TRAIT_MAP[cls];
    Object.keys(traitDelta).forEach(k => {
      gameState.traits[k] = (gameState.traits[k] || 0) + traitDelta[k];
    });

    // Apply effects from the active fate card
    if (gameState.activeFateCard) {
      switch (gameState.activeFateCard.id) {
        case 'DYN001': // Whispers of Doubt
          if (!isCorrect) threadChange -= 1;
          break;
        case 'DYN002': // Sudden Clarity
          if (isCorrect && cls === 'Revelatory') {
            scoreChange += 1; // bonus point
          }
          break;
        case 'DYN003':
          // Shared Burden has no direct state change here
          break;
      }
    }

    gameState.thread += threadChange;
    gameState.roundScore += scoreChange;

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
      outcomeText: isCorrect ? 'The thread holds.' : `The thread frays by ${Math.abs(threadChange)}`
    };
  };

  const incrementAudacity = () => {
    gameState.audacity++;
  };

  const loseRoundPoints = () => {
    gameState.roundScore = 0;
  };

  const recordAnswer = (qid, letter) => {
    gameState.answeredThisRound.push({ qid, letter });
  };

  const resetRound = () => {
    gameState.answeredThisRound = [];
    gameState.activeRoundEffects = [];
  };

  const applyFateResults = (res = {}) => {
    if (!res) return;
    const { scoreDelta = 0, roundScoreDelta = 0, roundScoreMultiplier = 1 } = res;
    gameState.score += scoreDelta;
    gameState.roundScore += roundScoreDelta;
    gameState.roundScore *= roundScoreMultiplier;
  };

  const drawDivination = () => {
    if (divinationDeck.length === 0) return null;
    const line = divinationDeck[Math.floor(Math.random() * divinationDeck.length)];
    gameState.divinations.push(line);
    return line;
  };

  const hasWonGame = () => gameState.roundsWon >= gameState.roundsToWin;

  const isOutOfLives = () => gameState.lives <= 0;

  const saveGame = () => {
    try {
      localStorage.setItem('nous-save', JSON.stringify(gameState));
      return true;
    } catch (err) {
      console.error('[SAVE]', err);
      return false;
    }
  };

  const loadGame = () => {
    try {
      const data = localStorage.getItem('nous-save');
      if (!data) return false;
      const saved = JSON.parse(data);
      gameState = { ...gameState, ...saved };
      return true;
    } catch (err) {
      console.error('[LOAD]', err);
      return false;
    }
  };

  // --- Public Interface ---
  return {
    loadData,
    initializeGame,
    startNewRound,
    endRound,
    spendThreadToWeave,
    pullThread,
    cutThread,
    shuffleNextCategory,
    getState: () => ({ ...gameState }),
    drawFateCard,
    applyFateCardEffect,
    setCurrentFateCard,
    getCurrentFateCard,
    chooseFateOption,
    drawDivination,
    getNextQuestion,
    evaluateAnswer,
    incrementAudacity,
    loseRoundPoints,
    hasWonGame,
    isOutOfLives,
    saveGame,
    loadGame,
    recordAnswer,
    resetRound,
    applyFateResults,
  };
})();
