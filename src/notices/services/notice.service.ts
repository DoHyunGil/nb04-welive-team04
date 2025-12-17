import noticeRepository from '../repositories/notice.repository.js';
import { NoticeCategory } from '../../../generated/prisma/client.js';
import type {
  GetNoticesDto,
  CreateNoticeDto,
  UpdateNoticeDto,
} from '../schemas/notice.schema.js';
import createHttpError from 'http-errors';

class NoticeService {
  // 공지 등록 - 관리자 전용
  async createNotice(userId: number, createDto: CreateNoticeDto) {
    const adminOfId = await noticeRepository.getAdminOfIdByUserId(userId);
    if (!adminOfId) {
      throw createHttpError(403, '관리자가 아닙니다.');
    }
    const notice = await noticeRepository.createNotice(
      adminOfId.id,
      userId,
      createDto,
    );
    return notice;
  }
  // 공지 목록 조회
  async getNotices(getDto: GetNoticesDto) {
    const notices = await noticeRepository.getNotices(getDto);
    const data = notices.map(({ _count, ...rest }) => ({
      ...rest,
      commentCount: _count.comments,
    }));
    const totalCount = await noticeRepository.getNoticeCount(
      getDto.searchKeyword,
      getDto.category,
    );
    const page = Number(getDto.page) || 1;
    const limit = Number(getDto.limit) || 20;
    const hasNext = page * limit < totalCount;
    const result = { data, totalCount, page, limit, hasNext };
    return result;
  }
  // 공지 상세 조회
  async getNoticeById(noticeId: number) {
    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) {
      throw createHttpError(404, '해당 공지가 존재하지 않습니다.');
    }
    const { _count, ...rest } = notice;
    await noticeRepository.incrementViewCount(noticeId);
    return {
      ...rest,
      commentCount: _count.comments,
    };
  }
  // 공지 수정 - 관리자 전용
  async updateNotice(
    userId: number,
    noticeId: number,
    updateDto: UpdateNoticeDto,
  ) {
    const adminOfId = await noticeRepository.getAdminOfIdByUserId(userId);
    if (!adminOfId) {
      throw createHttpError(403, '권한이 없습니다.');
    }
    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) {
      throw createHttpError(404, '해당 공지가 존재하지 않습니다.');
    }
    const updatedNotice = await noticeRepository.updateNotice(
      noticeId,
      updateDto,
    );
    return updatedNotice;
  }
  // 공지 삭제 - 관리자 전용
  async deleteNotice(userId: number, noticeId: number) {
    const adminOfId = await noticeRepository.getAdminOfIdByUserId(userId);
    if (!adminOfId) {
      throw createHttpError(403, '권한이 없습니다.');
    }
    const notice = await noticeRepository.getNoticeById(noticeId);
    if (!notice) {
      throw createHttpError(404, '해당 공지가 존재하지 않습니다.');
    }
    await noticeRepository.deleteNotice(noticeId);
  }
}

export default new NoticeService();
