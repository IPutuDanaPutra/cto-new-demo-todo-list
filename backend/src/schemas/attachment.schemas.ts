import { z } from 'zod';

export const createAttachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  url: z.string().url().optional(),
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

export const updateAttachmentSchema = z.object({
  fileName: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
});

export type UpdateAttachmentInput = z.infer<typeof updateAttachmentSchema>;

export const attachmentResponseSchema = z.object({
  id: z.string(),
  todoId: z.string(),
  userId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  url: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AttachmentResponse = z.infer<typeof attachmentResponseSchema>;
