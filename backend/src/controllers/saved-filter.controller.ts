import { Request, Response } from 'express';
import { SavedFilterService } from '../services';
import {
  createSavedFilterSchema,
  updateSavedFilterSchema,
} from '../schemas';

const savedFilterService = new SavedFilterService();

export const getSavedFilters = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';

  const filters = await savedFilterService.getSavedFilters(userId);

  res.status(200).json({
    data: filters,
    meta: {},
  });
};

export const getSavedFilter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { filterId } = req.params as { filterId: string };

  const filter = await savedFilterService.getSavedFilter(filterId, userId);

  if (!filter) {
    res.status(404).json({
      error: 'Saved filter not found',
      meta: {},
    });
    return;
  }

  res.status(200).json({
    data: filter,
    meta: {},
  });
};

export const createSavedFilter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedData = createSavedFilterSchema.parse(req.body);

  const filter = await savedFilterService.createSavedFilter(userId, validatedData);

  res.status(201).json({
    data: filter,
    meta: {},
  });
};

export const updateSavedFilter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { filterId } = req.params as { filterId: string };
  const validatedData = updateSavedFilterSchema.parse(req.body);

  const filter = await savedFilterService.updateSavedFilter(
    filterId,
    userId,
    validatedData
  );

  res.status(200).json({
    data: filter,
    meta: {},
  });
};

export const deleteSavedFilter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { filterId } = req.params as { filterId: string };

  await savedFilterService.deleteSavedFilter(filterId, userId);

  res.status(204).send();
};