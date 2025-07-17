(function (global) {
  const { FateCard } = require('./schema');
  const deckData = require('../../fate-cards.json');
  const { z } = require('zod');

  const DeckSchema = z.array(FateCard);
  const DYN_DECK = DeckSchema.parse(deckData);

  let currentCard = null;
  let storedEffects = [];
  let immediateScore = 0;

  function draw() {
    currentCard = DYN_DECK[Math.floor(Math.random() * DYN_DECK.length)];
    return currentCard;
  }

  function getButtonLabels() {
    if (!currentCard) return ['', '', ''];
    const labels = currentCard.choices.map(c => c.label);
    while (labels.length < 3) labels.push('');
    return labels.slice(0, 3);
  }

  function choose(index) {
    if (!currentCard) return null;
    const choice = currentCard.choices[index];
    if (!choice) { currentCard = null; return null; }
    const eff = choice.effect;
    if (eff) {
      if (eff.type === 'IMMEDIATE_SCORE') {
        immediateScore += eff.value;
      } else if (eff.type === 'ADD_CARD_TO_DECK') {
        if (eff.card) DYN_DECK.push(eff.card);
      } else {
        storedEffects.push(eff);
      }
    }
    currentCard = null;
    return eff && eff.flavorText ? eff.flavorText : null;
  }

  function resolveRound(tally, won) {
    let scoreDelta = immediateScore;
    let roundScoreDelta = 0;
    let roundScoreMultiplier = 1;

    storedEffects.forEach(eff => {
      if (eff.type === 'APPLY_WAGER') {
        const t = eff.target.split('-').pop().toUpperCase();
        const count = tally[t] || 0;
        if (eff.reward && eff.reward.type === 'SCORE') {
          roundScoreDelta += eff.reward.value * count;
        }
      } else if (eff.type === 'TALLY_TABLE') {
        const count = tally[eff.target] || 0;
        if (eff.table && eff.table[count]) {
          const reward = eff.table[count];
          if (reward.type === 'DOUBLE_ROUND_SCORE') {
            roundScoreMultiplier *= 2;
          } else if (reward.type === 'SCORE') {
            scoreDelta += reward.value;
          }
        }
      }
    });

    storedEffects = [];
    immediateScore = 0;
    return { scoreDelta, roundScoreDelta, roundScoreMultiplier };
  }

  const api = { draw, getButtonLabels, choose, resolveRound };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.Fate = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
