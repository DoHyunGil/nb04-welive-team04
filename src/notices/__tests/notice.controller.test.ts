import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

const mockNoticeService = {
  createNotice: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getNotices: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getNoticeById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateNotice: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  deleteNotice: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../services/notice.service.js', () => ({
  __esModule: true,
  default: mockNoticeService,
}));

const { default: noticeController } =
  await import('../controllers/notice.controller.js');

const createMockRequest = (
  overrides: Partial<Request> = {},
): Partial<Request> => ({
  user: { id: 1, role: 'ADMIN' },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const createMockResponse = () => {
  const statusMock = jest.fn();
  const jsonMock = jest.fn();
  const sendMock = jest.fn();
  statusMock.mockReturnValue({
    json: jsonMock,
    send: sendMock,
  });
  return {
    status: statusMock,
    json: jsonMock,
    send: sendMock,
    statusMock,
    jsonMock,
    sendMock,
  };
};

const mockNext = jest.fn() as NextFunction;

const noUser = async (
  request: Partial<Request> = {},
  controllerFn: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
) => {
  const { status, json } = createMockResponse();
  await controllerFn(
    request as Request,
    { status, json } as unknown as Response,
    mockNext,
  );
  expect(mockNext).toHaveBeenCalled();
  expect(mockNext).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 401,
      message: '로그인이 필요합니다.',
    }),
  );
};

const serverError = async (
  request: Partial<Request> = {},
  controllerFn: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
  error: Error,
) => {
  const { status, json } = createMockResponse();
  await controllerFn(
    request as Request,
    { status, json } as unknown as Response,
    mockNext,
  );

  expect(mockNext).toHaveBeenCalledWith(error);
};

describe('NoticeController - 단위 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('createNotice', () => {
    it('공지 생성에 성공하면 201 상태코드를 반환한다', async () => {
      const mockNotice = {
        title: '테스트 제목',
        content: '테스트 내용',
        category: 'MAINTENANCE',
        isPinned: false,
      };
      const mockRequest = createMockRequest({
        body: {
          title: '테스트 제목',
          content: '테스트 내용',
          category: 'MAINTENANCE',
          isPinned: false,
        },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockNoticeService.createNotice.mockResolvedValue(mockNotice);
      await noticeController.createNotice(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );
      expect(mockNoticeService.createNotice).toHaveBeenCalledWith(
        1,
        mockRequest.body,
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockNotice);
    });
    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        user: undefined,
        body: {
          title: '테스트 제목',
          content: '테스트 내용',
          category: 'MAINTENANCE',
          isPinned: false,
        },
      });
      noUser(mockRequest, noticeController.createNotice);
      expect(mockNoticeService.createNotice).not.toHaveBeenCalled();
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        body: {
          title: '테스트 제목',
          content: '테스트 내용',
          category: 'MAINTENANCE',
          isPinned: false,
        },
      });
      mockNoticeService.createNotice.mockRejectedValue(error);
      serverError(mockRequest, noticeController.createNotice, error);
    });
  });
  describe('getNotices', () => {
    it('공지 목록 조회에 성공하면 200 상태코드를 반환한다', async () => {
      const mockNotices = {
        data: [
          {
            id: 1,
            title: '제목1',
            conetent: '내용1',
            category: 'COMMUNITY',
            isPinned: false,
          },
          {
            id: 2,
            title: '제목2',
            content: '내용2',
            category: 'MAINTENANCE',
            isPinned: false,
          },
        ],
        totalCount: 2,
        page: 1,
        limit: 20,
        hasNext: false,
      };
      const mockRequest = createMockRequest({});
      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockNoticeService.getNotices.mockResolvedValue(mockNotices);
      await noticeController.getNotices(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockNoticeService.getNotices).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockNotices);
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({});
      mockNoticeService.getNotices.mockRejectedValue(error);
      serverError(mockRequest, noticeController.getNotices, error);
    });
  });
  describe('getNoticeById', () => {
    it('공지 상세 조회에 성공하면 200 상태코드를 반환한다', async () => {
      const mockNotice = {
        id: 1,
        title: '테스트 제목',
        content: '테스트 내용',
        category: 'MAINTENANCE',
        isPinned: false,
      };
      const mockRequest = createMockRequest({
        params: { noticeId: '1' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      mockNoticeService.getNoticeById.mockResolvedValue(mockNotice);
      await noticeController.getNoticeById(
        mockRequest as Request,
        { status, json } as unknown as Response,
        mockNext,
      );

      expect(mockNoticeService.getNoticeById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockNotice);
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { noticeId: '1' },
      });
      mockNoticeService.getNoticeById.mockRejectedValue(error);
      serverError(mockRequest, noticeController.getNoticeById, error);
    });
  });
  describe('updateNotice', () => {
    it('공지 수정에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { noticeId: '1' },
        body: {
          title: '수정된 제목',
          content: '수정된 내용',
        },
      });
      const { status, send, statusMock, sendMock } = createMockResponse();
      mockNoticeService.updateNotice.mockResolvedValue({});
      await noticeController.updateNotice(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );

      expect(mockNoticeService.updateNotice).toHaveBeenCalledWith(
        1,
        1,
        mockRequest.body,
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { noticeId: '1' },
        body: {
          title: '수정된 제목',
          content: '수정된 내용',
        },
        user: undefined,
      });
      noUser(mockRequest, noticeController.updateNotice);
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { noticeId: '1' },
        body: {
          title: '수정된 제목',
          content: '수정된 내용',
        },
      });
      mockNoticeService.updateNotice.mockRejectedValue(error);
      serverError(mockRequest, noticeController.updateNotice, error);
    });
  });
  describe('deleteNotice', () => {
    it('공지 삭제에 성공하면 204 상태코드를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { noticeId: '1' },
      });
      const { status, send, statusMock, sendMock } = createMockResponse();
      mockNoticeService.deleteNotice.mockResolvedValue({});
      await noticeController.deleteNotice(
        mockRequest as Request,
        { status, send } as unknown as Response,
        mockNext,
      );
      expect(mockNoticeService.deleteNotice).toHaveBeenCalledWith(1, 1);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
    it('사용자 정보가 없으면 401 에러를 반환한다', async () => {
      const mockRequest = createMockRequest({
        params: { noticeId: '1' },
        user: undefined,
      });
      noUser(mockRequest, noticeController.deleteNotice);
    });
    it('서비스에서 에러가 발생하면 next를 호출한다', async () => {
      const error = new Error('Service Error');
      const mockRequest = createMockRequest({
        params: { noticeId: '1' },
      });
      mockNoticeService.deleteNotice.mockRejectedValue(error);
      serverError(mockRequest, noticeController.deleteNotice, error);
    });
  });
});
