import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config';
import {
  errorHandler,
  correlationIdMiddleware,
  requestLogger,
} from './middleware';
import routes from './routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );

  app.use(compression());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(correlationIdMiddleware);

  app.use(requestLogger);

  app.use('/', routes);

  app.use(errorHandler);

  return app;
}
