import { Router } from 'express';
import {
  createRecurrenceRule,
  getRecurrenceRule,
  updateRecurrenceRule,
  deleteRecurrenceRule,
  generateNextOccurrences,
  applyRecurrenceToTodo,
} from '../controllers';
import {
  asyncHandler,
  authMiddleware,
  validateRequest,
} from '../middleware';
import {
  createRecurrenceRuleSchema,
  updateRecurrenceRuleSchema,
} from '../schemas';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createRecurrenceRuleSchema), asyncHandler(createRecurrenceRule));
router.get('/:ruleId', asyncHandler(getRecurrenceRule));
router.patch('/:ruleId', validateRequest(updateRecurrenceRuleSchema), asyncHandler(updateRecurrenceRule));
router.delete('/:ruleId', asyncHandler(deleteRecurrenceRule));
router.get('/:ruleId/occurrences', asyncHandler(generateNextOccurrences));
router.post('/apply/:todoId', asyncHandler(applyRecurrenceToTodo));

export default router;