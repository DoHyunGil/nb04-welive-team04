import type { NextFunction, Request, Response } from 'express';
import complaintService from '../services/complaint.service.js';
import { complainStatus } from '../../../generated/prisma/client.js';
import createHttpError from 'http-errors';

class ComplaintController {
  // 민원 등록
  async createComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const newComplaint = await complaintService.createComplaint(
        userId,
        req.createBody,
      );
      res.status(201).json(newComplaint);
    } catch (error) {
      next(error);
    }
  }
  // 민원 목록 조회
  async getComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const complaints = await complaintService.getComplaints(
        req.validatedQuery!,
      );
      res.status(200).json(complaints);
    } catch (error) {
      next(error);
    }
  }
  // 민원 상세 조회
  async getComplaintById(req: Request, res: Response, next: NextFunction) {
    try {
      const complaintId = parseInt(req.params.id!);
      if (req.body.userId) {
        req.user = { id: req.body.userId };
      }
      const userId = req.user!.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
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
      if (req.body.userId) {
        req.user = { id: req.body.userId };
      }
      const userId = req.user!.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }

      const complaintId = parseInt(req.params.id!);
      const updateData = req.updateBody;

      await complaintService.updateComplaint(userId, complaintId, updateData);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  // 민원 삭제
  async deleteComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body.userId) {
        req.user = { id: req.body.userId };
      }
      const userId = req.user!.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const complaintId = parseInt(req.params.id!);
      await complaintService.deleteComplaint(userId, complaintId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  // 민원 상태 업데이트 - 관리자 전용
  async updateComplaintStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body.userId) {
        req.user = { id: req.body.userId };
      }
      const userId = req.user!.id;
      const complaintId = parseInt(req.params.id!);
      const status: complainStatus = req.body.status;
      await complaintService.updateComplaintStatus(userId, complaintId, status);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ComplaintController();
