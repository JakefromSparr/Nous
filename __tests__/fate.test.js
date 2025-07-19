import * as Fate from '../src/fate/fateEngine.js';

test('DYN001 wager adds score per C answer', () => {
  let card;
  do { card = Fate.draw(); } while (card.id !== 'DYN001');
  // choose Wait option (index 1)
  Fate.choose(1);
  const res = Fate.resolveRound({ A: 0, B: 0, C: 2 }, true);
  expect(res.roundScoreDelta).toBe(2);
});

test('DYN004 tally table doubles round score when no Cs', () => {
  let card;
  do { card = Fate.draw(); } while (card.id !== 'DYN004');
  Fate.choose(0);
  const res = Fate.resolveRound({ A: 2, B: 1, C: 0 }, true);
  expect(res.roundScoreMultiplier).toBe(2);
});
