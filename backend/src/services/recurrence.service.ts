import { PrismaClient, RecurrenceRule, RecurrenceFrequency, Todo } from '@prisma/client';
import { CreateRecurrenceRuleInput, UpdateRecurrenceRuleInput } from '../schemas';

const prisma = new PrismaClient();

export class RecurrenceService {
  async createRecurrenceRule(
    data: CreateRecurrenceRuleInput
  ): Promise<RecurrenceRule> {
    return await prisma.recurrenceRule.create({
      data: {
        ...data,
        byWeekday: data.byWeekday ? JSON.stringify(data.byWeekday) : null,
        byMonthDay: data.byMonthDay ? JSON.stringify(data.byMonthDay) : null,
      },
    });
  }

  async getRecurrenceRule(ruleId: string): Promise<RecurrenceRule> {
    const rule = await prisma.recurrenceRule.findUnique({
      where: {
        id: ruleId,
      },
    });

    if (!rule) {
      throw new Error('Recurrence rule not found');
    }

    return rule;
  }

  async updateRecurrenceRule(
    ruleId: string,
    data: UpdateRecurrenceRuleInput
  ): Promise<RecurrenceRule> {
    const updateData: any = { ...data };

    if (data.byWeekday !== undefined) {
      updateData.byWeekday = data.byWeekday ? JSON.stringify(data.byWeekday) : null;
    }

    if (data.byMonthDay !== undefined) {
      updateData.byMonthDay = data.byMonthDay ? JSON.stringify(data.byMonthDay) : null;
    }

    return await prisma.recurrenceRule.update({
      where: {
        id: ruleId,
      },
      data: updateData,
    });
  }

  async deleteRecurrenceRule(ruleId: string): Promise<void> {
    // Check if rule is being used by any todos
    const todosCount = await prisma.todo.count({
      where: {
        recurrenceRuleId: ruleId,
      },
    });

    if (todosCount > 0) {
      throw new Error('Cannot delete recurrence rule that is in use');
    }

    await prisma.recurrenceRule.delete({
      where: {
        id: ruleId,
      },
    });
  }

  async generateNextOccurrences(
    ruleId: string,
    fromDate: Date,
    count: number = 10
  ): Promise<Date[]> {
    const rule = await this.getRecurrenceRule(ruleId);
    const occurrences: Date[] = [];
    let currentDate = new Date(fromDate);

    while (occurrences.length < count) {
      currentDate = this.calculateNextOccurrence(currentDate, rule);

      // Check if we've exceeded the end date
      if (rule.endDate && currentDate > rule.endDate) {
        break;
      }

      occurrences.push(new Date(currentDate));
    }

    return occurrences;
  }

  private calculateNextOccurrence(currentDate: Date, rule: RecurrenceRule): Date {
    const nextDate = new Date(currentDate);
    
    // Move to next interval first
    switch (rule.frequency) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + rule.interval);
        break;

      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + (7 * rule.interval));
        if (rule.byWeekday) {
          const weekdays = JSON.parse(rule.byWeekday as string) as string[];
          // Map ISO weekday strings to numbers (0=Sunday, 1=Monday, etc.)
          const weekdayMap: Record<string, number> = {
            'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
          };
          
          // Find the next valid weekday
          let daysToAdd = 0;
          let found = false;
          
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(nextDate);
            checkDate.setDate(checkDate.getDate() + i);
            const dayOfWeek = checkDate.getDay();
            const dayString = Object.keys(weekdayMap).find(key => weekdayMap[key] === dayOfWeek);
            
            if (dayString && weekdays.includes(dayString)) {
              daysToAdd = i;
              found = true;
              break;
            }
          }
          
          if (found) {
            nextDate.setDate(nextDate.getDate() + daysToAdd);
          }
        }
        break;

      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
        if (rule.byMonthDay) {
          const monthDays = JSON.parse(rule.byMonthDay as string) as number[];
          // Handle negative values (counting from end of month)
          const targetDay = monthDays[0] || 1;
          if (targetDay > 0) {
            nextDate.setDate(Math.min(targetDay, this.getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())));
          } else {
            // Negative day means count from end of month (-1 = last day, -2 = second to last, etc.)
            const daysInMonth = this.getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth());
            nextDate.setDate(daysInMonth + targetDay + 1);
          }
        }
        break;

      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + rule.interval);
        break;
    }

    return nextDate;
  }
  
  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  async applyRecurrenceToTodo(
    todoId: string,
    userId: string
  ): Promise<Todo | null> {
    const todo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
      },
      include: {
        recurrenceRule: true,
      },
    });

    if (!todo || !todo.recurrenceRuleId || !todo.recurrenceRule) {
      return null;
    }

    // Generate next occurrence
    const nextDates = await this.generateNextOccurrences(
      todo.recurrenceRuleId,
      todo.dueDate || todo.createdAt,
      1
    );

    if (nextDates.length === 0) {
      return null;
    }

    // Create new todo for next occurrence
    const newTodo = await prisma.todo.create({
      data: {
        userId: todo.userId,
        categoryId: todo.categoryId,
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        dueDate: nextDates[0],
        recurrenceRuleId: todo.recurrenceRuleId,
      },
    });

    // Copy tags
    const todoTags = await prisma.todoTag.findMany({
      where: {
        todoId: todo.id,
      },
    });

    if (todoTags.length > 0) {
      await prisma.todoTag.createMany({
        data: todoTags.map((tag) => ({
          todoId: newTodo.id,
          tagId: tag.tagId,
        })),
      });
    }

    return newTodo;
  }
}