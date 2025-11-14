import { z } from 'zod';

export const userPreferencesSchema = z.object({
  defaultView: z.enum(['LIST', 'BOARD', 'CALENDAR', 'TIMELINE']).default('LIST'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  timezone: z.string().default('UTC'),
  workHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
  workHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('17:00'),
  defaultReminderLeadTime: z.number().int().min(0).default(15), // minutes
  weekStartsOn: z.enum(['0', '1', '2', '3', '4', '5', '6']).default('1'), // Monday
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;