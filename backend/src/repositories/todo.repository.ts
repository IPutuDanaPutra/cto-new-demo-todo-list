import { Todo, Prisma, TodoStatus, TodoPriority } from '@prisma/client';
import { getPrismaClient } from '../config';

const todoDetailsInclude = Prisma.validator<Prisma.TodoInclude>()({
  tags: { include: { tag: true } },
  subtasks: true,
  attachments: true,
  reminders: true,
  recurrenceRule: true,
  category: true,
});

export type TodoWithRelations = Prisma.TodoGetPayload<{
  include: typeof todoDetailsInclude;
}>;

const todoListInclude = Prisma.validator<Prisma.TodoInclude>()({
  tags: { include: { tag: true } },
  category: true,
  subtasks: true,
  attachments: true,
});

export type TodoListItem = Prisma.TodoGetPayload<{
  include: typeof todoListInclude;
}>;

export type TodoPaginationOptions = {
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
};

export class TodoRepository {
  private prisma = getPrismaClient();

  async create(data: Prisma.TodoCreateInput): Promise<Todo> {
    return this.prisma.todo.create({ data });
  }

  async findById(id: string): Promise<Todo | null>;
  async findById(id: string, includeRelations: false): Promise<Todo | null>;
  async findById(
    id: string,
    includeRelations: true
  ): Promise<TodoWithRelations | null>;
  async findById(
    id: string,
    includeRelations = false
  ): Promise<Todo | TodoWithRelations | null> {
    if (includeRelations) {
      return this.prisma.todo.findUnique({
        where: { id },
        include: todoDetailsInclude,
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
    options: TodoPaginationOptions = {}
  ): Promise<{ data: TodoListItem[]; total: number }> {
    const {
      skip,
      take,
      status,
      categoryId,
      priority,
      tagId,
      dueDateFrom,
      dueDateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const where: Prisma.TodoWhereInput = {
      userId,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(priority && { priority }),
      ...(tagId && {
        tags: {
          some: {
            tagId,
          },
        },
      }),
      ...((dueDateFrom || dueDateTo) && {
        dueDate: {
          ...(dueDateFrom && { gte: dueDateFrom }),
          ...(dueDateTo && { lte: dueDateTo }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    let orderBy: Prisma.TodoOrderByWithRelationInput;
    switch (sortBy) {
      case 'dueDate':
        orderBy = { dueDate: sortOrder };
        break;
      case 'priority':
        orderBy = { priority: sortOrder };
        break;
      case 'title':
        orderBy = { title: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const [data, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        include: todoListInclude,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        orderBy,
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
  ): Promise<TodoWithRelations> {
    const original = await this.findById(id, true);

    if (!original) {
      throw new Error('Todo not found');
    }

    const createData: Prisma.TodoCreateInput = {
      user: { connect: { id: original.userId } },
      ...(original.categoryId && {
        category: { connect: { id: original.categoryId } },
      }),
      title: `${original.title} (copy)`,
      description: original.description,
      status: original.status,
      priority: original.priority,
      ...(original.startDate && { startDate: original.startDate }),
      ...(original.dueDate && { dueDate: original.dueDate }),
      ...(original.reminderLeadTime && {
        reminderLeadTime: original.reminderLeadTime,
      }),
      ...(original.recurrenceRuleId && {
        recurrenceRule: { connect: { id: original.recurrenceRuleId } },
      }),
      ...(includeTags &&
        original.tags.length > 0 && {
          tags: {
            createMany: {
              data: original.tags.map(({ tagId }) => ({ tagId })),
              skipDuplicates: true,
            },
          },
        }),
      ...(includeSubtasks &&
        original.subtasks.length > 0 && {
          subtasks: {
            create: original.subtasks.map(
              ({ userId: subtaskUserId, title, completed, ordering }) => ({
                user: { connect: { id: subtaskUserId } },
                title,
                completed,
                ordering,
              })
            ),
          },
        }),
    };

    const newTodo = await this.prisma.todo.create({
      data: createData,
      include: todoDetailsInclude,
    });

    return newTodo;
  }
}
