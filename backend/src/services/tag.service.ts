import { TagRepository } from '../repositories';
import { ApiError } from '../utils';
import { CreateTagInput, UpdateTagInput } from '../schemas';

export class TagService {
  private tagRepository = new TagRepository();

  async createTag(userId: string, data: CreateTagInput) {
    const existing = await this.tagRepository.findByUserIdAndName(
      userId,
      data.name
    );

    if (existing) {
      throw ApiError.conflict('Tag with this name already exists');
    }

    const tag = await this.tagRepository.create({
      user: { connect: { id: userId } },
      name: data.name,
      color: data.color || '#10b981',
    });

    return tag;
  }

  async getTag(tagId: string, userId: string) {
    const tag = await this.tagRepository.findById(tagId);

    if (!tag) {
      throw ApiError.notFound('Tag not found');
    }

    if (tag.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to access this tag');
    }

    return tag;
  }

  async listTags(userId: string) {
    return this.tagRepository.findByUserId(userId);
  }

  async updateTag(tagId: string, userId: string, data: UpdateTagInput) {
    const tag = await this.tagRepository.findById(tagId);

    if (!tag) {
      throw ApiError.notFound('Tag not found');
    }

    if (tag.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to update this tag');
    }

    // Check for duplicate name
    if (data.name && data.name !== tag.name) {
      const existing = await this.tagRepository.findByUserIdAndName(
        userId,
        data.name
      );
      if (existing) {
        throw ApiError.conflict('Tag with this name already exists');
      }
    }

    // Build update data, filtering out undefined values
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;

    const updated = await this.tagRepository.update(tagId, updateData);
    return updated;
  }

  async deleteTag(tagId: string, userId: string) {
    const tag = await this.tagRepository.findById(tagId);

    if (!tag) {
      throw ApiError.notFound('Tag not found');
    }

    if (tag.userId !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this tag');
    }

    await this.tagRepository.delete(tagId);
  }
}
