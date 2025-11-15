import { SearchService } from '../../src/services/search.service';
import { TodoStatus, TodoPriority } from '@prisma/client';

describe('SearchService', () => {
  let searchService: SearchService;
  let mockPrisma: any;

  beforeEach(() => {
    searchService = new SearchService();
    
    mockPrisma = {
      $queryRawUnsafe: jest.fn(),
      todo: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      tag: {
        findMany: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
      },
    };
    
    (searchService as any).prisma = mockPrisma;
  });

  describe('searchTodos', () => {
    it('should return ranked search results with full-text search', async () => {
      const query = {
        q: 'important task',
        page: 1,
        limit: 20,
        filters: {
          status: TodoStatus.TODO,
          priority: TodoPriority.HIGH,
        },
      };

      const mockResults = [
        {
          id: 'todo1',
          title: 'Important Task',
          description: 'This is an important task',
          status: TodoStatus.TODO,
          priority: TodoPriority.HIGH,
          category: { id: 'cat1', name: 'Work', color: '#blue' },
          tags: [{ id: 'tag1', name: 'urgent', color: '#red' }],
          _count: { subtasks: 2, attachments: 1, reminders: 1 },
        },
        {
          id: 'todo2',
          title: 'Task about importance',
          description: 'Another task',
          status: TodoStatus.TODO,
          priority: TodoPriority.HIGH,
          category: null,
          tags: [],
          _count: { subtasks: 0, attachments: 0, reminders: 0 },
        },
      ];

      const mockCount = [{ total: 2 }];

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockResults)
        .mockResolvedValueOnce(mockCount);

      const result = await searchService.searchTodos('user1', query);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
    });

    it('should fallback to Prisma search when raw query fails', async () => {
      const query = {
        q: 'test',
        page: 1,
        limit: 10,
        filters: {},
      };

      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      const mockPrismaResults = [
        {
          id: 'todo1',
          title: 'Test Todo',
          description: 'A test todo',
          status: TodoStatus.TODO,
          priority: TodoPriority.MEDIUM,
          category: null,
          tags: [],
          _count: { subtasks: 0, attachments: 0, reminders: 0 },
          _relevanceScore: 20,
        },
      ];

      mockPrisma.todo.findMany.mockResolvedValue(mockPrismaResults);
      mockPrisma.todo.count.mockResolvedValue(1);

      const result = await searchService.searchTodos('user1', query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]._relevanceScore).toBe(20);
      expect(mockPrisma.todo.findMany).toHaveBeenCalled();
    });

    it('should handle empty query', async () => {
      const query = {
        q: '',
        page: 1,
        limit: 20,
        filters: {},
      };

      const mockResults = [
        {
          id: 'todo1',
          title: 'Todo 1',
          description: '',
          status: TodoStatus.TODO,
          priority: TodoPriority.MEDIUM,
          category: null,
          tags: [],
          _count: { subtasks: 0, attachments: 0, reminders: 0 },
        },
      ];

      const mockCount = [{ total: 1 }];

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockResults)
        .mockResolvedValueOnce(mockCount);

      const result = await searchService.searchTodos('user1', query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('searchTags', () => {
    it('should return matching tags', async () => {
      const query = 'work';
      const mockTags = [
        { id: 'tag1', name: 'work', color: '#blue' },
        { id: 'tag2', name: 'work-related', color: '#green' },
      ];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      const result = await searchService.searchTags('user1', query);

      expect(result).toHaveLength(2);
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          name: 'asc',
        },
        take: 10,
      });
    });
  });

  describe('searchCategories', () => {
    it('should return matching categories', async () => {
      const query = 'personal';
      const mockCategories = [
        { id: 'cat1', name: 'Personal', color: '#purple' },
        { id: 'cat2', name: 'Personal Projects', color: '#orange' },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await searchService.searchCategories('user1', query);

      expect(result).toHaveLength(2);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          name: 'asc',
        },
        take: 10,
      });
    });
  });
});