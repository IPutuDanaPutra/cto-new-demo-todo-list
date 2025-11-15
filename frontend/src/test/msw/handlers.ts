import { rest } from 'msw';
import { differenceInHours, addDays, parseISO } from 'date-fns';
import { Reminder, SearchResult, TodoListItem } from '@/types';
import { BulkUpdatePayload } from '@/features/todos/api';
import {
  TestScenario,
  getScenarioState,
  updateScenarioState,
} from './scenario';

const API_PREFIX = '/api';

const toSearchResult = (todo: TodoListItem): SearchResult => ({
  id: todo.id,
  title: todo.title,
  description: todo.description,
  matchedFields: ['title', 'description'],
  dueDate: todo.dueDate,
  priority: todo.priority,
  status: todo.status,
  category: todo.category
    ? {
        id: todo.category.id,
        name: todo.category.name,
        color: todo.category.color,
      }
    : null,
});

const getAllReminders = (state: TestScenario): Reminder[] =>
  state.todos.data.flatMap((todo) => todo.reminders ?? []);

const computeAnalytics = (state: TestScenario) => {
  const todos = state.todos.data;
  const totalTodos = todos.length;
  const completedTodos = todos.filter((todo) => todo.status === 'DONE').length;
  const overdueTodos = todos.filter((todo) => {
    if (!todo.dueDate) {
      return false;
    }
    return todo.dueDate < state.now && todo.status !== 'DONE';
  }).length;
  const completionRate =
    totalTodos === 0
      ? 0
      : Math.round((completedTodos / totalTodos) * 1000) / 10;

  const priorities: TodoListItem['priority'][] = [
    'URGENT',
    'HIGH',
    'MEDIUM',
    'LOW',
  ];
  const statuses: TodoListItem['status'][] = [
    'TODO',
    'IN_PROGRESS',
    'DONE',
    'CANCELLED',
  ];

  const byPriority = priorities.map((priority) => ({
    priority,
    count: todos.filter((todo) => todo.priority === priority).length,
  }));

  const byStatus = statuses.map((status) => ({
    status,
    count: todos.filter((todo) => todo.status === status).length,
  }));

  const workloadByPriority = priorities.map((priority) => ({
    priority,
    value: todos.filter((todo) => todo.priority === priority).length,
  }));

  const baseCategories = state.analytics.workloadByCategory.length
    ? state.analytics.workloadByCategory
    : [
        { category: 'Operations', value: 0 },
        { category: 'Uncategorized', value: 0 },
      ];

  const workloadByCategory = baseCategories.map((item) => ({
    category: item.category,
    value:
      item.category === 'Uncategorized'
        ? todos.filter((todo) => !todo.category).length
        : todos.filter((todo) => todo.category?.name === item.category).length,
  }));

  return {
    overview: {
      ...state.analytics.overview,
      totalTodos,
      completedTodos,
      overdueTodos,
      completionRate,
    },
    distribution: {
      byPriority,
      byStatus,
    },
    trends: state.analytics.trends,
    overdueCount: overdueTodos,
    activeStreak: state.analytics.activeStreak,
    workloadByPriority,
    workloadByCategory,
  };
};

const recalculateScenario = (state: TestScenario) => {
  state.todos.meta.total = state.todos.data.length;
  state.todos.meta.pages = Math.max(
    1,
    Math.ceil(state.todos.meta.total / state.todos.meta.limit)
  );

  state.search.data = state.todos.data.map(toSearchResult);
  state.search.meta.total = state.search.data.length;
  state.search.meta.pages = Math.max(
    1,
    Math.ceil(state.search.meta.total / state.search.meta.limit)
  );

  const analytics = computeAnalytics(state);
  state.analytics.overview = analytics.overview;
  state.analytics.distribution = analytics.distribution;
  state.analytics.trends = analytics.trends;
  state.analytics.overdueCount = analytics.overdueCount;
  state.analytics.activeStreak = analytics.activeStreak;
  state.analytics.workloadByPriority = analytics.workloadByPriority;
  state.analytics.workloadByCategory = analytics.workloadByCategory;
};

const findTodo = (state: TestScenario, todoId: string) =>
  state.todos.data.find((todo) => todo.id === todoId);

const addActivityLogEntry = (
  state: TestScenario,
  entry: (typeof state.activity.data)[number]
) => {
  state.activity.data = [entry, ...state.activity.data];
  state.activity.meta.total = state.activity.data.length;
  state.activity.meta.pages = Math.max(
    1,
    Math.ceil(state.activity.meta.total / state.activity.meta.limit)
  );
};

const createHandlersForScenario = () => {
  return [
    rest.get(`${API_PREFIX}/todos`, (req, res, ctx) => {
      const state = getScenarioState();
      return res(ctx.status(200), ctx.json(state.todos));
    }),

    rest.get(`${API_PREFIX}/analytics/summary`, (req, res, ctx) => {
      const state = getScenarioState();
      recalculateScenario(state);
      return res(ctx.status(200), ctx.json({ data: state.analytics }));
    }),

    rest.get(`${API_PREFIX}/user-preferences`, (req, res, ctx) => {
      const state = getScenarioState();
      return res(ctx.status(200), ctx.json(state.preferences));
    }),

    rest.patch(`${API_PREFIX}/user-preferences`, async (req, res, ctx) => {
      const state = getScenarioState();
      if (state.errors.preferencesUpdate) {
        return res(
          ctx.status(state.errors.preferencesUpdate),
          ctx.json({ message: 'Failed to update preferences' })
        );
      }

      const payload = (await req.json()) as Record<string, unknown>;

      updateScenarioState((current) => {
        const prefs = current.preferences.data.preferences;
        const allowedPreferenceKeys = new Set([
          'theme',
          'defaultView',
          'timezone',
          'weekStartsOn',
          'workHoursStart',
          'workHoursEnd',
          'defaultReminderLeadTime',
        ]);

        Object.entries(payload).forEach(([key, value]) => {
          if (allowedPreferenceKeys.has(key)) {
            (prefs as Record<string, unknown>)[key] = value;
          } else if (key === 'displayName' || key === 'email') {
            (current.preferences.data as Record<string, unknown>)[key] = value;
          }
        });
      });

      return res(
        ctx.status(200),
        ctx.json({ data: getScenarioState().preferences.data })
      );
    }),

    rest.get(`${API_PREFIX}/search/todos`, (req, res, ctx) => {
      const term = (req.url.searchParams.get('q') || '').toLowerCase();
      const state = getScenarioState();

      const filtered = term
        ? state.search.data.filter((result) =>
            result.title.toLowerCase().includes(term) ||
            (result.description || '').toLowerCase().includes(term)
          )
        : state.search.data;

      return res(
        ctx.status(200),
        ctx.json({
          data: filtered,
          meta: {
            total: filtered.length,
            page: 1,
            limit: state.search.meta.limit,
            pages: 1,
          },
        })
      );
    }),

    rest.put(`${API_PREFIX}/bulk/update`, async (req, res, ctx) => {
      const state = getScenarioState();
      if (state.errors.bulkUpdate) {
        return res(
          ctx.status(state.errors.bulkUpdate),
          ctx.json({ message: 'Bulk update failed' })
        );
      }

      const payload = (await req.json()) as BulkUpdatePayload;

      updateScenarioState((current) => {
        current.todos.data = current.todos.data.map((todo) => {
          if (!payload.todoIds.includes(todo.id)) {
            return todo;
          }

          const next = { ...todo };

          if (payload.updates.status) {
            next.status = payload.updates.status;
            next.completedAt =
              payload.updates.status === 'DONE' ? current.now : null;
          }

          if (payload.updates.dueDate) {
            next.dueDate = payload.updates.dueDate;
          }

          if (payload.updates.priority) {
            next.priority = payload.updates.priority;
          }

          if (payload.updates.categoryId !== undefined) {
            if (payload.updates.categoryId === null) {
              next.categoryId = null;
              next.category = null;
            }
          }

          return next;
        });

        addActivityLogEntry(current, {
          id: `activity-bulk-${Date.now()}`,
          todoId: payload.todoIds[0],
          userId: 'user-1',
          type: 'STATUS_CHANGED',
          changes: {
            before: { status: 'TODO' },
            after: { status: payload.updates.status ?? 'TODO' },
          },
          createdAt: current.now,
          todo: {
            id: payload.todoIds[0],
            title:
              findTodo(current, payload.todoIds[0])?.title ?? 'Bulk updated todo',
            status:
              findTodo(current, payload.todoIds[0])?.status ?? 'IN_PROGRESS',
            priority:
              findTodo(current, payload.todoIds[0])?.priority ?? 'MEDIUM',
          },
        });

        current.bulkUpdateResult = {
          updated: payload.todoIds.length,
          failed: [],
        };

        recalculateScenario(current);
      });

      return res(
        ctx.status(200),
        ctx.json({
          data: getScenarioState().bulkUpdateResult,
          meta: {},
        })
      );
    }),

    rest.get(`${API_PREFIX}/activity-logs`, (req, res, ctx) => {
      const state = getScenarioState();
      const todoId = req.url.searchParams.get('todoId');
      const type = req.url.searchParams.get('type');
      const dateFrom = req.url.searchParams.get('dateFrom');
      const dateTo = req.url.searchParams.get('dateTo');

      const filtered = state.activity.data.filter((entry) => {
        if (todoId && entry.todoId !== todoId) {
          return false;
        }
        if (type && entry.type !== type) {
          return false;
        }
        if (dateFrom && entry.createdAt < dateFrom) {
          return false;
        }
        if (dateTo && entry.createdAt > dateTo) {
          return false;
        }
        return true;
      });

      return res(
        ctx.status(200),
        ctx.json({
          data: filtered,
          meta: {
            total: filtered.length,
            page: 1,
            limit: state.activity.meta.limit,
            pages: 1,
          },
        })
      );
    }),

    rest.post(`${API_PREFIX}/todos/:id/complete`, (req, res, ctx) => {
      const { id } = req.params as { id: string };

      updateScenarioState((current) => {
        const todo = findTodo(current, id);
        if (!todo) {
          return;
        }

        todo.status = 'DONE';
        todo.completedAt = current.now;

        addActivityLogEntry(current, {
          id: `activity-complete-${Date.now()}`,
          todoId: todo.id,
          userId: 'user-1',
          type: 'COMPLETED',
          changes: null,
          createdAt: current.now,
          todo: {
            id: todo.id,
            title: todo.title,
            status: todo.status,
            priority: todo.priority,
          },
        });

        recalculateScenario(current);
      });

      const todo = findTodo(getScenarioState(), id);
      return res(ctx.status(200), ctx.json({ data: todo }));
    }),

    rest.post(`${API_PREFIX}/todos/:id/incomplete`, (req, res, ctx) => {
      const { id } = req.params as { id: string };

      updateScenarioState((current) => {
        const todo = findTodo(current, id);
        if (!todo) {
          return;
        }

        todo.status = 'IN_PROGRESS';
        todo.completedAt = null;

        addActivityLogEntry(current, {
          id: `activity-reopen-${Date.now()}`,
          todoId: todo.id,
          userId: 'user-1',
          type: 'STATUS_CHANGED',
          changes: {
            before: { status: 'DONE' },
            after: { status: 'IN_PROGRESS' },
          },
          createdAt: current.now,
          todo: {
            id: todo.id,
            title: todo.title,
            status: todo.status,
            priority: todo.priority,
          },
        });

        recalculateScenario(current);
      });

      const todo = findTodo(getScenarioState(), id);
      return res(ctx.status(200), ctx.json({ data: todo }));
    }),

    rest.post(`${API_PREFIX}/recurrence/apply/:todoId`, (req, res, ctx) => {
      const { todoId } = req.params as { todoId: string };

      updateScenarioState((current) => {
        const source = findTodo(current, todoId);
        if (!source || !source.dueDate) {
          return;
        }

        const nextDueDate = addDays(parseISO(source.dueDate), 1).toISOString();

        const nextTodo: TodoListItem = {
          ...source,
          id: `todo-${Date.now()}`,
          status: 'TODO',
          completedAt: null,
          dueDate: nextDueDate,
          startDate: source.startDate
            ? addDays(parseISO(source.startDate), 1).toISOString()
            : null,
          reminders: (source.reminders ?? []).map((reminder) => ({
            ...reminder,
            id: `${reminder.id}-${Date.now()}`,
            scheduledAt: addDays(parseISO(reminder.scheduledAt), 1).toISOString(),
            sent: false,
            sentAt: null,
          })),
          activityLogs: [],
        };

        current.todos.data = [...current.todos.data, nextTodo];
        recalculateScenario(current);
      });

      return res(ctx.status(201), ctx.json({ success: true }));
    }),

    rest.post(`${API_PREFIX}/reminders`, async (req, res, ctx) => {
      const payload = (await req.json()) as {
        todoId: string;
        scheduledAt: string;
        channel: Reminder['channel'];
      };

      updateScenarioState((current) => {
        const todo = findTodo(current, payload.todoId);
        if (!todo) {
          return;
        }

        const reminder: Reminder = {
          id: `reminder-${Date.now()}`,
          todoId: payload.todoId,
          userId: todo.userId,
          scheduledAt: payload.scheduledAt,
          channel: payload.channel,
          sent: false,
          sentAt: null,
          createdAt: current.now,
          updatedAt: current.now,
        };

        todo.reminders = [...(todo.reminders ?? []), reminder];
      });

      const todo = findTodo(getScenarioState(), payload.todoId);
      const reminder = todo?.reminders?.[todo.reminders.length - 1];

      return res(ctx.status(200), ctx.json({ data: reminder }));
    }),

    rest.patch(`${API_PREFIX}/reminders/:id`, async (req, res, ctx) => {
      const { id } = req.params as { id: string };
      const updates = (await req.json()) as Partial<Reminder>;

      let updated: Reminder | undefined;

      updateScenarioState((current) => {
        for (const todo of current.todos.data) {
          const idx = (todo.reminders ?? []).findIndex(
            (reminder) => reminder.id === id
          );
          if (idx !== -1 && todo.reminders) {
            const existing = todo.reminders[idx];
            todo.reminders[idx] = {
              ...existing,
              ...updates,
              updatedAt: current.now,
            };
            updated = todo.reminders[idx];
            break;
          }
        }
      });

      return res(ctx.status(200), ctx.json({ data: updated }));
    }),

    rest.delete(`${API_PREFIX}/reminders/:id`, (req, res, ctx) => {
      const { id } = req.params as { id: string };

      updateScenarioState((current) => {
        for (const todo of current.todos.data) {
          if (todo.reminders) {
            todo.reminders = todo.reminders.filter(
              (reminder) => reminder.id !== id
            );
          }
        }
      });

      return res(ctx.status(200), ctx.json({ success: true }));
    }),

    rest.get(`${API_PREFIX}/reminders/upcoming`, (req, res, ctx) => {
      const hoursParam = req.url.searchParams.get('hours');
      const limitHours = hoursParam ? Number(hoursParam) : null;
      const state = getScenarioState();
      const now = parseISO(state.now);

      const reminders = getAllReminders(state).filter((reminder) => {
        const scheduledAt = parseISO(reminder.scheduledAt);
        if (scheduledAt < now) {
          return !reminder.sent;
        }
        if (limitHours === null) {
          return true;
        }
        return differenceInHours(scheduledAt, now) <= limitHours;
      });

      return res(ctx.status(200), ctx.json({ data: reminders }));
    }),
  ];
};

export const handlers = createHandlersForScenario();
