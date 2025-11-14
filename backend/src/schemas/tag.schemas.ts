import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1).max(255),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;

export const tagResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  color: z.string(),
});

export type TagResponse = z.infer<typeof tagResponseSchema>;
