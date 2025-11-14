export type TodoStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurrenceRule {
  id: string;
  frequency: RecurrenceFrequency;
  interval: number;
  byWeekday: string[] | null;
  byMonthDay: number[] | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReminderChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

export interface Reminder {
  id: string;
  todoId: string;
  userId: string;
  scheduledAt: string;
  channel: ReminderChannel;
  sent: boolean;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  todoId: string;
  userId: string;
  type:
    | 'CREATED'
    | 'UPDATED'
    | 'DELETED'
    | 'COMPLETED'
    | 'COMMENTED'
    | 'ASSIGNED'
    | 'TAGGED'
    | 'STATUS_CHANGED';
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface TodoSubtask {
  id: string;
  todoId: string;
  userId: string;
  title: string;
  completed: boolean;
  ordering: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  todoId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  ordering: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoTagPivot {
  id: string;
  todoId: string;
  tagId: string;
  tag: Tag;
}

export interface Todo {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  startDate: string | null;
  dueDate: string | null;
  reminderLeadTime: number | null;
  recurrenceRuleId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  tags?: TodoTagPivot[];
  subtasks?: TodoSubtask[];
  attachments?: Attachment[];
  reminders?: Reminder[];
  recurrenceRule?: RecurrenceRule | null;
  activityLogs?: ActivityLog[];
}

export interface TodoListItem extends Todo {
  reminders?: Reminder[];
  recurrenceRule?: RecurrenceRule | null;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  viewType: 'LIST' | 'BOARD' | 'CALENDAR' | 'TIMELINE';
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  completedTrend: Array<{ date: string; count: number }>;
  overdueCount: number;
  activeStreak: number;
  workloadByCategory: Array<{ category: string; value: number }>;
  workloadByPriority: Array<{ priority: TodoPriority; value: number }>;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  matchedFields: string[];
  dueDate: string | null;
  priority: TodoPriority;
}

export interface UserPreferences {
  defaultView: 'LIST' | 'BOARD' | 'CALENDAR' | 'TIMELINE';
  theme: 'light' | 'dark' | 'system';
  workHours: { start: string; end: string };
  defaultReminderLeadTime: number;
  savedFilters: SavedFilter[];
}

export interface ApiError {
  message: string;
  status: number;
  correlationId?: string;
}
