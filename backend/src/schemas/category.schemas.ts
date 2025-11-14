import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  ordering: z.number().int().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const reorderCategorySchema = z.object({
  ordering: z.array(
    z.object({
      id: z.string(),
      ordering: z.number().int(),
    })
  ),
});

export type ReorderCategoryInput = z.infer<typeof reorderCategorySchema>;

export const categoryResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  color: z.string(),
  ordering: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
