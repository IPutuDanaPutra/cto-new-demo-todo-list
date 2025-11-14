import { Router } from 'express';
import {
  getUserPreferences,
  updateUserPreferences,
  getViewPreferences,
  updateViewPreferences,
} from '../controllers';
import {
  asyncHandler,
  authMiddleware,
  validateRequest,
} from '../middleware';
import { userPreferencesSchema } from '../schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getUserPreferences));
router.patch('/', validateRequest(userPreferencesSchema), asyncHandler(updateUserPreferences));
router.get('/view/:viewType', asyncHandler(getViewPreferences));
router.patch('/view/:viewType', asyncHandler(updateViewPreferences));

export default router;