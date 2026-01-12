// src/notification/controllers/__test/notification.controller.test.ts
import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

const mockAddConnection = jest.fn();
const mockSendToUser = jest.fn();

jest.unstable_mockModule('../../../lib/sse.manager.js', () => ({
  sseManager: {
    addConnection: mockAddConnection,
    sendToUser: mockSendToUser,
  },
}));

const {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} = await import('@jest/globals');

const { NotificationController } = await import('../notification.controller.js');

describe('NotificationController 단위 테스트', () => {
  let controller: any;
  let mockService: any;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockService = {
      findUnread: jest.fn(),
      findAll: jest.fn(),
      markAsRead: jest.fn(),
    };

    controller = new NotificationController(mockService);

    req = {
      user: { id: 1 } as any,
      query: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      headersSent: false,
    } as unknown as Response;

    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSSE', () => {
    it('연결 시 sseManager.addConnection을 호출하고, 읽지 않은 알림이 있으면 전송해야 한다', async () => {
      req.user = { id: 999 } as any;
      const unreadList = [{ id: 1, content: 'New!' }];
      mockService.findUnread.mockResolvedValue(unreadList);

      await controller.handleSSE(req as Request, res as Response, next);

      expect(mockAddConnection).toHaveBeenCalledWith(999, res);
      expect(mockService.findUnread).toHaveBeenCalledWith(999);
      expect(mockSendToUser).toHaveBeenCalledWith(999, {
        type: 'alarm',
        data: unreadList,
      });
    });

    it('읽지 않은 알림이 없으면 sendToUser를 호출하지 않아야 한다', async () => {
      req.user = { id: 999 } as any;
      mockService.findUnread.mockResolvedValue([]);

      await controller.handleSSE(req as Request, res as Response, next);

      expect(mockAddConnection).toHaveBeenCalledWith(999, res);
      expect(mockSendToUser).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('서비스를 통해 알림 목록을 조회하고 반환해야 한다', async () => {
      req.user = { id: 1 } as any;
      req.query = { page: '2', limit: '10' };

      const mockResult = { notifications: [], total: 0 };
      mockService.findAll.mockResolvedValue(mockResult);

      await controller.findAll(req as Request, res as Response, next);

      expect(mockService.findAll).toHaveBeenCalledWith(1, '2', '10');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('markAsRead', () => {
    it('유효한 ID가 주어지면 읽음 처리 후 204를 반환해야 한다', async () => {
      req.user = { id: 1 } as any;
      req.params = { notificationid: '123' };

      mockService.markAsRead.mockResolvedValue(undefined);

      await controller.markAsRead(req as Request, res as Response, next);

      expect(mockService.markAsRead).toHaveBeenCalledWith(123, 1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('ID가 숫자가 아니면 에러를 던져야 한다 (next 호출)', async () => {
      req.params = { notificationid: 'abc' };

      await controller.markAsRead(req as Request, res as Response, next);

      expect(mockService.markAsRead).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        status: 400,
        message: '잘못된 요청입니다. ID는 숫자여야 합니다.'
      }));
    });
  });
});