import { PrismaClient, ActivityLog, ActivityType } from '@prisma/client';
import { ActivityLogQuery } from '../schemas';

const prisma = new PrismaClient();

export class ActivityLogService {
  async getActivityLogs(
    userId: string,
    query: ActivityLogQuery
  ): Promise<{
    data: ActivityLog[];
    meta: { total: number; page: number; limit: number };
  }> {
    const { todoId, type, dateFrom, dateTo, page = 1, limit = 20 } = query;

    const where: Record<string, unknown> = {
      userId,
    };

    if (todoId) {
      where.todoId = todoId;
    }

    if (type) {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          todo: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async createActivityLog(params: {
    userId: string;
    todoId: string;
    type: ActivityType;
    changes?: Record<string, unknown>;
  }): Promise<ActivityLog> {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId,
        todoId: params.todoId,
        type: params.type,
        changes: params.changes,
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });
  }
}
