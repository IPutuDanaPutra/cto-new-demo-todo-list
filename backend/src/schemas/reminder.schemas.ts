import { z } from 'zod';
import { ReminderChannel } from '@prisma/client';

export const createReminderSchema = z.object({
  todoId: z.string(),
  scheduledAt: z.coerce.date(),
  channel: z.nativeEnum(ReminderChannel).default('IN_APP'),
});

export const updateReminderSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  channel: z.nativeEnum(ReminderChannel).optional(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;