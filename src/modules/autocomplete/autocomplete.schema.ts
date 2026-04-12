import { z } from 'zod';

export const autocompleteQuerySchema = z.object({
  q: z.string().trim().min(1, 'Prefix is required').max(100, 'Prefix is too long'),
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

export type AutocompleteQueryInput = z.infer<typeof autocompleteQuerySchema>;