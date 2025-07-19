import { z } from 'zod';

const gameStateSchema = z.object({
  currentScreen: z.string(),
  lives: z.number(),
  score: z.number(),
  roundsToWin: z.number(),
  roundsWon: z.number(),
  roundNumber: z.number(),
  roundScore: z.number(),
  thread: z.number(),
  audacity: z.number(),
  difficultyLevel: z.number(),
  correctAnswersThisDifficulty: z.number(),
  answeredQuestionIds: z.any(),
  completedFateCardIds: z.any(),
  activeRoundEffects: z.array(z.any()),
  currentFateCard: z.any().nullable(),
  pendingFateCard: z.any().nullable(),
  activeFateCard: z.any().nullable(),
  currentQuestion: z.any().nullable(),
  currentAnswers: z.array(z.any()),
  notWrongCount: z.number(),
  currentCategory: z.string(),
  roundAnswerTally: z.object({ A: z.number(), B: z.number(), C: z.number() }),
  traits: z.object({ X: z.number(), Y: z.number(), Z: z.number() }),
  activePowerUps: z.array(z.any())
});

export function validateGameState(data) {
  return gameStateSchema.parse(data);
}

export { gameStateSchema };
