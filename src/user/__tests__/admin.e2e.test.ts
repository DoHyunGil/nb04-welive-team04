import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import adminRouter from '../../routers/admin.route.js';
import authRouter from '../../routers/auth.route.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

let app: Express;
let superAdminUserId: number = 0;
let createdAdminId: number = 0;
let createdApartmentId: number = 0;
let authCookies: string[] = [];

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  testApp.use('/api/v2/auth', authRouter);
  testApp.use('/api/v2/users/admins', adminRouter);

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

describe('Admin API - E2E 통합 테스트', () => {
  beforeAll(async () => {
    const hashedPassword = await hashPassword('superadmin123');

    const existingSuperAdmin = await prisma.user.findFirst({
      where: { username: 'e2e_super_admin' },
    });

    if (existingSuperAdmin) {
      superAdminUserId = existingSuperAdmin.id;
      await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: { password: hashedPassword },
      });
    } else {
      const superAdmin = await prisma.user.create({
        data: {
          username: 'e2e_super_admin',
          email: 'e2e_super_admin@example.com',
          contact: '010-0000-0000',
          name: 'E2E 슈퍼 관리자',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          avatar: '',
          joinStatus: 'APPROVED',
          isActive: true,
        },
      });
      superAdminUserId = superAdmin.id;
    }

    app = setupTestApp();

    // 로그인하여 인증 쿠키 획득
    const loginResponse = await request(app).post('/api/v2/auth/login').send({
      username: 'e2e_super_admin',
      password: 'superadmin123',
    });

    authCookies = loginResponse.headers['set-cookie'] as unknown as string[];
  });

  afterAll(async () => {
    // 생성된 테스트 데이터 정리
    if (createdAdminId) {
      await prisma.adminOf.deleteMany({
        where: { userId: createdAdminId },
      });
      await prisma.user.deleteMany({
        where: { id: createdAdminId },
      });
    }

    if (createdApartmentId) {
      await prisma.apartment.deleteMany({
        where: { id: createdApartmentId },
      });
    }

    await prisma.user.deleteMany({
      where: { id: superAdminUserId },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/v2/users/admins - 관리자 계정 생성', () => {
    it('관리자 계정 생성 성공', async () => {
      const response = await request(app)
        .post('/api/v2/users/admins')
        .send({
          username: 'e2e_test_admin',
          email: 'e2e_test_admin@example.com',
          contact: '01011111111',
          name: 'E2E 테스트 관리자',
          password: 'admin123!@#',
          adminOf: {
            name: 'E2E 테스트 아파트',
            address: '서울시 강남구',
            description: 'E2E 테스트용',
            officeNumber: '02-1234-5678',
            buildingNumberFrom: 1,
            buildingNumberTo: 5,
            floorCountPerBuilding: 10,
            unitCountPerFloor: 4,
          },
        });

      if (response.status !== 204) {
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(204);

      // 생성된 관리자 확인
      const createdAdmin = await prisma.user.findFirst({
        where: { username: 'e2e_test_admin' },
      });

      expect(createdAdmin).toBeDefined();
      expect(createdAdmin?.username).toBe('e2e_test_admin');
      expect(createdAdmin?.role).toBe('ADMIN');

      const adminOf = await prisma.adminOf.findFirst({
        where: { userId: createdAdmin!.id },
      });

      expect(adminOf).toBeDefined();

      createdAdminId = createdAdmin!.id;

      // apartment 찾기
      const apartment = await prisma.apartment.findFirst({
        where: { adminOfId: adminOf!.id },
      });

      if (apartment) {
        createdApartmentId = apartment.id;
      }
    });

    it('중복된 username으로 계정 생성 실패', async () => {
      const response = await request(app)
        .post('/api/v2/users/admins')
        .send({
          username: 'e2e_test_admin',
          email: 'duplicate@example.com',
          contact: '01022222222',
          name: '중복 관리자',
          password: 'admin123!@#',
          adminOf: {
            name: '중복 아파트',
            address: '서울시 서초구',
            description: '중복 테스트',
            officeNumber: '02-9999-9999',
            buildingNumberFrom: 1,
            buildingNumberTo: 3,
            floorCountPerBuilding: 10,
            unitCountPerFloor: 4,
          },
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
    });

    it('필수 필드 누락 시 실패', async () => {
      const response = await request(app).post('/api/v2/users/admins').send({
        username: 'incomplete_admin',
        email: 'incomplete@example.com',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v2/users/admins - 관리자 목록 조회', () => {
    it('관리자 목록 조회 성공', async () => {
      const response = await request(app)
        .get('/api/v2/users/admins')
        .set('Cookie', authCookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('페이지네이션 동작 확인', async () => {
      const response = await request(app)
        .get('/api/v2/users/admins')
        .set('Cookie', authCookies)
        .query({ page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });

    it('검색 키워드로 필터링', async () => {
      const response = await request(app)
        .get('/api/v2/users/admins')
        .set('Cookie', authCookies)
        .query({ searchKeyword: 'e2e' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('PATCH /api/v2/users/admins/:id/join-status - 가입 상태 변경', () => {
    it('관리자 가입 상태 변경 성공', async () => {
      const response = await request(app)
        .patch(`/api/v2/users/admins/${createdAdminId}/join-status`)
        .set('Cookie', authCookies)
        .send({ joinStatus: 'APPROVED' });

      expect(response.status).toBe(204);

      const updatedAdmin = await prisma.user.findUnique({
        where: { id: createdAdminId },
      });
      expect(updatedAdmin?.joinStatus).toBe('APPROVED');
    });

    it('잘못된 ID로 요청 시 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/users/admins/999999/join-status')
        .set('Cookie', authCookies)
        .send({ joinStatus: 'APPROVED' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v2/users/admins/:id - 관리자 정보 수정', () => {
    it('관리자 정보 수정 성공', async () => {
      const response = await request(app)
        .patch(`/api/v2/users/admins/${createdAdminId}`)
        .set('Cookie', authCookies)
        .send({
          email: 'updated_admin@example.com',
          contact: '010-9999-9999',
        });

      expect(response.status).toBe(204);

      const updatedAdmin = await prisma.user.findUnique({
        where: { id: createdAdminId },
      });
      expect(updatedAdmin?.email).toBe('updated_admin@example.com');
      expect(updatedAdmin?.contact).toBe('010-9999-9999');
    });
  });

  describe('DELETE /api/v2/users/admins/:id - 관리자 삭제', () => {
    it('관리자 삭제 성공', async () => {
      const response = await request(app)
        .delete(`/api/v2/users/admins/${createdAdminId}`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(204);

      const deletedAdmin = await prisma.user.findUnique({
        where: { id: createdAdminId },
      });
      expect(deletedAdmin).toBeNull();

      createdAdminId = 0;
    });
  });
});
