import { Request, Response } from 'express';
import { TagService } from '../services';
import { createTagSchema, updateTagSchema } from '../schemas';

const tagService = new TagService();

export const createTag = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';
  const validatedData = createTagSchema.parse(req.body);

  const tag = await tagService.createTag(userId, validatedData);

  res.status(201).json({
    data: tag,
    meta: {},
  });
};

export const getTag = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';
  const { tagId } = req.params as { tagId: string };

  const tag = await tagService.getTag(tagId, userId);

  res.status(200).json({
    data: tag,
    meta: {},
  });
};

export const listTags = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';

  const tags = await tagService.listTags(userId);

  res.status(200).json({
    data: tags,
    meta: { total: tags.length },
  });
};

export const updateTag = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';
  const { tagId } = req.params as { tagId: string };
  const validatedData = updateTagSchema.parse(req.body);

  const tag = await tagService.updateTag(tagId, userId, validatedData);

  res.status(200).json({
    data: tag,
    meta: {},
  });
};

export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';
  const { tagId } = req.params as { tagId: string };

  await tagService.deleteTag(tagId, userId);

  res.status(204).send();
};
