import { PrismaClient, TodoStatus, TodoPriority } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  async getAnalyticsSummary(userId: string): Promise<any> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalTodos,
      completedTodos,
      overdueTodos,
      todosThisWeek,
      todosThisMonth,
      todosThisYear,
      todosByStatus,
      todosByPriority,
      completionTrend,
      categoryDistribution,
    ] = await Promise.all([
      // Total todos
      prisma.todo.count({
        where: { userId },
      }),

      // Completed todos
      prisma.todo.count({
        where: {
          userId,
          status: 'DONE',
        },
      }),

      // Overdue todos
      prisma.todo.count({
        where: {
          userId,
          status: { not: 'DONE' },
          dueDate: {
            lt: now,
          },
        },
      }),

      // Todos created this week
      prisma.todo.count({
        where: {
          userId,
          createdAt: { gte: startOfWeek },
        },
      }),

      // Todos created this month
      prisma.todo.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Todos created this year
      prisma.todo.count({
        where: {
          userId,
          createdAt: { gte: startOfYear },
        },
      }),

      // Todos by status
      prisma.todo.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true,
        },
      }),

      // Todos by priority
      prisma.todo.groupBy({
        by: ['priority'],
        where: { userId },
        _count: {
          priority: true,
        },
      }),

      // Completion trend (last 30 days)
      this.getCompletionTrend(userId, 30),

      // Category distribution
      prisma.todo.groupBy({
        by: ['categoryId'],
        where: { userId },
        _count: {
          categoryId: true,
        },
      }),
    ]);

    // Calculate completion rate
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    // Get category details
    const categoryIds = categoryDistribution.map((cat) => cat.categoryId).filter(Boolean);
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds as string[] },
        userId,
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

    const categoryData = categoryDistribution.map((cat) => ({
      categoryId: cat.categoryId,
      count: cat._count.categoryId,
      category: cat.categoryId ? categoryMap.get(cat.categoryId) : null,
    }));

    return {
      overview: {
        totalTodos,
        completedTodos,
        overdueTodos,
        completionRate: Math.round(completionRate * 100) / 100,
        todosThisWeek,
        todosThisMonth,
        todosThisYear,
      },
      distribution: {
        byStatus: this.formatGroupByData(todosByStatus, 'status'),
        byPriority: this.formatGroupByData(todosByPriority, 'priority'),
        byCategory: categoryData,
      },
      trends: {
        completion: completionTrend,
      },
    };
  }

  private async getCompletionTrend(userId: string, days: number): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const completions = await prisma.todo.findMany({
      where: {
        userId,
        status: 'DONE',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        completedAt: true,
      },
    });

    // Group by date
    const trendData: any[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const count = completions.filter((todo) => {
        const completedAt = new Date(todo.completedAt!);
        return completedAt >= date && completedAt < nextDate;
      }).length;

      trendData.push({
        date: date.toISOString().split('T')[0],
        completed: count,
      });
    }

    return trendData;
  }

  private formatGroupByData(data: any[], field: string): any[] {
    return data.map((item) => ({
      [field]: item[field],
      count: item._count[field],
    }));
  }

  async getProductivityMetrics(userId: string): Promise<any> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      completedLastWeek,
      completedLastMonth,
      avgCompletionTime,
      streakData,
    ] = await Promise.all([
      // Completed in last week
      prisma.todo.count({
        where: {
          userId,
          status: 'DONE',
          completedAt: { gte: lastWeek },
        },
      }),

      // Completed in last month
      prisma.todo.count({
        where: {
          userId,
          status: 'DONE',
          completedAt: { gte: lastMonth },
        },
      }),

      // Average completion time
      this.getAverageCompletionTime(userId),

      // Current streak
      this.getCurrentStreak(userId),
    ]);

    return {
      productivity: {
        completedLastWeek,
        completedLastMonth,
        avgCompletionTime,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      },
    };
  }

  private async getAverageCompletionTime(userId: string): Promise<number> {
    const todos = await prisma.todo.findMany({
      where: {
        userId,
        status: 'DONE',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    if (todos.length === 0) return 0;

    const totalHours = todos.reduce((sum, todo) => {
      const created = new Date(todo.createdAt);
      const completed = new Date(todo.completedAt!);
      const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round(totalHours / todos.length * 100) / 100;
  }

  private async getCurrentStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    const completions = await prisma.todo.findMany({
      where: {
        userId,
        status: 'DONE',
        completedAt: { not: null },
      },
      select: {
        completedAt: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    if (completions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Group completions by date
    const completionDates = completions.map((todo) => {
      const date = new Date(todo.completedAt!);
      return date.toISOString().split('T')[0];
    });

    // Remove duplicates and sort
    const uniqueDates = [...new Set(completionDates)].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    // Check if there's a completion today or yesterday to start streak
    const lastCompletion = uniqueDates[uniqueDates.length - 1];
    const lastDate = new Date(lastCompletion);
    const daysSinceLastCompletion = Math.floor((checkDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastCompletion <= 1) {
      currentStreak = 1;
      tempStreak = 1;

      // Count backwards
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const currentDate = new Date(uniqueDates[i]);
        const prevDate = new Date(uniqueDates[i + 1]);
        const daysDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          currentStreak++;
          tempStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const prevDate = new Date(uniqueDates[i - 1]);
      const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }
}