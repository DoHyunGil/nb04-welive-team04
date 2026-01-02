// src/notification/controllers/notification.controller.ts
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { NotificationService } from '../services/notification.service.js';
import { sseManager } from '../../lib/sse.manager.js';
import type {
  PaginationQuery,
  NotificationIdParam,
} from './notification.types.js';

export class NotificationController {
  public router = Router();

  constructor(private service: NotificationService) {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get('/sse', this.handleSSE.bind(this));
    this.router.get('/', this.findAll.bind(this));
    this.router.patch('/:notificationid/read', this.markAsRead.bind(this));
  }

  async handleSSE(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);

      sseManager.addConnection(userId, res);

      const unreadNotifications = await this.service.findUnread(userId);
      if (unreadNotifications.length > 0) {
        sseManager.sendToUser(userId, {
          type: 'alarm',
          data: unreadNotifications,
        });
      }
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      }
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);

      const query = req.query as unknown as PaginationQuery;
      const { page = 1, limit = 20 } = query;

      const result = await this.service.findAll(userId, page, limit);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);

      const { notificationid } = req.params as unknown as NotificationIdParam;

      await this.service.markAsRead(notificationid, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  private getUserId(req: Request): number {
    const userId = req.user?.id;

    if (!userId) {
      throw createError(401, '인증이 필요합니다.');
    }
    return userId;
  }
}
