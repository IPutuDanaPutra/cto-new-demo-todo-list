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
}
