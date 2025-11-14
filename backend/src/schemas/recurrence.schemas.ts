import { z } from 'zod';
import { RecurrenceFrequency } from '@prisma/client';

export const createRecurrenceRuleSchema = z.object({
  frequency: z.nativeEnum(RecurrenceFrequency),
  interval: z.number().int().min(1).default(1),
  byWeekday: z.array(z.string()).optional(),
  byMonthDay: z.array(z.number().int()).optional(),
  endDate: z.coerce.date().optional(),
});

export const updateRecurrenceRuleSchema = z.object({
  frequency: z.nativeEnum(RecurrenceFrequency).optional(),
  interval: z.number().int().min(1).optional(),
  byWeekday: z.array(z.string()).optional(),
  byMonthDay: z.array(z.number().int()).optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateRecurrenceRuleInput = z.infer<typeof createRecurrenceRuleSchema>;
export type UpdateRecurrenceRuleInput = z.infer<typeof updateRecurrenceRuleSchema>;