import { Request, Response } from 'express';
import { TodoService } from '../services';
import {
  createTodoSchema,
  updateTodoSchema,
  duplicateTodoSchema,
  listTodoQuerySchema,
} from '../schemas';

const todoService = new TodoService();

export const createTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedData = createTodoSchema.parse(req.body);

  const todo = await todoService.createTodo(userId, validatedData);

  res.status(201).json({
    data: todo,
    meta: {},
  });
};

export const getTodo = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };

  const todo = await todoService.getTodo(todoId, userId);

  res.status(200).json({
    data: todo,
    meta: {},
  });
};

export const listTodos = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';
  const validatedQuery = listTodoQuerySchema.parse(req.query);

  const result = await todoService.listTodos(userId, validatedQuery);

  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
};

export const updateTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };
  const validatedData = updateTodoSchema.parse(req.body);

  const todo = await todoService.updateTodo(todoId, userId, validatedData);

  res.status(200).json({
    data: todo,
    meta: {},
  });
};

export const deleteTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };

  await todoService.deleteTodo(todoId, userId);

  res.status(204).send();
};

export const markComplete = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };

  const todo = await todoService.markComplete(todoId, userId);

  res.status(200).json({
    data: todo,
    meta: {},
  });
};

export const markIncomplete = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };

  const todo = await todoService.markIncomplete(todoId, userId);

  res.status(200).json({
    data: todo,
    meta: {},
  });
};

export const duplicateTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { todoId } = req.params as { todoId: string };
  const validatedData = duplicateTodoSchema.parse(req.body);

  const todo = await todoService.duplicateTodo(todoId, userId, validatedData);

  res.status(201).json({
    data: todo,
    meta: {},
  });
};

export const addTag = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';
  const { todoId, tagId } = req.params as { todoId: string; tagId: string };

  await todoService.addTag(todoId, tagId, userId);

  res.status(204).send();
};

export const removeTag = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || '';
  const { todoId, tagId } = req.params as { todoId: string; tagId: string };

  await todoService.removeTag(todoId, tagId, userId);

  res.status(204).send();
};
