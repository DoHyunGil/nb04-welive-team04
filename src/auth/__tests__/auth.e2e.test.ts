import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../../routers/auth.route.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

let app: Express;
let testUserId: number = 0;

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  testApp.use('/api/v2/auth', authRouter);

  testApp.use(
    (err: HttpError, req: Request, res: Response, next: NextFunction) => {
      void next;
      const status = err.status || err.statusCode || 500;

      if (status === 500) {
        console.error('[E2E Test Error Debug]:', err);
      }

      res.status(status).json({
        message: err.message || 'Internal Server Error',
      });
    },
  );

  return testApp;
};

describe('Auth API - E2E 통합 테스트', () => {
  beforeAll(async () => {
    const hashedPassword = await hashPassword('testpassword123');

    // 기존 사용자가 있는지 확인
    const existingUser = await prisma.user.findFirst({
      where: { username: 'e2e_test_user' },
    });

    if (existingUser) {
      testUserId = existingUser.id;
      // 비밀번호 업데이트
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          username: 'e2e_test_user',
          email: 'e2e_test@example.com',
          contact: '010-1111-1111',
          name: 'E2E 테스트 유저',
          password: hashedPassword,
          role: 'USER',
          avatar: '',
          joinStatus: 'APPROVED',
          isActive: true,
        },
      });
      testUserId = user.id;
    }

    app = setupTestApp();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v2/auth/login - 로그인', () => {
    it('올바른 credentials로 로그인 성공', async () => {
      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'e2e_test_user',
        password: 'testpassword123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'e2e_test_user');
      expect(response.body).toHaveProperty('email', 'e2e_test@example.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'e2e_test_user',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('존재하지 않는 사용자로 로그인 실패', async () => {
      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'nonexistent_user',
        password: 'testpassword123',
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('필수 필드 누락 시 실패', async () => {
      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'e2e_test_user',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v2/auth/logout - 로그아웃', () => {
    it('로그아웃 성공', async () => {
      const response = await request(app).post('/api/v2/auth/logout');

      expect(response.status).toBe(204);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v2/auth/refresh - 토큰 갱신', () => {
    it('유효한 refresh token으로 토큰 갱신 성공', async () => {
      // 먼저 로그인하여 refresh token 획득
      const loginResponse = await request(app).post('/api/v2/auth/login').send({
        username: 'e2e_test_user',
        password: 'testpassword123',
      });

      const cookies = loginResponse.headers['set-cookie'];

      // refresh token으로 토큰 갱신
      const response = await request(app)
        .post('/api/v2/auth/refresh')
        .set('Cookie', cookies as unknown as string[]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '토큰이 갱신되었습니다.');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('refresh token 없이 요청 시 실패', async () => {
      const response = await request(app).post('/api/v2/auth/refresh');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});
