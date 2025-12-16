import type { Request, Response, NextFunction } from 'express';
import noticeService from '../services/notice.service.js';
import createHttpError from 'http-errors';
import type { GetNoticesDto } from '../schemas/notice.schema.js';
import { NoticeCategory } from '../../../generated/prisma/client.js';

class NoticeController {
  // 공지 등록 - 관리자 전용
  async createNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const createBody = req.body;
      const newNotice = await noticeService.createNotice(userId, createBody);
      res.status(201).json(newNotice);
    } catch (error) {
      next(error);
    }
  }
  // 공지 목록 조회
  async getNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const query: GetNoticesDto = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        searchKeyword: req.query.searchKeyword as string,
        category: req.query.category as NoticeCategory,
      };
      const notices = await noticeService.getNotices(query);
      res.status(200).json(notices);
    } catch (error) {
      next(error);
    }
  }
  // 공지 상세 조회
  async getNoticeById(req: Request, res: Response, next: NextFunction) {
    try {
      const noticeId = Number(req.params.noticeId);
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
      const noticeId = Number(req.params.noticeId);
      const updateBody = req.body;
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
      const noticeId = Number(req.params.noticeId);
      await noticeService.deleteNotice(userId, noticeId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new NoticeController();
