import { Request, Response } from 'express';
import { env } from '../config';
import packageJson from '../../package.json';

interface HealthResponse {
  status: 'healthy';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
}

export const getHealth = (_req: Request, res: Response): void => {
  const response: HealthResponse = {
    status: 'healthy',
    service: packageJson.name,
    version: packageJson.version,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  res.status(200).json(response);
};
