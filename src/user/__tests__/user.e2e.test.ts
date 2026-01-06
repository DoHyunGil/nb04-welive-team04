import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import userRouter from '../../routers/me.route.js';
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
let authCookies: string[] = [];

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  testApp.use('/api/v2/auth', authRouter);
  testApp.use('/api/v2/users', userRouter);

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

describe('User API - E2E 통합 테스트', () => {
  beforeAll(async () => {
    const hashedPassword = await hashPassword('oldpassword123');

    const existingUser = await prisma.user.findFirst({
      where: { username: 'e2e_user_test' },
    });

    if (existingUser) {
      testUserId = existingUser.id;
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          username: 'e2e_user_test',
          email: 'e2e_user_test@example.com',
          contact: '010-1111-1111',
          name: 'E2E 유저 테스트',
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

    // 로그인하여 인증 쿠키 획득
    const loginResponse = await request(app).post('/api/v2/auth/login').send({
      username: 'e2e_user_test',
      password: 'oldpassword123',
    });

    authCookies = loginResponse.headers['set-cookie'] as unknown as string[];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('PATCH /api/v2/users/me/password - 비밀번호 변경', () => {
    it('비밀번호 변경 성공', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        });

      expect(response.status).toBe(204);
    });

    it('현재 비밀번호가 틀리면 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('새 비밀번호가 현재 비밀번호와 같으면 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'newpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('새 비밀번호와 확인 비밀번호가 다르면 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'newpassword123',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword789',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('필수 필드 누락 시 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'newpassword123',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v2/users/me/avatar - 프로필 이미지 업로드', () => {
    it('프로필 이미지 URL 업데이트 성공', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Cookie', authCookies)
        .send({
          avatar: 'https://example.com/avatar.jpg',
        });

      expect(response.status).toBe(204);

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(updatedUser?.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('avatar 필드 없이 요청 시 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Cookie', authCookies)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v2/users/me - 내 정보 조회', () => {
    it('내 정보 조회 성공', async () => {
      const response = await request(app)
        .get('/api/v2/users/me')
        .set('Cookie', authCookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('username', 'e2e_user_test');
      expect(response.body).toHaveProperty(
        'email',
        'e2e_user_test@example.com',
      );
      expect(response.body).not.toHaveProperty('password');
    });
  });
});
