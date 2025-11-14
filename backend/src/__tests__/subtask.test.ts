import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
} from './setup';
import { getPrismaClient } from '../config';

describe('Subtask Endpoints', () => {
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

  describe('POST /todos/:todoId/subtasks', () => {
    it('should create a new subtask', async () => {
      const response = await request(app)
        .post(`/todos/${todoId}/subtasks`)
        .set('X-User-ID', userId)
        .send({
          title: 'Subtask 1',
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Subtask 1');
      expect(response.body.data.todoId).toBe(todoId);
      expect(response.body.data.completed).toBe(false);
    });

    it('should fail with missing title', async () => {
      const response = await request(app)
        .post(`/todos/${todoId}/subtasks`)
        .set('X-User-ID', userId)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('GET /todos/:todoId/subtasks', () => {
    beforeEach(async () => {
      await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Subtask 1',
        },
      });

      await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Subtask 2',
        },
      });
    });

    it('should list all subtasks for a todo', async () => {
      const response = await request(app)
        .get(`/todos/${todoId}/subtasks`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total', 2);
    });
  });

  describe('GET /todos/:todoId/subtasks/:subtaskId', () => {
    let subtaskId: string;

    beforeEach(async () => {
      const subtask = await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Test Subtask',
        },
      });
      subtaskId = subtask.id;
    });

    it('should retrieve a specific subtask', async () => {
      const response = await request(app)
        .get(`/todos/${todoId}/subtasks/${subtaskId}`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(subtaskId);
      expect(response.body.data.title).toBe('Test Subtask');
    });

    it('should return 404 for non-existent subtask', async () => {
      const response = await request(app)
        .get(`/todos/${todoId}/subtasks/nonexistent`)
        .set('X-User-ID', userId)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('PATCH /todos/:todoId/subtasks/:subtaskId', () => {
    let subtaskId: string;

    beforeEach(async () => {
      const subtask = await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Original Title',
          completed: false,
        },
      });
      subtaskId = subtask.id;
    });

    it('should update a subtask', async () => {
      const response = await request(app)
        .patch(`/todos/${todoId}/subtasks/${subtaskId}`)
        .set('X-User-ID', userId)
        .send({
          title: 'Updated Title',
          completed: true,
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.completed).toBe(true);
    });
  });

  describe('DELETE /todos/:todoId/subtasks/:subtaskId', () => {
    let subtaskId: string;

    beforeEach(async () => {
      const subtask = await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Test Subtask',
        },
      });
      subtaskId = subtask.id;
    });

    it('should delete a subtask', async () => {
      await request(app)
        .delete(`/todos/${todoId}/subtasks/${subtaskId}`)
        .set('X-User-ID', userId)
        .expect(204);

      const subtask = await prisma.subtask.findUnique({
        where: { id: subtaskId },
      });
      expect(subtask).toBeNull();
    });
  });

  describe('PATCH /todos/:todoId/subtasks/:subtaskId/toggle', () => {
    let subtaskId: string;

    beforeEach(async () => {
      const subtask = await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Test Subtask',
          completed: false,
        },
      });
      subtaskId = subtask.id;
    });

    it('should toggle subtask completion', async () => {
      const response = await request(app)
        .patch(`/todos/${todoId}/subtasks/${subtaskId}/toggle`)
        .set('X-User-ID', userId)
        .send({
          completed: true,
        })
        .expect(200);

      expect(response.body.data.completed).toBe(true);
    });
  });

  describe('POST /todos/:todoId/subtasks/reorder', () => {
    beforeEach(async () => {
      await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Subtask 1',
          ordering: 0,
        },
      });

      await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Subtask 2',
          ordering: 1,
        },
      });
    });

    it('should reorder subtasks', async () => {
      const subtasks = await prisma.subtask.findMany({
        where: { todoId },
      });

      const response = await request(app)
        .post(`/todos/${todoId}/subtasks/reorder`)
        .set('X-User-ID', userId)
        .send({
          ordering: [
            { id: subtasks[0].id, ordering: 1 },
            { id: subtasks[1].id, ordering: 0 },
          ],
        })
        .expect(200);

      expect(response.body.data.length).toBe(2);
      const reordered = response.body.data.find(
        (s: any) => s.id === subtasks[0].id
      );
      expect(reordered.ordering).toBe(1);
    });
  });
});
