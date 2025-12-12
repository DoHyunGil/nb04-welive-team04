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
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from '../../lib/cookie.js';

const mockAuthService = {
  login: jest.fn<(username: string, password: string) => Promise<any>>(),
  logout: jest.fn<() => Promise<void>>(),
  refresh: jest.fn<(refreshToken: string) => Promise<any>>(),
};

const mockAuthController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const data = await mockAuthService.login(username, password);
      setRefreshTokenCookie(res, data.refreshToken);
      setAccessTokenCookie(res, data.accessToken);
      res.send(data.user);
    } catch (error: any) {
      next(error);
    }
  },
  logout: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await mockAuthService.logout();
      clearAuthCookies(res);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies['refresh-token'];
      if (!refreshToken) {
        const error = new Error(
          '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다.',
        ) as any;
        error.status = 400;
        throw error;
      }
      const tokens = await mockAuthService.refresh(refreshToken);
      setRefreshTokenCookie(res, tokens.refreshToken);
      setAccessTokenCookie(res, tokens.accessToken);
      res.status(200).json({ message: '토큰이 갱신되었습니다.' });
    } catch (error: any) {
      next(error);
    }
  },
};

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    const router = express.Router();
    router.post('/login', mockAuthController.login);
    router.post('/logout', mockAuthController.logout);
    router.post('/refresh', mockAuthController.refresh);

    app.use('/api/v2/auth', router);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/auth/login', () => {
    it('올바른 credentials로 로그인 성공', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        contact: '010-1234-5678',
        name: '테스트유저',
        role: 'ADMIN',
        avatar: '',
        joinStatus: 'APPROVED',
        isActive: true,
      };

      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'testuser',
        password: 'testpassword',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('testuser');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'testuser',
        'testpassword',
      );
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      const error = new Error('비밀번호가 일치하지 않습니다.') as any;
      error.status = 404;
      mockAuthService.login.mockRejectedValue(error);

      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(404);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'testuser',
        'wrongpassword',
      );
    });

    it('존재하지 않는 사용자로 로그인 실패', async () => {
      const error = new Error('사용자를 찾을 수 없습니다.') as any;
      error.status = 404;
      mockAuthService.login.mockRejectedValue(error);

      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'nonexistent',
        password: 'testpassword',
      });

      expect(response.status).toBe(404);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v2/auth/logout', () => {
    it('로그아웃 성공', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const response = await request(app).post('/api/v2/auth/logout');

      expect(response.status).toBe(204);
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v2/auth/refresh', () => {
    it('유효한 refresh token으로 토큰 갱신 성공', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const response = await request(app)
        .post('/api/v2/auth/refresh')
        .set('Cookie', ['refresh-token=mock-refresh-token']);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('토큰이 갱신되었습니다.');
      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        'mock-refresh-token',
      );
    });

    it('refresh token 없이 요청 시 실패', async () => {
      const response = await request(app).post('/api/v2/auth/refresh');

      expect(response.status).toBe(400);
      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });
  });
});
