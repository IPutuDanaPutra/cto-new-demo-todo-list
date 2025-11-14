import { Request, Response } from 'express';
import { CategoryService } from '../services';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategorySchema,
} from '../schemas';

const categoryService = new CategoryService();

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedData = createCategorySchema.parse(req.body);

  const category = await categoryService.createCategory(userId, validatedData);

  res.status(201).json({
    data: category,
    meta: {},
  });
};

export const getCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { categoryId } = req.params as { categoryId: string };

  const category = await categoryService.getCategory(categoryId, userId);

  res.status(200).json({
    data: category,
    meta: {},
  });
};

export const listCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';

  const categories = await categoryService.listCategories(userId);

  res.status(200).json({
    data: categories,
    meta: { total: categories.length },
  });
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { categoryId } = req.params as { categoryId: string };
  const validatedData = updateCategorySchema.parse(req.body);

  const category = await categoryService.updateCategory(
    categoryId,
    userId,
    validatedData
  );

  res.status(200).json({
    data: category,
    meta: {},
  });
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const { categoryId } = req.params as { categoryId: string };

  await categoryService.deleteCategory(categoryId, userId);

  res.status(204).send();
};

export const reorderCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedData = reorderCategorySchema.parse(req.body);

  const categories = await categoryService.reorderCategories(
    userId,
    validatedData
  );

  res.status(200).json({
    data: categories,
    meta: { total: categories.length },
  });
};
