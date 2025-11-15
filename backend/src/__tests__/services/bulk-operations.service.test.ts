import { BulkOperationsService } from '../../src/services/bulk-operations.service';
import { TodoStatus, TodoPriority } from '@prisma/client';

describe('BulkOperationsService', () => {
  let bulkOperationsService: BulkOperationsService;
  let mockPrisma: any;

  beforeEach(() => {
    bulkOperationsService = new BulkOperationsService();
    
    // Mock Prisma client
    mockPrisma = {
      $transaction: jest.fn(),
      todo: {
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      todoTag: {
        deleteMany: jest.fn(),
        upsert: jest.fn(),
      },
    };
    
    // Replace the prisma instance in the service
    (bulkOperationsService as any).prisma = mockPrisma;
  });

  describe('bulkUpdateStatus', () => {
    it('should update status for multiple todos successfully', async () => {
      const todoIds = ['todo1', 'todo2', 'todo3'];
      const newStatus = TodoStatus.DONE;
      
      const mockTodos = todoIds.map(id => ({
        id,
        title: `Todo ${id}`,
        status: TodoStatus.TODO,
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.todo.findFirst
        .mockResolvedValueOnce(mockTodos[0])
        .mockResolvedValueOnce(mockTodos[1])
        .mockResolvedValueOnce(mockTodos[2]);

      mockPrisma.todo.update
        .mockResolvedValueOnce({ ...mockTodos[0], status: newStatus, completedAt: new Date() })
        .mockResolvedValueOnce({ ...mockTodos[1], status: newStatus, completedAt: new Date() })
        .mockResolvedValueOnce({ ...mockTodos[2], status: newStatus, completedAt: new Date() });

      const result = await bulkOperationsService.bulkUpdateStatus('user1', todoIds, newStatus);

      expect(result.updated).toBe(3);
      expect(result.failed).toHaveLength(0);
      expect(mockPrisma.todo.update).toHaveBeenCalledTimes(3);
    });

    it('should handle failures for some todos', async () => {
      const todoIds = ['todo1', 'todo2', 'invalid-todo'];
      const newStatus = TodoStatus.DONE;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.todo.findFirst
        .mockResolvedValueOnce({ id: 'todo1', title: 'Todo 1', status: TodoStatus.TODO })
        .mockResolvedValueOnce({ id: 'todo2', title: 'Todo 2', status: TodoStatus.TODO })
        .mockResolvedValueOnce(null); // Not found

      mockPrisma.todo.update
        .mockResolvedValueOnce({ id: 'todo1', status: newStatus, completedAt: new Date() })
        .mockResolvedValueOnce({ id: 'todo2', status: newStatus, completedAt: new Date() });

      const result = await bulkOperationsService.bulkUpdateStatus('user1', todoIds, newStatus);

      expect(result.updated).toBe(2);
      expect(result.failed).toContain('invalid-todo');
    });
  });

  describe('bulkUpdatePriority', () => {
    it('should update priority for multiple todos', async () => {
      const todoIds = ['todo1', 'todo2'];
      const newPriority = TodoPriority.HIGH;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.todo.findFirst
        .mockResolvedValueOnce({ id: 'todo1', title: 'Todo 1', priority: TodoPriority.MEDIUM })
        .mockResolvedValueOnce({ id: 'todo2', title: 'Todo 2', priority: TodoPriority.LOW });

      mockPrisma.todo.update
        .mockResolvedValueOnce({ id: 'todo1', priority: newPriority })
        .mockResolvedValueOnce({ id: 'todo2', priority: newPriority });

      const result = await bulkOperationsService.bulkUpdatePriority('user1', todoIds, newPriority);

      expect(result.updated).toBe(2);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('bulkAssignTags', () => {
    it('should add tags to multiple todos', async () => {
      const todoIds = ['todo1', 'todo2'];
      const tagIds = ['tag1', 'tag2'];

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.todo.findFirst
        .mockResolvedValueOnce({ id: 'todo1', title: 'Todo 1' })
        .mockResolvedValueOnce({ id: 'todo2', title: 'Todo 2' });

      mockPrisma.todoTag.upsert.mockResolvedValue({});

      const result = await bulkOperationsService.bulkAssignTags('user1', todoIds, tagIds, 'add');

      expect(result.updated).toBe(2);
      expect(mockPrisma.todoTag.upsert).toHaveBeenCalledTimes(4); // 2 todos * 2 tags
    });

    it('should remove tags from multiple todos', async () => {
      const todoIds = ['todo1', 'todo2'];
      const tagIds = ['tag1'];

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.todo.findFirst
        .mockResolvedValueOnce({ id: 'todo1', title: 'Todo 1' })
        .mockResolvedValueOnce({ id: 'todo2', title: 'Todo 2' });

      mockPrisma.todoTag.deleteMany.mockResolvedValue({ count: 2 });

      const result = await bulkOperationsService.bulkAssignTags('user1', todoIds, tagIds, 'remove');

      expect(result.updated).toBe(2);
      expect(mockPrisma.todoTag.deleteMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple todos', async () => {
      const todoIds = ['todo1', 'todo2'];

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.todo.findFirst
        .mockResolvedValueOnce({ id: 'todo1', title: 'Todo 1' })
        .mockResolvedValueOnce({ id: 'todo2', title: 'Todo 2' });

      mockPrisma.todo.delete.mockResolvedValue({});

      const result = await bulkOperationsService.bulkDelete('user1', todoIds);

      expect(result.deleted).toBe(2);
      expect(result.failed).toHaveLength(0);
      expect(mockPrisma.todo.delete).toHaveBeenCalledTimes(2);
    });
  });
});