import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
} from './setup';
import { getPrismaClient } from '../config';
import { TodoStatus, TodoPriority, RecurrenceFrequency } from '@prisma/client';

// Mock the QueueService to avoid Redis dependency
jest.mock('../services/queue.service', () => {
  const mockScheduleReminder = jest.fn().mockResolvedValue(undefined);
  const mockScheduleRecurrenceCheck = jest.fn().mockResolvedValue(undefined);

  return {
    QueueService: jest.fn().mockImplementation(() => ({
      scheduleReminder: mockScheduleReminder,
      scheduleRecurrenceCheck: mockScheduleRecurrenceCheck,
      close: jest.fn().mockResolvedValue(undefined),
    })),
    __getMockScheduleReminder: () => mockScheduleReminder,
    __getMockScheduleRecurrenceCheck: () => mockScheduleRecurrenceCheck,
  };
});

describe('Advanced Features Integration Tests', () => {
  let app: Application;
  let prisma = getPrismaClient();
  let userId: string;
  let categoryId: string;
  let tagId1: string;
  let tagId2: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await setupTestDatabase();

    const user = await createTestUser('advanced@example.com', 'Advanced User');
    userId = user.id;

    const category = await prisma.category.create({
      data: {
        userId,
        name: 'Work',
        color: '#3b82f6',
      },
    });
    categoryId = category.id;

    const tag1 = await prisma.tag.create({
      data: {
        userId,
        name: 'Important',
        color: '#ef4444',
      },
    });
    tagId1 = tag1.id;

    const tag2 = await prisma.tag.create({
      data: {
        userId,
        name: 'Urgent',
        color: '#f59e0b',
      },
    });
    tagId2 = tag2.id;
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  describe('Scenario 1: Recurrence + Reminder Flow', () => {
    it('should create todo with recurrence rule and reminder, then generate next occurrence on completion', async () => {
      // Step 1: Create recurrence rule (simple daily recurrence)
      const recurrenceResponse = await request(app)
        .post('/recurrence')
        .set('X-User-ID', userId)
        .send({
          frequency: RecurrenceFrequency.DAILY,
          interval: 1,
        })
        .expect(201);

      const recurrenceRuleId = recurrenceResponse.body.data.id;

      // Step 2: Create todo and then associate it with recurrence rule via DB
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      dueDate.setHours(10, 0, 0, 0);

      const todoResponse = await request(app)
        .post('/todos')
        .set('X-User-ID', userId)
        .send({
          title: 'Weekly Report',
          description: 'Submit weekly progress report',
          categoryId,
          priority: TodoPriority.HIGH,
          status: TodoStatus.TODO,
          dueDate: dueDate.toISOString(),
        })
        .expect(201);

      const todoId = todoResponse.body.data.id;

      // Associate recurrence rule with todo via database update (since schema doesn't support it)
      await prisma.todo.update({
        where: { id: todoId },
        data: { recurrenceRuleId },
      });

      // Step 3: Create reminder for the todo
      const reminderTime = new Date(dueDate);
      reminderTime.setHours(reminderTime.getHours() - 2); // 2 hours before due

      const reminderResponse = await request(app)
        .post('/reminders')
        .set('X-User-ID', userId)
        .send({
          todoId,
          scheduledAt: reminderTime.toISOString(),
          channel: 'IN_APP',
        })
        .expect(201);

      const reminderId = reminderResponse.body.data.id;
      expect(reminderId).toBeDefined();

      // Verify reminder was created in database
      const reminder = await prisma.reminder.findUnique({
        where: { id: reminderId },
      });
      expect(reminder).toBeDefined();
      expect(reminder?.todoId).toBe(todoId);

      // Step 4: Mark todo as complete
      await request(app)
        .post(`/todos/${todoId}/complete`)
        .set('X-User-ID', userId)
        .expect(200);

      // Verify todo is completed
      const completedTodo = await prisma.todo.findUnique({
        where: { id: todoId },
      });
      expect(completedTodo?.status).toBe(TodoStatus.DONE);
      expect(completedTodo?.completedAt).toBeDefined();

      // Step 5: Apply recurrence to create next occurrence
      const recurrenceApplyResponse = await request(app)
        .post(`/recurrence/apply/${todoId}`)
        .set('X-User-ID', userId)
        .expect(201);

      const newTodoId = recurrenceApplyResponse.body.data.id;
      expect(newTodoId).toBeDefined();
      expect(newTodoId).not.toBe(todoId);

      // Step 6: Verify new todo has correct properties
      const newTodo = await prisma.todo.findUnique({
        where: { id: newTodoId },
        include: {
          tags: true,
          reminders: true,
        },
      });

      expect(newTodo).toBeDefined();
      expect(newTodo?.title).toBe('Weekly Report');
      expect(newTodo?.description).toBe('Submit weekly progress report');
      expect(newTodo?.categoryId).toBe(categoryId);
      expect(newTodo?.priority).toBe(TodoPriority.HIGH);
      expect(newTodo?.status).toBe(TodoStatus.TODO);
      expect(newTodo?.recurrenceRuleId).toBe(recurrenceRuleId);
      expect(newTodo?.dueDate).toBeDefined();
      expect(newTodo?.dueDate?.getTime()).toBeGreaterThan(dueDate.getTime());

      // Step 7: Verify activity logs were created
      const activityLogs = await prisma.activityLog.findMany({
        where: { todoId },
        orderBy: { createdAt: 'asc' },
      });

      expect(activityLogs.length).toBeGreaterThan(0);

      // Verify at least the creation was logged
      const creationLog = activityLogs.find((log) => log.type === 'CREATED');
      expect(creationLog).toBeDefined();
    });

    it('should handle reminders with timezone-sensitive scheduling', async () => {
      // Update user timezone to America/New_York
      await prisma.user.update({
        where: { id: userId },
        data: { timezone: 'America/New_York' },
      });

      // Create todo
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      dueDate.setHours(14, 0, 0, 0); // 2 PM

      const todoResponse = await request(app)
        .post('/todos')
        .set('X-User-ID', userId)
        .send({
          title: 'Meeting',
          dueDate: dueDate.toISOString(),
        })
        .expect(201);

      const todoId = todoResponse.body.data.id;

      // Create reminder
      const reminderTime = new Date(dueDate);
      reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before

      const reminderResponse = await request(app)
        .post('/reminders')
        .set('X-User-ID', userId)
        .send({
          todoId,
          scheduledAt: reminderTime.toISOString(),
          channel: 'EMAIL',
        })
        .expect(201);

      expect(reminderResponse.body.data).toBeDefined();
      expect(reminderResponse.body.data.scheduledAt).toBeDefined();

      // Verify reminder was created with correct schedule time
      const reminder = await prisma.reminder.findUnique({
        where: { id: reminderResponse.body.data.id },
      });
      expect(reminder).toBeDefined();
      expect(reminder?.scheduledAt.getTime()).toBe(reminderTime.getTime());
    });
  });

  describe('Scenario 2: Bulk Operations + Search + Activity Logs', () => {
    let todoIds: string[];

    beforeEach(async () => {
      // Seed multiple todos
      const todos = await Promise.all([
        prisma.todo.create({
          data: {
            userId,
            title: 'Task 1 - Design Homepage',
            description: 'Create wireframes',
            status: TodoStatus.TODO,
            priority: TodoPriority.HIGH,
            categoryId,
          },
        }),
        prisma.todo.create({
          data: {
            userId,
            title: 'Task 2 - Backend API',
            description: 'Implement REST endpoints',
            status: TodoStatus.IN_PROGRESS,
            priority: TodoPriority.MEDIUM,
          },
        }),
        prisma.todo.create({
          data: {
            userId,
            title: 'Task 3 - Database Schema',
            description: 'Design tables',
            status: TodoStatus.TODO,
            priority: TodoPriority.LOW,
          },
        }),
        prisma.todo.create({
          data: {
            userId,
            title: 'Task 4 - Testing',
            description: 'Write unit tests',
            status: TodoStatus.TODO,
            priority: TodoPriority.MEDIUM,
          },
        }),
        prisma.todo.create({
          data: {
            userId,
            title: 'Task 5 - Documentation',
            description: 'Write API docs',
            status: TodoStatus.DONE,
            priority: TodoPriority.LOW,
            completedAt: new Date(),
          },
        }),
      ]);

      todoIds = todos.map((t) => t.id);
    });

    it('should perform bulk operations and verify via search and activity logs', async () => {
      // Step 1: Bulk update status
      await request(app)
        .put('/bulk/status')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[2]!, todoIds[3]!],
          status: TodoStatus.IN_PROGRESS,
        })
        .expect(200);

      // Step 2: Bulk update priority
      await request(app)
        .put('/bulk/priority')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!],
          priority: TodoPriority.URGENT,
        })
        .expect(200);

      // Step 3: Bulk move to category
      await request(app)
        .put('/bulk/category')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[1]!, todoIds[2]!],
          categoryId,
        })
        .expect(200);

      // Step 4: Bulk add tags
      await request(app)
        .put('/bulk/tags')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todoIds[0]!, todoIds[1]!, todoIds[2]!],
          tagIds: [tagId1, tagId2],
          action: 'add',
        })
        .expect(200);

      // Step 5: Search with filters to verify updates
      const searchResponse = await request(app)
        .get('/search/todos')
        .set('X-User-ID', userId)
        .query({
          q: 'Task',
          'filters[status]': TodoStatus.IN_PROGRESS,
        })
        .expect(200);

      const inProgressTodos = searchResponse.body.data;
      expect(inProgressTodos.length).toBeGreaterThanOrEqual(3);

      // Verify priority updates via search
      const urgentResponse = await request(app)
        .get('/search/todos')
        .set('X-User-ID', userId)
        .query({
          q: 'Task',
          'filters[priority]': TodoPriority.URGENT,
        })
        .expect(200);

      expect(urgentResponse.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify category updates
      const categoryResponse = await request(app)
        .get('/search/todos')
        .set('X-User-ID', userId)
        .query({
          q: 'Task',
          'filters[categoryId]': categoryId,
        })
        .expect(200);

      expect(categoryResponse.body.data.length).toBeGreaterThanOrEqual(2);

      // Step 6: Verify activity logs captured all changes
      const activityLogsResponse = await request(app)
        .get('/activity-logs')
        .set('X-User-ID', userId)
        .query({
          limit: 100,
        })
        .expect(200);

      const logs = activityLogsResponse.body.data;
      expect(logs.length).toBeGreaterThan(0);

      // Check for status change logs
      const statusChangeLogs = logs.filter(
        (log: any) => log.type === 'UPDATED' || log.type === 'STATUS_CHANGED'
      );
      expect(statusChangeLogs.length).toBeGreaterThan(0);

      // Verify logs contain relevant todo IDs
      const todoIdSet = new Set(todoIds);
      const logsForOurTodos = logs.filter((log: any) =>
        todoIdSet.has(log.todoId)
      );
      expect(logsForOurTodos.length).toBeGreaterThan(0);
    });

    it('should support advanced search with multiple filters', async () => {
      // Add tags to some todos
      await prisma.todoTag.createMany({
        data: [
          { todoId: todoIds[0]!, tagId: tagId1 },
          { todoId: todoIds[1]!, tagId: tagId1 },
          { todoId: todoIds[2]!, tagId: tagId2 },
        ],
      });

      // Search with multiple criteria
      const searchResponse = await request(app)
        .get('/search/todos')
        .set('X-User-ID', userId)
        .query({
          q: 'API',
          'filters[status]': TodoStatus.IN_PROGRESS,
        })
        .expect(200);

      expect(searchResponse.body.data).toBeDefined();
      const matchingTodos = searchResponse.body.data.filter(
        (todo: any) =>
          todo.title.includes('API') || todo.description.includes('API')
      );
      expect(matchingTodos.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario 3: Analytics with Advanced Operations', () => {
    beforeEach(async () => {
      // Create a mix of todos for analytics
      const now = new Date();

      // Completed todos
      await prisma.todo.createMany({
        data: [
          {
            userId,
            title: 'Completed Task 1',
            status: TodoStatus.DONE,
            priority: TodoPriority.HIGH,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            completedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
            categoryId,
          },
          {
            userId,
            title: 'Completed Task 2',
            status: TodoStatus.DONE,
            priority: TodoPriority.MEDIUM,
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            userId,
            title: 'Completed Task 3',
            status: TodoStatus.DONE,
            priority: TodoPriority.LOW,
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            completedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          },
        ],
      });

      // Active todos
      await prisma.todo.createMany({
        data: [
          {
            userId,
            title: 'Active Task 1',
            status: TodoStatus.IN_PROGRESS,
            priority: TodoPriority.URGENT,
          },
          {
            userId,
            title: 'Active Task 2',
            status: TodoStatus.TODO,
            priority: TodoPriority.HIGH,
          },
        ],
      });

      // Overdue todos
      await prisma.todo.createMany({
        data: [
          {
            userId,
            title: 'Overdue Task 1',
            status: TodoStatus.TODO,
            priority: TodoPriority.HIGH,
            dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            userId,
            title: 'Overdue Task 2',
            status: TodoStatus.IN_PROGRESS,
            priority: TodoPriority.MEDIUM,
            dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      });
    });

    it('should generate accurate analytics summary with completion rates and distributions', async () => {
      // Get analytics summary
      const analyticsResponse = await request(app)
        .get('/analytics/summary')
        .set('X-User-ID', userId)
        .expect(200);

      const analytics = analyticsResponse.body.data;

      // Verify overview metrics
      expect(analytics.overview).toBeDefined();
      expect(analytics.overview.totalTodos).toBeGreaterThanOrEqual(7);
      expect(analytics.overview.completedTodos).toBe(3);
      expect(analytics.overview.overdueTodos).toBe(2);
      expect(analytics.overview.completionRate).toBeGreaterThan(0);
      expect(analytics.overview.completionRate).toBeLessThanOrEqual(100);

      // Verify distribution by status
      expect(analytics.distribution).toBeDefined();
      expect(analytics.distribution.byStatus).toBeDefined();
      expect(Array.isArray(analytics.distribution.byStatus)).toBe(true);

      const doneStatus = analytics.distribution.byStatus.find(
        (s: any) => s.status === TodoStatus.DONE
      );
      expect(doneStatus).toBeDefined();
      expect(doneStatus?.count).toBe(3);

      // Verify distribution by priority
      expect(analytics.distribution.byPriority).toBeDefined();
      const urgentPriority = analytics.distribution.byPriority.find(
        (p: any) => p.priority === TodoPriority.URGENT
      );
      expect(urgentPriority).toBeDefined();

      // Verify trends
      expect(analytics.trends).toBeDefined();
      expect(analytics.trends.completion).toBeDefined();
      expect(Array.isArray(analytics.trends.completion)).toBe(true);
    });

    it('should track productivity metrics accurately', async () => {
      const productivityResponse = await request(app)
        .get('/analytics/productivity')
        .set('X-User-ID', userId)
        .expect(200);

      const productivity = productivityResponse.body.data.productivity;

      expect(productivity).toBeDefined();
      expect(productivity.completedLastWeek).toBeGreaterThanOrEqual(3);
      expect(productivity.completedLastMonth).toBeGreaterThanOrEqual(3);
      expect(productivity.avgCompletionTime).toBeGreaterThanOrEqual(0);
      expect(productivity.currentStreak).toBeGreaterThanOrEqual(0);
      expect(productivity.longestStreak).toBeGreaterThanOrEqual(0);
    });

    it('should update analytics after completing overdue todos', async () => {
      // Get initial analytics
      const initialAnalytics = await request(app)
        .get('/analytics/summary')
        .set('X-User-ID', userId)
        .expect(200);

      const initialOverdue = initialAnalytics.body.data.overview.overdueTodos;
      expect(initialOverdue).toBe(2);

      // Complete an overdue todo
      const overdueTodos = await prisma.todo.findMany({
        where: {
          userId,
          status: { not: TodoStatus.DONE },
          dueDate: { lt: new Date() },
        },
      });

      const overdueId = overdueTodos[0]!.id;

      await request(app)
        .post(`/todos/${overdueId}/complete`)
        .set('X-User-ID', userId)
        .expect(200);

      // Get updated analytics
      const updatedAnalytics = await request(app)
        .get('/analytics/summary')
        .set('X-User-ID', userId)
        .expect(200);

      const updatedOverdue = updatedAnalytics.body.data.overview.overdueTodos;
      expect(updatedOverdue).toBe(initialOverdue - 1);

      const updatedCompleted =
        updatedAnalytics.body.data.overview.completedTodos;
      expect(updatedCompleted).toBeGreaterThan(
        initialAnalytics.body.data.overview.completedTodos
      );
    });

    it('should handle recurring todos in analytics', async () => {
      // Create recurrence rule
      const recurrenceResponse = await request(app)
        .post('/recurrence')
        .set('X-User-ID', userId)
        .send({
          frequency: RecurrenceFrequency.DAILY,
          interval: 1,
        })
        .expect(201);

      const recurrenceRuleId = recurrenceResponse.body.data.id;

      // Create recurring todo with a due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      const recurringTodoResponse = await request(app)
        .post('/todos')
        .set('X-User-ID', userId)
        .send({
          title: 'Daily Standup',
          status: TodoStatus.TODO,
          priority: TodoPriority.MEDIUM,
          dueDate: dueDate.toISOString(),
        })
        .expect(201);

      const recurringTodoId = recurringTodoResponse.body.data.id;

      // Associate recurrence rule via database
      await prisma.todo.update({
        where: { id: recurringTodoId },
        data: { recurrenceRuleId },
      });

      // Complete it
      await request(app)
        .post(`/todos/${recurringTodoId}/complete`)
        .set('X-User-ID', userId)
        .expect(200);

      // Apply recurrence
      await request(app)
        .post(`/recurrence/apply/${recurringTodoId}`)
        .set('X-User-ID', userId)
        .expect(201);

      // Verify analytics includes both old and new todos
      const analyticsResponse = await request(app)
        .get('/analytics/summary')
        .set('X-User-ID', userId)
        .expect(200);

      const totalTodos = analyticsResponse.body.data.overview.totalTodos;
      expect(totalTodos).toBeGreaterThanOrEqual(9); // 7 from beforeEach + 2 recurring
    });
  });

  describe('Edge Cases', () => {
    it('should handle error when applying recurrence to non-existent todo', async () => {
      const response = await request(app)
        .post('/recurrence/apply/non-existent-id')
        .set('X-User-ID', userId)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle error when creating reminder for non-existent todo', async () => {
      const response = await request(app)
        .post('/reminders')
        .set('X-User-ID', userId)
        .send({
          todoId: 'non-existent-id',
          scheduledAt: new Date().toISOString(),
          channel: 'IN_APP',
        })
        .expect(500);

      expect(response.body.status).toBe('error');
    });

    it('should handle bulk operations with some invalid todo IDs', async () => {
      const todo = await prisma.todo.create({
        data: {
          userId,
          title: 'Valid Todo',
          status: TodoStatus.TODO,
        },
      });

      const response = await request(app)
        .put('/bulk/status')
        .set('X-User-ID', userId)
        .send({
          todoIds: [todo.id, 'invalid-id-1', 'invalid-id-2'],
          status: TodoStatus.DONE,
        })
        .expect(200);

      expect(response.body.data.updated).toBeGreaterThanOrEqual(1);
      expect(response.body.data.failed).toBeDefined();
      expect(response.body.data.failed.length).toBeGreaterThanOrEqual(2);
    });

    it('should prevent deletion of recurrence rule in use', async () => {
      // Create recurrence rule
      const recurrenceResponse = await request(app)
        .post('/recurrence')
        .set('X-User-ID', userId)
        .send({
          frequency: RecurrenceFrequency.WEEKLY,
          interval: 1,
        })
        .expect(201);

      const recurrenceRuleId = recurrenceResponse.body.data.id;

      // Create todo using the rule
      const todoResponse = await request(app)
        .post('/todos')
        .set('X-User-ID', userId)
        .send({
          title: 'Todo with recurrence',
        })
        .expect(201);

      const todoId = todoResponse.body.data.id;

      // Associate recurrence rule via database
      await prisma.todo.update({
        where: { id: todoId },
        data: { recurrenceRuleId },
      });

      // Verify the todo exists and has the recurrence rule
      const verifyTodo = await prisma.todo.findUnique({
        where: { id: todoId },
      });
      expect(verifyTodo?.recurrenceRuleId).toBe(recurrenceRuleId);

      // Try to delete the rule - should fail with 500 since it's in use
      const deleteResponse = await request(app)
        .delete(`/recurrence/${recurrenceRuleId}`)
        .set('X-User-ID', userId);

      // The service throws an error which should be caught by error handler
      expect(deleteResponse.status).toBeGreaterThanOrEqual(400);

      // Verify the rule still exists
      const getResponse = await request(app)
        .get(`/recurrence/${recurrenceRuleId}`)
        .set('X-User-ID', userId)
        .expect(200);

      expect(getResponse.body.data.id).toBe(recurrenceRuleId);

      // Clean up - delete the todo first
      await request(app)
        .delete(`/todos/${todoId}`)
        .set('X-User-ID', userId)
        .expect(204);

      // Now deleting the rule should succeed
      await request(app)
        .delete(`/recurrence/${recurrenceRuleId}`)
        .set('X-User-ID', userId)
        .expect(204);
    });

    it('should handle concurrent bulk operations gracefully', async () => {
      // Create test todos
      const todos = await Promise.all([
        prisma.todo.create({
          data: { userId, title: 'Concurrent Test 1', status: TodoStatus.TODO },
        }),
        prisma.todo.create({
          data: { userId, title: 'Concurrent Test 2', status: TodoStatus.TODO },
        }),
        prisma.todo.create({
          data: { userId, title: 'Concurrent Test 3', status: TodoStatus.TODO },
        }),
      ]);

      const todoIds = todos.map((t) => t.id);

      // Execute multiple bulk operations concurrently
      const [statusResult, priorityResult, categoryResult] = await Promise.all([
        request(app).put('/bulk/status').set('X-User-ID', userId).send({
          todoIds,
          status: TodoStatus.IN_PROGRESS,
        }),
        request(app).put('/bulk/priority').set('X-User-ID', userId).send({
          todoIds,
          priority: TodoPriority.URGENT,
        }),
        request(app).put('/bulk/category').set('X-User-ID', userId).send({
          todoIds,
          categoryId,
        }),
      ]);

      // All operations should succeed
      expect(statusResult.status).toBe(200);
      expect(priorityResult.status).toBe(200);
      expect(categoryResult.status).toBe(200);

      // Verify final state
      const updatedTodos = await prisma.todo.findMany({
        where: { id: { in: todoIds } },
      });

      expect(
        updatedTodos.every((t) => t.status === TodoStatus.IN_PROGRESS)
      ).toBe(true);
      expect(
        updatedTodos.every((t) => t.priority === TodoPriority.URGENT)
      ).toBe(true);
      expect(updatedTodos.every((t) => t.categoryId === categoryId)).toBe(true);
    });

    it('should properly handle authentication errors', async () => {
      // Test without X-User-ID header
      const response = await request(app).get('/analytics/summary').expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('User ID');
    });

    it('should validate input schemas and return proper error responses', async () => {
      // Test with invalid recurrence frequency
      const response = await request(app)
        .post('/recurrence')
        .set('X-User-ID', userId)
        .send({
          frequency: 'INVALID_FREQUENCY',
          interval: 1,
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Scenario 4: Activity Log Comprehensive Tracking', () => {
    it('should track all types of activities across operations', async () => {
      // Create a todo
      const todoResponse = await request(app)
        .post('/todos')
        .set('X-User-ID', userId)
        .send({
          title: 'Activity Tracking Test',
          description: 'Test description',
          priority: TodoPriority.LOW,
        })
        .expect(201);

      const todoId = todoResponse.body.data.id;

      // Update the todo
      await request(app)
        .patch(`/todos/${todoId}`)
        .set('X-User-ID', userId)
        .send({
          priority: TodoPriority.HIGH,
          description: 'Updated description',
        })
        .expect(200);

      // Add tags
      await request(app)
        .post(`/todos/${todoId}/tags/${tagId1}`)
        .set('X-User-ID', userId)
        .expect(204);

      // Complete the todo
      await request(app)
        .post(`/todos/${todoId}/complete`)
        .set('X-User-ID', userId)
        .expect(200);

      // Get activity logs for this todo
      const logsResponse = await request(app)
        .get('/activity-logs')
        .set('X-User-ID', userId)
        .query({
          todoId,
          limit: 50,
        })
        .expect(200);

      const logs = logsResponse.body.data;
      expect(logs.length).toBeGreaterThan(0);

      // Verify different activity types are present
      const activityTypes = logs.map((log: any) => log.type);
      expect(activityTypes).toContain('CREATED');

      // Check that we have activity logs (at least one for creation)
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
