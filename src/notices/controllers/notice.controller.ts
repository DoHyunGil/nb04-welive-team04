import type { Request, Response, NextFunction } from 'express';
import noticeService from '../services/notice.service.js';
import type { LocalResponse } from '../schemas/notice.schema.js';
import createHttpError from 'http-errors';

class NoticeController {
  // 공지 등록 - 관리자 전용
  async createNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const localRes = res as unknown as LocalResponse;
      const createBody = localRes.locals.createBody;
      const newNotice = await noticeService.createNotice(userId, createBody);
      res.status(201).json(newNotice);
    } catch (error) {
      next(error);
    }
  }
  // 공지 목록 조회
  async getNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const localRes = res as unknown as LocalResponse;
      const query = localRes.locals.validatedQuery;
      const notices = await noticeService.getNotices(query);
      res.status(200).json(notices);
    } catch (error) {
      next(error);
    }
  }
  // 공지 상세 조회
  async getNoticeById(req: Request, res: Response, next: NextFunction) {
    try {
      const localRes = res as unknown as LocalResponse;
      const noticeId = localRes.locals.noticeId;
      const notice = await noticeService.getNoticeById(noticeId);
      res.status(200).json(notice);
    } catch (error) {
      next(error);
    }
  }
  // 공지 수정 - 관리자 전용
  async updateNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const localRes = res as unknown as LocalResponse;
      const noticeId = localRes.locals.noticeId;
      const updateBody = localRes.locals.updateBody;
      await noticeService.updateNotice(userId, noticeId, updateBody);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  // 공지 삭제 - 관리자 전용
  async deleteNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const localRes = res as unknown as LocalResponse;
      const noticeId = localRes.locals.noticeId;
      await noticeService.deleteNotice(userId, noticeId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new NoticeController();
