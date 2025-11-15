import { z } from 'zod';
import { TodoStatus, TodoPriority } from '@prisma/client';

export const BulkUpdateStatusSchema = z.object({
  todoIds: z.array(z.string().min(1, 'Todo ID is required')).min(1, 'At least one todo ID is required'),
  status: z.nativeEnum(TodoStatus),
});

export const BulkUpdatePrioritySchema = z.object({
  todoIds: z.array(z.string().min(1, 'Todo ID is required')).min(1, 'At least one todo ID is required'),
  priority: z.nativeEnum(TodoPriority),
});

export const BulkUpdateDueDateSchema = z.object({
  todoIds: z.array(z.string().min(1, 'Todo ID is required')).min(1, 'At least one todo ID is required'),
  dueDate: z.date().nullable().optional(),
});

export const BulkMoveToCategorySchema = z.object({
  todoIds: z.array(z.string().min(1, 'Todo ID is required')).min(1, 'At least one todo ID is required'),
  categoryId: z.string().nullable().optional(),
});

export const BulkAssignTagsSchema = z.object({
  todoIds: z.array(z.string().min(1, 'Todo ID is required')).min(1, 'At least one todo ID is required'),
  tagIds: z.array(z.string().min(1, 'Tag ID is required')),
  action: z.enum(['add', 'remove', 'replace']).default('add'),
});

export const BulkDeleteSchema = z.object({
  todoIds: z.array(z.string().min(1, 'Todo ID is required')).min(1, 'At least one todo ID is required'),
});

export const BulkUpdateInputSchema = z.object({
  todoIds: z.array(z.string().min(1, 'Todo ID is required')).min(1, 'At least one todo ID is required'),
  updates: z.object({
    status: z.nativeEnum(TodoStatus).optional(),
    priority: z.nativeEnum(TodoPriority).optional(),
    dueDate: z.date().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    reminderLeadTime: z.number().int().min(0).optional(),
  }).refine((data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0;
  }, {
    message: 'At least one update field must be provided',
  }),
});

export const BulkActionResultSchema = z.object({
  updated: z.number(),
  failed: z.array(z.string()),
});

export const BulkDeleteResultSchema = z.object({
  deleted: z.number(),
  failed: z.array(z.string()),
});

// Types
export type BulkUpdateStatusInput = z.infer<typeof BulkUpdateStatusSchema>;
export type BulkUpdatePriorityInput = z.infer<typeof BulkUpdatePrioritySchema>;
export type BulkUpdateDueDateInput = z.infer<typeof BulkUpdateDueDateSchema>;
export type BulkMoveToCategoryInput = z.infer<typeof BulkMoveToCategorySchema>;
export type BulkAssignTagsInput = z.infer<typeof BulkAssignTagsSchema>;
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;
export type BulkUpdateInput = z.infer<typeof BulkUpdateInputSchema>;
export type BulkActionResult = z.infer<typeof BulkActionResultSchema>;
export type BulkDeleteResult = z.infer<typeof BulkDeleteResultSchema>;