import { Prisma } from '@prisma/client';
import {
  TodoRepository,
  TagRepository,
  CategoryRepository,
} from '../repositories';
import { ApiError } from '../utils';
import {
  CreateTodoInput,
  UpdateTodoInput,
  DuplicateTodoInput,
  ListTodoQuery,
} from '../schemas';
import { getPrismaClient } from '../config';
import { UserPreferencesService } from './user-preferences.service';
import { ReminderService } from './reminder.service';
import { ActivityLogService } from './activity-log.service';
import { logger } from '../config/logger';

export class TodoService {
  private todoRepository = new TodoRepository();
  private tagRepository = new TagRepository();
  private categoryRepository = new CategoryRepository();
  private prisma = getPrismaClient();
  private userPreferencesService = new UserPreferencesService();
  private reminderService = new ReminderService();
  private activityLogService = new ActivityLogService();

  async createTodo(userId: string, data: CreateTodoInput) {
    // Apply user defaults to todo data
    const todoDataWithDefaults = await this.userPreferencesService.applyDefaultsToTodoData(userId, data);

    // Verify category exists if provided
    if (todoDataWithDefaults.categoryId) {
      const category = await this.categoryRepository.findById(todoDataWithDefaults.categoryId);
      if (!category) {
        throw ApiError.notFound('Category not found');
      }
    }

    const todo = await this.prisma.todo.create({
      data: {
        user: { connect: { id: userId } },
        title: todoDataWithDefaults.title,
        description: todoDataWithDefaults.description || '',
        status: todoDataWithDefaults.status || 'TODO',
        priority: todoDataWithDefaults.priority || 'MEDIUM',
        ...(todoDataWithDefaults.categoryId && {
          category: { connect: { id: todoDataWithDefaults.categoryId } },
        }),
        startDate: todoDataWithDefaults.startDate,
        dueDate: todoDataWithDefaults.dueDate,
        reminderLeadTime: todoDataWithDefaults.reminderLeadTime,
        tags:
          todoDataWithDefaults.tagIds && todoDataWithDefaults.tagIds.length > 0
            ? {
                create: todoDataWithDefaults.tagIds.map((tagId: string) => ({ tagId })),
              }
            : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        subtasks: true,
        attachments: true,
      },
    });

    // Create automatic reminders if enabled
    try {
      const shouldCreateReminder = await this.userPreferencesService.shouldCreateReminder(userId, todoDataWithDefaults);
      if (shouldCreateReminder) {
        await this.reminderService.createAutomaticReminders(userId, todo.id);
      }
    } catch (error) {
      // Log error but don't fail the todo creation
      logger.error('Failed to create automatic reminders:', error);
    }

    // Log activity
    await this.activityLogService.createActivityLog({
      todoId: todo.id,
      userId,
      type: 'CREATED',
      changes: {
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        dueDate: todo.dueDate,
      } as any,
    });

    return todo;
  }

  async getTodo(todoId: string, userId: string) {
    const todo = await this.todoRepository.findById(todoId, true);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to access this todo'
      );
    }

    return todo;
  }

  async listTodos(userId: string, query: ListTodoQuery) {
    const skip = (query.page - 1) * query.limit;

    const { data, total } =
      await this.todoRepository.findByUserIdWithPagination(userId, {
        skip,
        take: query.limit,
        ...(query.status && { status: query.status }),
        ...(query.categoryId && { categoryId: query.categoryId }),
        ...(query.priority && { priority: query.priority }),
        ...(query.tagId && { tagId: query.tagId }),
        ...(query.dueDateFrom && { dueDateFrom: query.dueDateFrom }),
        ...(query.dueDateTo && { dueDateTo: query.dueDateTo }),
        ...(query.search && { search: query.search }),
        ...(query.sortBy && { sortBy: query.sortBy }),
        ...(query.sortOrder && { sortOrder: query.sortOrder }),
      });

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async updateTodo(todoId: string, userId: string, data: UpdateTodoInput) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this todo'
      );
    }

    // Verify category exists if provided
    if (data.categoryId !== undefined && data.categoryId !== null) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw ApiError.notFound('Category not found');
      }
    }

    // Build update data, filtering out undefined values
    const updateData: Prisma.TodoUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.reminderLeadTime !== undefined)
      updateData.reminderLeadTime = data.reminderLeadTime;
    if (data.categoryId !== undefined) {
      if (data.categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: data.categoryId } };
      }
    }

    const updated = await this.todoRepository.update(todoId, updateData);
    return updated;
  }

  async deleteTodo(todoId: string, userId: string) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to delete this todo'
      );
    }

    await this.todoRepository.delete(todoId);
  }

  async markComplete(todoId: string, userId: string) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this todo'
      );
    }

    return this.todoRepository.markComplete(todoId);
  }

  async markIncomplete(todoId: string, userId: string) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this todo'
      );
    }

    return this.todoRepository.markIncomplete(todoId);
  }

  async duplicateTodo(
    todoId: string,
    userId: string,
    options?: DuplicateTodoInput
  ) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to duplicate this todo'
      );
    }

    return this.todoRepository.duplicate(
      todoId,
      options?.includeSubtasks !== false,
      options?.includeTags !== false
    );
  }

  async addTag(todoId: string, tagId: string, userId: string) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this todo'
      );
    }

    const tag = await this.tagRepository.findById(tagId);

    if (!tag) {
      throw ApiError.notFound('Tag not found');
    }

    if (tag.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to use this tag');
    }

    await this.todoRepository.addTag(todoId, tagId);
  }

  async removeTag(todoId: string, tagId: string, userId: string) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this todo'
      );
    }

    await this.todoRepository.removeTag(todoId, tagId);
  }
}
