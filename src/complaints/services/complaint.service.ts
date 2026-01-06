import complaintRepository from '../repositories/complaint.repository.js';
import type { complainStatus } from 'generated/prisma/enums.js';
import type {
  GetComplaintsDto,
  CreateComplaintDto,
  UpdateComplaintDto,
} from '../schemas/complaint.schema.js';
import createHttpError from 'http-errors';
import { getNotificationEventService } from '../../notification/index.js';

class ComplaintService {
  // 민원 등록
  async createComplaint(userId: number, createDto: CreateComplaintDto) {
    const complaint = await complaintRepository.createComplaint(
      userId,
      createDto,
    );

    try {
      const notificationEventService = getNotificationEventService();
      const resident = await complaintRepository.findResidentById(userId);
      if (!resident) throw createHttpError(404, '존재하지 않은 유저입니다.');
      const data = {
        complaintId: complaint.id,
        residentName: resident.name,
        building: resident.building,
        unit: resident.unit,
        title: complaint.title,
      };
      await notificationEventService.onComplaintCreated(data);
    } catch (e) {
      console.error('[ComplaintService] 알림 이벤트 호출 실패:', e);
    }
    return complaint;
  }
  // 민원 목록 조회
  async getComplaints(getDto: GetComplaintsDto) {
    const complaints = await complaintRepository.getComplaints(getDto);
    const data = complaints.map(({ _count, ...rest }) => ({
      ...rest,
      commentCount: _count.comments,
    }));
    const totalCount = await complaintRepository.getComplaintCount(
      getDto.searchKeyword,
      getDto.status,
      getDto.isPublic,
    );
    const page = Number(getDto.page) || 1;
    const limit = Number(getDto.limit) || 20;
    const hasNext = page * limit < totalCount;
    const result = { data, totalCount, page, limit, hasNext };
    return result;
  }
  // 민원 상세 조회
  async getComplaintById(complaintId: number, userId: number) {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      throw createHttpError(404, '해당 민원이 존재하지 않습니다.');
    }
    const userRole = await complaintRepository.checkUserRole(userId);
    if (!userRole) {
      throw createHttpError(404, '존재하지 않은 유저입니다.');
    }
    if (
      complaint.isPublic === false &&
      complaint.complainant.id !== userId &&
      userRole.role === 'USER'
    ) {
      throw createHttpError(403, '권한이 없습니다.');
    }
    const { _count, ...rest } = complaint;
    await complaintRepository.incrementViewCount(complaintId);
    return {
      ...rest,
      commentCount: _count.comments,
    };
  }
  // 민원 수정
  async updateComplaint(
    userId: number,
    complaintId: number,
    updateData: UpdateComplaintDto,
  ) {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      throw createHttpError(404, '해당 민원이 존재하지 않습니다.');
    }
    if (complaint.complainant.id !== userId) {
      throw createHttpError(403, '작성자만 수정 가능합니다.');
    }
    if (complaint.status !== 'PENDING') {
      throw createHttpError(400, '처리 전일 때만 수정 가능합니다.');
    }
    const updatedComplaint = await complaintRepository.updateComplaint(
      complaintId,
      updateData,
    );
    return updatedComplaint;
  }
  // 민원 삭제
  async deleteComplaint(userId: number, complaintId: number) {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      throw createHttpError(404, '해당 민원이 존재하지 않습니다.');
    }
    if (complaint.complainant.id !== userId) {
      throw createHttpError(403, '작성자만 삭제 가능합니다.');
    }
    if (complaint.status !== 'PENDING') {
      throw createHttpError(400, '처리 전일 때만 삭제 가능합니다.');
    }
    await complaintRepository.deleteComplaint(complaintId);
  }
  // 민원 상태 업데이트 - 관리자 전용
  async updateComplaintStatus(
    userId: number,
    complaintId: number,
    status: complainStatus,
  ) {
    // userId가 관리자인지 확인
    const user = await complaintRepository.checkUserRole(userId);
    if (!user) {
      throw createHttpError(404, '존재하지 않는 user입니다.');
    }
    if (user.role !== 'ADMIN') {
      throw createHttpError(403, '관리자 계정이 아닙니다.');
    }
    const complaint = await complaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      throw createHttpError(404, '해당 민원이 존재하지 않습니다.');
    }

    const updatedComplaint = await complaintRepository.updateComplaintStatus(
      complaintId,
      status,
    );
    try {
      const notificationEventService = getNotificationEventService();
      const residentUserId = complaint.complainant.id;
      const data = {
        complaintId,
        residentUserId,
        title: complaint.title,
        status,
      };
      await notificationEventService.onComplaintStatusChanged(data);
    } catch (e) {
      console.error('[ComplaintService] 알림 이벤트 호출 실패:', e);
    }
    return updatedComplaint;
  }
}
export default new ComplaintService();
