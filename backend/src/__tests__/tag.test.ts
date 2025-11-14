import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
} from './setup';
import { getPrismaClient } from '../config';

describe('Tag Endpoints', () => {
  let app: Application;
  let prisma = getPrismaClient();
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

  describe('POST /tags', () => {
    it('should create a new tag', async () => {
      const response = await request(app)
        .post('/tags')
        .set('X-User-ID', userId)
        .send({
          name: 'urgent',
          color: '#ef4444',
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('urgent');
      expect(response.body.data.color).toBe('#ef4444');
    });

    it('should fail with missing name', async () => {
      const response = await request(app)
        .post('/tags')
        .set('X-User-ID', userId)
        .send({
          color: '#ef4444',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should fail with duplicate tag name', async () => {
      await request(app)
        .post('/tags')
        .set('X-User-ID', userId)
        .send({
          name: 'urgent',
        })
        .expect(201);

      const response = await request(app)
        .post('/tags')
        .set('X-User-ID', userId)
        .send({
          name: 'urgent',
        })
        .expect(409);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /tags', () => {
    beforeEach(async () => {
      await prisma.tag.create({
        data: {
          userId,
          name: 'Tag 1',
        },
      });

      await prisma.tag.create({
        data: {
          userId,
          name: 'Tag 2',
        },
      });
    });

    it('should list all tags', async () => {
      const response = await request(app)
        .get('/tags')
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total', 2);
    });
  });

  describe('GET /tags/:tagId', () => {
    let tagId: string;

    beforeEach(async () => {
      const tag = await prisma.tag.create({
        data: {
          userId,
          name: 'Test Tag',
        },
      });
      tagId = tag.id;
    });

    it('should retrieve a specific tag', async () => {
      const response = await request(app)
        .get(`/tags/${tagId}`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(tagId);
      expect(response.body.data.name).toBe('Test Tag');
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .get('/tags/nonexistent')
        .set('X-User-ID', userId)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('PATCH /tags/:tagId', () => {
    let tagId: string;

    beforeEach(async () => {
      const tag = await prisma.tag.create({
        data: {
          userId,
          name: 'Original Name',
          color: '#10b981',
        },
      });
      tagId = tag.id;
    });

    it('should update a tag', async () => {
      const response = await request(app)
        .patch(`/tags/${tagId}`)
        .set('X-User-ID', userId)
        .send({
          name: 'Updated Name',
          color: '#f59e0b',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.color).toBe('#f59e0b');
    });
  });

  describe('DELETE /tags/:tagId', () => {
    let tagId: string;

    beforeEach(async () => {
      const tag = await prisma.tag.create({
        data: {
          userId,
          name: 'Test Tag',
        },
      });
      tagId = tag.id;
    });

    it('should delete a tag', async () => {
      await request(app)
        .delete(`/tags/${tagId}`)
        .set('X-User-ID', userId)
        .expect(204);

      const tag = await prisma.tag.findUnique({
        where: { id: tagId },
      });
      expect(tag).toBeNull();
    });
  });
});
