import { Router } from 'express';
import {
  getAnalyticsSummary,
  getProductivityMetrics,
} from '../controllers';
import {
  asyncHandler,
  authMiddleware,
} from '../middleware';

const router = Router();

router.use(authMiddleware);

router.get('/summary', asyncHandler(getAnalyticsSummary));
router.get('/productivity', asyncHandler(getProductivityMetrics));

export default router;