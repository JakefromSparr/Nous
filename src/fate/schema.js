import { z } from 'zod';

export const Effect = z.object({
  type: z.string()
}).catchall(z.any());

export const Choice = z.object({
  label: z.string(),
  effect: Effect.optional()
});

export const FateCard = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  choices: z.array(Choice).max(3)
});
