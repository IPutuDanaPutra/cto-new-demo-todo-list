// Load test environment variables for Jest
require('dotenv').config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgresql://todo_user:todo_password@localhost:5432/todo_platform_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-at-least-32-chars';
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-key-that-is-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.PORT = '3001';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.LOG_LEVEL = 'error';
