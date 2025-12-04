import type { NextFunction, Request, Response } from 'express';
import complaintService from '../services/complaint.service.js';
import { complainStatus } from '../../../generated/prisma/client.js';
import type { UpdateData } from '../types/complaint.js';
import createHttpError from 'http-errors';
import { ComplainQuerySchema } from '../schemas/complainQuerySchema.js';
import type { ComplainQueryType } from '../schemas/complainQuerySchema.js';
import { ZodError } from 'zod';

class ComplaintController {
  // 민원 등록
  async createComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId; // 임시로 userId를 body에서 받음
      if (!userId) {
        throw createHttpError(400, 'userId가 필요합니다.');
      }
      const title = req.body.title;
      const content = req.body.content;
      const isPublic = req.body.isPublic;
      const apartmentId = req.body.apartmentId;
      const newComplaint = await complaintService.createComplaint(
        userId,
        title,
        content,
        isPublic,
        apartmentId,
      );
      res.status(201).json(newComplaint);
    } catch (error) {
      next(error);
    }
  }
  // 민원 목록 조회
  async getComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = ComplainQuerySchema.parse(
        req.query,
      ) as ComplainQueryType;
      const { page, limit, searchKeyword, status, isPublic, building, unit } =
        validatedQuery;
      const complaints = await complaintService.getComplaints(
        page,
        limit,
        searchKeyword,
        status,
        isPublic,
        building,
        unit,
      );
      res.status(200).json(complaints);
    } catch (error) {
      if (error instanceof ZodError) {
        throw createHttpError(400, '요청 파라미터가 유효하지 않습니다.');
      }
      next(error);
    }
  }
  // 민원 상세 조회
  async getComplaintById(req: Request, res: Response, next: NextFunction) {
    try {
      const complaintId = parseInt(req.params.id!);

      const userId = req.body.userId; // 임시 user
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
      const userId = req.body.userId; // 임시 user
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }

      const complaintId = parseInt(req.params.id!);
      const { title, content, isPublic } = req.body;
      const updateData: UpdateData = {};

      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (isPublic) updateData.isPublic = isPublic;

      const updatedComplaint = await complaintService.updateComplaint(
        userId,
        complaintId,
        updateData,
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
  // 민원 삭제
  async deleteComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId; // 임시 user
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
      const userId = req.body.userId; // 임시 user
      const complaintId = parseInt(req.params.id!);
      const status: complainStatus = req.body.status;
      const updatedComplaint = await complaintService.updateComplaintStatus(
        userId,
        complaintId,
        status,
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ComplaintController();
