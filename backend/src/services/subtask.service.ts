import { Prisma } from '@prisma/client';
import { SubtaskRepository, TodoRepository } from '../repositories';
import { ApiError } from '../utils';
import {
  CreateSubtaskInput,
  UpdateSubtaskInput,
  ReorderSubtaskInput,
} from '../schemas';

export class SubtaskService {
  private subtaskRepository = new SubtaskRepository();
  private todoRepository = new TodoRepository();

  async createSubtask(
    todoId: string,
    userId: string,
    data: CreateSubtaskInput
  ) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to add subtasks to this todo'
      );
    }

    // Get max ordering
    const subtasks = await this.subtaskRepository.findByTodoId(todoId);
    const maxOrdering = Math.max(...subtasks.map((s) => s.ordering), -1);

    const subtask = await this.subtaskRepository.create({
      todo: { connect: { id: todoId } },
      user: { connect: { id: userId } },
      title: data.title,
      ordering: maxOrdering + 1,
    });

    return subtask;
  }

  async getSubtask(subtaskId: string, userId: string) {
    const subtask = await this.subtaskRepository.findById(subtaskId);

    if (!subtask) {
      throw ApiError.notFound('Subtask not found');
    }

    if (subtask.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to access this subtask'
      );
    }

    return subtask;
  }

  async listSubtasks(todoId: string, userId: string) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to access this todo'
      );
    }

    return this.subtaskRepository.findByTodoId(todoId);
  }

  async updateSubtask(
    subtaskId: string,
    userId: string,
    data: UpdateSubtaskInput
  ) {
    const subtask = await this.subtaskRepository.findById(subtaskId);

    if (!subtask) {
      throw ApiError.notFound('Subtask not found');
    }

    if (subtask.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this subtask'
      );
    }

    // Build update data, filtering out undefined values
    const updateData: Prisma.SubtaskUpdateInput = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.completed !== undefined) {
      updateData.completed = data.completed;
    }
    if (data.ordering !== undefined) {
      updateData.ordering = data.ordering;
    }

    const updated = await this.subtaskRepository.update(subtaskId, updateData);
    return updated;
  }

  async deleteSubtask(subtaskId: string, userId: string) {
    const subtask = await this.subtaskRepository.findById(subtaskId);

    if (!subtask) {
      throw ApiError.notFound('Subtask not found');
    }

    if (subtask.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to delete this subtask'
      );
    }

    await this.subtaskRepository.delete(subtaskId);
  }

  async reorderSubtasks(
    todoId: string,
    userId: string,
    data: ReorderSubtaskInput
  ) {
    const todo = await this.todoRepository.findById(todoId);

    if (!todo) {
      throw ApiError.notFound('Todo not found');
    }

    if (todo.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this todo'
      );
    }

    // Verify all subtasks belong to todo
    for (const item of data.ordering) {
      const subtask = await this.subtaskRepository.findById(item.id);
      if (!subtask || subtask.todoId !== todoId) {
        throw ApiError.forbidden(
          'One or more subtasks do not belong to this todo'
        );
      }
    }

    // Update all orderings
    for (const item of data.ordering) {
      await this.subtaskRepository.reorder(item.id, item.ordering);
    }

    return this.subtaskRepository.findByTodoId(todoId);
  }

  async toggleSubtask(subtaskId: string, userId: string, completed: boolean) {
    const subtask = await this.subtaskRepository.findById(subtaskId);

    if (!subtask) {
      throw ApiError.notFound('Subtask not found');
    }

    if (subtask.userId !== userId) {
      throw ApiError.forbidden(
        'You do not have permission to update this subtask'
      );
    }

    return this.subtaskRepository.toggleComplete(subtaskId, completed);
  }
}
