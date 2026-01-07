import { PrismaClient } from '../../generated/prisma/client.js';
import { NotificationRepository } from './repositories/notification.repository.js';
import { NotificationService } from './services/notification.service.js';
import { NotificationEventService } from './services/notification.event.service.js';
import { NotificationController } from './controllers/notification.controller.js';

let notificationServiceInstance: NotificationService | null = null;
let notificationEventServiceInstance: NotificationEventService | null = null;

export function initNotificationService(prisma: PrismaClient) {
  if (!notificationServiceInstance) {
    const repository = new NotificationRepository(prisma);
    notificationServiceInstance = new NotificationService(repository);
  }

  if (!notificationEventServiceInstance) {
    notificationEventServiceInstance = new NotificationEventService(
      notificationServiceInstance,
      prisma,
    );
  }

  return notificationServiceInstance;
}

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    throw new Error(
      'NotificationService not initialized. Call initNotificationService first.',
    );
  }
  return notificationServiceInstance;
}

export function getNotificationEventService(): NotificationEventService {
  if (!notificationEventServiceInstance) {
    throw new Error(
      'NotificationEventService not initialized. Call initNotificationService first.',
    );
  }
  return notificationEventServiceInstance;
}

export { NotificationController };
