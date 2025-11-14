import { PrismaClient, Reminder, ReminderChannel } from '@prisma/client';
import { CreateReminderInput, UpdateReminderInput } from '../schemas';

const prisma = new PrismaClient();

export class ReminderService {
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

    return await prisma.reminder.create({
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
}