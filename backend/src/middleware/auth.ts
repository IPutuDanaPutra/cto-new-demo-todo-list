import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // For now, this is a placeholder that requires userId from header
  // In a real application, this would validate JWT tokens or session cookies
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    throw ApiError.unauthorized('User ID is required');
  }

  req.userId = userId;
  next();
}
