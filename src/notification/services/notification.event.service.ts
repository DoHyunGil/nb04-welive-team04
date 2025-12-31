// src/notification/services/notification.event.service.ts
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { NotificationService } from './notification.service.js';
import type {
  AdminSignupData,
  ResidentSignupData,
  ComplaintCreatedData,
  ComplaintStatusChangedData,
  AnnouncementCreatedData,
} from '../controllers/notification.types.js';
import {
  NotificationType,
  NotificationMessages,
  UserRole,
  ComplaintStatusLabel,
} from '../constants/notification.constants.js';

export class NotificationEventService {
  constructor(
    private notificationService: NotificationService,
    private prisma: PrismaClient,
  ) {}

  async onAdminSignupRequest(data: AdminSignupData): Promise<void> {
    try {
      const superAdmins = await this.prisma.user.findMany({
        where: {
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
        select: { id: true },
      });

      if (superAdmins.length === 0) {
        console.warn('[Notification] No super admins found');
        return;
      }

      const content = NotificationMessages[
        NotificationType.ADMIN_SIGNUP_REQUEST
      ](data.name);

      const notifications = superAdmins.map((admin) => ({
        userId: admin.id,
        content,
      }));

      await this.notificationService.createMany(notifications);
      console.log(
        `[Notification] Admin signup notification sent to ${superAdmins.length} super admins`,
      );
    } catch (error) {
      console.error(
        '[Notification] Error sending admin signup notification:',
        error,
      );
    }
  }

  async onResidentSignupRequest(data: ResidentSignupData): Promise<void> {
    try {
      const resident = await this.prisma.resident.findUnique({
        where: { id: data.residentId },
        select: { apartmentId: true },
      });

      if (!resident) {
        console.warn(`[Notification] Resident ${data.residentId} not found`);
        return;
      }

      const apartment = await this.prisma.apartment.findUnique({
        where: { id: resident.apartmentId },
        select: {
          adminOf: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!apartment?.adminOf) {
        console.warn(
          `[Notification] No admin found for apartment ${resident.apartmentId}`,
        );
        return;
      }

      const superAdmins = await this.prisma.user.findMany({
        where: {
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
        select: { id: true },
      });

      const notificationRecipients = [
        apartment.adminOf.userId,
        ...superAdmins.map((admin) => admin.id),
      ];

      const content = NotificationMessages[
        NotificationType.RESIDENT_SIGNUP_REQUEST
      ](data.name, String(data.building), String(data.unit));

      const notifications = notificationRecipients.map((userId) => ({
        userId,
        content,
      }));

      await this.notificationService.createMany(notifications);
      console.log(
        `[Notification] Resident signup notification sent to ${notifications.length} admins`,
      );
    } catch (error) {
      console.error(
        '[Notification] Error sending resident signup notification:',
        error,
      );
    }
  }

  async onComplaintCreated(data: ComplaintCreatedData): Promise<void> {
    try {
      const complaint = await this.prisma.complain.findUnique({
        where: { id: data.complaintId },
        select: {
          apartment: {
            select: {
              adminOf: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!complaint?.apartment?.adminOf) {
        console.warn(
          `[Notification] No admin found for complaint ${data.complaintId}`,
        );
        return;
      }

      const superAdmins = await this.prisma.user.findMany({
        where: {
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
        select: { id: true },
      });

      const notificationRecipients = [
        complaint.apartment.adminOf.userId,
        ...superAdmins.map((admin) => admin.id),
      ];

      const content = NotificationMessages[NotificationType.NEW_COMPLAINT](
        String(data.building),
        String(data.unit),
        data.title,
      );

      const notifications = notificationRecipients.map((userId) => ({
        userId,
        content,
      }));

      await this.notificationService.createMany(notifications);
      console.log(
        `[Notification] New complaint notification sent to ${notifications.length} admins`,
      );
    } catch (error) {
      console.error(
        '[Notification] Error sending complaint notification:',
        error,
      );
    }
  }

  async onComplaintStatusChanged(
    data: ComplaintStatusChangedData,
  ): Promise<void> {
    try {
      const statusLabel = ComplaintStatusLabel[data.status];

      if (!statusLabel) {
        console.warn(`[Notification] Unknown complaint status: ${data.status}`);
        return;
      }

      const content = NotificationMessages[
        NotificationType.COMPLAINT_STATUS_CHANGED
      ](data.title, statusLabel);

      await this.notificationService.create(data.residentUserId, content);
      console.log(
        `[Notification] Complaint status change notification sent to user ${data.residentUserId}`,
      );
    } catch (error) {
      console.error(
        '[Notification] Error sending complaint status notification:',
        error,
      );
    }
  }

  async onAnnouncementCreated(data: AnnouncementCreatedData): Promise<void> {
    try {
      const residents = await this.prisma.resident.findMany({
        where: {
          apartmentId: data.apartmentId,
          isRegistered: true,
          userId: { not: null },
        },
        select: { userId: true },
      });

      if (residents.length === 0) {
        console.warn(
          `[Notification] No residents found for apartment ${data.apartmentId}`,
        );
        return;
      }

      const content = NotificationMessages[NotificationType.NEW_ANNOUNCEMENT](
        data.title,
      );

      const notifications = residents
        .filter(
          (resident): resident is { userId: number } =>
            resident.userId !== null,
        )
        .map((resident) => ({
          userId: resident.userId,
          content,
        }));

      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await this.notificationService.createMany(batch);
      }

      console.log(
        `[Notification] Announcement notification sent to ${notifications.length} residents`,
      );
    } catch (error) {
      console.error(
        '[Notification] Error sending announcement notification:',
        error,
      );
    }
  }

  async onPollCreated(apartmentId: number, title: string): Promise<void> {
    try {
      const residents = await this.prisma.resident.findMany({
        where: {
          apartmentId: apartmentId,
          isRegistered: true,
          userId: { not: null },
        },
        select: { userId: true },
      });

      if (residents.length === 0) {
        console.log(
          `[Notification] 투표 알림 대상이 없습니다. (Apt: ${apartmentId})`,
        );
        return;
      }

      const content = `새로운 투표가 개설되었습니다: ${title}`;

      const notifications = residents.map((resident) => ({
        userId: resident.userId!,
        content,
      }));

      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await this.notificationService.createMany(batch);
      }

      console.log(
        `[Notification] Poll created notification sent to ${notifications.length} residents`,
      );
    } catch (error) {
      console.error('[Notification] Error sending poll notification:', error);
    }
  }
}
