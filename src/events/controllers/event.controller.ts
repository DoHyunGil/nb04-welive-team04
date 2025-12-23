import type { Request, Response, NextFunction } from 'express';
import type { GetEventsDto } from '../schemas/event.schema.js';
import eventService from '../services/event.service.js';
import createHttpError from 'http-errors';

class EventController {
  // 이벤트 목록 조회
  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }

      const query: GetEventsDto = {
        year: Number(req.query.year),
        month: Number(req.query.month),
      };
      const events = await eventService.getEvents(userId, query);
      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  }
}

export default new EventController();
