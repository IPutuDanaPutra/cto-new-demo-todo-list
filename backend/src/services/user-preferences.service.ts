import { PrismaClient } from '@prisma/client';
import { UserPreferencesInput } from '../schemas';

const prisma = new PrismaClient();

export class UserPreferencesService {
  async getUserPreferences(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Merge default settings with user's custom settings
    const defaultSettings = {
      // UI Preferences
      defaultView: 'LIST',
      theme: 'system',
      compactMode: false,
      showCompletedTodos: true,
      
      // Time & Date Preferences
      timezone: 'UTC',
      weekStartsOn: '1', // Monday
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h', // 12h or 24h
      
      // Work Hours
      workHoursStart: '09:00',
      workHoursEnd: '17:00',
      workDays: [1, 2, 3, 4, 5], // Monday to Friday
      
      // Reminder Preferences
      defaultReminderLeadTime: 15, // minutes
      defaultReminderChannel: 'IN_APP',
      enableEmailReminders: false,
      enablePushReminders: true,
      
      // Notification Preferences
      notifyOnDueDate: true,
      notifyOnOverdue: true,
      notifyOnAssignment: true,
      notifyOnComments: true,
      
      // Productivity Preferences
      enableStreaks: true,
      enableAnalytics: true,
      showTimeTracking: false,
      
      // Default Values for New Todos
      defaultPriority: 'MEDIUM',
      defaultCategory: null,
      defaultTags: [],
      autoCreateReminders: true,
      
      // Advanced Features
      enableBulkOperations: true,
      enableAdvancedSearch: true,
      enableRecurrence: true,
      
      // Privacy & Security
      shareAnalytics: false,
      publicProfile: false,
    };

    return {
      ...user,
      preferences: {
        ...defaultSettings,
        ...user.settings,
      },
    };
  }

  async updateUserPreferences(
    userId: string,
    data: UserPreferencesInput
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedSettings = {
      ...(user.settings as Record<string, any> || {}),
      ...data,
    };

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        settings: updatedSettings,
        timezone: data.timezone || user.timezone,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updatedUser,
      preferences: updatedSettings,
    };
  }

  async getViewPreferences(
    userId: string,
    viewType: string
  ): Promise<any> {
    const preference = await prisma.viewPreference.findUnique({
      where: {
        userId_viewType: {
          userId,
          viewType: viewType as any,
        },
      },
    });

    if (!preference) {
      // Return default preferences
      return {
        viewType,
        filters: {},
        sorting: {
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      };
    }

    return {
      viewType: preference.viewType,
      filters: preference.filters,
      sorting: preference.sorting,
    };
  }

  async updateViewPreferences(
    userId: string,
    viewType: string,
    filters: any,
    sorting: any
  ): Promise<any> {
    return await prisma.viewPreference.upsert({
      where: {
        userId_viewType: {
          userId,
          viewType: viewType as any,
        },
      },
      update: {
        filters,
        sorting,
      },
      create: {
        userId,
        viewType: viewType as any,
        filters,
        sorting,
      },
    });
  }

  async getDefaultTodoValues(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true, timezone: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = { ...(user.settings as any || {}) };
    
    return {
      priority: settings.defaultPriority || 'MEDIUM',
      reminderLeadTime: settings.defaultReminderLeadTime || 15,
      autoCreateReminders: settings.autoCreateReminders !== false,
      defaultReminderChannel: settings.defaultReminderChannel || 'IN_APP',
      defaultCategory: settings.defaultCategory,
      defaultTags: settings.defaultTags || [],
    };
  }

  async applyDefaultsToTodoData(userId: string, todoData: any): Promise<any> {
    const defaults = await this.getDefaultTodoValues(userId);
    
    return {
      ...todoData,
      priority: todoData.priority || defaults.priority,
      reminderLeadTime: todoData.reminderLeadTime ?? defaults.reminderLeadTime,
      categoryId: todoData.categoryId || defaults.defaultCategory,
    };
  }

  async getUserWorkingHours(userId: string): Promise<{
    workHoursStart: string;
    workHoursEnd: string;
    workDays: number[];
    timezone: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true, timezone: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = { ...(user.settings as any || {}) };
    
    return {
      workHoursStart: settings.workHoursStart || '09:00',
      workHoursEnd: settings.workHoursEnd || '17:00',
      workDays: settings.workDays || [1, 2, 3, 4, 5],
      timezone: user.timezone || 'UTC',
    };
  }

  async isWorkingHours(userId: string, date: Date = new Date()): Promise<boolean> {
    const workingHours = await this.getUserWorkingHours(userId);
    
    // Convert date to user's timezone
    const userDate = new Date(date.toLocaleString("en-US", { timeZone: workingHours.timezone }));
    
    const dayOfWeek = userDate.getDay();
    const currentTime = userDate.getHours() * 60 + userDate.getMinutes();
    
    const [startHour, startMin] = workingHours.workHoursStart.split(':').map(Number) as [number, number];
    const [endHour, endMin] = workingHours.workHoursEnd.split(':').map(Number) as [number, number];
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return workingHours.workDays.includes(dayOfWeek) && currentTime >= startTime && currentTime <= endTime;
  }

  async getUserNotificationPreferences(userId: string): Promise<{
    enableEmailReminders: boolean;
    enablePushReminders: boolean;
    notifyOnDueDate: boolean;
    notifyOnOverdue: boolean;
    notifyOnAssignment: boolean;
    notifyOnComments: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = { ...(user.settings as any || {}) };
    
    return {
      enableEmailReminders: settings.enableEmailReminders || false,
      enablePushReminders: settings.enablePushReminders !== false,
      notifyOnDueDate: settings.notifyOnDueDate !== false,
      notifyOnOverdue: settings.notifyOnOverdue !== false,
      notifyOnAssignment: settings.notifyOnAssignment !== false,
      notifyOnComments: settings.notifyOnComments !== false,
    };
  }

  async shouldCreateReminder(userId: string, todoData: any): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    const defaults = await this.getDefaultTodoValues(userId);
    
    // Check if user has auto-create reminders enabled
    if (todoData.autoCreateReminders === false || !preferences.preferences.autoCreateReminders) {
      return false;
    }
    
    // Check if todo has due date
    if (!todoData.dueDate) {
      return false;
    }
    
    // Check if reminder lead time is set
    const leadTime = todoData.reminderLeadTime ?? defaults.reminderLeadTime;
    if (!leadTime || leadTime <= 0) {
      return false;
    }
    
    return true;
  }
}