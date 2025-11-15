import { Request, Response } from 'express';
import { BulkOperationsService } from '../services/bulk-operations.service';
import {
  BulkUpdateStatusInput,
  BulkUpdatePriorityInput,
  BulkUpdateDueDateInput,
  BulkMoveToCategoryInput,
  BulkAssignTagsInput,
  BulkDeleteInput,
  BulkUpdateInput,
} from '../schemas';

export class BulkOperationsController {
  private bulkOperationsService: BulkOperationsService;

  constructor() {
    this.bulkOperationsService = new BulkOperationsService();
  }

  bulkUpdateStatus = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const input: BulkUpdateStatusInput = req.body;

    const result = await this.bulkOperationsService.bulkUpdateStatus(
      userId,
      input.todoIds,
      input.status
    );

    res.status(200).json({
      data: result,
      meta: {},
    });
  };

  bulkUpdatePriority = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const input: BulkUpdatePriorityInput = req.body;

    const result = await this.bulkOperationsService.bulkUpdatePriority(
      userId,
      input.todoIds,
      input.priority
    );

    res.status(200).json({
      data: result,
      meta: {},
    });
  };

  bulkUpdateDueDate = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const input: BulkUpdateDueDateInput = req.body;

    const result = await this.bulkOperationsService.bulkUpdateDueDate(
      userId,
      input.todoIds,
      input.dueDate || null
    );

    res.status(200).json({
      data: result,
      meta: {},
    });
  };

  bulkMoveToCategory = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const input: BulkMoveToCategoryInput = req.body;

    const result = await this.bulkOperationsService.bulkMoveToCategory(
      userId,
      input.todoIds,
      input.categoryId || null
    );

    res.status(200).json({
      data: result,
      meta: {},
    });
  };

  bulkAssignTags = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const input: BulkAssignTagsInput = req.body;

    const result = await this.bulkOperationsService.bulkAssignTags(
      userId,
      input.todoIds,
      input.tagIds,
      input.action
    );

    res.status(200).json({
      data: result,
      meta: {},
    });
  };

  bulkDelete = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const input: BulkDeleteInput = req.body;

    const result = await this.bulkOperationsService.bulkDelete(
      userId,
      input.todoIds
    );

    res.status(200).json({
      data: result,
      meta: {},
    });
  };

  bulkUpdate = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const input: BulkUpdateInput = req.body;

    const result = await this.bulkOperationsService.bulkUpdate(userId, input);

    res.status(200).json({
      data: result,
      meta: {},
    });
  };
}
