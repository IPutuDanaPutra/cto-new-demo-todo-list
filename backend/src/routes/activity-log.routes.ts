import { Router } from 'express';
import {
  getActivityLogs,
  createActivityLog,
} from '../controllers';
import {
  asyncHandler,
  authMiddleware,
  validateQuery,
  validateRequest,
} from '../middleware';
import { activityLogQuerySchema } from '../schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(activityLogQuerySchema), asyncHandler(getActivityLogs));
router.post('/', asyncHandler(createActivityLog));

export default router;