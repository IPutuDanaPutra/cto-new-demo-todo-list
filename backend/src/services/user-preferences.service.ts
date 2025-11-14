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
      defaultView: 'LIST',
      theme: 'system',
      timezone: 'UTC',
      workHoursStart: '09:00',
      workHoursEnd: '17:00',
      defaultReminderLeadTime: 15,
      weekStartsOn: '1', // Monday
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
      ...(user.settings as any || {}),
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
}