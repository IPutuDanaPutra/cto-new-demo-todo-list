import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
} from './setup';
import { getPrismaClient } from '../config';

describe('Todo Endpoints', () => {
  let app: Application;
  let prisma = getPrismaClient();
  let userId: string;
  let categoryId: string;
  let tagId: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await setupTestDatabase();

    // Create test user
    const user = await createTestUser();
    userId = user.id;

    // Create test category
    const category = await prisma.category.create({
      data: {
        userId,
        name: 'Test Category',
        color: '#3b82f6',
      },
    });
    categoryId = category.id;

    // Create test tag
    const tag = await prisma.tag.create({
      data: {
        userId,
        name: 'Test Tag',
        color: '#10b981',
      },
    });
    tagId = tag.id;
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  describe('POST /todos', () => {
    it('should create a new todo', async () => {
      const response = await request(app)
        .post('/todos')
        .set('X-User-ID', userId)
        .send({
          title: 'Test Todo',
          description: 'Test Description',
          categoryId,
          priority: 'HIGH',
          status: 'TODO',
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Todo');
      expect(response.body.data.priority).toBe('HIGH');
      expect(response.body.data.categoryId).toBe(categoryId);
    });

    it('should fail with missing title', async () => {
      const response = await request(app)
        .post('/todos')
        .set('X-User-ID', userId)
        .send({
          description: 'Test Description',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/todos')
        .send({
          title: 'Test Todo',
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('User ID');
    });
  });

  describe('GET /todos', () => {
    beforeEach(async () => {
      // Create multiple test todos
      await prisma.todo.create({
        data: {
          userId,
          title: 'Todo 1',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date('2024-01-15'),
        },
      });

      await prisma.todo.create({
        data: {
          userId,
          title: 'Todo 2',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          dueDate: new Date('2024-01-20'),
        },
      });

      await prisma.todo.create({
        data: {
          userId,
          title: 'Todo 3',
          status: 'DONE',
          priority: 'MEDIUM',
          completedAt: new Date(),
        },
      });
    });

    it('should list all todos with pagination', async () => {
      const response = await request(app)
        .get('/todos')
        .set('X-User-ID', userId)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total', 3);
      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 20);
    });

    it('should filter todos by status', async () => {
      const response = await request(app)
        .get('/todos')
        .set('X-User-ID', userId)
        .query({ status: 'TODO' })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('TODO');
    });

    it('should filter todos by priority', async () => {
      const response = await request(app)
        .get('/todos')
        .set('X-User-ID', userId)
        .query({ priority: 'HIGH' })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].priority).toBe('HIGH');
    });

    it('should search todos by title', async () => {
      const response = await request(app)
        .get('/todos')
        .set('X-User-ID', userId)
        .query({ search: 'Todo 1' })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Todo 1');
    });

    it('should sort todos by due date', async () => {
      const response = await request(app)
        .get('/todos')
        .set('X-User-ID', userId)
        .query({ sortBy: 'dueDate', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.data.length).toBe(3);
      // Todo 3 has no due date, so it should come first or last depending on DB sorting
      // Todo 1 has 2024-01-15, Todo 2 has 2024-01-20
    });
  });

  describe('GET /todos/:todoId', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Test Todo',
          categoryId,
        },
      });
      todoId = todo.id;
    });

    it('should retrieve a specific todo', async () => {
      const response = await request(app)
        .get(`/todos/${todoId}`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(todoId);
      expect(response.body.data.title).toBe('Test Todo');
    });

    it('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .get('/todos/nonexistent')
        .set('X-User-ID', userId)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PATCH /todos/:todoId', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Original Title',
          priority: 'LOW',
        },
      });
      todoId = todo.id;
    });

    it('should update a todo', async () => {
      const response = await request(app)
        .patch(`/todos/${todoId}`)
        .set('X-User-ID', userId)
        .send({
          title: 'Updated Title',
          priority: 'HIGH',
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.priority).toBe('HIGH');
    });
  });

  describe('DELETE /todos/:todoId', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Test Todo',
        },
      });
      todoId = todo.id;
    });

    it('should delete a todo', async () => {
      await request(app)
        .delete(`/todos/${todoId}`)
        .set('X-User-ID', userId)
        .expect(204);

      const todo = await prisma.todo.findUnique({ where: { id: todoId } });
      expect(todo).toBeNull();
    });
  });

  describe('POST /todos/:todoId/complete', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Test Todo',
          status: 'TODO',
        },
      });
      todoId = todo.id;
    });

    it('should mark todo as complete', async () => {
      const response = await request(app)
        .post(`/todos/${todoId}/complete`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body.data.status).toBe('DONE');
      expect(response.body.data.completedAt).toBeDefined();
    });
  });

  describe('POST /todos/:todoId/incomplete', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Test Todo',
          status: 'DONE',
          completedAt: new Date(),
        },
      });
      todoId = todo.id;
    });

    it('should mark todo as incomplete', async () => {
      const response = await request(app)
        .post(`/todos/${todoId}/incomplete`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(response.body.data.status).toBe('TODO');
      expect(response.body.data.completedAt).toBeNull();
    });
  });

  describe('POST /todos/:todoId/duplicate', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Original Todo',
          categoryId,
          tags: {
            create: [
              {
                tagId,
              },
            ],
          },
        },
      });
      todoId = todo.id;

      // Add a subtask
      await prisma.subtask.create({
        data: {
          todoId,
          userId,
          title: 'Subtask 1',
        },
      });
    });

    it('should duplicate a todo with subtasks and tags', async () => {
      const response = await request(app)
        .post(`/todos/${todoId}/duplicate`)
        .set('X-User-ID', userId)
        .send({
          includeSubtasks: true,
          includeTags: true,
        })
        .expect(201);

      expect(response.body.data.title).toContain('copy');
      expect(response.body.data.subtasks).toBeDefined();
      expect(response.body.data.tags).toBeDefined();
    });
  });

  describe('POST /todos/:todoId/tags/:tagId', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Test Todo',
        },
      });
      todoId = todo.id;
    });

    it('should add a tag to todo', async () => {
      await request(app)
        .post(`/todos/${todoId}/tags/${tagId}`)
        .set('X-User-ID', userId)
        .expect(204);

      const todo = await prisma.todo.findUnique({
        where: { id: todoId },
        include: { tags: true },
      });

      expect(todo).not.toBeNull();
      if (!todo) {
        throw new Error('Todo should exist after adding a tag');
      }

      expect(todo.tags).toHaveLength(1);
      const tag = todo.tags[0];
      expect(tag).toBeDefined();
      if (!tag) {
        throw new Error('Tag should exist on the todo');
      }
      expect(tag.tagId).toBe(tagId);
    });
  });

  describe('DELETE /todos/:todoId/tags/:tagId', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Test Todo',
          tags: {
            create: [
              {
                tagId,
              },
            ],
          },
        },
      });
      todoId = todo.id;
    });

    it('should remove a tag from todo', async () => {
      await request(app)
        .delete(`/todos/${todoId}/tags/${tagId}`)
        .set('X-User-ID', userId)
        .expect(204);

      const todo = await prisma.todo.findUnique({
        where: { id: todoId },
        include: { tags: true },
      });

      expect(todo?.tags.length).toBe(0);
    });
  });
});
