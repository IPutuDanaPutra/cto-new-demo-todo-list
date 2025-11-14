import { Router } from 'express';
import {
  createAttachment,
  getAttachment,
  listAttachments,
  updateAttachment,
  deleteAttachment,
} from '../controllers';
import { asyncHandler, authMiddleware, validateRequest } from '../middleware';
import { createAttachmentSchema, updateAttachmentSchema } from '../schemas';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post(
  '/',
  validateRequest(createAttachmentSchema),
  asyncHandler(createAttachment)
);
router.get('/', asyncHandler(listAttachments));
router.get('/:attachmentId', asyncHandler(getAttachment));
router.patch(
  '/:attachmentId',
  validateRequest(updateAttachmentSchema),
  asyncHandler(updateAttachment)
);
router.delete('/:attachmentId', asyncHandler(deleteAttachment));

export default router;
