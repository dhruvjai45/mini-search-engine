import { z } from 'zod';

export const spellcheckQuerySchema = z.object({
  q: z.string().trim().min(1, 'Query is required').max(100, 'Query is too long'),
  limit: z.coerce.number().int().min(1).max(10).default(5)
});

export type SpellcheckQueryInput = z.infer<typeof spellcheckQuerySchema>;