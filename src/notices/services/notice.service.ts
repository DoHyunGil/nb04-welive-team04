import noticeRepository from '../repositories/notice.repository.js';
import eventRepository from '../../events/repositories/event.repository.js';
import type {
  GetNoticesDto,
  CreateNoticeDto,
  UpdateNoticeDto,
} from '../schemas/notice.schema.js';
import createHttpError from 'http-errors';
import { getNotificationEventService } from '../../notification/index.js';

class NoticeService {
  // 공지 등록 - 관리자 전용
  async createNotice(userId: number, createDto: CreateNoticeDto) {
    const adminOfId = await noticeRepository.getAdminOfIdByUserId(userId);
    if (!adminOfId) {
      throw createHttpError(403, '관리자가 아닙니다.');
    }
    let notice;
    if (createDto.event) {
      // 날짜 있는 경우
      // 공지 먼저 생성
      const { title, content, category, isPinned } = createDto;
      notice = await noticeRepository.createNotice(adminOfId.id, userId, {
        title,
        content,
        category,
        isPinned,
      });
      // 이벤트 생성
      const { startDate, endDate } = createDto.event;

      const newEvent = await eventRepository.createEvent({
        title,
        category,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        apartmentId: notice.apartmentId,
        resourceId: notice.id.toString(),
        resourceType: 'NOTICE',
      });
      // 공지에 이벤트 연결
      notice = await noticeRepository.updateNoticeEvent(notice.id, newEvent.id);
    } else {
      // 날짜 없는 경우
      notice = await noticeRepository.createNotice(
        adminOfId.id,
        userId,
        createDto,
      );
    }
    try {
      const notificationEventService = getNotificationEventService();
      const data = {
        noticeId: notice.id,
        title: notice.title,
        apartmentId: notice.apartmentId,
      };
      await notificationEventService.onAnnouncementCreated(data);
    } catch (e) {
      console.error('[NoticeService] 알림 이벤트 호출 실패:', e);
    }
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
    let updatedNotice = await noticeRepository.updateNotice(
      noticeId,
      updateDto,
    );
    const eventId = notice.event?.id;

    const { title, category } = updateDto;
    const startDate = updateDto.event?.startDate;
    const endDate = updateDto.event?.endDate;
    if (eventId) {
      // 기존 이벤트 수정
      await eventRepository.updateEvent(eventId, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        category,
        title,
      });
    } else {
      // 새로운 이벤트 생성
      if (!startDate || !endDate) {
        throw createHttpError(
          400,
          '이벤트 시작일과 종료일을 모두 입력해주세요.',
        );
      }
      const newEvent = await eventRepository.createEvent({
        title: updatedNotice.title,
        category: updatedNotice.category,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        apartmentId: updatedNotice.apartmentId,
        resourceId: updatedNotice.id.toString(),
        resourceType: 'NOTICE',
      });
      updatedNotice = await noticeRepository.updateNoticeEvent(
        updatedNotice.id,
        newEvent.id,
      );
    }
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
    if (notice.event) await eventRepository.deleteEvent(notice.event.id);
  }
}

export default new NoticeService();
