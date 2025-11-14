import { PrismaClient, Todo, TodoStatus, TodoPriority, Category, Tag } from '@prisma/client';
import { SearchQuery } from '../schemas';

const prisma = new PrismaClient();

export class SearchService {
  async searchTodos(
    userId: string,
    query: SearchQuery
  ): Promise<{ data: any[]; meta: { total: number; page: number; limit: number } }> {
    const { q, page = 1, limit = 20, filters } = query;

    const where: any = {
      userId,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    };

    // Apply additional filters
    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.priority) {
        where.priority = filters.priority;
      }
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }
      if (filters.tagIds && filters.tagIds.length > 0) {
        where.tags = {
          some: {
            tagId: {
              in: filters.tagIds,
            },
          },
        };
      }
      if (filters.dateFrom || filters.dateTo) {
        where.dueDate = {};
        if (filters.dateFrom) where.dueDate.gte = filters.dateFrom;
        if (filters.dateTo) where.dueDate.lte = filters.dateTo;
      }
    }

    const [data, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: {
              subtasks: true,
              attachments: true,
              reminders: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.todo.count({ where }),
    ]);

    // Calculate relevance score for ranking
    const rankedData = data.map((todo) => {
      let score = 0;
      
      // Title matches are more relevant
      if (todo.title.toLowerCase().includes(q.toLowerCase())) {
        score += 10;
      }
      
      // Description matches
      if (todo.description.toLowerCase().includes(q.toLowerCase())) {
        score += 5;
      }
      
      // Exact title match gets highest score
      if (todo.title.toLowerCase() === q.toLowerCase()) {
        score += 20;
      }
      
      return { ...todo, _relevanceScore: score };
    });

    // Sort by relevance score
    rankedData.sort((a, b) => b._relevanceScore - a._relevanceScore);

    return {
      data: rankedData,
      meta: {
        total,
        page,
        limit,
      },
    };
  }
}