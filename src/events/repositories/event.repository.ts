import { prisma } from '../../lib/prisma.js';
import type { GetEventsDto } from '../schemas/event.schema.js';
import type { CreateEventDto, UpdateEventDto } from '../types/event.types.js';
import type { EventResourceType } from '../../../generated/prisma/enums.js';

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
    return await prisma.event.create({
      data: createDto,
    });
  }

  // 이벤트 수정
  async updateEvent(eventId: number, updateDto: UpdateEventDto) {
    return await prisma.event.update({
      where: { id: eventId },
      data: updateDto,
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

  // resourceType과 resourceId로 이벤트 찾기
  async findEventByResource(
    resourceType: EventResourceType,
    resourceId: string,
  ) {
    return await prisma.event.findFirst({
      where: {
        resourceType,
        resourceId,
      },
    });
  }

  // 이벤트 삭제
  async deleteEvent(eventId: number) {
    return await prisma.event.delete({
      where: { id: eventId },
    });
  }
}
export default new EventRepository();
