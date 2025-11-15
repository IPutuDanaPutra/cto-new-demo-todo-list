import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
} from './setup';
import { getPrismaClient } from '../config';
import { TodoStatus, TodoPriority } from '@prisma/client';

describe('Bulk Operations Endpoints', () => {
  let app: Application;
  let prisma = getPrismaClient();
  let userId: string;
  let categoryId: string;
  let tagId1: string;
  let tagId2: string;
  let todoIds: string[];

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await setupTestDatabase();

    const user = await createTestUser();
    userId = user.id;

    const category = await prisma.category.create({
      data: {
        userId,
        name: 'Test Category',
        color: '#3b82f6',
      },
    });
    categoryId = category.id;

    const tag1 = await prisma.tag.create({
      data: {
        userId,
        name: 'Tag 1',
        color: '#10b981',
      },
    });
    tagId1 = tag1.id;

    const tag2 = await prisma.tag.create({
      data: {
        userId,
        name: 'Tag 2',
        color: '#f59e0b',
      },
    });
    tagId2 = tag2.id;

    const todos = await Promise.all([
      prisma.todo.create({
        data: {
          userId,
          title: 'Todo 1',
          status: TodoStatus.TODO,
          priority: TodoPriority.MEDIUM,
          categoryId,
        },
      }),
      prisma.todo.create({
        data: {
          userId,
          title: 'Todo 2',
          status: TodoStatus.TODO,
          priority: TodoPriority.LOW,
        },
      }),
      prisma.todo.create({
        data: {
          userId,
          title: 'Todo 3',
          status: TodoStatus.IN_PROGRESS,
          priority: TodoPriority.HIGH,
        },
      }),
    ]);
    todoIds = todos.map((t) => t.id);
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  describe('POST /bulk/status', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/bulk/status')
        .send({
          todoIds: [todoIds[0]!],
          status: TodoStatus.DONE,
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User ID');
    });

    it('should bulk update status with authentication', async () => {
      const response = await request(app)
        .put('/bulk/status')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!],
          status: TodoStatus.DONE,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toHaveLength(0);

      const updatedTodos = await prisma.todo.findMany({
        where: { id: { in: [todoIds[0]!, todoIds[1]!] } },
      });
      expect(updatedTodos.every((t) => t.status === TodoStatus.DONE)).toBe(
        true
      );
    });
  });

  describe('POST /bulk/priority', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/bulk/priority')
        .send({
          todoIds: [todoIds[0]!],
          priority: TodoPriority.URGENT,
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User ID');
    });

    it('should bulk update priority with authentication', async () => {
      const response = await request(app)
        .put('/bulk/priority')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!],
          priority: TodoPriority.URGENT,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toHaveLength(0);

      const updatedTodos = await prisma.todo.findMany({
        where: { id: { in: [todoIds[0]!, todoIds[1]!] } },
      });
      expect(
        updatedTodos.every((t) => t.priority === TodoPriority.URGENT)
      ).toBe(true);
    });
  });

  describe('POST /bulk/due-date', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/bulk/due-date')
        .send({
          todoIds: [todoIds[0]!],
          dueDate: '2024-12-31',
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User ID');
    });

    it('should bulk update due date with authentication', async () => {
      const dueDate = '2024-12-31';
      const response = await request(app)
        .put('/bulk/due-date')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!],
          dueDate,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toHaveLength(0);

      const updatedTodos = await prisma.todo.findMany({
        where: { id: { in: [todoIds[0]!, todoIds[1]!] } },
      });
      expect(updatedTodos.every((t) => t.dueDate !== null)).toBe(true);
    });

    it('should clear due date when dueDate is not provided', async () => {
      const response = await request(app)
        .put('/bulk/due-date')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!],
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.updated).toBe(1);
    });
  });

  describe('POST /bulk/category', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/bulk/category')
        .send({
          todoIds: [todoIds[0]!],
          categoryId,
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User ID');
    });

    it('should bulk move to category with authentication', async () => {
      const response = await request(app)
        .put('/bulk/category')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[1]!, todoIds[2]!],
          categoryId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toHaveLength(0);

      const updatedTodos = await prisma.todo.findMany({
        where: { id: { in: [todoIds[1]!, todoIds[2]!] } },
      });
      expect(updatedTodos.every((t) => t.categoryId === categoryId)).toBe(true);
    });

    it('should clear category when categoryId is not provided', async () => {
      const response = await request(app)
        .put('/bulk/category')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!],
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.updated).toBe(1);
    });
  });

  describe('POST /bulk/tags', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/bulk/tags')
        .send({
          todoIds: [todoIds[0]!],
          tagIds: [tagId1],
          action: 'add',
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User ID');
    });

    it('should add tags to todos with authentication', async () => {
      const response = await request(app)
        .put('/bulk/tags')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!],
          tagIds: [tagId1, tagId2],
          action: 'add',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toHaveLength(0);

      const todoTags = await prisma.todoTag.findMany({
        where: { todoId: { in: [todoIds[0]!, todoIds[1]!] } },
      });
      expect(todoTags.length).toBeGreaterThanOrEqual(2);
    });

    it('should remove tags from todos', async () => {
      await prisma.todoTag.createMany({
        data: [
          { todoId: todoIds[0]!, tagId: tagId1 },
          { todoId: todoIds[1]!, tagId: tagId1 },
        ],
      });

      const response = await request(app)
        .put('/bulk/tags')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!],
          tagIds: [tagId1],
          action: 'remove',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.updated).toBe(2);

      const todoTags = await prisma.todoTag.findMany({
        where: { todoId: { in: [todoIds[0]!, todoIds[1]!] }, tagId: tagId1 },
      });
      expect(todoTags.length).toBe(0);
    });

    it('should replace tags on todos', async () => {
      await prisma.todoTag.create({
        data: { todoId: todoIds[0]!, tagId: tagId1 },
      });

      const response = await request(app)
        .put('/bulk/tags')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!],
          tagIds: [tagId2],
          action: 'replace',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.updated).toBe(1);

      const todoTags = await prisma.todoTag.findMany({
        where: { todoId: todoIds[0]! },
      });
      expect(todoTags.length).toBe(1);
      expect(todoTags[0]!.tagId).toBe(tagId2);
    });
  });

  describe('POST /bulk/update', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/bulk/update')
        .send({
          todoIds: [todoIds[0]!],
          updates: {
            status: TodoStatus.DONE,
          },
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User ID');
    });

    it('should bulk update multiple fields with authentication', async () => {
      const response = await request(app)
        .put('/bulk/update')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!],
          updates: {
            status: TodoStatus.DONE,
            priority: TodoPriority.LOW,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.updated).toBe(2);
      expect(response.body.data.failed).toHaveLength(0);

      const updatedTodos = await prisma.todo.findMany({
        where: { id: { in: [todoIds[0]!, todoIds[1]!] } },
      });
      expect(updatedTodos.every((t) => t.status === TodoStatus.DONE)).toBe(
        true
      );
      expect(updatedTodos.every((t) => t.priority === TodoPriority.LOW)).toBe(
        true
      );
    });
  });

  describe('DELETE /bulk', () => {
    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/bulk')
        .send({
          todoIds: [todoIds[0]!],
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User ID');
    });

    it('should bulk delete todos with authentication', async () => {
      const response = await request(app)
        .delete('/bulk')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!],
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.deleted).toBe(2);
      expect(response.body.data.failed).toHaveLength(0);

      const remainingTodos = await prisma.todo.findMany({
        where: { id: { in: [todoIds[0]!, todoIds[1]!] } },
      });
      expect(remainingTodos.length).toBe(0);
    });

    it('should handle partial failures gracefully', async () => {
      const response = await request(app)
        .delete('/bulk')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, 'non-existent-id'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.deleted).toBe(1);
      expect(response.body.data.failed).toContain('non-existent-id');
    });
  });
});
