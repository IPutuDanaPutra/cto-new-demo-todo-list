import { Request, Response } from 'express';
import { UserPreferencesService } from '../services';
import { userPreferencesSchema } from '../schemas';

const userPreferencesService = new UserPreferencesService();

export const getUserPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';

  const preferences = await userPreferencesService.getUserPreferences(userId);

  res.status(200).json({
    data: preferences,
    meta: {},
  });
};

export const updateUserPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedData = userPreferencesSchema.parse(req.body);

  const preferences = await userPreferencesService.updateUserPreferences(
    userId,
    validatedData
  );

  res.status(200).json({
    data: preferences,
    meta: {},
  });
};

export const getViewPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { viewType } = req.params as { viewType: string };

  const preferences = await userPreferencesService.getViewPreferences(
    userId,
    viewType
  );

  res.status(200).json({
    data: preferences,
    meta: {},
  });
};

export const updateViewPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { viewType } = req.params as { viewType: string };
  const { filters, sorting } = req.body;

  const preferences = await userPreferencesService.updateViewPreferences(
    userId,
    viewType,
    filters,
    sorting
  );

  res.status(200).json({
    data: preferences,
    meta: {},
  });
};