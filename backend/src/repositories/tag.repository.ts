import { Tag, Prisma } from '@prisma/client';
import { getPrismaClient } from '../config';

export class TagRepository {
  private prisma = getPrismaClient();

  async create(data: Prisma.TagCreateInput): Promise<Tag> {
    return this.prisma.tag.create({ data });
  }

  async findById(id: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { userId },
    });
  }

  async findByUserIdAndName(userId: string, name: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({
      where: { userId_name: { userId, name } },
    });
  }

  async update(id: string, data: Prisma.TagUpdateInput): Promise<Tag> {
    return this.prisma.tag.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Tag> {
    return this.prisma.tag.delete({ where: { id } });
  }
}
