import { Router } from 'express';
import {
  createReminder,
  getReminder,
  getRemindersByTodo,
  getUpcomingReminders,
  updateReminder,
  deleteReminder,
} from '../controllers';
import {
  asyncHandler,
  authMiddleware,
  validateRequest,
} from '../middleware';
import {
  createReminderSchema,
  updateReminderSchema,
} from '../schemas';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createReminderSchema), asyncHandler(createReminder));
router.get('/upcoming', asyncHandler(getUpcomingReminders));
router.get('/:reminderId', asyncHandler(getReminder));
router.patch('/:reminderId', validateRequest(updateReminderSchema), asyncHandler(updateReminder));
router.delete('/:reminderId', asyncHandler(deleteReminder));
router.get('/todo/:todoId', asyncHandler(getRemindersByTodo));

export default router;