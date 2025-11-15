import { Router } from 'express';
import { BulkOperationsController } from '../controllers/bulk-operations.controller';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
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
router.use(authenticateToken);

// Bulk update status
router.put(
  '/status',
  validateRequest(BulkUpdateStatusSchema),
  bulkOperationsController.bulkUpdateStatus
);

// Bulk update priority
router.put(
  '/priority',
  validateRequest(BulkUpdatePrioritySchema),
  bulkOperationsController.bulkUpdatePriority
);

// Bulk update due date
router.put(
  '/due-date',
  validateRequest(BulkUpdateDueDateSchema),
  bulkOperationsController.bulkUpdateDueDate
);

// Bulk move to category
router.put(
  '/category',
  validateRequest(BulkMoveToCategorySchema),
  bulkOperationsController.bulkMoveToCategory
);

// Bulk assign tags
router.put(
  '/tags',
  validateRequest(BulkAssignTagsSchema),
  bulkOperationsController.bulkAssignTags
);

// Bulk update (multiple fields)
router.put(
  '/update',
  validateRequest(BulkUpdateInputSchema),
  bulkOperationsController.bulkUpdate
);

// Bulk delete
router.delete(
  '/',
  validateRequest(BulkDeleteSchema),
  bulkOperationsController.bulkDelete
);

export default router;