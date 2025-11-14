import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';

describe('Health Endpoint', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should include service name and version', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.service).toBe('@todo-platform/backend');
      expect(response.body.version).toBe('1.0.0');
    });

    it('should include correlation ID header', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should accept and return custom correlation ID', async () => {
      const correlationId = 'test-correlation-id-123';
      const response = await request(app)
        .get('/health')
        .set('X-Correlation-ID', correlationId)
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });
  });
});
