const { z } = require('zod');

const Effect = z.object({
  type: z.literal('IMMEDIATE_SCORE'),
  value: z.number()
});

const Choice = z.object({
  label: z.string(),
  effect: Effect.optional()
});

const FateCard = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  choices: z.array(Choice)
});

module.exports = { Effect, Choice, FateCard };
