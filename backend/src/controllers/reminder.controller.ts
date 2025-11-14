import { Request, Response } from 'express';
import { ReminderService } from '../services';
import {
  createReminderSchema,
  updateReminderSchema,
} from '../schemas';

const reminderService = new ReminderService();

export const createReminder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedData = createReminderSchema.parse(req.body);

  const reminder = await reminderService.createReminder(userId, validatedData);

  res.status(201).json({
    data: reminder,
    meta: {},
  });
};

export const getReminder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { reminderId } = req.params as { reminderId: string };

  const reminder = await reminderService.getReminder(reminderId, userId);

  res.status(200).json({
    data: reminder,
    meta: {},
  });
};

export const getRemindersByTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };

  const reminders = await reminderService.getRemindersByTodo(todoId, userId);

  res.status(200).json({
    data: reminders,
    meta: {},
  });
};

export const getUpcomingReminders = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { hours = 24 } = req.query as { hours?: string };

  const reminders = await reminderService.getUpcomingReminders(
    userId,
    parseInt(hours)
  );

  res.status(200).json({
    data: reminders,
    meta: {},
  });
};

export const updateReminder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { reminderId } = req.params as { reminderId: string };
  const validatedData = updateReminderSchema.parse(req.body);

  const reminder = await reminderService.updateReminder(
    reminderId,
    userId,
    validatedData
  );

  res.status(200).json({
    data: reminder,
    meta: {},
  });
};

export const deleteReminder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { reminderId } = req.params as { reminderId: string };

  await reminderService.deleteReminder(reminderId, userId);

  res.status(204).send();
};