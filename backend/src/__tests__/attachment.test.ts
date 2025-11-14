import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
} from './setup';
import { getPrismaClient } from '../config';

describe('Attachment Endpoints', () => {
  let app: Application;
  let prisma = getPrismaClient();
  let userId: string;
  let todoId: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await setupTestDatabase();
    const user = await createTestUser();
    userId = user.id;

    const todo = await prisma.todo.create({
      data: {
        userId,
        title: 'Test Todo',
      },
    });
    todoId = todo.id;
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  describe('POST /todos/:todoId/attachments', () => {
    it('should create a new attachment', async () => {
      const attachmentData = {
        fileName: 'test-file.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        url: 'https://example.com/test-file.pdf',
      };

      const response = await request(app)
        .post(`/todos/${todoId}/attachments`)
        .set('X-User-ID', userId)
        .send(attachmentData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.fileName).toBe(attachmentData.fileName);
      expect(response.body.data.mimeType).toBe(attachmentData.mimeType);
      expect(response.body.data.fileSize).toBe(attachmentData.fileSize);
      expect(response.body.data.url).toBe(attachmentData.url);
    });

    it('should fail with missing fileName', async () => {
      const attachmentData = {
        mimeType: 'application/pdf',
        fileSize: 1024,
      };

      await request(app)
        .post(`/todos/${todoId}/attachments`)
        .set('X-User-ID', userId)
        .send(attachmentData)
        .expect(400);
    });

    it('should fail with invalid fileSize (negative)', async () => {
      const attachmentData = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: -100,
      };

      await request(app)
        .post(`/todos/${todoId}/attachments`)
        .set('X-User-ID', userId)
        .send(attachmentData)
        .expect(400);
    });

    it('should return 404 for non-existent todo', async () => {
      const attachmentData = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      };

      await request(app)
        .post('/todos/non-existent-id/attachments')
        .set('X-User-ID', userId)
        .send(attachmentData)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const attachmentData = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      };

      await request(app)
        .post(`/todos/${todoId}/attachments`)
        .send(attachmentData)
        .expect(401);
    });
  });

  describe('GET /todos/:todoId/attachments', () => {
    it('should list all attachments for a todo', async () => {
      // Create some attachments
      await prisma.attachment.create({
        data: {
          todoId,
          userId,
          fileName: 'file1.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          url: 'https://example.com/file1.pdf',
        },
      });

      await prisma.attachment.create({
        data: {
          todoId,
          userId,
          fileName: 'file2.jpg',
          mimeType: 'image/jpeg',
          fileSize: 2048,
          url: 'https://example.com/file2.jpg',
        },
      });

      const response = await request(app)
        .get(`/todos/${todoId}/attachments`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta.total).toBe(2);
    });

    it('should return empty list for todo with no attachments', async () => {
      const response = await request(app)
        .get(`/todos/${todoId}/attachments`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe('GET /todos/:todoId/attachments/:attachmentId', () => {
    it('should retrieve a specific attachment', async () => {
      const attachment = await prisma.attachment.create({
        data: {
          todoId,
          userId,
          fileName: 'test-file.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          url: 'https://example.com/test-file.pdf',
        },
      });

      const response = await request(app)
        .get(`/todos/${todoId}/attachments/${attachment.id}`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(attachment.id);
      expect(response.body.data.fileName).toBe(attachment.fileName);
    });

    it('should return 404 for non-existent attachment', async () => {
      await request(app)
        .get(`/todos/${todoId}/attachments/non-existent-id`)
        .set('X-User-ID', userId)
        .expect(404);
    });

    it('should prevent access to attachment from another user todo', async () => {
      const otherUser = await createTestUser('other@example.com', 'Other User');
      const otherTodo = await prisma.todo.create({
        data: {
          userId: otherUser.id,
          title: 'Other Todo',
        },
      });

      const attachment = await prisma.attachment.create({
        data: {
          todoId: otherTodo.id,
          userId: otherUser.id,
          fileName: 'secret.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          url: 'https://example.com/secret.pdf',
        },
      });

      await request(app)
        .get(`/todos/${todoId}/attachments/${attachment.id}`)
        .set('X-User-ID', userId)
        .expect(403); // Returns 403 for unauthorized access
    });
  });

  describe('PATCH /todos/:todoId/attachments/:attachmentId', () => {
    it('should update an attachment', async () => {
      const attachment = await prisma.attachment.create({
        data: {
          todoId,
          userId,
          fileName: 'old-name.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          url: 'https://example.com/old-name.pdf',
        },
      });

      const updateData = {
        fileName: 'new-name.pdf',
        url: 'https://example.com/new-name.pdf',
      };

      const response = await request(app)
        .patch(`/todos/${todoId}/attachments/${attachment.id}`)
        .set('X-User-ID', userId)
        .send(updateData)
        .expect(200);

      expect(response.body.data.fileName).toBe(updateData.fileName);
      expect(response.body.data.url).toBe(updateData.url);
      expect(response.body.data.mimeType).toBe('application/pdf'); // Should remain unchanged
    });

    it('should return 404 for non-existent attachment', async () => {
      await request(app)
        .patch(`/todos/${todoId}/attachments/non-existent-id`)
        .set('X-User-ID', userId)
        .send({ fileName: 'updated.pdf' })
        .expect(404);
    });
  });

  describe('DELETE /todos/:todoId/attachments/:attachmentId', () => {
    it('should delete an attachment', async () => {
      const attachment = await prisma.attachment.create({
        data: {
          todoId,
          userId,
          fileName: 'to-delete.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          url: 'https://example.com/to-delete.pdf',
        },
      });

      await request(app)
        .delete(`/todos/${todoId}/attachments/${attachment.id}`)
        .set('X-User-ID', userId)
        .expect(204);

      // Verify attachment is deleted
      const deletedAttachment = await prisma.attachment.findUnique({
        where: { id: attachment.id },
      });
      expect(deletedAttachment).toBeNull();
    });

    it('should return 404 for non-existent attachment', async () => {
      await request(app)
        .delete(`/todos/${todoId}/attachments/non-existent-id`)
        .set('X-User-ID', userId)
        .expect(404);
    });
  });
});
