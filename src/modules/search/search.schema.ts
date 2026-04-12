import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(200, 'Query is too long'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;