import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NoticeCategory } from '../../../generated/prisma/client.js';

const mockNoticeRepository = {
  getAdminOfIdByUserId: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  createNotice: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getNotices: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getNoticeCount: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getNoticeById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  incrementViewCount: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateNotice: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateNoticeEvent: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleteNotice: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../repositories/notice.repository.js', () => ({
  __esModule: true,
  default: mockNoticeRepository,
}));

const mockEventRepository = {
  createEvent: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateEvent: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getApartmentIdByUserId: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  findEventByResource: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleteEvent: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule(
  '../../events/repositories/event.repository.js',
  () => ({
    __esModule: true,
    default: mockEventRepository,
  }),
);

const { default: noticeService } =
  await import('../services/notice.service.js');

const mockNotice = {
  title: '테스트 공지 제목',
  content: '테스트 공지 내용',
  category: NoticeCategory.MAINTENANCE,
  isPinned: false,
  apartmentId: 1,
};
const mockEvent = {
  title: '테스트 공지 제목',
  category: NoticeCategory.MAINTENANCE,
  resourceType: 'NOTICE',
};

const getFutureDates = () => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + 1);
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 7);
  return { startDate, endDate };
};

describe('NoticeService - 단위 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('createNotice', () => {
    it('관리자는 공지를 생성할 수 있다', async () => {
      const mockCreatedNotice = {
        id: 1,
        authorId: 1,
        ...mockNotice,
      };
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.createNotice.mockResolvedValue(mockCreatedNotice);
      const result = await noticeService.createNotice(1, mockNotice);
      expect(result).toBeDefined();
      expect(result.title).toBe('테스트 공지 제목');
      expect(mockNoticeRepository.createNotice).toHaveBeenCalledTimes(1);
      expect(mockEventRepository.createEvent).not.toHaveBeenCalled();
      expect(mockNoticeRepository.updateNoticeEvent).not.toHaveBeenCalled();
    });
    it('날짜와 생성할 경우 이벤트도 생성된다', async () => {
      const { startDate, endDate } = getFutureDates();
      const createDto = {
        event: { startDate, endDate },
        ...mockNotice,
      };
      const mockCreatedNotice = {
        id: 1,
        authorId: 1,
        ...mockNotice,
      };
      const mockCreatedEvent = {
        id: 1,
        startDate,
        endDate,
        ...mockEvent,
      };
      const finalNotice = {
        eventId: 1,
        ...mockCreatedNotice,
      };
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.createNotice.mockResolvedValue(mockCreatedNotice);
      mockEventRepository.createEvent.mockResolvedValue(mockCreatedEvent);
      mockNoticeRepository.updateNoticeEvent.mockResolvedValue(finalNotice);

      const result = await noticeService.createNotice(1, createDto);
      expect(result).toBeDefined();
      expect(result.title).toBe('테스트 공지 제목');
      expect(result.eventId).toBe(1);
      expect(mockNoticeRepository.createNotice).toHaveBeenCalledTimes(1);
      expect(mockEventRepository.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: '1',
        }),
      );
      expect(mockNoticeRepository.updateNoticeEvent).toHaveBeenCalledWith(1, 1);
    });
    it('관리자가 아닌 경우 403 에러를 반환한다', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue(null);
      await expect(noticeService.createNotice(2, mockNotice)).rejects.toThrow(
        '관리자가 아닙니다.',
      );
    });
  });
  describe('getNotices', () => {
    it('공지 목록을 조회할 수 있다', async () => {
      const mockList = [
        { id: 1, authorId: 1, ...mockNotice, _count: { comments: 0 } },
        { id: 2, authorId: 1, ...mockNotice, _count: { comments: 0 } },
      ];
      mockNoticeRepository.getNotices.mockResolvedValue(mockList);
      mockNoticeRepository.getNoticeCount.mockResolvedValue(2);

      const result = await noticeService.getNotices({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });
    it('상태별 필터링이 가능하다', async () => {
      mockNoticeRepository.getNotices.mockResolvedValue([]);
      mockNoticeRepository.getNoticeCount.mockResolvedValue(1);

      await noticeService.getNotices({
        page: 1,
        limit: 20,
        category: 'MAINTENANCE',
      });

      expect(mockNoticeRepository.getNotices).toHaveBeenCalledWith(
        expect.objectContaining({
          category: NoticeCategory.MAINTENANCE,
        }),
      );
      expect(mockNoticeRepository.getNoticeCount).toHaveBeenCalledWith(
        undefined,
        'MAINTENANCE',
      );
    });
  });
  describe('getNoticeById', () => {
    it('공지 상세를 조회할 수 있다', async () => {
      const mockCreatedNotice = {
        id: 1,
        authorId: 1,
        ...mockNotice,
        _count: { comments: 0 },
      };
      mockNoticeRepository.getNoticeById.mockResolvedValue(mockCreatedNotice);

      const result = await noticeService.getNoticeById(1);
      expect(result.id).toBe(1);
      expect(mockNoticeRepository.incrementViewCount).toHaveBeenCalledWith(1);
    });
    it('존재하지 않은 공지 조회 시 404 에러를 반환한다', async () => {
      mockNoticeRepository.getNoticeById.mockResolvedValue(null);
      await expect(noticeService.getNoticeById(99)).rejects.toThrow(
        '해당 공지가 존재하지 않습니다.',
      );
    });
  });
  describe('updateNotice', () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + 7);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 14);
    const notice = {
      id: 1,
      authorId: 1,
      ...mockNotice,
      eventId: null,
    };
    const noticeWithDate = {
      id: 2,
      authorId: 1,
      ...mockNotice,
      event: {
        id: 1,
      },
    };
    const updateBody = {
      title: '제목 수정',
      category: NoticeCategory.COMMUNITY,
    };
    const updateBodyWithDate = {
      title: '날짜도 수정',
      category: NoticeCategory.EMERGENCY,
      event: {
        startDate,
        endDate,
      },
    };
    it('날짜 없는 공지에 날짜없이 수정하기', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.getNoticeById.mockResolvedValue(notice);
      mockNoticeRepository.updateNotice.mockResolvedValue({
        ...notice,
        ...updateBody,
      });

      const result = await noticeService.updateNotice(1, 1, updateBody);
      expect(result.title).toBe('제목 수정');
      expect(result.category).toBe(NoticeCategory.COMMUNITY);
      expect(mockEventRepository.createEvent).not.toHaveBeenCalled();
      expect(mockNoticeRepository.updateNoticeEvent).not.toHaveBeenCalled();
    });
    it('날짜 없는 공지에 날짜 포함하여 수정하기', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.getNoticeById.mockResolvedValue(notice);
      mockNoticeRepository.updateNotice.mockResolvedValue({
        ...notice,
        title: '날짜도 수정',
        category: 'EMERGENCY',
      });

      mockEventRepository.createEvent.mockResolvedValue({
        title: '날짜도 수정',
        category: 'EMERGENCY',
        startDate,
        endDate,
        apartmentId: 1,
        resourceId: '1',
        resourceType: 'NOTICE',
      });
      mockNoticeRepository.updateNoticeEvent.mockResolvedValue({
        ...notice,
        title: '날짜도 수정',
        category: 'EMERGENCY',
        event: { id: 1 },
        eventId: 1,
      });

      const result = await noticeService.updateNotice(1, 1, {
        title: '날짜도 수정',
        event: { startDate, endDate },
      });
      expect(result.title).toBe('날짜도 수정');
      expect(result.eventId).toBe(1);
      expect(mockNoticeRepository.updateNotice).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: '날짜도 수정' }),
      );
      expect(mockEventRepository.updateEvent).not.toHaveBeenCalled();
    });
    it('날짜 있는 공지 수정하기', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.getNoticeById.mockResolvedValue(noticeWithDate);
      mockNoticeRepository.updateNotice.mockResolvedValue({
        ...noticeWithDate,
        ...updateBodyWithDate,
      });
      mockEventRepository.updateEvent.mockResolvedValue({
        title: updateBodyWithDate.title,
        category: updateBodyWithDate.category,
        startDate,
        endDate,
        apartmentId: 1,
        resourceId: '2',
        resourceType: 'NOTICE',
      });

      const result = await noticeService.updateNotice(1, 2, updateBodyWithDate);
      expect(result.title).toBe('날짜도 수정');
      expect(result.category).toBe('EMERGENCY');
      expect(mockEventRepository.createEvent).not.toHaveBeenCalled();
      expect(mockNoticeRepository.updateNoticeEvent).not.toHaveBeenCalled();
    });
    it('입주민이 공지 수정 시 403 에러를 반환한다', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue(null);
      await expect(
        noticeService.updateNotice(2, 1, updateBody),
      ).rejects.toThrow('권한이 없습니다.');
    });
    it('존재하지 않은 공지 수정 시 404 에러를 반환한다', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.getNoticeById.mockResolvedValue(null);
      await expect(
        noticeService.updateNotice(1, 999, updateBody),
      ).rejects.toThrow('해당 공지가 존재하지 않습니다.');
    });
  });
  describe('deleteNotice', () => {
    const notice = {
      id: 1,
      authorId: 1,
      ...mockNotice,
      eventId: null,
    };
    const noticeWithDate = {
      id: 2,
      authorId: 1,
      ...mockNotice,
      event: {
        id: 1,
      },
    };
    it('관리자는 공지를 삭제할 수 있다', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.getNoticeById.mockResolvedValue(notice);
      mockNoticeRepository.deleteNotice.mockResolvedValue(undefined);
      await noticeService.deleteNotice(1, 1);
      expect(mockNoticeRepository.deleteNotice).toHaveBeenCalledTimes(1);
      expect(mockEventRepository.deleteEvent).not.toHaveBeenCalled();
    });
    it('이벤트와 연결된 공지면 이벤트도 삭제한다', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.getNoticeById.mockResolvedValue(noticeWithDate);
      mockNoticeRepository.deleteNotice.mockResolvedValue(undefined);
      mockEventRepository.deleteEvent.mockResolvedValue(undefined);

      await noticeService.deleteNotice(1, 2);
      expect(mockNoticeRepository.deleteNotice).toHaveBeenCalledTimes(1);
      expect(mockEventRepository.deleteEvent).toHaveBeenCalledTimes(1);
    });
    it('입주민이 공지 삭제 시 403 에러를 반환한다', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue(null);
      await expect(noticeService.deleteNotice(2, 1)).rejects.toThrow(
        '권한이 없습니다.',
      );
    });
    it('존재하지 않은 공지 삭제 시 404 에러를 반환한다', async () => {
      mockNoticeRepository.getAdminOfIdByUserId.mockResolvedValue({ id: 1 });
      mockNoticeRepository.getNoticeById.mockResolvedValue(null);
      await expect(noticeService.deleteNotice(1, 999)).rejects.toThrow(
        '해당 공지가 존재하지 않습니다.',
      );
    });
  });
});
