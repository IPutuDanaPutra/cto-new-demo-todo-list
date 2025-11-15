import { SavedFilter, SearchResult, TodoListItem } from '@/types';
import { ActivityLogResponse } from '@/features/todos/api';

export interface TestScenario {
  now: string;
  todos: {
    data: TodoListItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  analytics: {
    overview: {
      totalTodos: number;
      completedTodos: number;
      overdueTodos: number;
      completionRate: number;
      todosThisWeek: number;
      todosThisMonth: number;
    };
    distribution: {
      byPriority: Array<{ priority: TodoListItem['priority']; count: number }>;
      byStatus: Array<{ status: TodoListItem['status']; count: number }>;
    };
    trends: {
      completion: Array<{ date: string; completed: number }>;
    };
    overdueCount: number;
    activeStreak: number;
    workloadByPriority: Array<{ priority: TodoListItem['priority']; value: number }>;
    workloadByCategory: Array<{ category: string; value: number }>;
  };
  preferences: {
    data: {
      email: string;
      displayName: string;
      timezone: string;
      preferences: {
        theme: 'light' | 'dark' | 'system';
        defaultView: 'LIST' | 'BOARD' | 'CALENDAR' | 'TIMELINE';
        timezone: string;
        weekStartsOn: string;
        workHoursStart: string;
        workHoursEnd: string;
        defaultReminderLeadTime: number;
      };
      savedFilters: SavedFilter[];
    };
  };
  search: {
    data: SearchResult[];
    meta: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  activity: ActivityLogResponse;
  bulkUpdateResult: {
    updated: number;
    failed: string[];
  };
  errors: {
    preferencesUpdate?: number;
    bulkUpdate?: number;
  };
}

const operationsCategory = {
  id: 'category-ops',
  name: 'Operations',
  color: '#2563eb',
  userId: 'user-1',
  ordering: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const dailyRecurrence = {
  id: 'recurrence-daily',
  frequency: 'DAILY' as const,
  interval: 1,
  byWeekday: ['MO', 'TU', 'WE', 'TH', 'FR'],
  byMonthDay: null,
  endDate: null,
  createdAt: '2024-04-01T00:00:00.000Z',
  updatedAt: '2024-04-01T00:00:00.000Z',
};

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

export const createDefaultScenario = (): TestScenario => {
  const todos: TodoListItem[] = [
    {
      id: 'todo-1',
      userId: 'user-1',
      categoryId: operationsCategory.id,
      title: 'Daily Standup',
      description: 'Recurring sync with the delivery team',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      startDate: '2024-04-10T08:45:00.000Z',
      dueDate: '2024-04-10T09:00:00.000Z',
      reminderLeadTime: 15,
      recurrenceRuleId: dailyRecurrence.id,
      completedAt: null,
      createdAt: '2024-04-01T08:00:00.000Z',
      updatedAt: '2024-04-10T08:45:00.000Z',
      category: { ...operationsCategory },
      tags: [],
      subtasks: [],
      attachments: [],
      reminders: [
        {
          id: 'reminder-1',
          todoId: 'todo-1',
          userId: 'user-1',
          scheduledAt: '2024-04-10T08:50:00.000Z',
          channel: 'IN_APP',
          sent: false,
          sentAt: null,
          createdAt: '2024-04-09T12:00:00.000Z',
          updatedAt: '2024-04-09T12:00:00.000Z',
        },
      ],
      recurrenceRule: { ...dailyRecurrence },
      activityLogs: [],
    },
    {
      id: 'todo-2',
      userId: 'user-1',
      categoryId: operationsCategory.id,
      title: 'Daily Standup (Next)',
      description: 'Next occurrence generated from recurrence',
      status: 'TODO',
      priority: 'MEDIUM',
      startDate: '2024-04-11T08:45:00.000Z',
      dueDate: '2024-04-11T09:00:00.000Z',
      reminderLeadTime: 15,
      recurrenceRuleId: dailyRecurrence.id,
      completedAt: null,
      createdAt: '2024-04-01T08:05:00.000Z',
      updatedAt: '2024-04-10T08:45:00.000Z',
      category: { ...operationsCategory },
      tags: [],
      subtasks: [],
      attachments: [],
      reminders: [],
      recurrenceRule: { ...dailyRecurrence },
      activityLogs: [],
    },
    {
      id: 'todo-3',
      userId: 'user-1',
      categoryId: null,
      title: 'Monthly Analytics Report',
      description: 'Compile analytics for leadership',
      status: 'TODO',
      priority: 'HIGH',
      startDate: '2024-04-01T13:00:00.000Z',
      dueDate: '2024-04-05T23:00:00.000Z',
      reminderLeadTime: 60,
      recurrenceRuleId: null,
      completedAt: null,
      createdAt: '2024-03-15T09:00:00.000Z',
      updatedAt: '2024-04-05T21:00:00.000Z',
      category: null,
      tags: [],
      subtasks: [],
      attachments: [],
      reminders: [
        {
          id: 'reminder-2',
          todoId: 'todo-3',
          userId: 'user-1',
          scheduledAt: '2024-04-05T21:00:00.000Z',
          channel: 'EMAIL',
          sent: true,
          sentAt: '2024-04-05T21:05:00.000Z',
          createdAt: '2024-03-20T12:00:00.000Z',
          updatedAt: '2024-04-05T21:05:00.000Z',
        },
      ],
      recurrenceRule: null,
      activityLogs: [],
    },
    {
      id: 'todo-4',
      userId: 'user-1',
      categoryId: null,
      title: 'Analytics Catch-up',
      description: 'Resolve backlog from last recurrence cycle',
      status: 'DONE',
      priority: 'MEDIUM',
      startDate: '2024-04-07T14:00:00.000Z',
      dueDate: '2024-04-08T16:00:00.000Z',
      reminderLeadTime: null,
      recurrenceRuleId: null,
      completedAt: '2024-04-08T15:30:00.000Z',
      createdAt: '2024-04-02T12:00:00.000Z',
      updatedAt: '2024-04-08T15:30:00.000Z',
      category: null,
      tags: [],
      subtasks: [],
      attachments: [],
      reminders: [],
      recurrenceRule: null,
      activityLogs: [],
    },
  ];

  const savedFilters: SavedFilter[] = [
    {
      id: 'filter-in-progress',
      name: 'In Progress',
      filters: { status: 'IN_PROGRESS' },
      viewType: 'LIST',
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-03-01T00:00:00.000Z',
    },
  ];

  const activity: ActivityLogResponse = {
    data: [
      {
        id: 'activity-1',
        todoId: 'todo-1',
        userId: 'user-1',
        type: 'STATUS_CHANGED',
        changes: {
          before: { status: 'TODO' },
          after: { status: 'IN_PROGRESS' },
        },
        createdAt: '2024-04-09T12:00:00.000Z',
        todo: {
          id: 'todo-1',
          title: 'Daily Standup',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        },
      },
      {
        id: 'activity-2',
        todoId: 'todo-4',
        userId: 'user-1',
        type: 'COMPLETED',
        changes: null,
        createdAt: '2024-04-08T16:00:00.000Z',
        todo: {
          id: 'todo-4',
          title: 'Analytics Catch-up',
          status: 'DONE',
          priority: 'MEDIUM',
        },
      },
    ],
    meta: {
      total: 2,
      page: 1,
      limit: 25,
      pages: 1,
    },
  };

  const searchData = todos.map(toSearchResult);

  return {
    now: '2024-04-10T12:00:00.000Z',
    todos: {
      data: todos,
      meta: {
        total: todos.length,
        page: 1,
        limit: 100,
        pages: 1,
      },
    },
    analytics: {
      overview: {
        totalTodos: todos.length,
        completedTodos: todos.filter((todo) => todo.status === 'DONE').length,
        overdueTodos: todos.filter((todo) => {
          if (!todo.dueDate) {
            return false;
          }
          return todo.dueDate < '2024-04-10T12:00:00.000Z' && todo.status !== 'DONE';
        }).length,
        completionRate: Math.round(
          (todos.filter((todo) => todo.status === 'DONE').length / todos.length) *
            1000
        ) / 10,
        todosThisWeek: 6,
        todosThisMonth: 22,
      },
      distribution: {
        byPriority: [],
        byStatus: [],
      },
      trends: {
        completion: [
          { date: '2024-04-06', completed: 2 },
          { date: '2024-04-07', completed: 1 },
          { date: '2024-04-08', completed: 3 },
          { date: '2024-04-09', completed: 2 },
          { date: '2024-04-10', completed: 1 },
        ],
      },
      overdueCount: todos.filter((todo) => {
        if (!todo.dueDate) {
          return false;
        }
        return todo.dueDate < '2024-04-10T12:00:00.000Z' && todo.status !== 'DONE';
      }).length,
      activeStreak: 4,
      workloadByPriority: [
        { priority: 'URGENT', value: 0 },
        { priority: 'HIGH', value: 2 },
        { priority: 'MEDIUM', value: 1 },
        { priority: 'LOW', value: 1 },
      ],
      workloadByCategory: [
        { category: 'Operations', value: 2 },
        { category: 'Uncategorized', value: 2 },
      ],
    },
    preferences: {
      data: {
        email: 'ops.lead@example.com',
        displayName: 'Operations Lead',
        timezone: 'America/New_York',
        preferences: {
          theme: 'light',
          defaultView: 'CALENDAR',
          timezone: 'America/New_York',
          weekStartsOn: '1',
          workHoursStart: '09:00',
          workHoursEnd: '17:00',
          defaultReminderLeadTime: 15,
        },
        savedFilters,
      },
    },
    search: {
      data: searchData,
      meta: {
        total: searchData.length,
        page: 1,
        limit: 20,
        pages: 1,
      },
    },
    activity,
    bulkUpdateResult: {
      updated: 0,
      failed: [],
    },
    errors: {},
  };
};

let scenarioState = createDefaultScenario();

export const getScenarioState = () => scenarioState;

export const setScenarioState = (next: TestScenario) => {
  scenarioState = next;
  return scenarioState;
};

export const resetScenarioState = () => {
  scenarioState = createDefaultScenario();
  return scenarioState;
};

export const updateScenarioState = (
  updater: (state: TestScenario) => void
) => {
  updater(scenarioState);
  return scenarioState;
};
