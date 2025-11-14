import { Router } from 'express';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';
import todoRoutes from './todo.routes';
import categoryRoutes from './category.routes';
import tagRoutes from './tag.routes';
import subtaskRoutes from './subtask.routes';
import attachmentRoutes from './attachment.routes';
import activityLogRoutes from './activity-log.routes';
import searchRoutes from './search.routes';
import reminderRoutes from './reminder.routes';
import recurrenceRoutes from './recurrence.routes';
import userPreferencesRoutes from './user-preferences.routes';
import savedFilterRoutes from './saved-filter.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/todos', todoRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/todos/:todoId/subtasks', subtaskRoutes);
router.use('/todos/:todoId/attachments', attachmentRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/search', searchRoutes);
router.use('/reminders', reminderRoutes);
router.use('/recurrence', recurrenceRoutes);
router.use('/user-preferences', userPreferencesRoutes);
router.use('/saved-filters', savedFilterRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
