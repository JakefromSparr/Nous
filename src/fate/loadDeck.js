const { FateCard } = require('./schema');
const cards = require('../../fate-cards.json');

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

const DECK = cards.map((c) => FateCard.parse(sanitize(c)));

module.exports = { DECK };
