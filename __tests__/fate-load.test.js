const { DECK } = require('../src/fate/loadDeck');

test('fate deck loads', () => {
  expect(DECK.length).toBeGreaterThan(0);
});
