import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { cn } from '@/utils/cn';
import { Category, Tag, Todo } from '@/types';
import { RecurrenceBuilder } from './RecurrenceBuilder';
import { RecurrencePayload, TodoMutationPayload } from '../api';

const recurrenceSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1).default(1),
  byWeekday: z.array(z.string()).optional(),
  byMonthDay: z.array(z.number()).optional(),
  endDate: z.string().optional().nullable(),
});

const reminderSchema = z.object({
  scheduledAt: z.string(),
  channel: z.enum(['IN_APP', 'EMAIL', 'PUSH']).default('IN_APP'),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  categoryId: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  reminderLeadTime: z.union([z.number().int().min(0), z.null()]).optional(),
  tagIds: z.array(z.string()).optional(),
  recurrence: recurrenceSchema.nullable().optional(),
  reminders: z.array(reminderSchema).optional(),
});

export type TodoFormValues = z.infer<typeof formSchema>;

export interface TodoFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: TodoMutationPayload) => Promise<void>;
  categories: Category[];
  tags: Tag[];
  initialData?: Todo | null;
  defaultReminderLeadTime?: number;
}

export function TodoFormDrawer({
  open,
  onClose,
  onSubmit,
  categories,
  tags,
  initialData,
  defaultReminderLeadTime,
}: TodoFormDrawerProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(initialData, defaultReminderLeadTime),
  });

  const { fields: reminderFields, append, remove } = useFieldArray({
    control,
    name: 'reminders',
  });

  useEffect(() => {
    reset(getDefaultValues(initialData, defaultReminderLeadTime));
  }, [initialData, reset, defaultReminderLeadTime]);

  const recurrenceValue = watch('recurrence') ?? null;
  const dueDateValue = watch('dueDate');

  const internalSubmit = async (values: TodoFormValues) => {
    const payload: TodoMutationPayload = {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      ...(values.categoryId === undefined
        ? {}
        : { categoryId: values.categoryId === '' ? null : values.categoryId }),
      ...(values.startDate
        ? { startDate: new Date(values.startDate).toISOString() }
        : { startDate: null }),
      ...(values.dueDate
        ? { dueDate: new Date(values.dueDate).toISOString() }
        : { dueDate: null }),
      ...(values.reminderLeadTime !== undefined
        ? { reminderLeadTime: values.reminderLeadTime ?? null }
        : {}),
      ...(values.tagIds && values.tagIds.length > 0
        ? { tagIds: values.tagIds }
        : {}),
      ...(values.recurrence
        ? {
            recurrence: {
              ...values.recurrence,
              ...(values.recurrence.endDate
                ? { endDate: values.recurrence.endDate }
                : {}),
            } satisfies RecurrencePayload,
          }
        : { recurrence: null }),
      ...(values.reminders && values.reminders.length > 0
        ? {
            reminders: values.reminders.map((reminder) => ({
              channel: reminder.channel,
              scheduledAt: new Date(reminder.scheduledAt).toISOString(),
            })),
          }
        : {}),
    };

    await onSubmit(payload);
    onClose();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="flex min-h-full items-stretch justify-end">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="relative flex w-full max-w-2xl flex-col bg-white shadow-xl dark:bg-gray-900">
                  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                    <div>
                      <Dialog.Title className="text-lg font-semibold">
                        {initialData ? 'Edit todo' : 'Create todo'}
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure details, recurrence, and reminders
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost h-9 rounded-md px-3 text-sm"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>

                  <form className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6" onSubmit={handleSubmit(internalSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        control={control}
                        name="title"
                        render={({ field }) => (
                          <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
                            <span className="font-medium">Title</span>
                            <Input {...field} placeholder="Plan quarterly roadmap" error={errors.title?.message} />
                          </label>
                        )}
                      />

                      <Controller
                        control={control}
                        name="description"
                        render={({ field }) => (
                          <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
                            <span className="font-medium">Description</span>
                            <textarea
                              {...field}
                              rows={4}
                              className={cn('input min-h-[120px] resize-none', errors.description && 'border-red-500 focus-visible:ring-red-500')}
                              placeholder="Add more context"
                            />
                          </label>
                        )}
                      />

                      <Controller
                        control={control}
                        name="status"
                        render={({ field }) => (
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium">Status</span>
                            <select {...field} className="input h-10">
                              <option value="TODO">Todo</option>
                              <option value="IN_PROGRESS">In progress</option>
                              <option value="DONE">Done</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </label>
                        )}
                      />

                      <Controller
                        control={control}
                        name="priority"
                        render={({ field }) => (
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium">Priority</span>
                            <select {...field} className="input h-10">
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                              <option value="URGENT">Urgent</option>
                            </select>
                          </label>
                        )}
                      />

                      <Controller
                        control={control}
                        name="categoryId"
                        render={({ field }) => (
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium">Category</span>
                            <select
                              {...field}
                              value={field.value ?? ''}
                              className="input h-10"
                              onChange={(event) => field.onChange(event.target.value || null)}
                            >
                              <option value="">None</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      />

                      <Controller
                        control={control}
                        name="tagIds"
                        render={({ field }) => (
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium">Tags</span>
                            <select
                              multiple
                              className="input h-32"
                              value={field.value ?? []}
                              onChange={(event) => {
                                const selected = Array.from(
                                  event.target.selectedOptions,
                                  (option) => option.value
                                );
                                field.onChange(selected);
                              }}
                            >
                              {tags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                  {tag.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      />

                      <Controller
                        control={control}
                        name="startDate"
                        render={({ field }) => (
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium">Start date</span>
                            <input
                              type="datetime-local"
                              className="input"
                              value={field.value ?? ''}
                              onChange={(event) => field.onChange(event.target.value || null)}
                            />
                          </label>
                        )}
                      />

                      <Controller
                        control={control}
                        name="dueDate"
                        render={({ field }) => (
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium">Due date</span>
                            <input
                              type="datetime-local"
                              className="input"
                              value={field.value ?? ''}
                              onChange={(event) => field.onChange(event.target.value || null)}
                            />
                          </label>
                        )}
                      />

                      <Controller
                        control={control}
                        name="reminderLeadTime"
                        render={({ field }) => (
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium">Default reminder lead time (minutes)</span>
                            <input
                              type="number"
                              min={0}
                              className="input"
                              value={field.value ?? ''}
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value === ''
                                    ? null
                                    : Number.parseInt(event.target.value, 10)
                                )
                              }
                            />
                          </label>
                        )}
                      />
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <RecurrenceBuilder
                        value={recurrenceValue}
                        onChange={(next) => setValue('recurrence', next)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold">Reminders</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Schedule notifications for this todo
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const fallback = format(
                              new Date(),
                              "yyyy-MM-dd'T'HH:mm"
                            );
                            append({
                              scheduledAt: dueDateValue ?? fallback,
                              channel: 'IN_APP',
                            });
                          }}
                          disabled={isSubmitting}
                        >
                          Add reminder
                        </Button>
                      </div>

                      {reminderFields.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No reminders configured
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {reminderFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-center"
                            >
                              <Controller
                                control={control}
                                name={`reminders.${index}.scheduledAt`}
                                render={({ field: reminderField }) => (
                                  <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-medium">Schedule</span>
                                    <input
                                      type="datetime-local"
                                      className="input"
                                      value={convertToLocalDateTime(reminderField.value)}
                                      onChange={(event) =>
                                        reminderField.onChange(event.target.value)
                                      }
                                      required
                                    />
                                  </label>
                                )}
                              />
                              <Controller
                                control={control}
                                name={`reminders.${index}.channel`}
                                render={({ field: reminderField }) => (
                                  <label className="flex flex-col gap-1 text-sm">
                                    <span className="font-medium">Channel</span>
                                    <select
                                      className="input h-10"
                                      value={reminderField.value}
                                      onChange={(event) =>
                                        reminderField.onChange(event.target.value)
                                      }
                                    >
                                      <option value="IN_APP">In app</option>
                                      <option value="EMAIL">Email</option>
                                      <option value="PUSH">Push</option>
                                    </select>
                                  </label>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={isSubmitting}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                      <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={isSubmitting}>
                        {initialData ? 'Save changes' : 'Create todo'}
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function getDefaultValues(
  todo: Todo | null | undefined,
  defaultReminderLeadTime?: number
): TodoFormValues {
  if (!todo) {
    return {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      categoryId: null,
      startDate: null,
      dueDate: null,
      reminderLeadTime: defaultReminderLeadTime ?? null,
      tagIds: [],
      recurrence: null,
      reminders: [],
    };
  }

  return {
    title: todo.title,
    description: todo.description ?? '',
    status: todo.status,
    priority: todo.priority,
    categoryId: todo.categoryId,
    startDate: todo.startDate ? format(parseISO(todo.startDate), "yyyy-MM-dd'T'HH:mm") : null,
    dueDate: todo.dueDate ? format(parseISO(todo.dueDate), "yyyy-MM-dd'T'HH:mm") : null,
    reminderLeadTime: todo.reminderLeadTime ?? null,
    tagIds: todo.tags?.map((tag) => tag.tagId ?? tag.tag.id) ?? [],
    recurrence: todo.recurrenceRule
      ? {
          frequency: todo.recurrenceRule.frequency,
          interval: todo.recurrenceRule.interval,
          byWeekday: Array.isArray(todo.recurrenceRule.byWeekday)
            ? (todo.recurrenceRule.byWeekday as string[])
            : undefined,
          byMonthDay: Array.isArray(todo.recurrenceRule.byMonthDay)
            ? (todo.recurrenceRule.byMonthDay as number[])
            : undefined,
          endDate: todo.recurrenceRule.endDate
            ? format(parseISO(todo.recurrenceRule.endDate), 'yyyy-MM-dd')
            : null,
        }
      : null,
    reminders:
      todo.reminders?.map((reminder) => ({
        scheduledAt: format(parseISO(reminder.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
        channel: reminder.channel,
      })) ?? [],
  };
}

function convertToLocalDateTime(value: string | undefined) {
  if (!value) return '';
  if (value.includes('T')) return value;
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}
