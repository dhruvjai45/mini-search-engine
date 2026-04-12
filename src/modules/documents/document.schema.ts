import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().trim().min(1, 'Content is required').max(100000, 'Content is too long'),
  url: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      return value;
    },
    z.string().url('URL must be valid').optional()
  ),
  sourceType: z.enum(['manual', 'crawl']).optional().default('manual')
});

export type CreateDocumentSchema = z.infer<typeof createDocumentSchema>;