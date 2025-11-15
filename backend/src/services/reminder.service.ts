import { PrismaClient, Reminder, ReminderChannel } from '@prisma/client';
import { CreateReminderInput, UpdateReminderInput } from '../schemas';
import { QueueService } from './queue.service';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export class ReminderService {
  private queueService: QueueService | null;

  constructor() {
    // Only initialize queue if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.queueService = new QueueService();
    } else {
      this.queueService = null;
    }
  }

  async createReminder(
    userId: string,
    data: CreateReminderInput
  ): Promise<Reminder> {
    // Verify user owns the todo
    const todo = await prisma.todo.findFirst({
      where: {
        id: data.todoId,
        userId,
      },
    });

    if (!todo) {
      throw new Error('Todo not found or access denied');
    }

    const reminder = await prisma.reminder.create({
      data: {
        ...data,
        userId,
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
    });

    // Schedule the reminder in the queue
    if (this.queueService) {
      try {
        await this.queueService.scheduleReminder(
          reminder.id,
          userId,
          data.todoId,
          reminder.scheduledAt
        );
      } catch (error) {
        logger.error(`Failed to schedule reminder ${reminder.id}:`, error);
        // Don't fail the creation if scheduling fails
      }
    }

    return reminder;
  }

  async getReminder(reminderId: string, userId: string): Promise<Reminder> {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    return reminder;
  }

  async getRemindersByTodo(
    todoId: string,
    userId: string
  ): Promise<Reminder[]> {
    // Verify user owns the todo
    const todo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
      },
    });

    if (!todo) {
      throw new Error('Todo not found or access denied');
    }

    return await prisma.reminder.findMany({
      where: {
        todoId,
        userId,
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  async getUpcomingReminders(
    userId: string,
    hours: number = 24
  ): Promise<Reminder[]> {
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return await prisma.reminder.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: now,
          lte: endTime,
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
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  async updateReminder(
    reminderId: string,
    userId: string,
    data: UpdateReminderInput
  ): Promise<Reminder> {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    return await prisma.reminder.update({
      where: {
        id: reminderId,
      },
      data,
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
    });
  }

  async markAsSent(reminderId: string): Promise<Reminder> {
    return await prisma.reminder.update({
      where: {
        id: reminderId,
      },
      data: {
        sent: true,
        sentAt: new Date(),
      },
    });
  }

  async deleteReminder(reminderId: string, userId: string): Promise<void> {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    await prisma.reminder.delete({
      where: {
        id: reminderId,
      },
    });
  }

  async createAutomaticReminders(userId: string, todoId: string): Promise<Reminder[]> {
    const todo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
      },
    });

    if (!todo || !todo.dueDate) {
      return [];
    }

    const reminders: Reminder[] = [];

    // Create reminder based on lead time if specified
    if (todo.reminderLeadTime && todo.reminderLeadTime > 0) {
      const reminderTime = new Date(todo.dueDate.getTime() - todo.reminderLeadTime * 60 * 1000);
      
      if (reminderTime > new Date()) {
        const reminder = await this.createReminder(userId, {
          todoId,
          scheduledAt: reminderTime,
          channel: 'IN_APP',
        });
        reminders.push(reminder);
      }
    }

    return reminders;
  }

  async updateReminderSchedule(
    reminderId: string,
    userId: string,
    newScheduledAt: Date
  ): Promise<Reminder> {
    const reminder = await this.getReminder(reminderId, userId);

    const updatedReminder = await prisma.reminder.update({
      where: {
        id: reminderId,
      },
      data: {
        scheduledAt: newScheduledAt,
        sent: false,
        sentAt: null,
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
    });

    // Reschedule the reminder in the queue
    if (this.queueService) {
      try {
        await this.queueService.scheduleReminder(
          updatedReminder.id,
          userId,
          reminder.todoId,
          newScheduledAt
        );
      } catch (error) {
        logger.error(`Failed to reschedule reminder ${reminderId}:`, error);
      }
    }

    return updatedReminder;
  }
}