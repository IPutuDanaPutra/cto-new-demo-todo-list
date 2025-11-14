import { Reminder, Prisma } from '@prisma/client';
import { getPrismaClient } from '../config';

export class ReminderRepository {
  private prisma = getPrismaClient();

  async create(data: Prisma.ReminderCreateInput): Promise<Reminder> {
    return this.prisma.reminder.create({ data });
  }

  async findById(id: string): Promise<Reminder | null> {
    return this.prisma.reminder.findUnique({ where: { id } });
  }

  async findByTodoId(todoId: string): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: { todoId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findByUserId(userId: string): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findPending(upTo?: Date): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: {
        sent: false,
        scheduledAt: {
          lte: upTo || new Date(),
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async update(
    id: string,
    data: Prisma.ReminderUpdateInput
  ): Promise<Reminder> {
    return this.prisma.reminder.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Reminder> {
    return this.prisma.reminder.delete({ where: { id } });
  }

  async markAsSent(id: string): Promise<Reminder> {
    return this.prisma.reminder.update({
      where: { id },
      data: {
        sent: true,
        sentAt: new Date(),
      },
    });
  }
}
