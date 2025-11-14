import { Request, Response } from 'express';
import { AttachmentService } from '../services';
import { createAttachmentSchema, updateAttachmentSchema } from '../schemas';

const attachmentService = new AttachmentService();

export const createAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };
  const validatedData = createAttachmentSchema.parse(req.body);

  const attachment = await attachmentService.createAttachment(
    todoId,
    userId,
    validatedData
  );

  res.status(201).json({
    data: attachment,
    meta: {},
  });
};

export const getAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { attachmentId } = req.params as { attachmentId: string };

  const attachment = await attachmentService.getAttachment(
    attachmentId,
    userId
  );

  res.status(200).json({
    data: attachment,
    meta: {},
  });
};

export const listAttachments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };

  const attachments = await attachmentService.listAttachments(todoId, userId);

  res.status(200).json({
    data: attachments,
    meta: { total: attachments.length },
  });
};

export const updateAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { attachmentId } = req.params as { attachmentId: string };
  const validatedData = updateAttachmentSchema.parse(req.body);

  const attachment = await attachmentService.updateAttachment(
    attachmentId,
    userId,
    validatedData
  );

  res.status(200).json({
    data: attachment,
    meta: {},
  });
};

export const deleteAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { attachmentId } = req.params as { attachmentId: string };

  await attachmentService.deleteAttachment(attachmentId, userId);

  res.status(204).send();
};
