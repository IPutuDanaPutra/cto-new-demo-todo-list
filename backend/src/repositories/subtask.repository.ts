import { Subtask, Prisma } from '@prisma/client';
import { getPrismaClient } from '../config';

export class SubtaskRepository {
  private prisma = getPrismaClient();

  async create(data: Prisma.SubtaskCreateInput): Promise<Subtask> {
    return this.prisma.subtask.create({ data });
  }

  async findById(id: string): Promise<Subtask | null> {
    return this.prisma.subtask.findUnique({ where: { id } });
  }

  async findByTodoId(todoId: string): Promise<Subtask[]> {
    return this.prisma.subtask.findMany({
      where: { todoId },
      orderBy: { ordering: 'asc' },
    });
  }

  async findByUserId(userId: string): Promise<Subtask[]> {
    return this.prisma.subtask.findMany({
      where: { userId },
    });
  }

  async update(id: string, data: Prisma.SubtaskUpdateInput): Promise<Subtask> {
    return this.prisma.subtask.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Subtask> {
    return this.prisma.subtask.delete({ where: { id } });
  }

  async toggleComplete(id: string, completed: boolean): Promise<Subtask> {
    return this.prisma.subtask.update({
      where: { id },
      data: { completed },
    });
  }

  async reorder(id: string, ordering: number): Promise<Subtask> {
    return this.prisma.subtask.update({
      where: { id },
      data: { ordering },
    });
  }
}
