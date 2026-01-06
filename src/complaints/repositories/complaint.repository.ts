import { prisma } from '../../lib/prisma.js';
import { complainStatus } from '../../../generated/prisma/client.js';
import type {
  GetComplaintsDto,
  CreateComplaintDto,
  UpdateComplaintDto,
} from '../schemas/complaint.schema.js';

class complaintRepository {
  // 민원 등록
  async createComplaint(userId: number, createDto: CreateComplaintDto) {
    const { title, content, isPublic, apartmentId } = createDto;
    return await prisma.complain.create({
      data: {
        title,
        content,
        isPublic,
        apartment: {
          connect: { id: apartmentId },
        },
        complainant: {
          connect: { id: userId },
        },
      },
    });
  }

  // 민원 목록 조회
  async getComplaints(getDto: GetComplaintsDto) {
    const { searchKeyword, status, isPublic, building, unit } = getDto;
    const page = Number(getDto.page) || 1;
    const limit = Number(getDto.limit) || 20;
    const offset = (page - 1) * limit;

    const searchFilter = searchKeyword
      ? {
          OR: [
            { title: { contains: searchKeyword } },
            { content: { contains: searchKeyword } },
            {
              complainant: {
                name: { contains: searchKeyword },
              },
            },
          ],
        }
      : {};
    const statusFilter = status ? { status } : {};
    const isPublicFilter = isPublic ? { isPublic: isPublic === true } : {};
    return await prisma.complain.findMany({
      where: {
        ...searchFilter,
        ...statusFilter,
        ...isPublicFilter,
        complainant: {
          resident: {
            building,
            unit,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        status: true,
        viewsCount: true,
        apartmentId: true,
        complainant: true,
        _count: {
          select: { comments: true },
        },
      },
    });
  }
  // 민원 개수 조회
  async getComplaintCount(
    searchKeyword?: string,
    status?: complainStatus,
    isPublic?: boolean,
  ) {
    const searchFilter = searchKeyword
      ? {
          OR: [
            { title: { contains: searchKeyword } },
            { content: { contains: searchKeyword } },
            {
              complainant: {
                name: { contains: searchKeyword },
              },
            },
          ],
        }
      : {};
    const statusFilter = status ? { status } : {};
    const isPublicFilter = isPublic ? { isPublic: isPublic === true } : {};
    return await prisma.complain.count({
      where: {
        ...searchFilter,
        ...statusFilter,
        ...isPublicFilter,
      },
    });
  }
  // Id로 민원 조회
  async getComplaintById(complaintId: number) {
    return await prisma.complain.findUnique({
      where: { id: complaintId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        status: true,
        viewsCount: true,
        apartmentId: true,
        complainant: true,
        _count: {
          select: { comments: true },
        },
      },
    });
  }
  // 조회수 증가
  async incrementViewCount(complaintId: number) {
    await prisma.complain.update({
      where: { id: complaintId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });
  }
  // 민원 수정
  async updateComplaint(complaintId: number, updateData: UpdateComplaintDto) {
    return await prisma.complain.update({
      where: { id: complaintId },
      data: updateData,
    });
  }
  // 민원 삭제
  async deleteComplaint(complaintId: number) {
    await prisma.complain.delete({
      where: { id: complaintId },
    });
  }
  // 민원 상태 업데이트 - 관리자 전용
  async updateComplaintStatus(complaintId: number, status: complainStatus) {
    return await prisma.complain.update({
      where: { id: complaintId },
      data: { status },
    });
  }
  // 유저 Role(슈퍼어드민, 관리자, 입주민) 확인
  async checkUserRole(userId: number) {
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });
  }
  // userId로 Resident 찾기
  async findResidentById(userId: number) {
    return await prisma.resident.findUnique({
      where: {
        userId,
      },
    });
  }
}

export default new complaintRepository();
