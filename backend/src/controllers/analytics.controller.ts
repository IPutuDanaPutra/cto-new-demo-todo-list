import { Request, Response } from 'express';
import { AnalyticsService } from '../services';

const analyticsService = new AnalyticsService();

export const getAnalyticsSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';

  const analytics = await analyticsService.getAnalyticsSummary(userId);

  res.status(200).json({
    data: analytics,
    meta: {},
  });
};

export const getProductivityMetrics = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';

  const metrics = await analyticsService.getProductivityMetrics(userId);

  res.status(200).json({
    data: metrics,
    meta: {},
  });
};