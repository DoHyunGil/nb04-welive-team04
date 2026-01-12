import { prisma } from '../../lib/prisma.js';
import { NoticeCategory } from '../../../generated/prisma/client.js';
import type {
  GetNoticesDto,
  CreateNoticeDto,
  UpdateNoticeDto,
} from '../schemas/notice.schema.js';

class noticeRepository {
  // userId로 adminOf의 id 조회
  async getAdminOfIdByUserId(userId: number) {
    return await prisma.adminOf.findUnique({
      where: { userId },
      select: { id: true },
    });
  }
  // 공지 등록 - 관리자 전용
  async createNotice(
    adminOfId: number,
    userId: number,
    createDto: CreateNoticeDto,
  ) {
    const { title, content, category, isPinned } = createDto;
    return await prisma.notice.create({
      data: {
        title,
        content,
        category,
        isPinned,
        viewsCount: 0,
        apartment: {
          connect: { adminOfId },
        },
        author: {
          connect: { id: userId },
        },
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }
  // 공지 목록 조회
  async getNotices(getDto: GetNoticesDto) {
    const { searchKeyword, category } = getDto;
    const page = Number(getDto.page) || 1;
    const limit = Number(getDto.limit) || 20;
    const offset = (page - 1) * limit;

    const searchFilter = searchKeyword
      ? {
          OR: [
            {
              title: { contains: searchKeyword },
            },
            { content: { contains: searchKeyword } },
          ],
        }
      : {};
    const categoryFilter = category ? { category } : {};
    return await prisma.notice.findMany({
      where: {
        ...searchFilter,
        ...categoryFilter,
      },
      skip: offset,
      take: limit,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        title: true,
        content: true,
        category: true,
        isPinned: true,
        viewsCount: true,
        apartmentId: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  }
  // 공지 개수 조회
  async getNoticeCount(searchKeyword?: string, category?: NoticeCategory) {
    const searchFilter = searchKeyword
      ? {
          OR: [
            { title: { contains: searchKeyword } },
            { content: { contains: searchKeyword } },
          ],
        }
      : {};
    const categoryFilter = category ? { category } : {};
    return await prisma.notice.count({
      where: {
        ...searchFilter,
        ...categoryFilter,
      },
    });
  }
  // 공지 상세 조회
  async getNoticeById(noticeId: number) {
    return await prisma.notice.findUnique({
      where: { id: noticeId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        title: true,
        content: true,
        category: true,
        isPinned: true,
        viewsCount: true,
        apartmentId: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { comments: true },
        },
        event: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
  }
  // 조회수 증가
  async incrementViewCount(noticeId: number) {
    await prisma.notice.update({
      where: { id: noticeId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });
  }
  // 공지 수정 - 관리자 전용
  async updateNotice(noticeId: number, updateDto: UpdateNoticeDto) {
    const { title, content, category, isPinned } = updateDto;
    return await prisma.notice.update({
      where: { id: noticeId },
      data: { title, content, category, isPinned },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }
  // 공지에 이벤트 연결
  async updateNoticeEvent(noticeId: number, eventId: number) {
    return await prisma.notice.update({
      where: { id: noticeId },
      data: {
        event: {
          connect: { id: eventId },
        },
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }
  // 공지 삭제 - 관리자 전용
  async deleteNotice(noticeId: number) {
    await prisma.notice.delete({
      where: { id: noticeId },
    });
  }
}

export default new noticeRepository();
