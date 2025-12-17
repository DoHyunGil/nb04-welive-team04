import type {
  EventResourceType,
  NoticeCategory,
} from '../../../generated/prisma/enums.js';

// repository에서 사용
export interface CreateEventDto {
  startDate: Date;
  endDate: Date;
  category: NoticeCategory;
  title: string;
  apartmentId: number;
  resourceId: number;
  resourceType: EventResourceType;
}

export interface UpdateEventDto {
  startDate?: Date;
  endDate?: Date;
  category?: NoticeCategory;
  title?: string;
}
