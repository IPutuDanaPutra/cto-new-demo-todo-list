import { Router } from 'express';
import {
  getSavedFilters,
  getSavedFilter,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
} from '../controllers';
import {
  asyncHandler,
  authMiddleware,
  validateRequest,
} from '../middleware';
import {
  createSavedFilterSchema,
  updateSavedFilterSchema,
} from '../schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getSavedFilters));
router.post('/', validateRequest(createSavedFilterSchema), asyncHandler(createSavedFilter));
router.get('/:filterId', asyncHandler(getSavedFilter));
router.patch('/:filterId', validateRequest(updateSavedFilterSchema), asyncHandler(updateSavedFilter));
router.delete('/:filterId', asyncHandler(deleteSavedFilter));

export default router;