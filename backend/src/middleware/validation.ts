import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      const message =
        error.errors
          ?.map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ') || 'Validation failed';
      throw ApiError.badRequest(message);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error: any) {
      const message =
        error.errors
          ?.map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ') || 'Validation failed';
      throw ApiError.badRequest(message);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error: any) {
      const message =
        error.errors
          ?.map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ') || 'Validation failed';
      throw ApiError.badRequest(message);
    }
  };
}
