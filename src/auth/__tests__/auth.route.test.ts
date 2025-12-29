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
import authController from '../controllers/auth.controller.js';

jest.mock('../services/auth.service.js', () => ({
  default: {
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
  },
}));

// Mock된 서비스를 가져옵니다
import authService from '../services/auth.service.js';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    const router = express.Router();
    router.post('/login', authController.login);
    router.post('/logout', authController.logout);
    router.post('/refresh', authController.refresh);

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

      (authService.login as jest.MockedFunction<typeof authService.login>)
        .mockResolvedValue({
          user: mockUser,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        } as any);

      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'testuser',
        password: 'testpassword',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('testuser');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(authService.login).toHaveBeenCalledWith('testuser', 'testpassword');
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      const error = new Error('비밀번호가 일치하지 않습니다.') as any;
      error.status = 404;
      (authService.login as jest.MockedFunction<typeof authService.login>)
        .mockRejectedValue(error);

      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(404);
      expect(authService.login).toHaveBeenCalledWith(
        'testuser',
        'wrongpassword',
      );
    });

    it('존재하지 않는 사용자로 로그인 실패', async () => {
      const error = new Error('사용자를 찾을 수 없습니다.') as any;
      error.status = 404;
      (authService.login as jest.MockedFunction<typeof authService.login>)
        .mockRejectedValue(error);

      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'nonexistent',
        password: 'testpassword',
      });

      expect(response.status).toBe(404);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v2/auth/logout', () => {
    it('로그아웃 성공', async () => {
      (authService.logout as jest.MockedFunction<typeof authService.logout>)
        .mockResolvedValue(undefined);

      const response = await request(app).post('/api/v2/auth/logout');

      expect(response.status).toBe(204);
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v2/auth/refresh', () => {
    it('유효한 refresh token으로 토큰 갱신 성공', async () => {
      (authService.refresh as jest.MockedFunction<typeof authService.refresh>)
        .mockResolvedValue({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        } as any);

      const response = await request(app)
        .post('/api/v2/auth/refresh')
        .set('Cookie', ['refresh_token=mock-refresh-token']);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('토큰이 갱신되었습니다.');
      expect(authService.refresh).toHaveBeenCalledWith('mock-refresh-token');
    });

    it('refresh token 없이 요청 시 실패', async () => {
      const response = await request(app).post('/api/v2/auth/refresh');

      expect(response.status).toBe(400);
      expect(authService.refresh).not.toHaveBeenCalled();
    });
  });
});
