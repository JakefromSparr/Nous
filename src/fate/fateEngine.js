import { z } from 'zod';
import deckData from '../data/fateDeck.js';
import { FateCard } from './schema.js';

const DeckSchema = z.array(FateCard);
const DYN_DECK = DeckSchema.parse(deckData);

let currentCard = null;
let storedEffects = [];
let immediateScore = 0;

export function draw() {
  currentCard = DYN_DECK[Math.floor(Math.random() * DYN_DECK.length)];
  return currentCard;
}

export function getButtonLabels() {
  if (!currentCard) return ['', '', ''];
  const labels = currentCard.choices.map(c => c.label || '');
  while (labels.length < 3) labels.push('');
  return labels.slice(0, 3);
}

export function choose(index) {
  if (!currentCard) return null;
  const choice = currentCard.choices[index];
  if (!choice?.effect) { currentCard = null; return null; }
  applyEffect(choice.effect);
  currentCard = null;
  return choice.effect?.flavorText || null;
}

export function resolveRound(tally, won) {
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

function applyEffect(eff) {
  if (eff.type === 'IMMEDIATE_SCORE') immediateScore += eff.value;
  else if (eff.type === 'ADD_CARD_TO_DECK' && eff.card) DYN_DECK.push(eff.card);
  else storedEffects.push(eff);
}

// expose to global for non-module script.js
if (typeof window !== 'undefined') window.Fate = { draw, getButtonLabels, choose, resolveRound };
