import { FateCard } from './schema.js';
import cards from '../../fate-cards.json' assert { type: 'json' };

const sanitize = (card) => ({
  id: card.id,
  title: card.title,
  text: card.text,
  choices: (card.choices || []).map((ch) => {
    const eff = ch.effect;
    if (eff && eff.type === 'IMMEDIATE_SCORE' && typeof eff.value === 'number') {
      return { label: ch.label, effect: { type: 'IMMEDIATE_SCORE', value: eff.value } };
    }
    return { label: ch.label };
  })
});

export const DECK = cards.map((c) => FateCard.parse(sanitize(c)));
