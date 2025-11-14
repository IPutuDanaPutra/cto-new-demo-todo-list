import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  timezone: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  timezone: z.string(),
  settings: z.record(z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
