import complaintRepository from '../repositories/complaint.repository.js';
import { complainStatus } from '../../../generated/prisma/client.js';
import type { UpdateData } from '../types/complaint.js';
import createHttpError from 'http-errors';

class ComplaintService {
  // 민원 등록
  async createComplaint(
    userId: number,
    title: string,
    content: string,
    isPublic: boolean,
    apartmentId: number,
  ) {
    if (!title || !content || !apartmentId) {
      throw createHttpError(400, '필수 값이 비어있습니다.');
    }
    const complaint = await complaintRepository.createComplaint(
      title,
      content,
      isPublic,
      apartmentId,
      userId,
    );
    return complaint;
  }
  // 민원 목록 조회
  async getComplaints(
    page: number,
    limit: number,
    searchKeyword?: string,
    status?: string,
    isPublic?: string,
    building?: number,
    unit?: number,
  ) {
    const complaints = await complaintRepository.getComplaints(
      page,
      limit,
      status,
      isPublic,
      building,
      unit,
      searchKeyword,
    );
    const data = complaints.map(({ _count, ...rest }) => ({
      ...rest,
      commentCount: _count.comments,
    }));
    const totalCount = await complaintRepository.getComplaintCount(
      searchKeyword,
      status,
      isPublic,
    );
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
      userRole.role === 'RESIDENT'
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
    updateData: UpdateData,
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

    const updatedComplaint = await complaintRepository.updateComplaintStatus(
      complaintId,
      status,
    );
    return updatedComplaint;
  }
}
export default new ComplaintService();
