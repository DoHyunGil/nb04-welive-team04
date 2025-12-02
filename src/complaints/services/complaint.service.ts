import complaintRepository from '../repositories/complaint.repository.js';
import { complainStatus } from '../../../generated/prisma/client.js';
import type { UpdateData } from '../types/complaint.js';
import createHttpError from 'http-errors';

class ComplaintService {
  // 민원 등록
  async createComplaint(
    userId: number,
    complaintData: {
      title: string;
      content: string;
      isPublic: boolean;
      apartmentId: number;
    },
  ) {
    const complaint = await complaintRepository.createComplaint({
      title: complaintData.title,
      content: complaintData.content,
      isPublic: complaintData.isPublic,
      apartmentId: complaintData.apartmentId,
      userId,
    });
    return complaint;
  }
  // 민원 목록 조회
  async getComplaints(
    page: number,
    limit: number,
    searchKeyword: string | undefined,
    status: complainStatus,
    isPublic: boolean,
    building: number,
    unit: number,
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
  async getComplaintById(complaintId: number) {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      throw createHttpError(404, '해당 민원이 존재하지 않습니다.');
    }
    const { _count, ...rest } = complaint;
    return {
      ...rest,
      commentCount: _count.comments,
    };
  }
  // 민원 수정
  async updateComplaint(complaintId: number, updateData: UpdateData) {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      throw createHttpError(404, '해당 민원이 존재하지 않습니다.');
    }
    const updatedComplaint = await complaintRepository.updateComplaint(
      complaintId,
      updateData,
    );
    await complaintRepository.incrementViewCount(complaintId);
    return updatedComplaint;
  }
  // 민원 삭제
  async deleteComplaint(complaintId: number) {
    const complaint = await complaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      throw createHttpError(404, '해당 민원이 존재하지 않습니다.');
    }
    await complaintRepository.deleteComplaint(complaintId);
  }
  // 민원 상태 업데이트 - 관리자 전용
  async updateComplaintStatus(complaintId: number, status: complainStatus) {
    const updatedComplaint = await complaintRepository.updateComplaintStatus(
      complaintId,
      status,
    );
    return updatedComplaint;
  }
}
export default new ComplaintService();
