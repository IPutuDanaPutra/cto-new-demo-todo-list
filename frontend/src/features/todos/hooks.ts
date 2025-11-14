import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  bulkUpdateTodos,
  cancelRecurrence,
  completeTodo,
  completeRecurrenceSeries,
  createReminder,
  createTodo,
  deleteFilter,
  deleteReminder,
  fetchActivityLog,
  fetchAnalyticsSummary,
  fetchCategories,
  fetchSavedFilters,
  fetchTags,
  fetchTodo,
  fetchTodos,
  fetchUserPreferences,
  markTodoIncomplete,
  reorderTodos,
  saveFilter,
  searchTodos,
  updateReminderRequest,
  updateTodo,
  updateUserPreferences,
  updateRecurrence,
} from './api';
import {
  ActivityLog,
  AnalyticsSummary,
  Category,
  Reminder,
  SavedFilter,
  SearchResult,
  Tag,
  Todo,
  TodoListItem,
  UserPreferences,
} from '@/types';
import {
  ActivityLogQuery,
  BulkUpdatePayload,
  PreferencesPayload,
  RecurrencePayload,
  ReminderPayload,
  ReorderPayload,
  TodoListQuery,
  TodoMutationPayload,
} from './api';

type PaginatedTodoResponse = {
  data: TodoListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (query: TodoListQuery) => [...todoKeys.lists(), query] as const,
  detail: (todoId: string) => [...todoKeys.all, 'detail', todoId] as const,
  activity: (todoId: string, query: ActivityLogQuery) =>
    [...todoKeys.detail(todoId), 'activity', query] as const,
  savedFilters: () => [...todoKeys.all, 'savedFilters'] as const,
  preferences: () => ['preferences', 'me'] as const,
  analytics: (query: TodoListQuery) => ['analytics', query] as const,
  search: (term: string) => ['search', term] as const,
};

export const taxonomyKeys = {
  categories: () => ['taxonomies', 'categories'] as const,
  tags: () => ['taxonomies', 'tags'] as const,
};

export const useTodoList = (query: TodoListQuery) => {
  return useQuery<PaginatedTodoResponse, Error, PaginatedTodoResponse>(
    todoKeys.list(query),
    () => fetchTodos(query),
    {
      keepPreviousData: true,
    }
  );
};

export const useTodoDetail = (todoId: string | null) => {
  return useQuery<Todo, Error, Todo>(
    todoId ? todoKeys.detail(todoId) : ['todos', 'detail', 'empty'],
    () => fetchTodo(todoId || ''),
    {
      enabled: Boolean(todoId),
    }
  );
};

export const useActivityLog = (todoId: string | null, query: ActivityLogQuery) => {
  return useQuery<ActivityLog[], Error, ActivityLog[]>(
    todoId ? todoKeys.activity(todoId, query) : ['todos', 'activity', 'empty'],
    () => fetchActivityLog(todoId || '', query),
    {
      enabled: Boolean(todoId),
    }
  );
};

export const useSavedFilters = () => {
  return useQuery<SavedFilter[], Error, SavedFilter[]>(
    todoKeys.savedFilters(),
    fetchSavedFilters
  );
};

export const useUserPreferences = () => {
  return useQuery<UserPreferences, Error, UserPreferences>(
    todoKeys.preferences(),
    fetchUserPreferences
  );
};

export const useAnalyticsSummary = (query: TodoListQuery) => {
  return useQuery<AnalyticsSummary, Error, AnalyticsSummary>(
    todoKeys.analytics(query),
    () => fetchAnalyticsSummary(query),
    {
      keepPreviousData: true,
    }
  );
};

export const useSearchTodos = (term: string, enabled: boolean) => {
  return useQuery<SearchResult[], Error, SearchResult[]>(
    todoKeys.search(term),
    () => searchTodos(term),
    {
      enabled,
    }
  );
};

export const useCategories = () => {
  return useQuery<Category[], Error, Category[]>(
    taxonomyKeys.categories(),
    fetchCategories
  );
};

export const useTags = () => {
  return useQuery<Tag[], Error, Tag[]>(taxonomyKeys.tags(), fetchTags);
};

export const useTodoMutations = () => {
  const queryClient = useQueryClient();

  const invalidateLists = () => {
    void queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    void queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const create = useMutation(createTodo, {
    onSuccess: (data) => {
      invalidateLists();
      toast.success('Todo created');
      void queryClient.invalidateQueries({
        queryKey: todoKeys.detail(data.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const update = useMutation(
    ({ todoId, payload }: { todoId: string; payload: Partial<TodoMutationPayload> }) =>
      updateTodo(todoId, payload),
    {
      onSuccess: (data) => {
        invalidateLists();
        toast.success('Todo updated');
        void queryClient.invalidateQueries({
          queryKey: todoKeys.detail(data.id),
        });
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }
  );

  const toggleComplete = useMutation(
    ({ todoId, completed }: { todoId: string; completed: boolean }) =>
      completed ? markTodoIncomplete(todoId) : completeTodo(todoId),
    {
      onSuccess: (data) => {
        invalidateLists();
        toast.success(
          data.status === 'DONE' ? 'Todo completed' : 'Todo marked active'
        );
        void queryClient.invalidateQueries({
          queryKey: todoKeys.detail(data.id),
        });
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }
  );

  const recurrenceMutation = useMutation(
    ({ todoId, payload }: { todoId: string; payload: RecurrencePayload }) =>
      updateRecurrence(todoId, payload),
    {
      onSuccess: (_, variables) => {
        invalidateLists();
        toast.success('Recurrence updated');
        void queryClient.invalidateQueries({
          queryKey: todoKeys.detail(variables.todoId),
        });
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }
  );

  const cancelRecurrenceMutation = useMutation(cancelRecurrence, {
    onSuccess: (_, todoId) => {
      invalidateLists();
      toast.success('Recurrence cancelled');
      void queryClient.invalidateQueries({
        queryKey: todoKeys.detail(todoId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const completeSeriesMutation = useMutation(completeRecurrenceSeries, {
    onSuccess: (_, todoId) => {
      invalidateLists();
      toast.success('Series completed');
      void queryClient.invalidateQueries({
        queryKey: todoKeys.detail(todoId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createReminderMutation = useMutation(
    ({ todoId, payload }: { todoId: string; payload: ReminderPayload }) =>
      createReminder(todoId, payload),
    {
      onSuccess: (_, variables) => {
        toast.success('Reminder added');
        void queryClient.invalidateQueries({
          queryKey: todoKeys.detail(variables.todoId),
        });
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }
  );

  const updateReminderMutation = useMutation(
    ({
      todoId,
      reminderId,
      payload,
    }: {
      todoId: string;
      reminderId: string;
      payload: Partial<ReminderPayload>;
    }) => updateReminderRequest(todoId, reminderId, payload),
    {
      onSuccess: (_, variables) => {
        toast.success('Reminder updated');
        void queryClient.invalidateQueries({
          queryKey: todoKeys.detail(variables.todoId),
        });
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }
  );

  const deleteReminderMutation = useMutation(
    ({ todoId, reminderId }: { todoId: string; reminderId: string }) =>
      deleteReminder(todoId, reminderId),
    {
      onSuccess: (_, variables) => {
        toast.success('Reminder removed');
        void queryClient.invalidateQueries({
          queryKey: todoKeys.detail(variables.todoId),
        });
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }
  );

  const bulkUpdateMutation = useMutation(bulkUpdateTodos, {
    onSuccess: () => {
      invalidateLists();
      toast.success('Todos updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reorderMutation = useMutation(reorderTodos, {
    onSuccess: () => {
      invalidateLists();
      toast.success('Todos reordered');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return useMemo(
    () => ({
      create,
      update,
      toggleComplete,
      recurrenceMutation,
      cancelRecurrenceMutation,
      completeSeriesMutation,
      createReminderMutation,
      updateReminderMutation,
      deleteReminderMutation,
      bulkUpdateMutation,
      reorderMutation,
    }),
    [
      bulkUpdateMutation,
      cancelRecurrenceMutation,
      completeSeriesMutation,
      create,
      createReminderMutation,
      deleteReminderMutation,
      recurrenceMutation,
      reorderMutation,
      toggleComplete,
      update,
      updateReminderMutation,
    ]
  );
};

export const useSavedFilterMutations = () => {
  const queryClient = useQueryClient();

  const createFilter = useMutation(saveFilter, {
    onSuccess: () => {
      toast.success('Filter saved');
      void queryClient.invalidateQueries({ queryKey: todoKeys.savedFilters() });
      void queryClient.invalidateQueries({ queryKey: todoKeys.preferences() });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeFilter = useMutation(deleteFilter, {
    onSuccess: () => {
      toast.success('Filter removed');
      void queryClient.invalidateQueries({ queryKey: todoKeys.savedFilters() });
      void queryClient.invalidateQueries({ queryKey: todoKeys.preferences() });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { createFilter, removeFilter };
};

export const usePreferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(updateUserPreferences, {
    onSuccess: () => {
      toast.success('Preferences updated');
      void queryClient.invalidateQueries({ queryKey: todoKeys.preferences() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUserPreferencesMutations = () => {
  const queryClient = useQueryClient();

  const updatePreferences = useMutation(updateUserPreferences, {
    onSuccess: () => {
      toast.success('Preferences updated');
      void queryClient.invalidateQueries({ queryKey: todoKeys.preferences() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return { updatePreferences };
};

export const useSearchTodos = () => {
  return useMutation(searchTodos, {
    onError: (error: Error) => {
      toast.error('Search failed: ' + error.message);
    },
  });
};
