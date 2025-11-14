import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers';
import { asyncHandler, authMiddleware, validateRequest } from '../middleware';
import { updateUserProfileSchema } from '../schemas';

const router = Router();

router.use(authMiddleware);

router.get('/profile', asyncHandler(getProfile));
router.patch(
  '/profile',
  validateRequest(updateUserProfileSchema),
  asyncHandler(updateProfile)
);

export default router;
