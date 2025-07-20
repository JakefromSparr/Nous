import deckData from '../src/data/questions.json';
import { QuestionEngine, setDefaultDeck } from '../src/engine/questionEngine.js';

test('engine advances to Tier2 after four questions', () => {
  const deck = deckData.questions ?? deckData;
  setDefaultDeck(deck);
  const engine = new QuestionEngine(deck);
  const tiers = [];

  for (let i = 0; i < 5; i++) {
    const q = engine.nextQuestion();
    tiers.push(q.difficultyTier);
    engine.resolve(q.questionId, 0, { points: 0, thread: 0, traits: {} });
  }

  expect(tiers.slice(0, 4).every(t => t === 'Tier1')).toBe(true);
  expect(tiers[4]).toBe('Tier2');
});
