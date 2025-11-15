import * as cron from 'node-cron';
import { PrismaClient, TodoStatus } from '@prisma/client';
import { RecurrenceService } from './recurrence.service';
import { ReminderService } from './reminder.service';
import { QueueService } from './queue.service';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export class SchedulerService {
  private recurrenceService: RecurrenceService;
  private reminderService: ReminderService;
  private queueService: QueueService;
  private tasks: cron.ScheduledTask[] = [];

  constructor() {
    this.recurrenceService = new RecurrenceService();
    this.reminderService = new ReminderService();
    this.queueService = new QueueService();
  }

  async start(): Promise<void> {
    logger.info('Starting scheduler service...');

    // Schedule reminder checks every minute
    const reminderTask = cron.schedule('* * * * *', async () => {
      await this.checkAndScheduleReminders();
    }, {
      scheduled: false,
      timezone: 'UTC',
    });

    // Schedule recurrence checks every hour
    const recurrenceTask = cron.schedule('0 * * * *', async () => {
      await this.checkAndScheduleRecurrences();
    }, {
      scheduled: false,
      timezone: 'UTC',
    });

    // Schedule overdue notifications every hour
    const overdueTask = cron.schedule('0 * * * *', async () => {
      await this.checkOverdueTodos();
    }, {
      scheduled: false,
      timezone: 'UTC',
    });

    // Schedule cleanup of old completed todos daily at 2 AM
    const cleanupTask = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldTodos();
    }, {
      scheduled: false,
      timezone: 'UTC',
    });

    this.tasks.push(reminderTask, recurrenceTask, overdueTask, cleanupTask);

    // Start all tasks
    this.tasks.forEach(task => task.start());

    // Run initial checks
    await this.checkAndScheduleReminders();
    await this.checkAndScheduleRecurrences();

    logger.info('Scheduler service started successfully');
  }

  async stop(): Promise<void> {
    logger.info('Stopping scheduler service...');
    
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    
    await this.queueService.close();
    
    logger.info('Scheduler service stopped');
  }

  private async checkAndScheduleReminders(): Promise<void> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Find reminders that need to be scheduled in the next hour
      const remindersToSchedule = await prisma.reminder.findMany({
        where: {
          scheduledAt: {
            gte: now,
            lte: oneHourFromNow,
          },
          sent: false,
        },
        include: {
          todo: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              status: true,
            },
          },
        },
      });

      for (const reminder of remindersToSchedule) {
        // Skip if todo is already completed or cancelled
        if (reminder.todo.status === 'DONE' || reminder.todo.status === 'CANCELLED') {
          await this.reminderService.markAsSent(reminder.id);
          continue;
        }

        // Schedule the reminder in the queue
        await this.queueService.scheduleReminder(
          reminder.id,
          reminder.userId,
          reminder.todoId,
          reminder.scheduledAt
        );
      }

      if (remindersToSchedule.length > 0) {
        logger.info(`Scheduled ${remindersToSchedule.length} reminders`);
      }
    } catch (error) {
      logger.error('Error checking and scheduling reminders:', error);
    }
  }

  private async checkAndScheduleRecurrences(): Promise<void> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Find todos with recurrence rules that are due for completion check
      const todosToCheck = await prisma.todo.findMany({
        where: {
          status: 'DONE',
          completedAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
          recurrenceRuleId: {
            not: null,
          },
        },
        include: {
          recurrenceRule: true,
        },
      });

      for (const todo of todosToCheck) {
        if (!todo.recurrenceRule) continue;

        // Schedule recurrence check for the next occurrence
        const nextCheck = new Date(todo.completedAt!.getTime() + 5 * 60 * 1000); // 5 minutes after completion
        
        if (nextCheck <= oneHourFromNow) {
          await this.queueService.scheduleRecurrenceCheck(
            todo.id,
            todo.userId,
            todo.recurrenceRuleId,
            nextCheck
          );
        }
      }

      if (todosToCheck.length > 0) {
        logger.info(`Scheduled recurrence checks for ${todosToCheck.length} todos`);
      }
    } catch (error) {
      logger.error('Error checking and scheduling recurrences:', error);
    }
  }

  private async checkOverdueTodos(): Promise<void> {
    try {
      const now = new Date();

      // Find overdue todos that are not completed
      const overdueTodos = await prisma.todo.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            notIn: ['DONE', 'CANCELLED'],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      for (const todo of overdueTodos) {
        // Check if we should notify this user about overdue todos
        const { UserPreferencesService } = await import('./user-preferences.service');
        const userPreferencesService = new UserPreferencesService();
        const notificationPrefs = await userPreferencesService.getUserNotificationPreferences(todo.userId);

        if (notificationPrefs.notifyOnOverdue) {
          // Create an immediate reminder for the overdue todo
          await this.reminderService.createReminder(todo.userId, {
            todoId: todo.id,
            scheduledAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes from now
            channel: 'IN_APP',
          });

          logger.info(`Created overdue reminder for todo: ${todo.title}`);
        }
      }

      if (overdueTodos.length > 0) {
        logger.info(`Processed ${overdueTodos.length} overdue todos`);
      }
    } catch (error) {
      logger.error('Error checking overdue todos:', error);
    }
  }

  private async cleanupOldTodos(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find completed todos older than 30 days
      const oldCompletedTodos = await prisma.todo.findMany({
        where: {
          status: 'DONE',
          completedAt: {
            lt: thirtyDaysAgo,
          },
        },
        select: {
          id: true,
          title: true,
          userId: true,
        },
      });

      // Archive them instead of deleting (you could implement an archive table)
      // For now, we'll just log them
      if (oldCompletedTodos.length > 0) {
        logger.info(`Found ${oldCompletedTodos.length} completed todos older than 30 days`);
        
        // In a real implementation, you might:
        // 1. Move them to an archive table
        // 2. Delete them if user preferences allow it
        // 3. Mark them as archived
      }
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  async getQueueStats(): Promise<any> {
    return await this.queueService.getQueueStats();
  }

  async scheduleImmediateReminder(reminderId: string, userId: string, todoId: string): Promise<void> {
    await this.queueService.scheduleReminder(reminderId, userId, todoId, new Date());
  }

  async scheduleImmediateRecurrenceCheck(todoId: string, userId: string, recurrenceRuleId: string): Promise<void> {
    await this.queueService.scheduleRecurrenceCheck(todoId, userId, recurrenceRuleId, new Date());
  }
}