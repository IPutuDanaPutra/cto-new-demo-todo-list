import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../config';
import { ApiError } from '../utils';
import { CreateAttachmentInput, UpdateAttachmentInput } from '../schemas';
import { TodoRepository } from '../repositories';

export class AttachmentService {
  private prisma = getPrismaClient();
  private todoRepository = new TodoRepository();

  async createAttachment(
    todoId: string,
    userId: string,
    data: CreateAttachmentInput
  ) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to add attachments to this todo'
      );
    }

    const attachment = await this.prisma.attachment.create({
      data: {
        todo: { connect: { id: todoId } },
        user: { connect: { id: userId } },
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        ...(data.url && { url: data.url }),
      },
    });

    return attachment;
  }

  async getAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw ApiError.notFound('Attachment not found');
    }

    if (attachment.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to access this attachment'
      );
    }

    return attachment;
  }

  async listAttachments(todoId: string, userId: string) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to access this todo'
      );
    }

    return this.prisma.attachment.findMany({
      where: { todoId },
    });
  }

  async updateAttachment(
    attachmentId: string,
    userId: string,
    data: UpdateAttachmentInput
  ) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw ApiError.notFound('Attachment not found');
    }

    if (attachment.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this attachment'
      );
    }

    // Build update data, filtering out undefined values
    const updateData: Prisma.AttachmentUpdateInput = {};
    if (data.fileName !== undefined) {
      updateData.fileName = data.fileName;
    }
    if (data.url !== undefined) {
      updateData.url = data.url;
    }

    const updated = await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: updateData,
    });

    return updated;
  }

  async deleteAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw ApiError.notFound('Attachment not found');
    }

    if (attachment.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to delete this attachment'
      );
    }

    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });
  }
}
