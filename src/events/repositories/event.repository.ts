import { prisma } from '../../lib/prisma.js';
import type { GetEventsDto } from '../schemas/event.schema.js';
import type { CreateEventDto, UpdateEventDto } from '../types/event.types.js';

class EventRepository {
  // 이벤트 목록 조회
  async getEvents(apartmentId: number, getDto: GetEventsDto) {
    const { year, month } = getDto;
    const startOfMonth = new Date(year, month - 1, 1);
    const startOfNextMonth = new Date(year, month, 1);
    const where = {
      apartmentId,
      AND: [
        {
          startDate: { lt: startOfNextMonth },
        },
        {
          endDate: { gte: startOfMonth },
        },
      ],
    };
    return await prisma.event.findMany({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        category: true,
        title: true,
        apartmentId: true,
        resourceId: true,
        resourceType: true,
      },
    });
  }

  // 이벤트 생성
  async createEvent(createDto: CreateEventDto) {
    const {
      startDate,
      endDate,
      category,
      title,
      apartmentId,
      resourceId,
      resourceType,
    } = createDto;
    return await prisma.event.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        category,
        title,
        apartmentId,
        resourceId,
        resourceType,
      },
    });
  }

  // 이벤트 수정
  async updateEvent(eventId: number, updateDto: UpdateEventDto) {
    const { startDate, endDate, category, title } = updateDto;
    return await prisma.event.update({
      where: { id: eventId },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        category,
        title,
      },
    });
  }

  // user의 apartmentId 찾기
  async getApartmentIdByUserId(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        adminOf: {
          select: {
            apartment: {
              select: { id: true },
            },
          },
        },
        resident: {
          select: {
            apartmentId: true,
          },
        },
      },
    });
  }
}
export default new EventRepository();
