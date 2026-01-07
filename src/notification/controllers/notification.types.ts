// src/notification/controllers/notification.types.ts
import type { complainStatus } from '../../../generated/prisma/client.js';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface NotificationIdParam {
  notificationid: number;
}

export interface CreateNotificationData {
  userId: number;
  content: string;
}
export interface AdminSignupData {
  userId: number;
  name: string;
}

export interface ResidentSignupData {
  residentId: number;
  name: string;
  building: number;
  unit: number;
}

export interface ComplaintCreatedData {
  complaintId: number;
  residentName: string;
  building: number;
  unit: number;
  title: string;
}

export interface ComplaintStatusChangedData {
  complaintId: number;
  residentUserId: number;
  title: string;
  status: complainStatus;
}

export interface AnnouncementCreatedData {
  noticeId: number;
  title: string;
  apartmentId: number;
}

export interface NotificationListResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  hasNext: boolean;
}
