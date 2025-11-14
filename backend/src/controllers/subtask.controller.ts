import { Request, Response } from 'express';
import { SubtaskService } from '../services';
import {
  createSubtaskSchema,
  updateSubtaskSchema,
  reorderSubtaskSchema,
} from '../schemas';
import { z } from 'zod';

const subtaskService = new SubtaskService();

const toggleSubtaskSchema = z.object({
  completed: z.boolean(),
});

export const createSubtask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };
  const validatedData = createSubtaskSchema.parse(req.body);

  const subtask = await subtaskService.createSubtask(
    todoId,
    userId,
    validatedData
  );

  res.status(201).json({
    data: subtask,
    meta: {},
  });
};

export const getSubtask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { subtaskId } = req.params as { subtaskId: string };

  const subtask = await subtaskService.getSubtask(subtaskId, userId);

  res.status(200).json({
    data: subtask,
    meta: {},
  });
};

export const listSubtasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };

  const subtasks = await subtaskService.listSubtasks(todoId, userId);

  res.status(200).json({
    data: subtasks,
    meta: { total: subtasks.length },
  });
};

export const updateSubtask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { subtaskId } = req.params as { subtaskId: string };
  const validatedData = updateSubtaskSchema.parse(req.body);

  const subtask = await subtaskService.updateSubtask(
    subtaskId,
    userId,
    validatedData
  );

  res.status(200).json({
    data: subtask,
    meta: {},
  });
};

export const deleteSubtask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { subtaskId } = req.params as { subtaskId: string };

  await subtaskService.deleteSubtask(subtaskId, userId);

  res.status(204).send();
};

export const reorderSubtasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };
  const validatedData = reorderSubtaskSchema.parse(req.body);

  const subtasks = await subtaskService.reorderSubtasks(
    todoId,
    userId,
    validatedData
  );

  res.status(200).json({
    data: subtasks,
    meta: { total: subtasks.length },
  });
};

export const toggleSubtask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { subtaskId } = req.params as { subtaskId: string };
  const validatedData = toggleSubtaskSchema.parse(req.body);

  const subtask = await subtaskService.toggleSubtask(
    subtaskId,
    userId,
    validatedData.completed
  );

  res.status(200).json({
    data: subtask,
    meta: {},
  });
};
