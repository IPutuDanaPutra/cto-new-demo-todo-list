import { Router } from 'express';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';
import todoRoutes from './todo.routes';
import categoryRoutes from './category.routes';
import tagRoutes from './tag.routes';
import subtaskRoutes from './subtask.routes';
import attachmentRoutes from './attachment.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/todos', todoRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/todos/:todoId/subtasks', subtaskRoutes);
router.use('/todos/:todoId/attachments', attachmentRoutes);

export default router;
