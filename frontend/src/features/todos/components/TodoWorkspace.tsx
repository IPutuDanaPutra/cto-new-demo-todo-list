import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChartBarSquareIcon,
  CalendarDaysIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, isBefore, parseISO } from 'date-fns';
import { Button } from '@/components/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TodoListItem, TodoPriority, TodoStatus } from '@/types';
import {
  useActivityLog,
  useAnalyticsSummary,
  useCategories,
  useSavedFilterMutations,
  useSavedFilters,
  useTags,
  useTodoDetail,
  useTodoList,
  useTodoMutations,
  useUserPreferences,
} from '../hooks';
import {
  TodoSelectionProvider,
  useTodoSelection,
} from '../todo-selection-context';
import { TodoFormDrawer } from './TodoFormDrawer';
import {
  RecurrencePayload,
  ReminderPayload,
  TodoMutationPayload,
  TodoListQuery,
} from '../api';
import { ReminderManager } from './ReminderManager';
import { RecurrenceBuilder } from './RecurrenceBuilder';
import { ActivityLog } from '@/types';
import { cn } from '@/utils/cn';

interface TodoWorkspaceInternalProps {
  query: TodoListQuery;
  setQuery: (updater: (previous: TodoListQuery) => TodoListQuery) => void;
}

export function TodoWorkspace() {
  const [query, setQueryState] = useState<TodoListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  const handleSetQuery = (
    updater: (previous: TodoListQuery) => TodoListQuery
  ) => {
    setQueryState((prev) => updater(prev));
  };

  return (
    <TodoSelectionProvider>
      <TodoWorkspaceInternal query={query} setQuery={handleSetQuery} />
    </TodoSelectionProvider>
  );
}

function TodoWorkspaceInternal({
  query,
  setQuery,
}: TodoWorkspaceInternalProps) {
  const { selectedIds, clear } = useTodoSelection();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const [localTodos, setLocalTodos] = useState<TodoListItem[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<
    ActivityLog['type'] | undefined
  >(undefined);
  const [activityDateFrom, setActivityDateFrom] = useState<
    string | undefined
  >();
  const [activityDateTo, setActivityDateTo] = useState<string | undefined>();
  const [editingRecurrence, setEditingRecurrence] = useState(false);

  const todoList = useTodoList(query);
  const todoMutations = useTodoMutations();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const { data: preferences } = useUserPreferences();
  const { data: savedFilters } = useSavedFilters();
  const { createFilter, removeFilter } = useSavedFilterMutations();

  const activeTodoQuery = useTodoDetail(activeTodoId);
  const editingTodoQuery = useTodoDetail(editingTodoId);
  const activityLog = useActivityLog(activeTodoId, {
    type: activityTypeFilter,
    dateFrom: activityDateFrom,
    dateTo: activityDateTo,
  });
  const analytics = useAnalyticsSummary(query);

  useEffect(() => {
    if (todoList.data?.data) {
      setLocalTodos(todoList.data.data);
    }
  }, [todoList.data]);

  useEffect(() => {
    if (!activeTodoId && todoList.data?.data.length) {
      setActiveTodoId(todoList.data.data[0].id);
    }
  }, [activeTodoId, todoList.data]);

  useEffect(() => {
    if (
      preferences?.defaultView === 'LIST' &&
      preferences.savedFilters.length > 0
    ) {
      const defaultFilter = preferences.savedFilters[0];
      if (defaultFilter) {
        applySavedFilter(defaultFilter.filters as Partial<TodoListQuery>);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences]);

  const groupedTodos = useMemo(() => {
    const groups = new Map<
      string,
      {
        categoryId: string | null;
        title: string;
        color?: string;
        items: TodoListItem[];
      }
    >();

    for (const todo of localTodos) {
      const categoryId = todo.category?.id ?? 'uncategorized';
      const existing = groups.get(categoryId);
      if (existing) {
        existing.items.push(todo);
      } else {
        groups.set(categoryId, {
          categoryId: todo.category?.id ?? null,
          title: todo.category?.name ?? 'Uncategorized',
          color: todo.category?.color,
          items: [todo],
        });
      }
    }

    return Array.from(groups.values());
  }, [localTodos]);

  const handleCreate = async (payload: TodoMutationPayload) => {
    // Extract recurrence and reminders if present (for TodoFormPayload compatibility)
    const { recurrence, reminders, ...todoPayload } =
      payload as TodoMutationPayload & {
        recurrence?: RecurrencePayload | null;
        reminders?: ReminderPayload[];
      };

    const todo = await todoMutations.create.mutateAsync(todoPayload);

    // Handle recurrence separately if provided
    if (recurrence) {
      await todoMutations.createRecurrence.mutateAsync({
        todoId: todo.id,
        payload: recurrence,
      });
    }

    // Handle reminders separately if provided
    if (reminders && reminders.length > 0) {
      await Promise.all(
        reminders.map((reminder) =>
          todoMutations.createReminderMutation.mutateAsync({
            todoId: todo.id,
            payload: reminder,
          })
        )
      );
    }

    setIsFormOpen(false);
  };

  const handleUpdate = async (
    todoId: string,
    payload: Partial<TodoMutationPayload>
  ) => {
    // Extract recurrence and reminders if present (for TodoFormPayload compatibility)
    const { ...todoPayload } = payload as Partial<TodoMutationPayload> & {
      recurrence?: RecurrencePayload | null;
      reminders?: ReminderPayload[];
    };

    await todoMutations.update.mutateAsync({ todoId, payload: todoPayload });

    // Note: Updating recurrence and reminders would require separate handling here
    // For now, those should be managed through the detail panel

    setEditingTodoId(null);
  };

  const handleRecurrenceUpdate = async (
    todoId: string,
    payload: RecurrencePayload
  ) => {
    // Note: This requires the todo to already have a recurrence rule
    // For now, we'll use createRecurrence which creates and applies the rule
    await todoMutations.createRecurrence.mutateAsync({ todoId, payload });
    setEditingRecurrence(false);
  };

  const handleApplyBulkStatus = (status: TodoStatus) => {
    if (!selectedIds.length) return;
    todoMutations.bulkUpdateMutation.mutate({
      todoIds: selectedIds,
      updates: { status },
    });
    clear();
  };

  const handleApplyBulkPriority = (priority: TodoPriority) => {
    if (!selectedIds.length) return;
    todoMutations.bulkUpdateMutation.mutate({
      todoIds: selectedIds,
      updates: { priority },
    });
    clear();
  };

  const handleSavedFilterCreate = async (name: string) => {
    await createFilter.mutateAsync({ name, viewType: 'LIST', filters: query });
  };

  const handleSavedFilterRemove = async (filterId: string) => {
    await removeFilter.mutateAsync(filterId);
  };

  const applySavedFilter = (filters: Partial<TodoListQuery>) => {
    setQuery((prev) => ({
      ...prev,
      ...filters,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setQuery((prev) => ({
      page: 1,
      limit: prev.limit,
      sortBy: prev.sortBy,
      sortOrder: prev.sortOrder,
    }));
  };

  const handleSortChange = (sortBy: TodoListQuery['sortBy']) => {
    setQuery((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const onSelectTodo = (todoId: string) => {
    setActiveTodoId(todoId);
  };

  const defaultReminderLeadTime = preferences?.defaultReminderLeadTime;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Todos</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage recurring tasks, reminders, and advanced workflows
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTodoId(null);
            setIsFormOpen(true);
          }}
        >
          Create todo
        </Button>
      </header>

      <FilterBar
        query={query}
        setQuery={setQuery}
        savedFilters={savedFilters ?? []}
        onApplySavedFilter={applySavedFilter}
        onSaveCurrentFilter={handleSavedFilterCreate}
        onRemoveSavedFilter={handleSavedFilterRemove}
        onClear={handleClearFilters}
      />

      {selectedIds.length > 0 && (
        <BulkActionsBar
          count={selectedIds.length}
          onClearSelection={clear}
          onApplyStatus={handleApplyBulkStatus}
          onApplyPriority={handleApplyBulkPriority}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Todo list</CardTitle>
              <CardDescription>
                Drag to reorder within categories, multi-select for quick
                updates
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {todoList.data?.meta.total ?? 0} tasks
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSortChange('dueDate')}
              >
                Sort by due date
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {todoList.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : groupedTodos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                <SparklesIcon className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">
                  No todos match these filters
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Adjust filters or create a new todo to get started.
                </p>
              </div>
            ) : (
              groupedTodos.map((group) => (
                <CategorySection
                  key={group.categoryId ?? 'uncategorized'}
                  group={group}
                  onReorder={(orderedIds) => {
                    const updatedItems = group.items.slice();
                    const newItems = orderedIds
                      .map((id) => updatedItems.find((todo) => todo.id === id))
                      .filter((todo): todo is TodoListItem => Boolean(todo));
                    setLocalTodos((prev) => {
                      const next = prev.slice();
                      let offset = 0;
                      for (let index = 0; index < next.length; index += 1) {
                        if (next[index].category?.id === group.categoryId) {
                          next[index] = newItems[offset];
                          offset += 1;
                        }
                      }
                      return next;
                    });
                    // Note: Reordering todos is not supported by the backend yet
                    // Only local state is updated for now
                  }}
                  onSelect={onSelectTodo}
                  onEdit={(todoId) => {
                    setActiveTodoId(todoId);
                    setEditingTodoId(todoId);
                    setIsFormOpen(true);
                  }}
                  activeTodoId={activeTodoId}
                />
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <TodoDetailPanel
            todo={activeTodoQuery.data ?? null}
            isLoading={activeTodoQuery.isLoading}
            onEdit={() => {
              if (!activeTodoId) return;
              setEditingTodoId(activeTodoId);
              setIsFormOpen(true);
            }}
            onToggleComplete={(todo) =>
              todoMutations.toggleComplete.mutate({
                todoId: todo.id,
                completed: todo.status === 'DONE',
              })
            }
            onMarkSeriesComplete={(todo) => {
              // Note: Complete series is not supported by backend yet
              // For now, just mark the current todo as complete
              todoMutations.toggleComplete.mutate({
                todoId: todo.id,
                completed: todo.status === 'DONE',
              });
            }}
            onCancelRecurrence={(todo) => {
              // Delete recurrence rule if todo has one
              if (todo.recurrenceRule) {
                todoMutations.deleteRecurrence.mutate(todo.recurrenceRule.id);
              }
            }}
            onSaveRecurrence={(todo, recurrence) =>
              handleRecurrenceUpdate(todo.id, recurrence)
            }
            editingRecurrence={editingRecurrence}
            setEditingRecurrence={setEditingRecurrence}
            reminderMutations={{
              create: todoMutations.createReminderMutation,
              update: todoMutations.updateReminderMutation,
              remove: todoMutations.deleteReminderMutation,
            }}
            activityLog={activityLog.data?.data ?? []}
            activityLoading={activityLog.isLoading}
            onActivityFilterChange={(filters) => {
              setActivityTypeFilter(filters.type);
              setActivityDateFrom(filters.dateFrom);
              setActivityDateTo(filters.dateTo);
            }}
          />

          <AnalyticsWidget
            overdue={analytics.data?.overdueCount ?? 0}
            streak={analytics.data?.activeStreak ?? 0}
            workloadByPriority={analytics.data?.workloadByPriority ?? []}
          />
        </div>
      </div>

      <TodoFormDrawer
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecurrence(false);
          setEditingTodoId(null);
        }}
        onSubmit={(payload) =>
          editingTodoId
            ? handleUpdate(editingTodoId, payload)
            : handleCreate(payload)
        }
        categories={categories ?? []}
        tags={tags ?? []}
        initialData={
          editingTodoId ? (editingTodoQuery.data ?? undefined) : undefined
        }
        defaultReminderLeadTime={defaultReminderLeadTime}
      />
    </div>
  );
}

interface CategorySectionProps {
  group: {
    categoryId: string | null;
    title: string;
    color?: string;
    items: TodoListItem[];
  };
  onReorder: (orderedIds: string[]) => void;
  onSelect: (todoId: string) => void;
  onEdit: (todoId: string) => void;
  activeTodoId: string | null;
}

function CategorySection({
  group,
  onReorder,
  onSelect,
  onEdit,
  activeTodoId,
}: CategorySectionProps) {
  const { selectedIds, toggleSelection } = useTodoSelection();
  const [items, setItems] = useState(group.items.map((todo) => todo.id));

  useEffect(() => {
    setItems(group.items.map((todo) => todo.id));
  }, [group.items]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      onReorder(reordered);
      return reordered;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: group.color ?? '#6b7280' }}
          />
          <h3 className="text-lg font-semibold">{group.title}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {group.items.length} tasks
          </span>
        </div>
        <button
          type="button"
          className="text-xs uppercase tracking-wide text-primary-600"
          onClick={() => {
            for (const todo of group.items) {
              toggleSelection(todo.id);
            }
          }}
        >
          Toggle select all
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((itemId) => {
              const todo = group.items.find((record) => record.id === itemId);
              if (!todo) return null;
              return (
                <SortableTodoRow
                  key={todo.id}
                  todo={todo}
                  onSelect={() => onSelect(todo.id)}
                  onToggleSelection={() => toggleSelection(todo.id)}
                  selected={selectedIds.includes(todo.id)}
                  active={activeTodoId === todo.id}
                  onEdit={() => onEdit(todo.id)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface SortableTodoRowProps {
  todo: TodoListItem;
  onSelect: () => void;
  onToggleSelection: () => void;
  selected: boolean;
  active: boolean;
  onEdit: () => void;
}

function SortableTodoRow({
  todo,
  onSelect,
  onToggleSelection,
  selected,
  active,
  onEdit,
}: SortableTodoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDate = todo.dueDate ? format(parseISO(todo.dueDate), 'PP p') : null;
  const overdue = todo.dueDate
    ? isBefore(parseISO(todo.dueDate), new Date())
    : false;
  const hasRecurrence = Boolean(todo.recurrenceRuleId || todo.recurrenceRule);
  const upcomingReminder = todo.reminders?.find(
    (reminder) =>
      !reminder.sent && !isBefore(parseISO(reminder.scheduledAt), new Date())
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition dark:border-gray-800 dark:bg-gray-900',
        isDragging && 'shadow-lg',
        active &&
          'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
      )}
      onClick={onSelect}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleSelection();
        }}
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded border',
          selected
            ? 'border-primary-500 bg-primary-500 text-white'
            : 'border-gray-300'
        )}
      >
        {selected ? '✓' : ''}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{todo.title}</span>
          {hasRecurrence && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
              Recurs
            </span>
          )}
          {todo.priority === 'URGENT' && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/60 dark:text-red-200">
              Urgent
            </span>
          )}
        </div>
        {todo.description && (
          <p className="line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
            {todo.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <CalendarDaysIcon className="h-4 w-4" />
            {dueDate ? (
              <>
                {dueDate}
                {overdue && <span className="text-red-500">(overdue)</span>}
              </>
            ) : (
              'No due date'
            )}
          </span>
          <span className="flex items-center gap-1">
            <ChartBarSquareIcon className="h-4 w-4" />
            {todo.status.toLowerCase()}
          </span>
          {upcomingReminder && (
            <span className="flex items-center gap-1 text-primary-600">
              <ClockIcon className="h-4 w-4" />
              Reminder in{' '}
              {formatDistanceToNow(parseISO(upcomingReminder.scheduledAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost h-9 px-3 text-sm"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn-ghost h-9 px-3 text-sm"
          {...listeners}
          onClick={(event) => event.stopPropagation()}
        >
          Drag
        </button>
      </div>
    </div>
  );
}

interface FilterBarProps {
  query: TodoListQuery;
  setQuery: (updater: (prev: TodoListQuery) => TodoListQuery) => void;
  savedFilters: Array<{
    id: string;
    name: string;
    filters: Record<string, unknown>;
  }>;
  onApplySavedFilter: (filters: Partial<TodoListQuery>) => void;
  onSaveCurrentFilter: (name: string) => Promise<void> | void;
  onRemoveSavedFilter: (id: string) => Promise<void> | void;
  onClear: () => void;
}

function FilterBar({
  query,
  setQuery,
  savedFilters,
  onApplySavedFilter,
  onSaveCurrentFilter,
  onRemoveSavedFilter,
  onClear,
}: FilterBarProps) {
  const [filterName, setFilterName] = useState('');

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="input h-10 w-40"
            value={query.status ?? ''}
            onChange={(event) => {
              const { status, ...rest } = query;
              setQuery({
                ...rest,
                ...(event.target.value && {
                  status: event.target.value as TodoStatus,
                }),
                page: 1,
              });
              void status; // Keep reference to avoid unused var warning
            }}
          >
            <option value="">All statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="input h-10 w-40"
            value={query.priority ?? ''}
            onChange={(event) => {
              const { priority, ...rest } = query;
              setQuery({
                ...rest,
                ...(event.target.value && {
                  priority: event.target.value as TodoPriority,
                }),
                page: 1,
              });
              void priority;
            }}
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <input
            type="date"
            className="input h-10"
            value={query.dueDateFrom ?? ''}
            onChange={(event) => {
              const { dueDateFrom, ...rest } = query;
              setQuery({
                ...rest,
                ...(event.target.value && { dueDateFrom: event.target.value }),
                page: 1,
              });
              void dueDateFrom;
            }}
          />
          <input
            type="date"
            className="input h-10"
            value={query.dueDateTo ?? ''}
            onChange={(event) => {
              const { dueDateTo, ...rest } = query;
              setQuery({
                ...rest,
                ...(event.target.value && { dueDateTo: event.target.value }),
                page: 1,
              });
              void dueDateTo;
            }}
          />

          <Button variant="secondary" size="sm" onClick={onClear}>
            Reset filters
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="input h-10 w-40"
              placeholder="Filter name"
              value={filterName}
              onChange={(event) => setFilterName(event.target.value)}
            />
            <Button
              size="sm"
              onClick={() => {
                if (!filterName) return;
                void onSaveCurrentFilter(filterName);
                setFilterName('');
              }}
            >
              Save filter
            </Button>
          </div>

          {savedFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {savedFilters.map((filter) => (
                <span
                  key={filter.id}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <button
                    type="button"
                    className="font-semibold text-primary-600"
                    onClick={() =>
                      onApplySavedFilter(
                        filter.filters as Partial<TodoListQuery>
                      )
                    }
                  >
                    {filter.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onRemoveSavedFilter(filter.id)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BulkActionsBarProps {
  count: number;
  onClearSelection: () => void;
  onApplyStatus: (status: TodoStatus) => void;
  onApplyPriority: (priority: TodoPriority) => void;
}

function BulkActionsBar({
  count,
  onClearSelection,
  onApplyStatus,
  onApplyPriority,
}: BulkActionsBarProps) {
  return (
    <Card className="border-primary-200 bg-primary-50 dark:border-primary-900 dark:bg-primary-950/60">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
            {count} tasks selected
          </p>
          <p className="text-xs text-primary-600 dark:text-primary-300">
            Apply quick updates across selected tasks
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input h-9"
            defaultValue=""
            onChange={(event) => {
              if (!event.target.value) return;
              onApplyStatus(event.target.value as TodoStatus);
              event.currentTarget.value = '';
            }}
          >
            <option value="">Set status</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            className="input h-9"
            defaultValue=""
            onChange={(event) => {
              if (!event.target.value) return;
              onApplyPriority(event.target.value as TodoPriority);
              event.currentTarget.value = '';
            }}
          >
            <option value="">Set priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            Clear selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface TodoDetailPanelProps {
  todo: TodoListItem | null;
  isLoading: boolean;
  onEdit: () => void;
  onToggleComplete: (todo: TodoListItem) => void;
  onMarkSeriesComplete: (todo: TodoListItem) => void;
  onCancelRecurrence: (todo: TodoListItem) => void;
  onSaveRecurrence: (todo: TodoListItem, recurrence: RecurrencePayload) => void;
  editingRecurrence: boolean;
  setEditingRecurrence: (value: boolean) => void;
  reminderMutations: {
    create: {
      mutate: (variables: {
        todoId: string;
        payload: { scheduledAt: string; channel: 'IN_APP' | 'EMAIL' | 'PUSH' };
      }) => void;
      mutateAsync: (variables: {
        todoId: string;
        payload: { scheduledAt: string; channel: 'IN_APP' | 'EMAIL' | 'PUSH' };
      }) => Promise<unknown>;
      isLoading?: boolean;
    };
    update: {
      mutate: (variables: {
        todoId: string;
        reminderId: string;
        payload: Partial<{
          scheduledAt: string;
          channel: 'IN_APP' | 'EMAIL' | 'PUSH';
        }>;
      }) => void;
      isLoading?: boolean;
    };
    remove: {
      mutate: (variables: { todoId: string; reminderId: string }) => void;
      isLoading?: boolean;
    };
  };
  activityLog: ActivityLog[];
  activityLoading: boolean;
  onActivityFilterChange: (filters: {
    type?: ActivityLog['type'];
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

function TodoDetailPanel({
  todo,
  isLoading,
  onEdit,
  onToggleComplete,
  onMarkSeriesComplete,
  onCancelRecurrence,
  onSaveRecurrence,
  editingRecurrence,
  setEditingRecurrence,
  reminderMutations,
  activityLog,
  activityLoading,
  onActivityFilterChange,
}: TodoDetailPanelProps) {
  const [draftRecurrence, setDraftRecurrence] =
    useState<RecurrencePayload | null>(
      recurrenceRuleToPayload(todo?.recurrenceRule ?? null)
    );

  useEffect(() => {
    setDraftRecurrence(recurrenceRuleToPayload(todo?.recurrenceRule ?? null));
  }, [todo]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!todo) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Select a todo to view details
        </CardContent>
      </Card>
    );
  }

  const recurrenceSummary = todo.recurrenceRule
    ? formatRecurrence(todo.recurrenceRule)
    : 'No recurrence';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{todo.title}</CardTitle>
            <CardDescription>
              {todo.description || 'No description provided'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" onClick={() => onToggleComplete(todo)}>
              {todo.status === 'DONE' ? 'Mark active' : 'Complete'}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Status: {todo.status.toLowerCase()}</span>
          <span>Priority: {todo.priority.toLowerCase()}</span>
          {todo.dueDate && (
            <span>Due {format(parseISO(todo.dueDate), 'PPpp')}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold">Recurrence</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {recurrenceSummary}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {todo.recurrenceRule && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkSeriesComplete(todo)}
                >
                  Complete series
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRecurrence(!editingRecurrence)}
              >
                {editingRecurrence
                  ? 'Cancel'
                  : todo.recurrenceRule
                    ? 'Edit recurrence'
                    : 'Add recurrence'}
              </Button>
              {todo.recurrenceRule && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancelRecurrence(todo)}
                >
                  Cancel recurrence
                </Button>
              )}
            </div>
          </div>
          {editingRecurrence && (
            <div className="mt-4 space-y-3">
              <RecurrenceBuilder
                value={draftRecurrence}
                onChange={(next) => setDraftRecurrence(next)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDraftRecurrence(
                      recurrenceRuleToPayload(todo.recurrenceRule)
                    );
                    setEditingRecurrence(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (draftRecurrence) {
                      onSaveRecurrence(todo, draftRecurrence);
                    } else {
                      onCancelRecurrence(todo);
                    }
                    setEditingRecurrence(false);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Reminders</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage notification schedule for this todo
              </p>
            </div>
          </div>
          <ReminderManager
            reminders={todo.reminders}
            dueDate={todo.dueDate}
            onCreate={(payload) =>
              reminderMutations.create.mutate({ todoId: todo.id, payload })
            }
            onUpdate={(reminderId, payload) =>
              reminderMutations.update.mutate({
                todoId: todo.id,
                reminderId,
                payload,
              })
            }
            onDelete={(reminderId) =>
              reminderMutations.remove.mutate({ todoId: todo.id, reminderId })
            }
          />
        </section>

        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Activity log</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track updates across the todo lifecycle
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <select
                className="input h-8"
                onChange={(event) => {
                  const value = event.target.value;
                  onActivityFilterChange(
                    value ? { type: value as ActivityLog['type'] } : {}
                  );
                }}
              >
                <option value="">All types</option>
                <option value="CREATED">Created</option>
                <option value="UPDATED">Updated</option>
                <option value="COMPLETED">Completed</option>
                <option value="STATUS_CHANGED">Status changed</option>
              </select>
              <input
                type="date"
                className="input h-8"
                onChange={(event) => {
                  const value = event.target.value;
                  onActivityFilterChange(value ? { dateFrom: value } : {});
                }}
              />
              <input
                type="date"
                className="input h-8"
                onChange={(event) => {
                  const value = event.target.value;
                  onActivityFilterChange(value ? { dateTo: value } : {});
                }}
              />
            </div>
          </div>
          {activityLoading ? (
            <div className="flex items-center justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : activityLog.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No activity recorded for this todo yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {activityLog.map((activity) => (
                <li
                  key={activity.id}
                  className="rounded border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{activity.type.toLowerCase()}</span>
                    <span>{format(parseISO(activity.createdAt), 'PPpp')}</span>
                  </div>
                  {activity.changes && (
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-300">
                      {JSON.stringify(activity.changes, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

interface AnalyticsWidgetProps {
  overdue: number;
  streak: number;
  workloadByPriority: Array<{ priority: TodoPriority; value: number }>;
}

function AnalyticsWidget({
  overdue,
  streak,
  workloadByPriority,
}: AnalyticsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>At a glance</CardTitle>
        <CardDescription>
          Productivity insights update in real time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Active streak
            </div>
            <div className="mt-2 text-3xl font-semibold">{streak} days</div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Consecutive days with at least one completed todo
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Overdue tasks
            </div>
            <div className="mt-2 text-3xl font-semibold">{overdue}</div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Follow up on overdue tasks to maintain momentum
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Workload distribution</h4>
          <div className="mt-3 grid gap-2">
            {workloadByPriority.map((entry) => (
              <div key={entry.priority} className="flex items-center gap-3">
                <div className="w-24 text-xs uppercase text-gray-500 dark:text-gray-400">
                  {entry.priority.toLowerCase()}
                </div>
                <div className="relative h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary-500"
                    style={{ width: `${Math.min(100, entry.value * 10)}%` }}
                  />
                </div>
                <div className="w-10 text-right text-sm font-medium">
                  {entry.value}
                </div>
              </div>
            ))}
            {workloadByPriority.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No workload data available yet.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatRecurrence(recurrence: TodoListItem['recurrenceRule']) {
  if (!recurrence) return 'No recurrence';
  const parts = [recurrence.frequency.toLowerCase()];
  if (recurrence.interval > 1) {
    parts.unshift(`every ${recurrence.interval}`);
  }
  if (Array.isArray(recurrence.byWeekday) && recurrence.byWeekday.length > 0) {
    parts.push(`on ${recurrence.byWeekday.join(', ')}`);
  }
  if (
    Array.isArray(recurrence.byMonthDay) &&
    recurrence.byMonthDay.length > 0
  ) {
    parts.push(`on day ${recurrence.byMonthDay.join(', ')}`);
  }
  if (recurrence.endDate) {
    parts.push(`until ${format(parseISO(recurrence.endDate), 'PP')}`);
  }
  return parts.join(' ');
}

function recurrenceRuleToPayload(
  rule: TodoListItem['recurrenceRule']
): RecurrencePayload | null {
  if (!rule) return null;
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    ...(Array.isArray(rule.byWeekday) && rule.byWeekday.length > 0
      ? { byWeekday: rule.byWeekday as string[] }
      : {}),
    ...(Array.isArray(rule.byMonthDay) && rule.byMonthDay.length > 0
      ? { byMonthDay: rule.byMonthDay as number[] }
      : {}),
    ...(rule.endDate ? { endDate: rule.endDate } : {}),
  };
}
