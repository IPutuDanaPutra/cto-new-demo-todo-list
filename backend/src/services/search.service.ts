import { PrismaClient, Todo, TodoStatus, TodoPriority, Category, Tag } from '@prisma/client';
import { SearchQuery } from '../schemas';

const prisma = new PrismaClient();

export class SearchService {
  async searchTodos(
    userId: string,
    query: SearchQuery
  ): Promise<{ data: any[]; meta: { total: number; page: number; limit: number } }> {
    const { q, page = 1, limit = 20, filters } = query;

    // Build the WHERE clause
    const whereConditions: string[] = ['"userId" = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    // Full-text search using PostgreSQL tsvector
    if (q && q.trim()) {
      whereConditions.push(`(
        to_tsvector('english', "title" || ' ' || COALESCE("description", '')) @@ to_tsquery('english', ${paramIndex})
        OR "title" ILIKE ${paramIndex + 1}
        OR "description" ILIKE ${paramIndex + 1}
      )`);
      params.push(`${q.trim().split(/\s+/).join(' & ')}:*`, `%${q.trim()}%`);
      paramIndex += 2;
    }

    // Apply additional filters
    if (filters) {
      if (filters.status) {
        whereConditions.push(`"status" = ${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }
      if (filters.priority) {
        whereConditions.push(`"priority" = ${paramIndex}`);
        params.push(filters.priority);
        paramIndex++;
      }
      if (filters.categoryId) {
        whereConditions.push(`"categoryId" = ${paramIndex}`);
        params.push(filters.categoryId);
        paramIndex++;
      }
      if (filters.tagIds && filters.tagIds.length > 0) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM "todo_tags" tt 
          WHERE tt."todo_id" = "todos"."id" AND tt."tag_id" = ANY(${paramIndex})
        )`);
        params.push(filters.tagIds);
        paramIndex++;
      }
      if (filters.dateFrom || filters.dateTo) {
        if (filters.dateFrom) {
          whereConditions.push(`"dueDate" >= ${paramIndex}`);
          params.push(filters.dateFrom);
          paramIndex++;
        }
        if (filters.dateTo) {
          whereConditions.push(`"dueDate" <= ${paramIndex}`);
          params.push(filters.dateTo);
          paramIndex++;
        }
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // Build the ORDER BY clause for relevance
    let orderByClause = '"priority" DESC, "dueDate" ASC, "createdAt" DESC';
    
    if (q && q.trim()) {
      // Add relevance ranking for full-text search
      orderByClause = `
        CASE 
          WHEN "title" ILIKE ${paramIndex} THEN 100
          WHEN to_tsvector('english', "title" || ' ' || COALESCE("description", '')) @@ to_tsquery('english', ${paramIndex + 1}) THEN 50
          WHEN "title" ILIKE ${paramIndex + 2} THEN 30
          WHEN "description" ILIKE ${paramIndex + 2} THEN 10
          ELSE 0
        END DESC,
        "priority" DESC,
        "dueDate" ASC,
        "createdAt" DESC
      `;
      params.push(
        `%${q.trim()}%`,
        `${q.trim().split(/\s+/).join(' & ')}:*`,
        `%${q.trim()}%`
      );
    }

    // Execute the search query
    const searchQuery = `
      SELECT 
        "todos".*,
        (
          SELECT json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'color', c.color
            )
          )
          FROM "categories" c 
          WHERE c.id = "todos"."categoryId"
        ) as "category",
        (
          SELECT json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name,
              'color', t.color
            )
          )
          FROM "todo_tags" tt
          JOIN "tags" t ON tt."tag_id" = t.id
          WHERE tt."todo_id" = "todos"."id"
        ) as "tags",
        (
          SELECT json_build_object(
            'subtasks', (SELECT COUNT(*) FROM "subtasks" WHERE "todo_id" = "todos"."id"),
            'attachments', (SELECT COUNT(*) FROM "attachments" WHERE "todo_id" = "todos"."id"),
            'reminders', (SELECT COUNT(*) FROM "reminders" WHERE "todo_id" = "todos"."id")
          )
        ) as "_count"
      FROM "todos"
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT ${paramIndex + 3} OFFSET ${paramIndex + 4}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM "todos"
      WHERE ${whereClause}
    `;

    try {
      const [searchResult, countResult] = await Promise.all([
        prisma.$queryRawUnsafe(searchQuery, ...params, limit, (page - 1) * limit),
        prisma.$queryRawUnsafe(countQuery, ...params.slice(0, paramIndex - 1))
      ]);

      const data = searchResult as any[];
      const total = Number((countResult as any[])[0]?.total || 0);

      return {
        data,
        meta: {
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      // Fallback to the original Prisma-based search if raw query fails
      return this.fallbackSearch(userId, query);
    }
  }

  private async fallbackSearch(
    userId: string,
    query: SearchQuery
  ): Promise<{ data: any[]; meta: { total: number; page: number; limit: number } }> {
    const { q, page = 1, limit = 20, filters } = query;

    const where: any = {
      userId,
    };

    if (q && q.trim()) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

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
      
      if (q && q.trim()) {
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
      }
      
      return { ...todo, _relevanceScore: score };
    });

    // Sort by relevance score
    if (q && q.trim()) {
      rankedData.sort((a, b) => b._relevanceScore - a._relevanceScore);
    }

    return {
      data: rankedData,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async searchTags(userId: string, query: string): Promise<any[]> {
    return await prisma.tag.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        name: 'asc',
      },
      take: 10,
    });
  }

  async searchCategories(userId: string, query: string): Promise<any[]> {
    return await prisma.category.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        name: 'asc',
      },
      take: 10,
    });
  }
}