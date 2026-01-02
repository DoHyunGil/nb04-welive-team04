// src/notification/services/notification.service.ts
import createError from 'http-errors';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { sseManager } from '../../lib/sse.manager.js';
import type { CreateNotificationData } from '../controllers/notification.types.js';
import type { Notification as NotificationModel } from '../../../generated/prisma/client.js';

export class NotificationService {
  constructor(private repository: NotificationRepository) {}

  async create(userId: number, content: string) {
    const notification = await this.repository.create(userId, content);

    this.sendNotificationViaSSE(userId, [notification]);

    return notification;
  }

  async createMany(notifications: CreateNotificationData[]) {
    const results = await this.repository.createMany(notifications);

    const notificationsByUser = new Map<number, typeof results>();
    results.forEach((notif) => {
      const userNotifications = notificationsByUser.get(notif.userId) || [];
      userNotifications.push(notif);
      notificationsByUser.set(notif.userId, userNotifications);
    });

    notificationsByUser.forEach((notifs, userId) => {
      this.sendNotificationViaSSE(userId, notifs);
    });

    return results;
  }

  async findAll(userId: number, page: number, limit: number) {
    return this.repository.findByUserIdWithPagination(userId, page, limit);
  }

  async findUnread(userId: number, since?: Date) {
    return this.repository.findUnreadByUserId(userId, since);
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.repository.findSimple(id);

    if (!notification) {
      throw createError(404, '알림을 찾을 수 없습니다.');
    }

    if (notification.userId !== userId) {
      throw createError(403, '알림에 대한 권한이 없습니다.');
    }

    const result = await this.repository.markAsRead(id, userId);

    if (result.count === 0) {
      throw createError(500, '알림 상태 업데이트에 실패했습니다.');
    }

    return result;
  }

  async markAllAsRead(userId: number) {
    return this.repository.markAllAsRead(userId);
  }

  private sendNotificationViaSSE(
    userId: number,
    notifications: NotificationModel[],
  ) {
    try {
      sseManager.sendToUser(userId, {
        type: 'alarm',
        data: notifications,
      });
    } catch (error) {
      console.error(`[Notification] SSE 전송 실패 (userId: ${userId}):`, error);
    }
  }
}
