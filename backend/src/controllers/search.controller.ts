import { Request, Response } from 'express';
import { SearchService } from '../services';
import { searchQuerySchema } from '../schemas';

const searchService = new SearchService();

export const searchTodos = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId || '';
  const validatedQuery = searchQuerySchema.parse(req.query);

  const result = await searchService.searchTodos(userId, validatedQuery);

  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
};