import { Todo, Prisma, TodoStatus, TodoPriority } from '@prisma/client';
import { getPrismaClient } from '../config';

export class TodoRepository {
  private prisma = getPrismaClient();

  async create(data: Prisma.TodoCreateInput): Promise<Todo> {
    return this.prisma.todo.create({ data });
  }

  async findById(id: string, includeRelations = false): Promise<Todo | null> {
    if (includeRelations) {
      return this.prisma.todo.findUnique({
        where: { id },
        include: {
          tags: { include: { tag: true } },
          subtasks: true,
          attachments: true,
          reminders: true,
          recurrenceRule: true,
        },
      });
    }
    return this.prisma.todo.findUnique({ where: { id } });
  }

  async findByUserId(
    userId: string,
    filters?: {
      status?: TodoStatus;
      categoryId?: string;
      priority?: TodoPriority;
    }
  ): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.priority && { priority: filters.priority }),
      },
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCategoryId(categoryId: string): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      where: { categoryId },
    });
  }

  async findByRecurrenceRuleId(recurrenceRuleId: string): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      where: { recurrenceRuleId },
    });
  }

  async findUpcomingTodos(userId: string, days = 7): Promise<Todo[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.todo.findMany({
      where: {
        userId,
        dueDate: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async update(id: string, data: Prisma.TodoUpdateInput): Promise<Todo> {
    return this.prisma.todo.update({
      where: { id },
      data,
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
    });
  }

  async delete(id: string): Promise<Todo> {
    return this.prisma.todo.delete({ where: { id } });
  }

  async markComplete(id: string): Promise<Todo> {
    return this.prisma.todo.update({
      where: { id },
      data: {
        status: 'DONE',
        completedAt: new Date(),
      },
    });
  }

  async addTag(todoId: string, tagId: string): Promise<void> {
    await this.prisma.todoTag.create({
      data: {
        todoId,
        tagId,
      },
    });
  }

  async removeTag(todoId: string, tagId: string): Promise<void> {
    await this.prisma.todoTag.deleteMany({
      where: {
        todoId,
        tagId,
      },
    });
  }

  async findByUserIdWithPagination(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      status?: TodoStatus;
      categoryId?: string;
      priority?: TodoPriority;
      tagId?: string;
      dueDateFrom?: Date;
      dueDateTo?: Date;
      search?: string;
      sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ data: Todo[]; total: number }> {
    const where: Prisma.TodoWhereInput = {
      userId,
      ...(options?.status && { status: options.status }),
      ...(options?.categoryId && { categoryId: options.categoryId }),
      ...(options?.priority && { priority: options.priority }),
      ...(options?.tagId && {
        tags: {
          some: {
            tagId: options.tagId,
          },
        },
      }),
      ...((options?.dueDateFrom || options?.dueDateTo) && {
        dueDate: {
          ...(options?.dueDateFrom && { gte: options.dueDateFrom }),
          ...(options?.dueDateTo && { lte: options.dueDateTo }),
        },
      }),
      ...(options?.search && {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const sortByMap: Record<string, Prisma.TodoOrderByWithRelationInput> = {
      createdAt: { createdAt: options?.sortOrder || 'desc' },
      dueDate: { dueDate: options?.sortOrder || 'desc' },
      priority: { priority: options?.sortOrder || 'desc' },
      title: { title: options?.sortOrder || 'desc' },
    };

    const [data, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          category: true,
          subtasks: true,
          attachments: true,
        },
        skip: options?.skip,
        take: options?.take,
        orderBy: sortByMap[options?.sortBy || 'createdAt'],
      }),
      this.prisma.todo.count({ where }),
    ]);

    return { data, total };
  }

  async markIncomplete(id: string): Promise<Todo> {
    return this.prisma.todo.update({
      where: { id },
      data: {
        status: 'TODO',
        completedAt: null,
      },
    });
  }

  async duplicate(
    id: string,
    includeSubtasks = true,
    includeTags = true
  ): Promise<Todo> {
    const original = await this.findById(id, true);

    if (!original) {
      throw new Error('Todo not found');
    }

    const newTodo = await this.prisma.todo.create({
      data: {
        userId: original.userId,
        categoryId: original.categoryId,
        title: `${original.title} (copy)`,
        description: original.description,
        status: original.status,
        priority: original.priority,
        startDate: original.startDate,
        dueDate: original.dueDate,
        reminderLeadTime: original.reminderLeadTime,
        recurrenceRuleId: original.recurrenceRuleId,
        ...(includeTags &&
          original.tags.length > 0 && {
            tags: {
              create: original.tags.map((t: any) => ({
                tagId: t.tag.id,
              })),
            },
          }),
        ...(includeSubtasks &&
          original.subtasks.length > 0 && {
            subtasks: {
              create: original.subtasks.map((s: any) => ({
                userId: s.userId,
                title: s.title,
                completed: s.completed,
                ordering: s.ordering,
              })),
            },
          }),
      },
      include: {
        tags: { include: { tag: true } },
        subtasks: true,
        attachments: true,
      },
    });

    return newTodo;
  }
}
