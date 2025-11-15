import { PrismaClient, TodoStatus, TodoPriority } from '@prisma/client';
import { BulkUpdateInput } from '../schemas';
import { ActivityLogService } from './activity-log.service';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export class BulkOperationsService {
  private activityLogService: ActivityLogService;

  constructor() {
    this.activityLogService = new ActivityLogService();
  }

  async bulkUpdateStatus(
    userId: string,
    todoIds: string[],
    status: TodoStatus
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      for (const todoId of todoIds) {
        try {
          // Get current todo for activity log
          const currentTodo = await tx.todo.findFirst({
            where: { id: todoId, userId },
            select: { id: true, title: true, status: true },
          });

          if (!currentTodo) {
            failed.push(todoId);
            continue;
          }

          // Update the todo
          await tx.todo.update({
            where: { id: todoId },
            data: {
              status,
              ...(status === 'DONE'
                ? { completedAt: new Date() }
                : { completedAt: null }),
            },
          });

          // Log activity
          await this.activityLogService.createActivityLog({
            todoId,
            userId,
            type: 'STATUS_CHANGED',
            changes: {
              before: { status: currentTodo.status },
              after: { status },
            },
          });

          updated++;
        } catch (error) {
          logger.error(`Failed to update status for todo ${todoId}:`, error);
          failed.push(todoId);
        }
      }
    });

    return { updated, failed };
  }

  async bulkUpdatePriority(
    userId: string,
    todoIds: string[],
    priority: TodoPriority
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const todoId of todoIds) {
        try {
          // Get current todo for activity log
          const currentTodo = await tx.todo.findFirst({
            where: { id: todoId, userId },
            select: { id: true, title: true, priority: true },
          });

          if (!currentTodo) {
            failed.push(todoId);
            continue;
          }

          // Update the todo
          await tx.todo.update({
            where: { id: todoId },
            data: { priority },
          });

          // Log activity
          await this.activityLogService.createActivityLog({
            todoId,
            userId,
            type: 'UPDATED',
            changes: {
              before: { priority: currentTodo.priority },
              after: { priority },
            },
          });

          updated++;
        } catch (error) {
          logger.error(`Failed to update priority for todo ${todoId}:`, error);
          failed.push(todoId);
        }
      }
    });

    return { updated, failed };
  }

  async bulkUpdateDueDate(
    userId: string,
    todoIds: string[],
    dueDate: Date | null
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const todoId of todoIds) {
        try {
          // Get current todo for activity log
          const currentTodo = await tx.todo.findFirst({
            where: { id: todoId, userId },
            select: { id: true, title: true, dueDate: true },
          });

          if (!currentTodo) {
            failed.push(todoId);
            continue;
          }

          // Update the todo
          await tx.todo.update({
            where: { id: todoId },
            data: { dueDate },
          });

          // Log activity
          await this.activityLogService.createActivityLog({
            todoId,
            userId,
            type: 'UPDATED',
            changes: {
              before: { dueDate: currentTodo.dueDate },
              after: { dueDate },
            },
          });

          updated++;
        } catch (error) {
          logger.error(`Failed to update due date for todo ${todoId}:`, error);
          failed.push(todoId);
        }
      }
    });

    return { updated, failed };
  }

  async bulkMoveToCategory(
    userId: string,
    todoIds: string[],
    categoryId: string | null
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    // Verify category exists if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!category) {
        throw new Error('Category not found or access denied');
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const todoId of todoIds) {
        try {
          // Get current todo for activity log
          const currentTodo = await tx.todo.findFirst({
            where: { id: todoId, userId },
            select: { id: true, title: true, categoryId: true },
          });

          if (!currentTodo) {
            failed.push(todoId);
            continue;
          }

          // Update the todo
          await tx.todo.update({
            where: { id: todoId },
            data: { categoryId },
          });

          // Log activity
          await this.activityLogService.createActivityLog({
            todoId,
            userId,
            type: 'UPDATED',
            changes: {
              before: { categoryId: currentTodo.categoryId },
              after: { categoryId },
            },
          });

          updated++;
        } catch (error) {
          logger.error(`Failed to move todo ${todoId} to category:`, error);
          failed.push(todoId);
        }
      }
    });

    return { updated, failed };
  }

  async bulkAssignTags(
    userId: string,
    todoIds: string[],
    tagIds: string[],
    action: 'add' | 'remove' | 'replace'
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    // Verify all tags exist and belong to user
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new Error('One or more tags not found or access denied');
    }

    await prisma.$transaction(async (tx) => {
      for (const todoId of todoIds) {
        try {
          // Verify todo exists
          const todo = await tx.todo.findFirst({
            where: { id: todoId, userId },
            select: { id: true, title: true },
          });

          if (!todo) {
            failed.push(todoId);
            continue;
          }

          if (action === 'replace') {
            // Remove all existing tags
            await tx.todoTag.deleteMany({
              where: { todoId },
            });
          }

          if (action === 'remove') {
            // Remove specified tags
            await tx.todoTag.deleteMany({
              where: {
                todoId,
                tagId: { in: tagIds },
              },
            });
          } else if (action === 'add' || action === 'replace') {
            // Add specified tags
            for (const tagId of tagIds) {
              await tx.todoTag.upsert({
                where: {
                  todoId_tagId: {
                    todoId,
                    tagId,
                  },
                },
                update: {},
                create: {
                  todoId,
                  tagId,
                },
              });
            }
          }

          // Log activity
          await this.activityLogService.createActivityLog({
            todoId,
            userId,
            type: action === 'remove' ? 'UPDATED' : 'TAGGED',
            changes: {
              action,
              tagIds,
            },
          });

          updated++;
        } catch (error) {
          logger.error(`Failed to ${action} tags for todo ${todoId}:`, error);
          failed.push(todoId);
        }
      }
    });

    return { updated, failed };
  }

  async bulkDelete(
    userId: string,
    todoIds: string[]
  ): Promise<{ deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    await prisma.$transaction(async (tx) => {
      for (const todoId of todoIds) {
        try {
          // Get current todo for activity log
          const currentTodo = await tx.todo.findFirst({
            where: { id: todoId, userId },
            select: { id: true, title: true },
          });

          if (!currentTodo) {
            failed.push(todoId);
            continue;
          }

          // Log activity before deletion (since cascade will delete logs too)
          await this.activityLogService.createActivityLog({
            todoId,
            userId,
            type: 'DELETED',
            changes: {
              title: currentTodo.title,
            },
          });

          // Delete the todo (this will cascade delete related records including the log we just created)
          await tx.todo.delete({
            where: { id: todoId },
          });

          deleted++;
        } catch (error) {
          logger.error(`Failed to delete todo ${todoId}:`, error);
          failed.push(todoId);
        }
      }
    });

    return { deleted, failed };
  }

  async bulkUpdate(
    userId: string,
    input: BulkUpdateInput
  ): Promise<{ updated: number; failed: string[] }> {
    const { todoIds, updates } = input;
    const failed: string[] = [];
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const todoId of todoIds) {
        try {
          // Get current todo for activity log
          const currentTodo = await tx.todo.findFirst({
            where: { id: todoId, userId },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              categoryId: true,
              reminderLeadTime: true,
            },
          });

          if (!currentTodo) {
            failed.push(todoId);
            continue;
          }

          // Prepare update data
          const updateData: Record<string, unknown> = {};

          if (updates.status !== undefined) {
            updateData.status = updates.status;
            if (updates.status === 'DONE') {
              updateData.completedAt = new Date();
            } else if (currentTodo.status === 'DONE') {
              updateData.completedAt = null;
            }
          }

          if (updates.priority !== undefined) {
            updateData.priority = updates.priority;
          }

          if (updates.dueDate !== undefined) {
            updateData.dueDate = updates.dueDate;
          }

          if (updates.categoryId !== undefined) {
            updateData.categoryId = updates.categoryId;
          }

          if (updates.reminderLeadTime !== undefined) {
            updateData.reminderLeadTime = updates.reminderLeadTime;
          }

          // Update the todo
          await tx.todo.update({
            where: { id: todoId },
            data: updateData,
          });

          // Log activity
          await this.activityLogService.createActivityLog({
            todoId,
            userId,
            type: updates.status !== undefined ? 'STATUS_CHANGED' : 'UPDATED',
            changes: {
              before: {
                ...(updates.status !== undefined && {
                  status: currentTodo.status,
                }),
                ...(updates.priority !== undefined && {
                  priority: currentTodo.priority,
                }),
                ...(updates.dueDate !== undefined && {
                  dueDate: currentTodo.dueDate,
                }),
                ...(updates.categoryId !== undefined && {
                  categoryId: currentTodo.categoryId,
                }),
                ...(updates.reminderLeadTime !== undefined && {
                  reminderLeadTime: currentTodo.reminderLeadTime,
                }),
              },
              after: updates,
            },
          });

          updated++;
        } catch (error) {
          logger.error(`Failed to update todo ${todoId}:`, error);
          failed.push(todoId);
        }
      }
    });

    return { updated, failed };
  }
}
