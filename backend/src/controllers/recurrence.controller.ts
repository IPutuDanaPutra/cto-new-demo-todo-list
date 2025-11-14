import { Request, Response } from 'express';
import { RecurrenceService } from '../services';
import {
  createRecurrenceRuleSchema,
  updateRecurrenceRuleSchema,
} from '../schemas';

const recurrenceService = new RecurrenceService();

export const createRecurrenceRule = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validatedData = createRecurrenceRuleSchema.parse(req.body);

  const rule = await recurrenceService.createRecurrenceRule(validatedData);

  res.status(201).json({
    data: rule,
    meta: {},
  });
};

export const getRecurrenceRule = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ruleId } = req.params as { ruleId: string };

  const rule = await recurrenceService.getRecurrenceRule(ruleId);

  res.status(200).json({
    data: rule,
    meta: {},
  });
};

export const updateRecurrenceRule = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ruleId } = req.params as { ruleId: string };
  const validatedData = updateRecurrenceRuleSchema.parse(req.body);

  const rule = await recurrenceService.updateRecurrenceRule(ruleId, validatedData);

  res.status(200).json({
    data: rule,
    meta: {},
  });
};

export const deleteRecurrenceRule = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ruleId } = req.params as { ruleId: string };

  await recurrenceService.deleteRecurrenceRule(ruleId);

  res.status(204).send();
};

export const generateNextOccurrences = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ruleId } = req.params as { ruleId: string };
  const { fromDate = new Date().toISOString(), count = 10 } = req.query as {
    fromDate?: string;
    count?: string;
  };

  const occurrences = await recurrenceService.generateNextOccurrences(
    ruleId,
    new Date(fromDate),
    parseInt(count)
  );

  res.status(200).json({
    data: occurrences,
    meta: {},
  });
};

export const applyRecurrenceToTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };

  const newTodo = await recurrenceService.applyRecurrenceToTodo(todoId, userId);

  if (!newTodo) {
    res.status(400).json({
      error: 'Unable to apply recurrence to todo',
      meta: {},
    });
    return;
  }

  res.status(201).json({
    data: newTodo,
    meta: {},
  });
};