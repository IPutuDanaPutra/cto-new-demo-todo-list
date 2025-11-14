import { Router } from 'express';
import { searchTodos } from '../controllers';
import {
  asyncHandler,
  authMiddleware,
  validateQuery,
} from '../middleware';
import { searchQuerySchema } from '../schemas';

const router = Router();

router.use(authMiddleware);

router.get('/todos', validateQuery(searchQuerySchema), asyncHandler(searchTodos));

export default router;