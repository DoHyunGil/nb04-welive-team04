import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../main.js';
import { prisma } from '../../lib/prisma.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';

describe('Users Routes', () => {
  let testUser: any;
  let userToken: string;

  beforeAll(async () => {
    // 테스트용 유저 생성
    const hashedPassword = await authMiddleware.hashPassword('testpassword123');
    testUser = await prisma.user.create({
      data: {
        username: 'userstest',
        email: 'userstest@example.com',
        contact: '010-1234-5678',
        name: '유저테스트',
        password: hashedPassword,
        role: 'RESIDENT',
        avatar: '',
        joinStatus: 'APPROVED',
        isActive: true,
      },
    });

    // 유저 토큰 생성
    userToken = jwt.sign(
      { id: testUser.id },
      process.env.JWT_ACCESS_SECRET || '',
      { expiresIn: '15m' },
    );

    // uploads 폴더 확인 및 생성
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.user.deleteMany({
      where: { username: 'userstest' },
    });
    await prisma.$disconnect();
  });

  describe('PATCH /users/me/password', () => {
    it('비밀번호 변경 성공', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(204);

      // 변경된 비밀번호로 다시 변경 (원래대로)
      await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'newpassword456',
          newPassword: 'testpassword123',
        });
    });

    it('현재 비밀번호가 틀리면 실패', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(400);
    });

    it('새 비밀번호가 현재 비밀번호와 같으면 실패', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'testpassword123',
        });

      expect(response.status).toBe(400);
    });

    it('인증 없이 비밀번호 변경 시도 시 실패', async () => {
      const response = await request(app).patch('/users/me/password').send({
        currentPassword: 'testpassword123',
        newPassword: 'newpassword456',
      });

      expect(response.status).toBe(401);
    });

    it('필수 필드 누락 시 실패', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'testpassword123',
        });

      expect(response.status).toBe(400);
    });

    it('빈 값으로 요청 시 실패', async () => {
      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: '',
          newPassword: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /users/me/avatar', () => {
    it('프로필 이미지 업로드 성공', async () => {
      // 테스트용 이미지 파일 생성
      const testImagePath = path.join(process.cwd(), 'uploads', 'test-image.png');

      // 간단한 PNG 파일 데이터 생성 (1x1 pixel transparent PNG)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      fs.writeFileSync(testImagePath, pngBuffer);

      const response = await request(app)
        .patch('/users/me/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('avatar', testImagePath);

      expect(response.status).toBe(204);

      // 테스트 파일 정리
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    it('인증 없이 아바타 업로드 시도 시 실패', async () => {
      const testImagePath = path.join(process.cwd(), 'uploads', 'test-image2.png');

      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      fs.writeFileSync(testImagePath, pngBuffer);

      const response = await request(app)
        .patch('/users/me/avatar')
        .attach('avatar', testImagePath);

      expect(response.status).toBe(401);

      // 테스트 파일 정리
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    it('파일 없이 아바타 업로드 시도 시 실패', async () => {
      const response = await request(app)
        .patch('/users/me/avatar')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });

    it('지원하지 않는 파일 형식 업로드 시 실패', async () => {
      const testFilePath = path.join(process.cwd(), 'uploads', 'test-file.txt');
      fs.writeFileSync(testFilePath, 'This is a test file');

      const response = await request(app)
        .patch('/users/me/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('avatar', testFilePath);

      expect(response.status).toBe(500);

      // 테스트 파일 정리
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });
  });
});
