import eventRepository from '../repositories/event.repository.js';
import createHttpError from 'http-errors';
import type { GetEventsDto } from '../schemas/event.schema.js';

class EventService {
  // 이벤트 목록 조회
  async getEvents(userId: number, getDto: GetEventsDto) {
    const userWithApartment =
      await eventRepository.getApartmentIdByUserId(userId);
    if (!userWithApartment) {
      throw createHttpError(403, '아파트에 속한 사용자가 아닙니다.');
    }
    const apartmentId =
      userWithApartment?.adminOf?.apartment!.id ||
      userWithApartment?.resident?.apartmentId;
    if (!apartmentId) {
      throw createHttpError(403, '아파트에 속한 사용자가 아닙니다.');
    }
    const events = await eventRepository.getEvents(apartmentId, getDto);
    if (!events) {
      throw createHttpError(404, '해당하는 이벤트가 없습니다.');
    }
    return events;
  }
}
export default new EventService();
