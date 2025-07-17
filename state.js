/**
 * state.js
 * Manages the game's internal state.
 */

const State = (() => {
  // --- Game Data ---
  let questionDeck = [];
  let fateCardDeck = [];

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
    currentQuestion: null,
    notWrongCount: 0
  };

  // --- Data Loading ---
  const loadData = async () => {
    try {
      const [questionsRes, fateCardsRes] = await Promise.all([
        fetch('questions/questions.json'),
        fetch('fate-cards.json')
      ]);
      if (!questionsRes.ok) throw new Error('Failed to load questions');
      if (!fateCardsRes.ok) throw new Error('Failed to load fate cards');
      questionDeck = await questionsRes.json();
      fateCardDeck = await fateCardsRes.json();
    } catch (err) {
      console.error('[LOAD DATA]', err);
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
        currentQuestion: null,
        notWrongCount: 0
    };
  };

  const startNewRound = () => {
    gameState.roundNumber++;
    gameState.roundScore = 0;
    gameState.thread = gameState.roundsToWin - gameState.roundsWon + 1;
    gameState.notWrongCount = 0;
    gameState.activeRoundEffects = [];
  };

  const endRound = (won = false) => {
    resolveRoundEffects(); // Resolve fate card effects first

    if (won) {
        gameState.roundsWon++;
        gameState.score += gameState.roundScore;
    } else {
        gameState.lives--;
    }
    // ... rest of endRound logic
  };


  // --- Fate Card Logic ---
  const drawFateCard = () => {
    const availableCards = fateCardDeck.filter(card => {
        const meetsAudacity = card.audacityMin ? gameState.audacity >= card.audacityMin : true;
        const meetsPrereqs = card.prerequisites ? card.prerequisites.every(id => gameState.completedFateCardIds.has(id)) : true;
        return meetsAudacity && meetsPrereqs;
    });

    if (availableCards.length === 0) return null;
    const idx = Math.floor(Math.random() * availableCards.length);
    return availableCards[idx];
  };

  const applyFateCardEffect = (effect) => {
    if (!effect) return null;

    if (effect.type === 'IMMEDIATE_SCORE') {
        gameState.score += effect.value;
    } else {
        // Any other effect is considered a round-long effect
        gameState.activeRoundEffects.push(effect);
    }
    return effect.flavorText || null;
  };
  
  const resolveRoundEffects = () => {
    // This function will be expanded as we add more complex cards
    // For now, it's a placeholder for the logic in the Tallyman's Gambit, etc.
    console.log("Resolving round effects...", gameState.activeRoundEffects);
  };


  // --- Question Logic ---
  const getNextQuestion = () => {
    // ... (Your existing getNextQuestion logic)
    return null; // Placeholder
  };

  const evaluateAnswer = (choice) => {
    // Check for active wager effects
    gameState.activeRoundEffects.forEach(effect => {
        if (effect.type === 'APPLY_WAGER' && `answer-${choice.toLowerCase()}` === effect.target) {
            if (effect.reward.type === 'SCORE') {
                gameState.score += effect.reward.value;
            }
        }
    });

    // ... (Your existing evaluateAnswer logic)
    return null; // Placeholder
  };

  // --- Public Interface ---
  return {
    loadData,
    initializeGame,
    startNewRound,
    endRound,
    getState: () => ({ ...gameState }),
    drawFateCard,
    applyFateCardEffect,
    getNextQuestion,
    evaluateAnswer
    // ... other functions you need to export
  };
})();
