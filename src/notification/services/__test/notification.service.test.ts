// src/notification/services/__test/notification.service.test.ts
import { jest } from '@jest/globals';

const mockSendToUser = jest.fn();
jest.unstable_mockModule('../../../lib/sse.manager.js', () => ({
  sseManager: {
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

const { NotificationService } = await import('../notification.service.js');


describe('NotificationService 단위 테스트', () => {
  let service: any;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findByUserIdWithPagination: jest.fn(),
      findUnreadByUserId: jest.fn(),
      findSimple: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    service = new NotificationService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('DB에 저장하고 SSE로 알림을 전송해야 한다', async () => {
      const userId = 1;
      const content = '새 알림';
      const mockNotif = { id: 10, userId, content };

      mockRepository.create.mockResolvedValue(mockNotif);

      const result = await service.create(userId, content);

      expect(mockRepository.create).toHaveBeenCalledWith(userId, content);
      expect(result).toEqual(mockNotif);

      expect(mockSendToUser).toHaveBeenCalledWith(userId, {
        type: 'alarm',
        data: [mockNotif],
      });
    });
  });

  describe('createMany', () => {
    it('여러 유저의 알림을 생성하고, 각 유저에게 SSE를 따로 전송해야 한다', async () => {
      const inputData = [
        { userId: 1, content: 'User1 알림' },
        { userId: 2, content: 'User2 알림' },
        { userId: 1, content: 'User1 또 다른 알림' },
      ];

      const mockResults = [
        { id: 1, userId: 1, content: 'User1 알림' },
        { id: 2, userId: 2, content: 'User2 알림' },
        { id: 3, userId: 1, content: 'User1 또 다른 알림' },
      ];

      mockRepository.createMany.mockResolvedValue(mockResults);

      await service.createMany(inputData);

      expect(mockRepository.createMany).toHaveBeenCalledWith(inputData);

      expect(mockSendToUser).toHaveBeenCalledWith(1, {
        type: 'alarm',
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 1, content: 'User1 알림' }),
          expect.objectContaining({ userId: 1, content: 'User1 또 다른 알림' })
        ]),
      });

      expect(mockSendToUser).toHaveBeenCalledWith(2, {
        type: 'alarm',
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 2, content: 'User2 알림' })
        ]),
      });
    });
  });

  describe('markAsRead', () => {
    it('존재하지 않는 알림이면 404 에러를 던져야 한다', async () => {
      mockRepository.findSimple.mockResolvedValue(null);

      await expect(service.markAsRead(999, 1))
        .rejects.toThrow(expect.objectContaining({ status: 404 }));
    });

    it('본인의 알림이 아니면 403 에러를 던져야 한다', async () => {
      const notifId = 10;
      const ownerId = 2;
      const requesterId = 1;

      mockRepository.findSimple.mockResolvedValue({ id: notifId, userId: ownerId });

      await expect(service.markAsRead(notifId, requesterId))
        .rejects.toThrow(expect.objectContaining({ status: 403 }));
    });

    it('정상적인 경우 업데이트를 수행해야 한다', async () => {
      const notifId = 10;
      const userId = 1;

      mockRepository.findSimple.mockResolvedValue({ id: notifId, userId });
      mockRepository.markAsRead.mockResolvedValue({ count: 1 });

      await service.markAsRead(notifId, userId);

      expect(mockRepository.markAsRead).toHaveBeenCalledWith(notifId, userId);
    });

    it('업데이트 결과가 0이면(실패 시) 500 에러를 던져야 한다', async () => {
      mockRepository.findSimple.mockResolvedValue({ id: 10, userId: 1 });
      mockRepository.markAsRead.mockResolvedValue({ count: 0 });

      await expect(service.markAsRead(10, 1))
        .rejects.toThrow(expect.objectContaining({ status: 500 }));
    });
  });

  describe('Simple Pass-through Methods', () => {
    it('findAll은 레포지토리 메서드를 그대로 호출해야 한다', async () => {
      await service.findAll(1, 1, 10);
      expect(mockRepository.findByUserIdWithPagination).toHaveBeenCalledWith(1, 1, 10);
    });

    it('findUnread는 레포지토리 메서드를 그대로 호출해야 한다', async () => {
      const date = new Date();
      await service.findUnread(1, date);
      expect(mockRepository.findUnreadByUserId).toHaveBeenCalledWith(1, date);
    });

    it('markAllAsRead는 레포지토리 메서드를 그대로 호출해야 한다', async () => {
      await service.markAllAsRead(1);
      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith(1);
    });
  });
});