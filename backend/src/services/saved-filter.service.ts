import { PrismaClient } from '@prisma/client';
import { CreateSavedFilterInput, UpdateSavedFilterInput } from '../schemas';

const prisma = new PrismaClient();

export class SavedFilterService {
  async getSavedFilters(userId: string): Promise<any[]> {
    // For now, store saved filters in user settings
    // In a real implementation, you might want a dedicated table
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        settings: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = user.settings as any || {};
    return settings.savedFilters || [];
  }

  async getSavedFilter(filterId: string, userId: string): Promise<any> {
    const filters = await this.getSavedFilters(userId);
    return filters.find((filter: any) => filter.id === filterId);
  }

  async createSavedFilter(
    userId: string,
    data: CreateSavedFilterInput
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = user.settings as any || {};
    const savedFilters = settings.savedFilters || [];

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      savedFilters.forEach((filter: any) => {
        filter.isDefault = false;
      });
    }

    const newFilter = {
      id: `filter_${Date.now()}`, // Simple ID generation
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savedFilters.push(newFilter);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        settings: {
          ...settings,
          savedFilters,
        },
      },
    });

    return newFilter;
  }

  async updateSavedFilter(
    filterId: string,
    userId: string,
    data: UpdateSavedFilterInput
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = user.settings as any || {};
    let savedFilters = settings.savedFilters || [];

    const filterIndex = savedFilters.findIndex((filter: any) => filter.id === filterId);

    if (filterIndex === -1) {
      throw new Error('Saved filter not found');
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      savedFilters.forEach((filter: any, index: number) => {
        if (index !== filterIndex) {
          filter.isDefault = false;
        }
      });
    }

    savedFilters[filterIndex] = {
      ...savedFilters[filterIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        settings: {
          ...settings,
          savedFilters,
        },
      },
    });

    return savedFilters[filterIndex];
  }

  async deleteSavedFilter(filterId: string, userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = user.settings as any || {};
    let savedFilters = settings.savedFilters || [];

    savedFilters = savedFilters.filter((filter: any) => filter.id !== filterId);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        settings: {
          ...settings,
          savedFilters,
        },
      },
    });
  }
}