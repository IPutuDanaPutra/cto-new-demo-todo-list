import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import { errorHandler, correlationIdMiddleware } from '../middleware';
import { ApiError } from '../utils';

describe('Error Handler Middleware', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(correlationIdMiddleware);
  });

  it('should handle ApiError with custom status code', async () => {
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(ApiError.badRequest('Invalid request'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test').expect(400);

    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Invalid request');
    expect(response.body).toHaveProperty('correlationId');
  });

  it('should handle generic Error as 500', async () => {
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(new Error('Something went wrong'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test').expect(500);

    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Internal Server Error');
  });

  it('should handle ApiError.notFound', async () => {
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(ApiError.notFound('Resource not found'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test').expect(404);

    expect(response.body).toHaveProperty('message', 'Resource not found');
  });

  it('should handle ApiError.unauthorized', async () => {
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(ApiError.unauthorized('Unauthorized access'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test').expect(401);

    expect(response.body).toHaveProperty('message', 'Unauthorized access');
  });

  it('should handle ApiError.forbidden', async () => {
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(ApiError.forbidden('Access forbidden'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test').expect(403);

    expect(response.body).toHaveProperty('message', 'Access forbidden');
  });

  it('should include correlation ID in error response', async () => {
    const correlationId = 'test-error-correlation-123';
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(ApiError.badRequest('Test error'));
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/test')
      .set('X-Correlation-ID', correlationId)
      .expect(400);

    expect(response.body.correlationId).toBe(correlationId);
  });
});
