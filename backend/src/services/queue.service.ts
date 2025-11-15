import { Queue, Worker, Job } from 'bullmq';
import { createClient } from 'redis';
import { ReminderService } from './reminder.service';
import { ActivityLogService } from './activity-log.service';
import { logger } from '../config/logger';
import { env } from '../config/env';

interface ReminderJobData {
  reminderId: string;
  userId: string;
  todoId: string;
}

interface RecurrenceJobData {
  todoId: string;
  userId: string;
  recurrenceRuleId: string;
}

export class QueueService {
  private redisConnection: any;
  private reminderQueue: Queue<ReminderJobData>;
  private recurrenceQueue: Queue<RecurrenceJobData>;
  private reminderWorker: Worker<ReminderJobData>;
  private recurrenceWorker: Worker<RecurrenceJobData>;
  private reminderService: ReminderService;
  private activityLogService: ActivityLogService;

  constructor() {
    const redisConfig = env.REDIS_URL 
      ? { url: env.REDIS_URL }
      : {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
        };

    this.redisConnection = createClient(redisConfig);
    
    if (this.redisConnection) {
      this.redisConnection.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });
    }

    this.reminderQueue = new Queue<ReminderJobData>('reminders', {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.recurrenceQueue = new Queue<RecurrenceJobData>('recurrences', {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.reminderService = new ReminderService();
    this.activityLogService = new ActivityLogService();

    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    this.reminderWorker = new Worker<ReminderJobData>(
      'reminders',
      async (job: Job<ReminderJobData>) => {
        const { reminderId, userId, todoId } = job.data;
        
        try {
          logger.info(`Processing reminder job for reminder: ${reminderId}`);
          
          // Get reminder details
          const reminder = await this.reminderService.getReminder(reminderId, userId);
          
          if (reminder.sent) {
            logger.info(`Reminder ${reminderId} already sent, skipping`);
            return;
          }

          // Send reminder (start with console log, can be extended to email/push)
          await this.sendReminder(reminder);
          
          // Mark reminder as sent
          await this.reminderService.markAsSent(reminderId);
          
          // Log activity
          await this.activityLogService.createActivityLog({
            todoId,
            userId,
            type: 'COMMENTED', // Using existing type, could add REMINDER_SENT
            changes: {
              message: `Reminder sent via ${reminder.channel}`,
            },
          });

          logger.info(`Successfully processed reminder: ${reminderId}`);
        } catch (error) {
          logger.error(`Failed to process reminder ${reminderId}:`, error);
          throw error;
        }
      },
      { connection: this.redisConnection }
    );

    this.recurrenceWorker = new Worker<RecurrenceJobData>(
      'recurrences',
      async (job: Job<RecurrenceJobData>) => {
        const { todoId, userId, recurrenceRuleId } = job.data;
        
        try {
          logger.info(`Processing recurrence job for todo: ${todoId}`);
          
          // Use the recurrence service to create next occurrence
          const { RecurrenceService } = await import('./recurrence.service');
          const recurrenceService = new RecurrenceService();
          
          const newTodo = await recurrenceService.applyRecurrenceToTodo(todoId, userId);
          
          if (newTodo) {
            // Log activity
            await this.activityLogService.createActivityLog({
              todoId,
              userId,
              type: 'CREATED',
              changes: {
                message: `New recurring todo created: ${newTodo.title}`,
                newTodoId: newTodo.id,
              },
            });

            logger.info(`Successfully created next occurrence for todo: ${todoId}, new todo: ${newTodo.id}`);
          } else {
            logger.info(`No next occurrence generated for todo: ${todoId}`);
          }
        } catch (error) {
          logger.error(`Failed to process recurrence for todo ${todoId}:`, error);
          throw error;
        }
      },
      { connection: this.redisConnection }
    );

    // Handle worker errors
    this.reminderWorker.on('error', (err) => {
      logger.error('Reminder worker error:', err);
    });

    this.recurrenceWorker.on('error', (err) => {
      logger.error('Recurrence worker error:', err);
    });
  }

  async scheduleReminder(
    reminderId: string,
    userId: string,
    todoId: string,
    scheduledAt: Date
  ): Promise<void> {
    const delay = scheduledAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // Schedule immediately if time is in the past
      await this.reminderQueue.add(
        'send-reminder',
        { reminderId, userId, todoId },
        { delay: 0 }
      );
    } else {
      await this.reminderQueue.add(
        'send-reminder',
        { reminderId, userId, todoId },
        { delay }
      );
    }

    logger.info(`Scheduled reminder ${reminderId} for ${scheduledAt.toISOString()}`);
  }

  async scheduleRecurrenceCheck(
    todoId: string,
    userId: string,
    recurrenceRuleId: string,
    checkAt: Date
  ): Promise<void> {
    const delay = checkAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // Schedule immediately if time is in the past
      await this.recurrenceQueue.add(
        'check-recurrence',
        { todoId, userId, recurrenceRuleId },
        { delay: 0 }
      );
    } else {
      await this.recurrenceQueue.add(
        'check-recurrence',
        { todoId, userId, recurrenceRuleId },
        { delay }
      );
    }

    logger.info(`Scheduled recurrence check for todo ${todoId} at ${checkAt.toISOString()}`);
  }

  private async sendReminder(reminder: any): Promise<void> {
    const { todo, channel } = reminder;
    const message = `Reminder: ${todo.title} (Due: ${todo.dueDate ? new Date(todo.dueDate).toLocaleString() : 'No due date'})`;

    switch (channel) {
      case 'IN_APP':
        logger.info(`[IN_APP REMINDER] ${message}`);
        // In a real implementation, this would send to a websocket or push notification service
        break;
      case 'EMAIL':
        logger.info(`[EMAIL REMINDER] To user: ${reminder.userId} - ${message}`);
        // In a real implementation, this would send an email
        break;
      case 'PUSH':
        logger.info(`[PUSH REMINDER] To user: ${reminder.userId} - ${message}`);
        // In a real implementation, this would send a push notification
        break;
      default:
        logger.info(`[REMINDER] ${message}`);
    }
  }

  async getQueueStats(): Promise<any> {
    const [reminderWaiting, reminderActive, reminderCompleted, reminderFailed] = await Promise.all([
      this.reminderQueue.getWaiting(),
      this.reminderQueue.getActive(),
      this.reminderQueue.getCompleted(),
      this.reminderQueue.getFailed(),
    ]);

    const [recurrenceWaiting, recurrenceActive, recurrenceCompleted, recurrenceFailed] = await Promise.all([
      this.recurrenceQueue.getWaiting(),
      this.recurrenceQueue.getActive(),
      this.recurrenceQueue.getCompleted(),
      this.recurrenceQueue.getFailed(),
    ]);

    return {
      reminders: {
        waiting: reminderWaiting.length,
        active: reminderActive.length,
        completed: reminderCompleted.length,
        failed: reminderFailed.length,
      },
      recurrences: {
        waiting: recurrenceWaiting.length,
        active: recurrenceActive.length,
        completed: recurrenceCompleted.length,
        failed: recurrenceFailed.length,
      },
    };
  }

  async close(): Promise<void> {
    await this.reminderWorker.close();
    await this.recurrenceWorker.close();
    await this.reminderQueue.close();
    await this.recurrenceQueue.close();
    await this.redisConnection.quit();
  }
}