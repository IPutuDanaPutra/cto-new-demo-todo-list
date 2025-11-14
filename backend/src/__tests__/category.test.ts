import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
} from './setup';
import { getPrismaClient } from '../config';

describe('Category Endpoints', () => {
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

  describe('POST /categories', () => {
    it('should create a new category', async () => {
      const response = await request(app)
        .post('/categories')
        .set('X-User-ID', userId)
        .send({
          name: 'Shopping',
          color: '#3b82f6',
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Shopping');
      expect(response.body.data.color).toBe('#3b82f6');
    });

    it('should fail with missing name', async () => {
      const response = await request(app)
        .post('/categories')
        .set('X-User-ID', userId)
        .send({
          color: '#3b82f6',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should fail with duplicate category name', async () => {
      await request(app)
        .post('/categories')
        .set('X-User-ID', userId)
        .send({
          name: 'Shopping',
        })
        .expect(201);

      const response = await request(app)
        .post('/categories')
        .set('X-User-ID', userId)
        .send({
          name: 'Shopping',
        })
        .expect(409);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /categories', () => {
    beforeEach(async () => {
      await prisma.category.create({
        data: {
          userId,
          name: 'Category 1',
        },
      });

      await prisma.category.create({
        data: {
          userId,
          name: 'Category 2',
        },
      });
    });

    it('should list all categories', async () => {
      const response = await request(app)
        .get('/categories')
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total', 2);
    });
  });

  describe('GET /categories/:categoryId', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: {
          userId,
          name: 'Test Category',
        },
      });
      categoryId = category.id;
    });

    it('should retrieve a specific category', async () => {
      const response = await request(app)
        .get(`/categories/${categoryId}`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(categoryId);
      expect(response.body.data.name).toBe('Test Category');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/categories/nonexistent')
        .set('X-User-ID', userId)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('PATCH /categories/:categoryId', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: {
          userId,
          name: 'Original Name',
          color: '#3b82f6',
        },
      });
      categoryId = category.id;
    });

    it('should update a category', async () => {
      const response = await request(app)
        .patch(`/categories/${categoryId}`)
        .set('X-User-ID', userId)
        .send({
          name: 'Updated Name',
          color: '#ef4444',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.color).toBe('#ef4444');
    });
  });

  describe('DELETE /categories/:categoryId', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: {
          userId,
          name: 'Test Category',
        },
      });
      categoryId = category.id;
    });

    it('should delete a category', async () => {
      await request(app)
        .delete(`/categories/${categoryId}`)
        .set('X-User-ID', userId)
        .expect(204);

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      expect(category).toBeNull();
    });
  });

  describe('POST /categories/reorder', () => {
    beforeEach(async () => {
      await prisma.category.create({
        data: {
          userId,
          name: 'Category 1',
          ordering: 0,
        },
      });

      await prisma.category.create({
        data: {
          userId,
          name: 'Category 2',
          ordering: 1,
        },
      });
    });

    it('should reorder categories', async () => {
      const categories = await prisma.category.findMany({
        where: { userId },
      });

      const response = await request(app)
        .post('/categories/reorder')
        .set('X-User-ID', userId)
        .send({
          ordering: [
            { id: categories[0]!.id, ordering: 1 },
            { id: categories[1]!.id, ordering: 0 },
          ],
        })
        .expect(200);

      expect(response.body.data.length).toBe(2);
      const reordered = response.body.data.find(
        (c: { id: string; ordering: number }) => c.id === categories[0]!.id
      );
      expect(reordered.ordering).toBe(1);
    });

    it('should fail to reorder with unauthorized category', async () => {
      // Create a category for another user
      const otherUser = await createTestUser('other@example.com', 'Other User');
      const otherCategory = await prisma.category.create({
        data: {
          userId: otherUser.id,
          name: 'Other Category',
          ordering: 0,
        },
      });

      const categories = await prisma.category.findMany({
        where: { userId },
      });

      await request(app)
        .post('/categories/reorder')
        .set('X-User-ID', userId)
        .send({
          ordering: [
            { id: categories[0]!.id, ordering: 1 },
            { id: otherCategory.id, ordering: 0 }, // Unauthorized category
          ],
        })
        .expect(403);
    });
  });

  describe('Edge Cases', () => {
    it('should create category with default color when not provided', async () => {
      const response = await request(app)
        .post('/categories')
        .set('X-User-ID', userId)
        .send({
          name: 'Default Color Category',
        })
        .expect(201);

      expect(response.body.data.color).toBe('#3b82f6');
    });

    it('should create category with first ordering when no categories exist', async () => {
      const response = await request(app)
        .post('/categories')
        .set('X-User-ID', userId)
        .send({
          name: 'First Category',
        })
        .expect(201);

      expect(response.body.data.ordering).toBe(0);
    });

    it('should update only provided fields', async () => {
      const category = await prisma.category.create({
        data: {
          userId,
          name: 'Original Name',
          color: '#ff0000',
          ordering: 0,
        },
      });

      const response = await request(app)
        .patch(`/categories/${category.id}`)
        .set('X-User-ID', userId)
        .send({
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.color).toBe('#ff0000'); // Should remain unchanged
    });

    it('should handle category not found in get operation', async () => {
      await request(app)
        .get('/categories/non-existent-id')
        .set('X-User-ID', userId)
        .expect(404);
    });

    it('should handle category not found in update operation', async () => {
      await request(app)
        .patch('/categories/non-existent-id')
        .set('X-User-ID', userId)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should handle category not found in delete operation', async () => {
      await request(app)
        .delete('/categories/non-existent-id')
        .set('X-User-ID', userId)
        .expect(404);
    });

    it('should prevent access to another user category', async () => {
      const otherUser = await createTestUser('other@example.com', 'Other User');
      const otherCategory = await prisma.category.create({
        data: {
          userId: otherUser.id,
          name: 'Other Category',
          ordering: 0,
        },
      });

      await request(app)
        .get(`/categories/${otherCategory.id}`)
        .set('X-User-ID', userId)
        .expect(403);

      await request(app)
        .patch(`/categories/${otherCategory.id}`)
        .set('X-User-ID', userId)
        .send({ name: 'Hacked' })
        .expect(403);

      await request(app)
        .delete(`/categories/${otherCategory.id}`)
        .set('X-User-ID', userId)
        .expect(403);
    });
  });
});
