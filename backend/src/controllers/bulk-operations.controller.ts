import { Request, Response } from 'express';
import { BulkOperationsService } from '../services/bulk-operations.service';
import { 
  BulkUpdateStatusInput, 
  BulkUpdatePriorityInput, 
  BulkUpdateDueDateInput,
  BulkMoveToCategoryInput,
  BulkAssignTagsInput,
  BulkDeleteInput,
  BulkUpdateInput
} from '../schemas';
import { validateRequest } from '../middleware/validation';
import { ApiError } from '../utils/api-error';
import { logger } from '../config/logger';

export class BulkOperationsController {
  private bulkOperationsService: BulkOperationsService;

  constructor() {
    this.bulkOperationsService = new BulkOperationsService();
  }

  bulkUpdateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input: BulkUpdateStatusInput = req.body;

      const result = await this.bulkOperationsService.bulkUpdateStatus(
        userId,
        input.todoIds,
        input.status
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Updated status for ${result.updated} todos${result.failed.length > 0 ? ` (${result.failed.length} failed)` : ''}`,
      });
    } catch (error) {
      logger.error('Error in bulkUpdateStatus:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  bulkUpdatePriority = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input: BulkUpdatePriorityInput = req.body;

      const result = await this.bulkOperationsService.bulkUpdatePriority(
        userId,
        input.todoIds,
        input.priority
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Updated priority for ${result.updated} todos${result.failed.length > 0 ? ` (${result.failed.length} failed)` : ''}`,
      });
    } catch (error) {
      logger.error('Error in bulkUpdatePriority:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  bulkUpdateDueDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input: BulkUpdateDueDateInput = req.body;

      const result = await this.bulkOperationsService.bulkUpdateDueDate(
        userId,
        input.todoIds,
        input.dueDate || null
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Updated due date for ${result.updated} todos${result.failed.length > 0 ? ` (${result.failed.length} failed)` : ''}`,
      });
    } catch (error) {
      logger.error('Error in bulkUpdateDueDate:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  bulkMoveToCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input: BulkMoveToCategoryInput = req.body;

      const result = await this.bulkOperationsService.bulkMoveToCategory(
        userId,
        input.todoIds,
        input.categoryId || null
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Moved ${result.updated} todos to category${result.failed.length > 0 ? ` (${result.failed.length} failed)` : ''}`,
      });
    } catch (error) {
      logger.error('Error in bulkMoveToCategory:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  bulkAssignTags = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input: BulkAssignTagsInput = req.body;

      const result = await this.bulkOperationsService.bulkAssignTags(
        userId,
        input.todoIds,
        input.tagIds,
        input.action
      );

      const actionMessages = {
        add: 'added tags to',
        remove: 'removed tags from',
        replace: 'replaced tags for',
      };

      res.status(200).json({
        success: true,
        data: result,
        message: `${actionMessages[input.action]} ${result.updated} todos${result.failed.length > 0 ? ` (${result.failed.length} failed)` : ''}`,
      });
    } catch (error) {
      logger.error('Error in bulkAssignTags:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  bulkDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input: BulkDeleteInput = req.body;

      const result = await this.bulkOperationsService.bulkDelete(
        userId,
        input.todoIds
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Deleted ${result.deleted} todos${result.failed.length > 0 ? ` (${result.failed.length} failed)` : ''}`,
      });
    } catch (error) {
      logger.error('Error in bulkDelete:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  bulkUpdate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input: BulkUpdateInput = req.body;

      const result = await this.bulkOperationsService.bulkUpdate(
        userId,
        input
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Updated ${result.updated} todos${result.failed.length > 0 ? ` (${result.failed.length} failed)` : ''}`,
      });
    } catch (error) {
      logger.error('Error in bulkUpdate:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };
}