import { z } from 'zod';

const TodoStatus = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']);
const TodoPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTodoSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
  status: TodoStatus.optional(),
  priority: TodoPriority.optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  reminderLeadTime: z.number().int().optional(),
  tagIds: z.array(z.string()).optional(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional().nullable(),
  status: TodoStatus.optional(),
  priority: TodoPriority.optional(),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  reminderLeadTime: z.number().int().optional(),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

export const duplicateTodoSchema = z.object({
  includeTags: z.boolean().optional(),
  includeSubtasks: z.boolean().optional(),
});

export type DuplicateTodoInput = z.infer<typeof duplicateTodoSchema>;

export const listTodoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: TodoStatus.optional(),
  priority: TodoPriority.optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'dueDate', 'priority', 'title'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListTodoQuery = z.infer<typeof listTodoQuerySchema>;

export const todoResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  categoryId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  status: TodoStatus,
  priority: TodoPriority,
  startDate: z.date().nullable(),
  dueDate: z.date().nullable(),
  reminderLeadTime: z.number().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TodoResponse = z.infer<typeof todoResponseSchema>;

export const todoDetailedResponseSchema = todoResponseSchema.extend({
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    })
    .nullable(),
  tags: z.array(
    z.object({
      id: z.string(),
      tag: z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
      }),
    })
  ),
  subtasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
      ordering: z.number(),
    })
  ),
  attachments: z.array(
    z.object({
      id: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      url: z.string().nullable(),
    })
  ),
});

export type TodoDetailedResponse = z.infer<typeof todoDetailedResponseSchema>;
