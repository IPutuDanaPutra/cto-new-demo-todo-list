import { z } from 'zod';

export const createSavedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.any()),
  isDefault: z.boolean().default(false),
});

export const updateSavedFilterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  filters: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
});

export type CreateSavedFilterInput = z.infer<typeof createSavedFilterSchema>;
export type UpdateSavedFilterInput = z.infer<typeof updateSavedFilterSchema>;