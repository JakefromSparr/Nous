import deck from '../src/data/fateDeck.js';
import { FateCard } from '../src/fate/schema.js';

test('deck validates', () => {
  deck.forEach(card => expect(() => FateCard.parse(card)).not.toThrow());
});
