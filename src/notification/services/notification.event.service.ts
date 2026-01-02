// src/notification/services/notification.event.service.ts
import type { PrismaClient, Role } from '../../../generated/prisma/client.js';
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
      const recipients = await this.getSuperAdmins();

      if (recipients.length === 0) {
        console.warn('[Notification] No super admins found');
        return;
      }

      const content = NotificationMessages[
        NotificationType.ADMIN_SIGNUP_REQUEST
      ](data.name);
      await this.sendNotifications(recipients, content);

      console.log(
        `[Notification] Admin signup notification sent to ${recipients.length} super admins`,
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
      const apartmentId = await this.getApartmentIdByResident(data.residentId);
      if (!apartmentId) {
        console.warn(`[Notification] Resident ${data.residentId} not found`);
        return;
      }

      const recipients =
        await this.getApartmentAdminsAndSuperAdmins(apartmentId);
      if (recipients.length === 0) {
        console.warn(
          `[Notification] No admins found for apartment ${apartmentId}`,
        );
        return;
      }

      const content = NotificationMessages[
        NotificationType.RESIDENT_SIGNUP_REQUEST
      ](data.name, String(data.building), String(data.unit));

      await this.sendNotifications(recipients, content);
      console.log(
        `[Notification] Resident signup notification sent to ${recipients.length} admins`,
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
      const apartmentId = await this.getApartmentIdByComplaint(
        data.complaintId,
      );
      if (!apartmentId) {
        console.warn(`[Notification] Complaint ${data.complaintId} not found`);
        return;
      }

      const recipients =
        await this.getApartmentAdminsAndSuperAdmins(apartmentId);
      if (recipients.length === 0) {
        console.warn(
          `[Notification] No admins found for complaint ${data.complaintId}`,
        );
        return;
      }

      const content = NotificationMessages[NotificationType.NEW_COMPLAINT](
        String(data.building),
        String(data.unit),
        data.title,
      );

      await this.sendNotifications(recipients, content);
      console.log(
        `[Notification] New complaint notification sent to ${recipients.length} admins`,
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
      const recipients = await this.getRegisteredResidentsByApartment(
        data.apartmentId,
      );

      if (recipients.length === 0) {
        console.warn(
          `[Notification] No residents found for apartment ${data.apartmentId}`,
        );
        return;
      }

      const content = NotificationMessages[NotificationType.NEW_ANNOUNCEMENT](
        data.title,
      );

      await this.sendBatchNotifications(recipients, content);

      console.log(
        `[Notification] Announcement notification sent to ${recipients.length} residents`,
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
      const recipients =
        await this.getRegisteredResidentsByApartment(apartmentId);

      if (recipients.length === 0) {
        console.log(
          `[Notification] 투표 알림 대상이 없습니다. (Apt: ${apartmentId})`,
        );
        return;
      }

      const content = `새로운 투표가 개설되었습니다: ${title}`;

      await this.sendBatchNotifications(recipients, content);

      console.log(
        `[Notification] Poll created notification sent to ${recipients.length} residents`,
      );
    } catch (error) {
      console.error('[Notification] Error sending poll notification:', error);
    }
  }

  private async getSuperAdmins(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: UserRole.SUPER_ADMIN as Role,
        isActive: true,
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private async getApartmentAdminsAndSuperAdmins(
    apartmentId: number,
  ): Promise<number[]> {
    const [apartment, superAdmins] = await Promise.all([
      this.prisma.apartment.findUnique({
        where: { id: apartmentId },
        select: {
          adminOf: {
            select: { userId: true },
          },
        },
      }),
      this.getSuperAdmins(),
    ]);

    const recipients: number[] = [...superAdmins];

    if (apartment?.adminOf) {
      recipients.push(apartment.adminOf.userId);
    }

    return [...new Set(recipients)];
  }

  private async getRegisteredResidentsByApartment(
    apartmentId: number,
  ): Promise<number[]> {
    const residents = await this.prisma.resident.findMany({
      where: {
        apartmentId,
        isRegistered: true,
        userId: { not: null },
      },
      select: { userId: true },
    });

    return residents
      .filter(
        (resident): resident is { userId: number } => resident.userId !== null,
      )
      .map((resident) => resident.userId);
  }

  private async getApartmentIdByResident(
    residentId: number,
  ): Promise<number | null> {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      select: { apartmentId: true },
    });

    return resident?.apartmentId ?? null;
  }

  private async getApartmentIdByComplaint(
    complaintId: number,
  ): Promise<number | null> {
    const complaint = await this.prisma.complain.findUnique({
      where: { id: complaintId },
      select: { apartmentId: true },
    });

    return complaint?.apartmentId ?? null;
  }

  private async sendNotifications(
    userIds: number[],
    content: string,
  ): Promise<void> {
    if (userIds.length === 0) return;
    const notifications = userIds.map((userId) => ({ userId, content }));
    await this.notificationService.createMany(notifications);
  }

  private async sendBatchNotifications(
    userIds: number[],
    content: string,
  ): Promise<void> {
    if (userIds.length === 0) return;

    const notifications = userIds.map((userId) => ({ userId, content }));
    const batchSize = 100;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await this.notificationService.createMany(batch);
    }
  }
}
