import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ApiError } from '../utils';

const formatZodError = (error: ZodError): string => {
  if (error.errors.length === 0) {
    return 'Validation failed';
  }

  return error.errors
    .map((issue) => {
      const path = issue.path.join('.') || 'root';
      return `${path}: ${issue.message}`;
    })
    .join(', ');
};

export function validateRequest(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw ApiError.badRequest(formatZodError(error));
      }
      throw error;
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as unknown as Request['query'];
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw ApiError.badRequest(formatZodError(error));
      }
      throw error;
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as unknown as Request['params'];
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw ApiError.badRequest(formatZodError(error));
      }
      throw error;
    }
  };
}
