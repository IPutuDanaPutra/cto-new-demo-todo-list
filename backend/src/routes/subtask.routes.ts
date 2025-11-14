import { Router } from 'express';
import {
  createSubtask,
  getSubtask,
  listSubtasks,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks,
  toggleSubtask,
} from '../controllers';
import { asyncHandler, authMiddleware, validateRequest } from '../middleware';
import {
  createSubtaskSchema,
  updateSubtaskSchema,
  reorderSubtaskSchema,
} from '../schemas';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post(
  '/',
  validateRequest(createSubtaskSchema),
  asyncHandler(createSubtask)
);
router.get('/', asyncHandler(listSubtasks));
router.get('/:subtaskId', asyncHandler(getSubtask));
router.patch(
  '/:subtaskId',
  validateRequest(updateSubtaskSchema),
  asyncHandler(updateSubtask)
);
router.delete('/:subtaskId', asyncHandler(deleteSubtask));
router.post(
  '/reorder',
  validateRequest(reorderSubtaskSchema),
  asyncHandler(reorderSubtasks)
);
router.patch(
  '/:subtaskId/toggle',
  validateRequest(updateSubtaskSchema),
  asyncHandler(toggleSubtask)
);

export default router;
