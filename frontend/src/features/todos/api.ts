import { apiClient } from '@/lib/api-client';
import {
  ActivityLog,
  AnalyticsSummary,
  Category,
  Reminder,
  RecurrenceRule,
  SavedFilter,
  SearchResult,
  Tag,
  Todo,
  TodoListItem,
  TodoPriority,
  TodoStatus,
  UserPreferences,
} from '@/types';

export interface TodoListQuery {
  page?: number;
  limit?: number;
  status?: TodoStatus;
  priority?: TodoPriority;
  categoryId?: string;
  tagId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface RecurrencePayload {
  frequency: RecurrenceRule['frequency'];
  interval: number;
  byWeekday?: string[];
  byMonthDay?: number[];
  endDate?: string | null;
}

export interface ReminderPayload {
  scheduledAt: string;
  channel: Reminder['channel'];
}

export interface TodoMutationPayload {
  title: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  categoryId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  reminderLeadTime?: number | null;
  tagIds?: string[];
  recurrence?: RecurrencePayload | null;
  reminders?: ReminderPayload[];
}

export interface BulkUpdatePayload {
  todoIds: string[];
  updates: Partial<
    Pick<
      Todo,
      | 'status'
      | 'priority'
      | 'categoryId'
      | 'dueDate'
      | 'startDate'
      | 'reminderLeadTime'
    >
  > & { tagIds?: string[] };
}

export interface ReorderPayload {
  sourceCategoryId: string | null;
  destinationCategoryId: string | null;
  orderedIds: string[];
}

export interface ActivityLogQuery {
  type?: ActivityLog['type'];
  from?: string;
  to?: string;
}

export interface SavedFilterPayload {
  name: string;
  viewType: SavedFilter['viewType'];
  filters: Record<string, unknown>;
}

export interface PreferencesPayload extends Partial<UserPreferences> {}

export const fetchTodos = async (
  query: TodoListQuery = {}
): Promise<PaginatedResponse<TodoListItem[]>> => {
  const response = await apiClient.get<PaginatedResponse<TodoListItem[]>>(
    '/todos',
    {
      params: {
        ...query,
        ...(query.dueDateFrom && { dueDateFrom: query.dueDateFrom }),
        ...(query.dueDateTo && { dueDateTo: query.dueDateTo }),
      },
    }
  );

  return response.data;
};

export const fetchTodo = async (todoId: string): Promise<Todo> => {
  const response = await apiClient.get<{ data: Todo }>(`/todos/${todoId}`);
  return response.data.data;
};

export const createTodo = async (
  payload: TodoMutationPayload
): Promise<Todo> => {
  const { recurrence, reminders, ...basePayload } = payload;
  const response = await apiClient.post<{ data: Todo }>(
    '/todos',
    {
      ...basePayload,
      ...(recurrence ? { recurrence } : {}),
      ...(reminders && reminders.length > 0
        ? { reminders }
        : {}),
    }
  );

  return response.data.data;
};

export const updateTodo = async (
  todoId: string,
  payload: Partial<TodoMutationPayload>
): Promise<Todo> => {
  const { recurrence, reminders, ...basePayload } = payload;
  const response = await apiClient.patch<{ data: Todo }>(
    `/todos/${todoId}`,
    {
      ...basePayload,
      ...(recurrence ? { recurrence } : {}),
      ...(recurrence === null ? { recurrence: null } : {}),
      ...(reminders ? { reminders } : {}),
    }
  );

  return response.data.data;
};

export const completeTodo = async (todoId: string): Promise<Todo> => {
  const response = await apiClient.post<{ data: Todo }>(
    `/todos/${todoId}/complete`
  );
  return response.data.data;
};

export const markTodoIncomplete = async (todoId: string): Promise<Todo> => {
  const response = await apiClient.post<{ data: Todo }>(
    `/todos/${todoId}/incomplete`
  );
  return response.data.data;
};

export const updateRecurrence = async (
  todoId: string,
  payload: RecurrencePayload
): Promise<RecurrenceRule> => {
  const response = await apiClient.put<{ data: RecurrenceRule }>(
    `/todos/${todoId}/recurrence`,
    payload
  );
  return response.data.data;
};

export const cancelRecurrence = async (todoId: string): Promise<void> => {
  await apiClient.delete(`/todos/${todoId}/recurrence`);
};

export const completeRecurrenceSeries = async (
  todoId: string
): Promise<void> => {
  await apiClient.post(`/todos/${todoId}/recurrence/complete-series`);
};

export const createReminder = async (
  payload: ReminderPayload & { todoId: string }
): Promise<Reminder> => {
  const response = await apiClient.post<{ data: Reminder }>(
    '/reminders',
    payload
  );
  return response.data.data;
};

export const updateReminderRequest = async (
  reminderId: string,
  payload: Partial<ReminderPayload>
): Promise<Reminder> => {
  const response = await apiClient.patch<{ data: Reminder }>(
    `/reminders/${reminderId}`,
    payload
  );
  return response.data.data;
};

export const deleteReminder = async (
  reminderId: string
): Promise<void> => {
  await apiClient.delete(`/reminders/${reminderId}`);
};

export const fetchActivityLog = async (
  query: ActivityLogQuery = {}
): Promise<PaginatedResponse<ActivityLog[]>> => {
  const response = await apiClient.get<PaginatedResponse<ActivityLog[]>>(
    '/activity-logs',
    {
      params: query,
    }
  );
  return response.data;
};

export const fetchSavedFilters = async (): Promise<SavedFilter[]> => {
  const response = await apiClient.get<{ data: SavedFilter[] }>(
    '/saved-filters'
  );
  return response.data.data;
};

export const saveFilter = async (
  payload: SavedFilterPayload
): Promise<SavedFilter> => {
  const response = await apiClient.post<{ data: SavedFilter }>(
    '/saved-filters',
    payload
  );
  return response.data.data;
};

export const deleteFilter = async (filterId: string): Promise<void> => {
  await apiClient.delete(`/saved-filters/${filterId}`);
};

export const fetchUserPreferences = async (): Promise<UserPreferences> => {
  const response = await apiClient.get<{ data: UserPreferences }>(
    '/user-preferences'
  );
  return response.data.data;
};

export const updateUserPreferences = async (
  payload: PreferencesPayload
): Promise<UserPreferences> => {
  const response = await apiClient.patch<{ data: UserPreferences }>(
    '/user-preferences',
    payload
  );
  return response.data.data;
};

export const fetchAnalyticsSummary = async (
  query: TodoListQuery = {}
): Promise<AnalyticsSummary> => {
  const response = await apiClient.get<{ data: AnalyticsSummary }>(
    '/analytics/summary',
    {
      params: query,
    }
  );
  return response.data.data;
};

export const searchTodos = async (
  term: string,
  filters?: any
): Promise<PaginatedResponse<SearchResult[]>> => {
  const response = await apiClient.get<PaginatedResponse<SearchResult[]>>(
    '/search/todos',
    {
      params: { 
        q: term,
        ...(filters && { filters })
      },
    }
  );
  return response.data;
};

export const bulkUpdateTodos = async (
  payload: BulkUpdatePayload
): Promise<void> => {
  await apiClient.post('/todos/bulk-update', payload);
};

export const reorderTodos = async (
  payload: ReorderPayload
): Promise<void> => {
  await apiClient.post('/todos/reorder', payload);
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<{ data: Category[] }>('/categories');
  return response.data.data;
};

export const fetchTags = async (): Promise<Tag[]> => {
  const response = await apiClient.get<{ data: Tag[] }>('/tags');
  return response.data.data;
};

export const getRemindersByTodo = async (todoId: string): Promise<Reminder[]> => {
  const response = await apiClient.get<{ data: Reminder[] }>(
    `/reminders/todo/${todoId}`
  );
  return response.data.data;
};

export const getUpcomingReminders = async (hours?: number): Promise<Reminder[]> => {
  const response = await apiClient.get<{ data: Reminder[] }>(
    '/reminders/upcoming',
    {
      params: hours ? { hours } : {},
    }
  );
  return response.data.data;
};

export const getReminder = async (reminderId: string): Promise<Reminder> => {
  const response = await apiClient.get<{ data: Reminder }>(
    `/reminders/${reminderId}`
  );
  return response.data.data;
};
