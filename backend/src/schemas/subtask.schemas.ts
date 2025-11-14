import { z } from 'zod';

export const createSubtaskSchema = z.object({
  title: z.string().min(1).max(500),
});

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  ordering: z.number().int().optional(),
});

export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;

export const reorderSubtaskSchema = z.object({
  ordering: z.array(
    z.object({
      id: z.string(),
      ordering: z.number().int(),
    })
  ),
});

export type ReorderSubtaskInput = z.infer<typeof reorderSubtaskSchema>;

export const subtaskResponseSchema = z.object({
  id: z.string(),
  todoId: z.string(),
  userId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  ordering: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubtaskResponse = z.infer<typeof subtaskResponseSchema>;
