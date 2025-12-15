import type { NextFunction, Request, Response } from 'express';
import complaintService from '../services/complaint.service.js';
import type { LocalResponse } from '../schemas/complaint.schema.js';
import createHttpError from 'http-errors';

class ComplaintController {
  // 민원 등록
  async createComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const localRes = res as unknown as LocalResponse;
      const createBody = localRes.locals.createBody;
      const newComplaint = await complaintService.createComplaint(
        userId,
        createBody,
      );
      res.status(201).json(newComplaint);
    } catch (error) {
      next(error);
    }
  }
  // 민원 목록 조회
  async getComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const localRes = res as unknown as LocalResponse;
      const query = localRes.locals.validatedQuery;
      const complaints = await complaintService.getComplaints(query);
      res.status(200).json(complaints);
    } catch (error) {
      next(error);
    }
  }
  // 민원 상세 조회
  async getComplaintById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const localRes = res as unknown as LocalResponse;
      const complaintId = localRes.locals.complaint.complaintId;
      const complaint = await complaintService.getComplaintById(
        complaintId,
        userId,
      );
      res.status(200).json(complaint);
    } catch (error) {
      next(error);
    }
  }
  // 민원 수정
  async updateComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const localRes = res as unknown as LocalResponse;
      const complaintId = localRes.locals.complaint.complaintId;
      const updateData = localRes.locals.updateBody;

      await complaintService.updateComplaint(userId, complaintId, updateData);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  // 민원 삭제
  async deleteComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const localRes = res as unknown as LocalResponse;
      const complaintId = localRes.locals.complaint.complaintId;
      await complaintService.deleteComplaint(userId, complaintId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  // 민원 상태 업데이트 - 관리자 전용
  async updateComplaintStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const localRes = res as unknown as LocalResponse;
      const complaintId = localRes.locals.complaint.complaintId;
      const status = localRes.locals.statusBody.status;
      await complaintService.updateComplaintStatus(userId, complaintId, status);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ComplaintController();
