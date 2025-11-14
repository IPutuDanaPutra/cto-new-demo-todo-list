import { Router } from 'express';
import {
  createTodo,
  getTodo,
  listTodos,
  updateTodo,
  deleteTodo,
  markComplete,
  markIncomplete,
  duplicateTodo,
  addTag,
  removeTag,
} from '../controllers';
import {
  asyncHandler,
  authMiddleware,
  validateRequest,
  validateQuery,
} from '../middleware';
import {
  createTodoSchema,
  updateTodoSchema,
  duplicateTodoSchema,
  listTodoQuerySchema,
} from '../schemas';

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest(createTodoSchema), asyncHandler(createTodo));
router.get('/', validateQuery(listTodoQuerySchema), asyncHandler(listTodos));
router.get('/:todoId', asyncHandler(getTodo));
router.patch(
  '/:todoId',
  validateRequest(updateTodoSchema),
  asyncHandler(updateTodo)
);
router.delete('/:todoId', asyncHandler(deleteTodo));
router.post('/:todoId/complete', asyncHandler(markComplete));
router.post('/:todoId/incomplete', asyncHandler(markIncomplete));
router.post(
  '/:todoId/duplicate',
  validateRequest(duplicateTodoSchema),
  asyncHandler(duplicateTodo)
);
router.post('/:todoId/tags/:tagId', asyncHandler(addTag));
router.delete('/:todoId/tags/:tagId', asyncHandler(removeTag));

export default router;
