import request from 'supertest';
import app from '../../main.js';
import { prisma } from '../../lib/prisma.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

describe('Auth Routes', () => {
  let testUser: any;

  beforeAll(async () => {
    // 테스트용 유저 생성
    const hashedPassword = await authMiddleware.hashPassword('testpassword');
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        contact: '010-1234-5678',
        name: '테스트유저',
        password: hashedPassword,
        role: 'ADMIN',
        avatar: '',
        joinStatus: 'APPROVED',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.user.deleteMany({
      where: { username: 'testuser' },
    });
    await prisma.$disconnect();
  });

  describe('POST /auth/login', () => {
    it('올바른 credentials로 로그인 성공', async () => {
      const response = await request(app).post('/auth/login').send({
        username: 'testuser',
        password: 'testpassword',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('testuser');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      const response = await request(app).post('/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(404);
    });

    it('존재하지 않는 사용자로 로그인 실패', async () => {
      const response = await request(app).post('/auth/login').send({
        username: 'nonexistent',
        password: 'testpassword',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /auth/logout', () => {
    it('로그아웃 성공', async () => {
      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(204);
    });
  });

  describe('POST /auth/refresh', () => {
    it('유효한 refresh token으로 토큰 갱신 성공', async () => {
      // 먼저 로그인하여 쿠키 획득
      const loginResponse = await request(app).post('/auth/login').send({
        username: 'testuser',
        password: 'testpassword',
      });

      // 쿠키 추출
      const cookies = loginResponse.headers['set-cookie'];

      if (!cookies) {
        throw new Error('No cookies received from login');
      }

      // refresh 요청 시 쿠키 포함
      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('토큰이 갱신되었습니다.');
    });

    it('refresh token 없이 요청 시 실패', async () => {
      const response = await request(app).post('/auth/refresh');

      expect(response.status).toBe(400);
    });
  });
});
