import { Prisma } from '@prisma/client';
import { CategoryRepository } from '../repositories';
import { ApiError } from '../utils';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoryInput,
} from '../schemas';

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async createCategory(userId: string, data: CreateCategoryInput) {
    const existing = await this.categoryRepository.findByUserIdAndName(
      userId,
      data.name
    );

    if (existing) {
      throw ApiError.conflict('Category with this name already exists');
    }

    // Get max ordering
    const categories = await this.categoryRepository.findByUserId(userId);
    const maxOrdering = Math.max(...categories.map((c) => c.ordering), -1);

    const category = await this.categoryRepository.create({
      user: { connect: { id: userId } },
      name: data.name,
      color: data.color || '#3b82f6',
      ordering: maxOrdering + 1,
    });

    return category;
  }

  async getCategory(categoryId: string, userId: string) {
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (category.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to access this category'
      );
    }

    return category;
  }

  async listCategories(userId: string) {
    return this.categoryRepository.findByUserId(userId);
  }

  async updateCategory(
    categoryId: string,
    userId: string,
    data: UpdateCategoryInput
  ) {
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (category.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this category'
      );
    }

    // Check for duplicate name
    if (data.name && data.name !== category.name) {
      const existing = await this.categoryRepository.findByUserIdAndName(
        userId,
        data.name
      );
      if (existing) {
        throw ApiError.conflict('Category with this name already exists');
      }
    }

    // Build update data, filtering out undefined values
    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.color !== undefined) {
      updateData.color = data.color;
    }
    if (data.ordering !== undefined) {
      updateData.ordering = data.ordering;
    }

    const updated = await this.categoryRepository.update(
      categoryId,
      updateData
    );
    return updated;
  }

  async deleteCategory(categoryId: string, userId: string) {
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (category.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to delete this category'
      );
    }

    await this.categoryRepository.delete(categoryId);
  }

  async reorderCategories(userId: string, data: ReorderCategoryInput) {
    // Verify all categories belong to user
    for (const item of data.ordering) {
      const category = await this.categoryRepository.findById(item.id);
      if (!category || category.userId !== userId) {
        throw ApiError.forbidden('One or more categories do not belong to you');
      }
    }

    // Update all orderings in a transaction
    for (const item of data.ordering) {
      await this.categoryRepository.updateOrdering(item.id, item.ordering);
    }

    return this.categoryRepository.findByUserId(userId);
  }
}
