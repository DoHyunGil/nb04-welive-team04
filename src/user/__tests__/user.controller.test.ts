import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Mock user service
const mockUserService = {
  getUserById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateAvatar: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updatePassword: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

// Mock AWS S3 functions
const mockUploadToS3 = jest.fn<(...args: unknown[]) => Promise<string>>();
const mockDeleteFromS3 = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.unstable_mockModule('../services/user.service.js', () => ({
  __esModule: true,
  default: mockUserService,
}));

jest.unstable_mockModule('../../lib/aws-s3.js', () => ({
  uploadToS3: mockUploadToS3,
  deleteFromS3: mockDeleteFromS3,
}));

const { default: userController } = await import(
  '../controllers/user.controller.js'
);

const createMockRequest = (
  overrides: Partial<Request> = {},
): Partial<Request> => ({
  body: {},
  user: undefined,
  file: undefined,
  ...overrides,
});

const createMockResponse = () => {
  const statusMock = jest.fn();
  const sendMock = jest.fn();
  statusMock.mockReturnValue({
    send: sendMock,
  });
  return {
    status: statusMock,
    send: sendMock,
    statusMock,
    sendMock,
  };
};

const mockNext = jest.fn() as NextFunction;

describe('UserController Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateAvatar', () => {
    it('아바타 업데이트 성공 시 204 응답을 반환한다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        avatar: null,
      };
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      };

      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUploadToS3.mockResolvedValue(
        'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      );
      mockUserService.updateAvatar.mockResolvedValue({
        ...mockUser,
        avatar: 'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      });

      const req = createMockRequest({
        user: { id: 1 },
        file: mockFile as Express.Multer.File,
      });
      const { status, send, statusMock, sendMock } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updateAvatar(req as Request, res, mockNext);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockUploadToS3).toHaveBeenCalledWith(mockFile, 'avatars');
      expect(mockUserService.updateAvatar).toHaveBeenCalledWith(
        1,
        'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      );
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('기존 S3 아바타가 있으면 삭제한다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        avatar: 'https://s3.amazonaws.com/bucket/avatars/old.jpg',
      };
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      };

      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUploadToS3.mockResolvedValue(
        'https://s3.amazonaws.com/bucket/avatars/new.jpg',
      );
      mockUserService.updateAvatar.mockResolvedValue({});
      mockDeleteFromS3.mockResolvedValue();

      const req = createMockRequest({
        user: { id: 1 },
        file: mockFile as Express.Multer.File,
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updateAvatar(req as Request, res, mockNext);

      expect(mockDeleteFromS3).toHaveBeenCalledWith(
        'https://s3.amazonaws.com/bucket/avatars/old.jpg',
      );
    });

    it('인증되지 않은 사용자는 401 에러를 받는다', async () => {
      const req = createMockRequest({
        user: undefined,
        file: {} as Express.Multer.File,
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updateAvatar(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: '인증이 필요합니다.',
        }),
      );
    });

    it('파일이 없으면 400 에러를 받는다', async () => {
      const req = createMockRequest({
        user: { id: 1 },
        file: undefined,
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updateAvatar(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 400,
          message: '이미지 파일이 필요합니다.',
        }),
      );
    });
  });

  describe('deleteAvatar', () => {
    it('아바타 삭제 성공 시 204 응답을 반환한다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        avatar: 'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      };

      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockDeleteFromS3.mockResolvedValue();
      mockUserService.updateAvatar.mockResolvedValue({
        ...mockUser,
        avatar: null,
      });

      const req = createMockRequest({
        user: { id: 1 },
      });
      const { status, send, statusMock, sendMock } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.deleteAvatar(req as Request, res, mockNext);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockDeleteFromS3).toHaveBeenCalledWith(
        'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      );
      expect(mockUserService.updateAvatar).toHaveBeenCalledWith(1, null);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('S3 URL이 아닌 경우 deleteFromS3를 호출하지 않는다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        avatar: 'http://example.com/avatar.jpg',
      };

      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUserService.updateAvatar.mockResolvedValue({});

      const req = createMockRequest({
        user: { id: 1 },
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.deleteAvatar(req as Request, res, mockNext);

      expect(mockDeleteFromS3).not.toHaveBeenCalled();
      expect(mockUserService.updateAvatar).toHaveBeenCalledWith(1, null);
    });

    it('인증되지 않은 사용자는 401 에러를 받는다', async () => {
      const req = createMockRequest({
        user: undefined,
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.deleteAvatar(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: '인증이 필요합니다.',
        }),
      );
    });
  });

  describe('updatePassword', () => {
    it('비밀번호 변경 성공 시 204 응답을 반환한다', async () => {
      mockUserService.updatePassword.mockResolvedValue({});

      const req = createMockRequest({
        user: { id: 1 },
        body: {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        },
      });
      const { status, send, statusMock, sendMock } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updatePassword(req as Request, res, mockNext);

      expect(mockUserService.updatePassword).toHaveBeenCalledWith(1, {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      });
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('password 필드를 사용한 비밀번호 변경도 성공한다', async () => {
      mockUserService.updatePassword.mockResolvedValue({});

      const req = createMockRequest({
        user: { id: 1 },
        body: {
          password: 'oldpassword',
          newPassword: 'newpassword123',
        },
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updatePassword(req as Request, res, mockNext);

      expect(mockUserService.updatePassword).toHaveBeenCalledWith(1, {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      });
    });

    it('현재 비밀번호가 없으면 400 에러를 받는다', async () => {
      const req = createMockRequest({
        user: { id: 1 },
        body: {
          newPassword: 'newpassword123',
        },
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updatePassword(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 400,
          message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
        }),
      );
    });

    it('새 비밀번호가 없으면 400 에러를 받는다', async () => {
      const req = createMockRequest({
        user: { id: 1 },
        body: {
          currentPassword: 'oldpassword',
        },
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updatePassword(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 400,
          message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
        }),
      );
    });

    it('인증되지 않은 사용자는 401 에러를 받는다', async () => {
      const req = createMockRequest({
        user: undefined,
        body: {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        },
      });
      const { status, send } = createMockResponse();
      const res = { status, send } as unknown as Response;

      await userController.updatePassword(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401,
          message: '인증이 필요합니다.',
        }),
      );
    });
  });
});
