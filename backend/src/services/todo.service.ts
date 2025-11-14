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

export class TodoService {
  private todoRepository = new TodoRepository();
  private tagRepository = new TagRepository();
  private categoryRepository = new CategoryRepository();
  private prisma = getPrismaClient();

  async createTodo(userId: string, data: CreateTodoInput) {
    // Verify category exists if provided
    if (data.categoryId) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw ApiError.notFound('Category not found');
      }
    }

    const todo = await this.prisma.todo.create({
      data: {
        user: { connect: { id: userId } },
        title: data.title,
        description: data.description || '',
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        ...(data.categoryId && {
          category: { connect: { id: data.categoryId } },
        }),
        startDate: data.startDate,
        dueDate: data.dueDate,
        reminderLeadTime: data.reminderLeadTime,
        tags:
          data.tagIds && data.tagIds.length > 0
            ? {
                create: data.tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        subtasks: true,
        attachments: true,
      },
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
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
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
    const updateData: any = {};
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
