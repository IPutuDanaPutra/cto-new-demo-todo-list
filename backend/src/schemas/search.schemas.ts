import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  filters: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    categoryId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;