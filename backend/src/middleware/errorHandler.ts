import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils';
import { logger } from '../config';
import { env } from '../config';

interface ErrorResponse {
  status: 'error';
  message: string;
  correlationId?: string | undefined;
  stack?: string | undefined;
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  const errorResponse: ErrorResponse = {
    status: 'error',
    message,
    correlationId: req.correlationId,
  };

  if (env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    correlationId: req.correlationId,
    path: req.path,
    method: req.method,
    statusCode,
    isOperational,
  });

  res.status(statusCode).json(errorResponse);
}
