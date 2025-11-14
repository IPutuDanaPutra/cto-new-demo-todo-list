import { Category, Prisma } from '@prisma/client';
import { getPrismaClient } from '../config';

export class CategoryRepository {
  private prisma = getPrismaClient();

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { ordering: 'asc' },
    });
  }

  async findByUserIdAndName(
    userId: string,
    name: string
  ): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { userId_name: { userId, name } },
    });
  }

  async update(
    id: string,
    data: Prisma.CategoryUpdateInput
  ): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }

  async updateOrdering(id: string, ordering: number): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: { ordering },
    });
  }
}
