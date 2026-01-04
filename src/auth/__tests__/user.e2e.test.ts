import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import meRouter from '../../routers/me.route.js';
import authRouter from '../../routers/auth.route.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  testApp.use('/api/v2/users', meRouter);

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
    const hashedPassword = await hashPassword('testpassword123');

    // 테스트 사용자 생성
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
          email: 'e2e_user@example.com',
          contact: '010-1111-1111',
          name: 'E2E User Test',
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
      password: 'testpassword123',
    });

    authCookies = loginResponse.headers['set-cookie'] || [];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('PATCH /api/v2/users/me/avatar - 아바타 업데이트', () => {
    it('인증 없이 요청 시 401 에러', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .attach('avatar', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(401);
    });

    it('파일 없이 요청 시 400 에러', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Cookie', authCookies);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        '이미지 파일이 필요합니다.',
      );
    });

    // Note: 실제 S3 업로드 테스트는 E2E에서 제외 (모킹 필요)
    // 실제 프로덕션 환경에서는 S3 모킹 또는 별도의 통합 테스트 환경 필요
  });

  describe('DELETE /api/v2/users/me/avatar - 아바타 삭제', () => {
    it('인증 없이 요청 시 401 에러', async () => {
      const response = await request(app).delete('/api/v2/users/me/avatar');

      expect(response.status).toBe(401);
    });

    // Note: 실제 S3 삭제 테스트는 E2E에서 제외 (모킹 필요)
  });

  describe('PATCH /api/v2/users/me/password - 비밀번호 변경', () => {
    it('유효한 비밀번호로 변경 성공', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(204);

      // 비밀번호가 실제로 변경되었는지 확인 (새 비밀번호로 로그인 시도)
      const loginResponse = await request(app).post('/api/v2/auth/login').send({
        username: 'e2e_user_test',
        password: 'newpassword456',
      });

      expect(loginResponse.status).toBe(200);

      // 다시 원래 비밀번호로 복구
      const resetResponse = await request(app)
        .patch('/api/v2/users/me/password')
        .set(
          'Cookie',
          loginResponse.headers['set-cookie'] as unknown as string[],
        )
        .send({
          currentPassword: 'newpassword456',
          newPassword: 'testpassword123',
        });

      expect(resetResponse.status).toBe(204);
    });

    it('잘못된 현재 비밀번호로 변경 시 에러', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(401);
    });

    it('현재 비밀번호와 같은 새 비밀번호로 변경 시 400 에러', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'testpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
      );
    });

    it('현재 비밀번호 누락 시 400 에러', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
      );
    });

    it('새 비밀번호 누락 시 400 에러', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'testpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
      );
    });

    it('인증 없이 요청 시 401 에러', async () => {
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(401);
    });
  });
});
