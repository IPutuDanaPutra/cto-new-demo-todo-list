import { Request, Response } from 'express';
import { ActivityLogService } from '../services';
import { activityLogQuerySchema } from '../schemas';
import { ActivityType } from '@prisma/client';

const activityLogService = new ActivityLogService();

export const getActivityLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedQuery = activityLogQuerySchema.parse(req.query);

  const result = await activityLogService.getActivityLogs(userId, validatedQuery);

  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
};

export const createActivityLog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId, type, changes } = req.body;

  const activityLog = await activityLogService.createActivityLog(
    userId,
    todoId,
    type as ActivityType,
    changes
  );

  res.status(201).json({
    data: activityLog,
    meta: {},
  });
};