import { Router } from 'express';
import {
  createCategory,
  getCategory,
  listCategories,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../controllers';
import { asyncHandler, authMiddleware, validateRequest } from '../middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategorySchema,
} from '../schemas';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  validateRequest(createCategorySchema),
  asyncHandler(createCategory)
);
router.get('/', asyncHandler(listCategories));
router.get('/:categoryId', asyncHandler(getCategory));
router.patch(
  '/:categoryId',
  validateRequest(updateCategorySchema),
  asyncHandler(updateCategory)
);
router.delete('/:categoryId', asyncHandler(deleteCategory));
router.post(
  '/reorder',
  validateRequest(reorderCategorySchema),
  asyncHandler(reorderCategories)
);

export default router;
