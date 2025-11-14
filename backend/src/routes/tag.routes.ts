import { Router } from 'express';
import {
  createTag,
  getTag,
  listTags,
  updateTag,
  deleteTag,
} from '../controllers';
import { asyncHandler, authMiddleware, validateRequest } from '../middleware';
import { createTagSchema, updateTagSchema } from '../schemas';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createTagSchema), asyncHandler(createTag));
router.get('/', asyncHandler(listTags));
router.get('/:tagId', asyncHandler(getTag));
router.patch(
  '/:tagId',
  validateRequest(updateTagSchema),
  asyncHandler(updateTag)
);
router.delete('/:tagId', asyncHandler(deleteTag));

export default router;
