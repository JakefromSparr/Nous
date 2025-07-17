/**
 * state.js
 * Manages the game's internal state.
 */

const State = (() => {
  // --- Game Data ---
  let questionDeck = [];

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
    activePowerUps: []
  };

  // --- Data Loading ---
  const loadData = async () => {
    try {
      const [questionsRes, fateCardsRes, divinationsRes] = await Promise.all([
        fetch('questions/questions.json'),
        fetch('fate-cards.json'),
        fetch('divinations/divinations.json')
      ]);
      if (!questionsRes.ok) throw new Error('Failed to load questions');
      if (!fateCardsRes.ok) throw new Error('Failed to load fate cards');
      if (!divinationsRes.ok) throw new Error('Failed to load divinations');
      questionDeck = await questionsRes.json();
      fateCardDeck = await fateCardsRes.json();
      divinationDeck = await divinationsRes.json();
    } catch (err) {
      console.error('[LOAD DATA]', err);
      fateCardDeck = [];
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
    gameState.currentFateCard = null;
    gameState.currentCategory = 'Mind, Past';
    gameState.currentAnswers = [];

    // Activate any pending fate card for this round
    gameState.activeFateCard = gameState.pendingFateCard;
    if (gameState.activeFateCard &&
        (gameState.activeFateCard.id === 'DYN005' || gameState.activeFateCard.id === 'DYN004')) {
    if (gameState.activeFateCard && gameState.activeFateCard.id === 'DYN005') {
      gameState.thread++; // Scholar's Boon immediate effect
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
    gameState.currentAnswers = q.answers.slice();
    shuffleArray(gameState.currentAnswers);

    if (gameState.activePowerUps.includes('REMOVE_WRONG_ANSWER')) {
      const wrongIdx = gameState.currentAnswers.findIndex(a => a.answerClass === 'Wrong');
      if (wrongIdx !== -1) {
        gameState.currentAnswers.splice(wrongIdx, 1);
      }
      gameState.activePowerUps = gameState.activePowerUps.filter(p => p !== 'REMOVE_WRONG_ANSWER');
    }
    return { ...q, answers: gameState.currentAnswers };
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
    const cls = selected.answerClass;

    let isCorrect = false;
    let threadChange = 0;
    let scoreChange = 0;

    if (cls === 'Typical') {
      isCorrect = true;
      scoreChange += 2;
      gameState.notWrongCount++;
      gameState.correctAnswersThisDifficulty++;
    } else if (cls === 'Revelatory') {
      isCorrect = true;
      scoreChange += 1;
      threadChange += 1;
      gameState.notWrongCount++;
      gameState.correctAnswersThisDifficulty++;
    } else {
      threadChange -= 1;
    }

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

  const drawDivination = () => {
    if (divinationDeck.length === 0) return null;
    const line = divinationDeck[Math.floor(Math.random() * divinationDeck.length)];
    gameState.divinations.push(line);
    return line;
  };

  const hasWonGame = () => gameState.roundsWon >= gameState.roundsToWin;

  const isOutOfLives = () => gameState.lives <= 0;

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
    // ... other functions you need to export
  };
})();
