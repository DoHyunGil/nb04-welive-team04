/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from '@jest/globals';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

const mockUserService = {
  updatePassword: jest.fn<(userId: number, data: any) => Promise<any>>(),
  updateAvatar: jest.fn<(userId: number, path: string) => Promise<any>>(),
};

const mockJwtAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }
  req.user = { id: 1 };
  next();
};

const mockUserController = {
  updatePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }
      await mockUserService.updatePassword(userId, req.body);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  updateAvatar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }
      if (!req.file) {
        const error = new Error('파일이 없습니다.') as any;
        error.status = 400;
        throw error;
      }
      await mockUserService.updateAvatar(userId, req.file.path);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
};

describe('Users Routes', () => {
  let app: express.Application;
  const testToken = 'test-valid-token';
  const testUserId = 1;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const router = express.Router();

    const mockUpload = (req: Request, _res: Response, next: NextFunction) => {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        (req as any).file = { path: 'uploads/test-avatar.png' };
      }
      next();
    };

    router.patch(
      '/me/avatar',
      mockJwtAuth,
      mockUpload,
      mockUserController.updateAvatar,
    );
    router.patch(
      '/me/password',
      mockJwtAuth,
      mockUserController.updatePassword,
    );

    app.use('/api/v2/users', router);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/v2/users/me/password', () => {
    it('비밀번호 변경 성공', async () => {
      mockUserService.updatePassword.mockResolvedValue({
        id: testUserId,
        username: 'testuser',
      });

      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(204);
      expect(mockUserService.updatePassword).toHaveBeenCalledTimes(1);
      expect(mockUserService.updatePassword).toHaveBeenCalledWith(testUserId, {
        currentPassword: 'testpassword123',
        newPassword: 'newpassword456',
      });
    });

    it('현재 비밀번호가 틀리면 실패', async () => {
      const error = new Error('현재 비밀번호가 일치하지 않습니다.') as any;
      error.status = 400;
      mockUserService.updatePassword.mockRejectedValue(error);

      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(400);
      expect(mockUserService.updatePassword).toHaveBeenCalledTimes(1);
    });

    it('새 비밀번호가 현재 비밀번호와 같으면 실패', async () => {
      const error = new Error(
        '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
      ) as any;
      error.status = 400;
      mockUserService.updatePassword.mockRejectedValue(error);

      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'testpassword123',
        });

      expect(response.status).toBe(400);
    });

    it('인증 없이 비밀번호 변경 시도 시 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(401);
      expect(mockUserService.updatePassword).not.toHaveBeenCalled();
    });

    it('필수 필드 누락 시 실패', async () => {
      const error = new Error('필수 필드가 누락되었습니다.') as any;
      error.status = 400;
      mockUserService.updatePassword.mockRejectedValue(error);

      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'testpassword123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v2/users/me/avatar', () => {
    it('프로필 이미지 업로드 성공', async () => {
      mockUserService.updateAvatar.mockResolvedValue({
        id: testUserId,
        avatar: 'uploads/test-avatar.png',
      });

      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'multipart/form-data');

      expect(response.status).toBe(204);
      expect(mockUserService.updateAvatar).toHaveBeenCalledTimes(1);
      expect(mockUserService.updateAvatar).toHaveBeenCalledWith(
        testUserId,
        'uploads/test-avatar.png',
      );
    });

    it('인증 없이 아바타 업로드 시도 시 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Content-Type', 'multipart/form-data');

      expect(response.status).toBe(401);
      expect(mockUserService.updateAvatar).not.toHaveBeenCalled();
    });

    it('파일 없이 아바타 업로드 시도 시 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });
  });
});
