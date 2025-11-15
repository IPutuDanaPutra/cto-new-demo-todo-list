import { Router } from 'express';
import { BulkOperationsController } from '../controllers/bulk-operations.controller';
import { authMiddleware, asyncHandler, validateRequest } from '../middleware';
import {
  BulkUpdateStatusSchema,
  BulkUpdatePrioritySchema,
  BulkUpdateDueDateSchema,
  BulkMoveToCategorySchema,
  BulkAssignTagsSchema,
  BulkDeleteSchema,
  BulkUpdateInputSchema,
} from '../schemas';

const router = Router();
const bulkOperationsController = new BulkOperationsController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Bulk update status
router.put(
  '/status',
  validateRequest(BulkUpdateStatusSchema),
  asyncHandler(bulkOperationsController.bulkUpdateStatus)
);

// Bulk update priority
router.put(
  '/priority',
  validateRequest(BulkUpdatePrioritySchema),
  asyncHandler(bulkOperationsController.bulkUpdatePriority)
);

// Bulk update due date
router.put(
  '/due-date',
  validateRequest(BulkUpdateDueDateSchema),
  asyncHandler(bulkOperationsController.bulkUpdateDueDate)
);

// Bulk move to category
router.put(
  '/category',
  validateRequest(BulkMoveToCategorySchema),
  asyncHandler(bulkOperationsController.bulkMoveToCategory)
);

// Bulk assign tags
router.put(
  '/tags',
  validateRequest(BulkAssignTagsSchema),
  asyncHandler(bulkOperationsController.bulkAssignTags)
);

// Bulk update (multiple fields)
router.put(
  '/update',
  validateRequest(BulkUpdateInputSchema),
  asyncHandler(bulkOperationsController.bulkUpdate)
);

// Bulk delete
router.delete(
  '/',
  validateRequest(BulkDeleteSchema),
  asyncHandler(bulkOperationsController.bulkDelete)
);

export default router;
