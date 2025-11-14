import { ActivityLog, Prisma } from '@prisma/client';
import { getPrismaClient } from '../config';

export class ActivityLogRepository {
  private prisma = getPrismaClient();

  async create(data: Prisma.ActivityLogCreateInput): Promise<ActivityLog> {
    return this.prisma.activityLog.create({ data });
  }

  async findByTodoId(todoId: string): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { todoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserId(userId: string): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTodoIdPaginated(
    todoId: string,
    limit = 10,
    offset = 0
  ): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { todoId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async delete(id: string): Promise<ActivityLog> {
    return this.prisma.activityLog.delete({ where: { id } });
  }

  async deleteByTodoId(todoId: string): Promise<{ count: number }> {
    return this.prisma.activityLog.deleteMany({
      where: { todoId },
    });
  }
}
