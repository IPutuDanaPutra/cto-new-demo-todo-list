import { z } from 'zod';
import { ActivityType } from '@prisma/client';

export const activityLogQuerySchema = z.object({
  todoId: z.string().optional(),
  type: z.nativeEnum(ActivityType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ActivityLogQuery = z.infer<typeof activityLogQuerySchema>;