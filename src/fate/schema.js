const { z } = require('zod');

const Effect = z.object({
  type: z.string()
}).catchall(z.any());

const Choice = z.object({
  label: z.string(),
  effect: Effect.optional()
});

const FateCard = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  choices: z.array(Choice).max(3)
});

module.exports = { Effect, Choice, FateCard };
