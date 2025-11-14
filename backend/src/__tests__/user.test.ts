import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
} from './setup';

describe('User Endpoints', () => {
  let app: Application;
  let userId: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await setupTestDatabase();
    const user = await createTestUser();
    userId = user.id;
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  describe('GET /users/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).toHaveProperty('displayName', 'Test User');
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/users/profile').expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/users/profile')
        .set('X-User-ID', 'non-existent-user-id')
        .expect(404);
    });
  });

  describe('PATCH /users/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        displayName: 'Updated Name',
        timezone: 'America/New_York',
      };

      const response = await request(app)
        .patch('/users/profile')
        .set('X-User-ID', userId)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.displayName).toBe(updateData.displayName);
      expect(response.body.data.timezone).toBe(updateData.timezone);
    });

    it('should update partial profile data', async () => {
      const updateData = {
        displayName: 'Partial Update',
      };

      const response = await request(app)
        .patch('/users/profile')
        .set('X-User-ID', userId)
        .send(updateData)
        .expect(200);

      expect(response.body.data.displayName).toBe(updateData.displayName);
      expect(response.body.data.email).toBe('test@example.com'); // Should remain unchanged
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .patch('/users/profile')
        .send({ displayName: 'Test' })
        .expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .patch('/users/profile')
        .set('X-User-ID', 'non-existent-user-id')
        .send({ displayName: 'Test' })
        .expect(404);
    });

    it('should fail with invalid display name', async () => {
      const updateData = {
        displayName: '', // Empty string should fail
      };

      await request(app)
        .patch('/users/profile')
        .set('X-User-ID', userId)
        .send(updateData)
        .expect(400);
    });

    it('should fail with display name too long', async () => {
      const updateData = {
        displayName: 'a'.repeat(256), // Too long
      };

      await request(app)
        .patch('/users/profile')
        .set('X-User-ID', userId)
        .send(updateData)
        .expect(400);
    });
  });
});
