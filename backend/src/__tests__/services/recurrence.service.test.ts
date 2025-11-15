import { RecurrenceService } from '../../src/services/recurrence.service';
import { RecurrenceFrequency } from '@prisma/client';

describe('RecurrenceService', () => {
  let recurrenceService: RecurrenceService;

  beforeEach(() => {
    recurrenceService = new RecurrenceService();
  });

  describe('generateNextOccurrences', () => {
    it('should generate daily occurrences', async () => {
      const mockRule = {
        id: 'rule1',
        frequency: 'DAILY' as RecurrenceFrequency,
        interval: 1,
        byWeekday: null,
        byMonthDay: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(recurrenceService as any, 'getRecurrenceRule').mockResolvedValue(mockRule);

      const fromDate = new Date('2024-01-01T10:00:00Z');
      const occurrences = await recurrenceService.generateNextOccurrences('rule1', fromDate, 5);

      expect(occurrences).toHaveLength(5);
      expect(occurrences[0]).toEqual(new Date('2024-01-02T10:00:00Z'));
      expect(occurrences[1]).toEqual(new Date('2024-01-03T10:00:00Z'));
      expect(occurrences[2]).toEqual(new Date('2024-01-04T10:00:00Z'));
      expect(occurrences[3]).toEqual(new Date('2024-01-05T10:00:00Z'));
      expect(occurrences[4]).toEqual(new Date('2024-01-06T10:00:00Z'));
    });

    it('should generate weekly occurrences with specific weekdays', async () => {
      const mockRule = {
        id: 'rule2',
        frequency: 'WEEKLY' as RecurrenceFrequency,
        interval: 1,
        byWeekday: JSON.stringify(['MO', 'WE', 'FR']),
        byMonthDay: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(recurrenceService as any, 'getRecurrenceRule').mockResolvedValue(mockRule);

      const fromDate = new Date('2024-01-01T10:00:00Z'); // Monday
      const occurrences = await recurrenceService.generateNextOccurrences('rule2', fromDate, 3);

      expect(occurrences).toHaveLength(3);
      expect(occurrences[0]).toEqual(new Date('2024-01-01T10:00:00Z')); // Monday
      expect(occurrences[1]).toEqual(new Date('2024-01-03T10:00:00Z')); // Wednesday
      expect(occurrences[2]).toEqual(new Date('2024-01-05T10:00:00Z')); // Friday
    });

    it('should generate monthly occurrences with specific days', async () => {
      const mockRule = {
        id: 'rule3',
        frequency: 'MONTHLY' as RecurrenceFrequency,
        interval: 1,
        byWeekday: null,
        byMonthDay: JSON.stringify([15]),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(recurrenceService as any, 'getRecurrenceRule').mockResolvedValue(mockRule);

      const fromDate = new Date('2024-01-01T10:00:00Z');
      const occurrences = await recurrenceService.generateNextOccurrences('rule3', fromDate, 3);

      expect(occurrences).toHaveLength(3);
      expect(occurrences[0]).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(occurrences[1]).toEqual(new Date('2024-02-15T10:00:00Z'));
      expect(occurrences[2]).toEqual(new Date('2024-03-15T10:00:00Z'));
    });

    it('should respect end date', async () => {
      const endDate = new Date('2024-01-05T00:00:00Z');
      const mockRule = {
        id: 'rule4',
        frequency: 'DAILY' as RecurrenceFrequency,
        interval: 1,
        byWeekday: null,
        byMonthDay: null,
        endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(recurrenceService as any, 'getRecurrenceRule').mockResolvedValue(mockRule);

      const fromDate = new Date('2024-01-01T10:00:00Z');
      const occurrences = await recurrenceService.generateNextOccurrences('rule4', fromDate, 10);

      expect(occurrences).toHaveLength(4);
      expect(occurrences[3]).toEqual(new Date('2024-01-05T10:00:00Z'));
    });
  });

  describe('calculateNextOccurrence', () => {
    it('should handle negative month days (last day of month)', () => {
      const rule = {
        frequency: 'MONTHLY' as RecurrenceFrequency,
        interval: 1,
        byMonthDay: JSON.stringify([-1]), // Last day of month
      };

      const currentDate = new Date('2024-01-15T10:00:00Z');
      const nextDate = (recurrenceService as any).calculateNextOccurrence(currentDate, rule);

      expect(nextDate.getDate()).toBe(31); // January has 31 days
      expect(nextDate.getMonth()).toBe(0); // Still January
    });

    it('should handle February leap year', () => {
      const rule = {
        frequency: 'YEARLY' as RecurrenceFrequency,
        interval: 1,
      };

      const currentDate = new Date('2023-02-28T10:00:00Z');
      const nextDate = (recurrenceService as any).calculateNextOccurrence(currentDate, rule);

      expect(nextDate.getFullYear()).toBe(2024);
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBe(28); // Should handle leap year correctly
    });
  });
});