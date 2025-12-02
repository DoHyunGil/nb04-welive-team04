import type { NextFunction, Request, Response } from 'express';
import complaintService from '../services/complaint.service.js';
import { complainStatus } from '../../../generated/prisma/client.js';
import type { UpdateData } from '../types/complaint.js';

class ComplaintController {
  // 민원 등록
  async createComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body; // 임시로 userId를 body에서 받음
      const complaintData = req.body;
      const newComplaint = await complaintService.createComplaint(
        userId,
        complaintData,
      );
      res.status(201).json(newComplaint);
    } catch (error) {
      next(error);
    }
  }
  // 민원 목록 조회
  async getComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const searchKeyword = req.query.searchKeyword?.toString();
      const status = req.query.status as complainStatus | 'PENDING';
      const isPublic = (req.query.isPublic as string) === 'true';
      const building = parseInt(req.query.building as string);
      const unit = parseInt(req.query.unit as string);

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
      next(error);
    }
  }
  // 민원 상세 조회
  async getComplaintById(req: Request, res: Response, next: NextFunction) {
    try {
      const complaintId = parseInt(req.params.id!);
      const complaint = await complaintService.getComplaintById(complaintId);
      res.status(200).json(complaint);
    } catch (error) {
      next(error);
    }
  }
  // 민원 수정
  async updateComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const complaintId = parseInt(req.params.id!);
      const { title, content, isPublic } = req.body;
      const updateData: UpdateData = {};

      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (isPublic) updateData.isPublic = isPublic;

      const updatedComplaint = await complaintService.updateComplaint(
        complaintId,
        updateData,
      );
      res.status(200).json(updatedComplaint);
    } catch (error) {
      next(error);
    }
  }
  // 민원 삭제
  async deleteComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const complaintId = parseInt(req.params.id!);
      await complaintService.deleteComplaint(complaintId);
      res.status(200).json({ message: '민원이 삭제되었습니다.' });
    } catch (error) {
      next(error);
    }
  }
  // 민원 상태 업데이트 - 관리자 전용
  async updateComplaintStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const complaintId = parseInt(req.params.id!);
      const status = req.body.status as complainStatus;
      const updatedComplaint = await complaintService.updateComplaintStatus(
        complaintId,
        status,
      );
      res.status(200).json(updatedComplaint);
    } catch (error) {
      next(error);
    }
  }
}

export default new ComplaintController();
