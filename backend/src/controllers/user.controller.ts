import { Request, Response } from 'express';
import { UserService } from '../services';
import { updateUserProfileSchema } from '../schemas';

const userService = new UserService();

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const user = await userService.getUserProfile(userId);

  res.status(200).json({
    data: user,
    meta: {},
  });
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedData = updateUserProfileSchema.parse(req.body);

  const user = await userService.updateUserProfile(userId, validatedData);

  res.status(200).json({
    data: user,
    meta: {},
  });
};
