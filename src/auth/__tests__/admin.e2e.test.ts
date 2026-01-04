import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import adminRouter, { superAdminRouter } from '../../routers/admin.route.js';
import authRouter from '../../routers/auth.route.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

let app: Express;
let testSuperAdminId: number = 0;
let testAdminId: number = 0;
let authCookies: string[] = [];

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  testApp.use('/api/v2/auth', authRouter);
  testApp.use('/api/v2/users/super-admins', superAdminRouter);
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
    const hashedPassword = await hashPassword('testpassword123');

    // 슈퍼 관리자 생성
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { username: 'e2e_super_admin' },
    });

    if (existingSuperAdmin) {
      testSuperAdminId = existingSuperAdmin.id;
      await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: { password: hashedPassword },
      });
    } else {
      const superAdmin = await prisma.user.create({
        data: {
          username: 'e2e_super_admin',
          email: 'e2e_super@example.com',
          contact: '010-0000-0000',
          name: 'E2E Super Admin',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          avatar: '',
          joinStatus: 'APPROVED',
          isActive: true,
        },
      });
      testSuperAdminId = superAdmin.id;
    }

    app = setupTestApp();

    // 로그인하여 인증 쿠키 획득
    const loginResponse = await request(app).post('/api/v2/auth/login').send({
      username: 'e2e_super_admin',
      password: 'testpassword123',
    });

    authCookies = loginResponse.headers['set-cookie'] || [];
  });

  afterAll(async () => {
    // 테스트 중 생성된 관리자 삭제
    await prisma.adminOf.deleteMany({
      where: {
        OR: [
          { userId: testAdminId },
          { name: { contains: 'E2E Test Apartment' } },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: testSuperAdminId },
          { id: testAdminId },
          { username: { contains: 'e2e_test_admin' } },
        ],
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/v2/users/super-admins - 슈퍼 관리자 등록', () => {
    it('유효한 데이터로 슈퍼 관리자 등록 성공', async () => {
      const response = await request(app)
        .post('/api/v2/users/super-admins')
        .send({
          username: 'e2e_test_super_admin',
          password: 'testpassword123',
          email: 'e2e_test_super@example.com',
          contact: '010-1111-1111',
          name: 'E2E Test Super Admin',
        });

      expect(response.status).toBe(204);
    });

    it('중복된 아이디로 등록 실패', async () => {
      const response = await request(app)
        .post('/api/v2/users/super-admins')
        .send({
          username: 'e2e_super_admin',
          password: 'testpassword123',
          email: 'new_email@example.com',
          contact: '010-2222-2222',
          name: 'Duplicate User',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v2/users/admins - 일반 관리자 등록', () => {
    it('유효한 데이터로 일반 관리자 등록 성공', async () => {
      const response = await request(app)
        .post('/api/v2/users/admins')
        .send({
          username: 'e2e_test_admin',
          password: 'testpassword123',
          email: 'e2e_test_admin@example.com',
          contact: '010-3333-3333',
          name: 'E2E Test Admin',
          adminOf: {
            name: 'E2E Test Apartment',
            address: 'Seoul',
            description: 'Test Apartment',
            officeNumber: '02-1234-5678',
            buildingNumberFrom: 101,
            buildingNumberTo: 105,
            floorCountPerBuilding: 10,
            unitCountPerFloor: 4,
          },
        });

      expect(response.status).toBe(204);

      // 생성된 관리자 ID 저장 (cleanup용)
      const createdAdmin = await prisma.user.findFirst({
        where: { username: 'e2e_test_admin' },
      });
      if (createdAdmin) {
        testAdminId = createdAdmin.id;
      }
    });

    it('중복된 아파트 이름으로 등록 실패', async () => {
      const response = await request(app)
        .post('/api/v2/users/admins')
        .send({
          username: 'e2e_test_admin2',
          password: 'testpassword123',
          email: 'e2e_test_admin2@example.com',
          contact: '010-4444-4444',
          name: 'E2E Test Admin 2',
          adminOf: {
            name: 'E2E Test Apartment',
            address: 'Seoul',
            description: 'Duplicate Apartment',
            officeNumber: '02-1234-5678',
            buildingNumberFrom: 101,
            buildingNumberTo: 105,
            floorCountPerBuilding: 10,
            unitCountPerFloor: 4,
          },
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message', '이미 등록된 아파트입니다.');
    });
  });

  describe('GET /api/v2/users/admins - 관리자 목록 조회', () => {
    it('인증된 사용자가 관리자 목록 조회 성공', async () => {
      const response = await request(app)
        .get('/api/v2/users/admins')
        .set('Cookie', authCookies)
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 20);
    });

    it('검색 키워드로 필터링하여 조회', async () => {
      const response = await request(app)
        .get('/api/v2/users/admins')
        .set('Cookie', authCookies)
        .query({ page: 1, limit: 20, searchKeyword: 'e2e_test' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('인증 없이 요청 시 401 에러', async () => {
      const response = await request(app)
        .get('/api/v2/users/admins')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v2/users/admins/:id/join-status - 가입 상태 변경', () => {
    it('특정 관리자의 가입 상태를 APPROVED로 변경 성공', async () => {
      const response = await request(app)
        .patch(`/api/v2/users/admins/${testAdminId}/join-status`)
        .set('Cookie', authCookies)
        .send({ joinStatus: 'APPROVED' });

      expect(response.status).toBe(204);

      // 변경 확인
      const updatedAdmin = await prisma.user.findUnique({
        where: { id: testAdminId },
      });
      expect(updatedAdmin?.joinStatus).toBe('APPROVED');
    });

    it('인증 없이 요청 시 401 에러', async () => {
      const response = await request(app)
        .patch(`/api/v2/users/admins/${testAdminId}/join-status`)
        .send({ joinStatus: 'APPROVED' });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v2/users/admins/:id - 관리자 정보 수정', () => {
    it('관리자 정보 수정 성공', async () => {
      const response = await request(app)
        .patch(`/api/v2/users/admins/${testAdminId}`)
        .set('Cookie', authCookies)
        .send({
          email: 'updated_email@example.com',
          contact: '010-9999-9999',
          name: 'Updated Name',
        });

      expect(response.status).toBe(204);

      // 변경 확인
      const updatedAdmin = await prisma.user.findUnique({
        where: { id: testAdminId },
      });
      expect(updatedAdmin?.email).toBe('updated_email@example.com');
      expect(updatedAdmin?.contact).toBe('010-9999-9999');
    });
  });

  describe('DELETE /api/v2/users/admins/:id - 관리자 삭제', () => {
    it('관리자 삭제 성공', async () => {
      // 새로운 관리자 생성
      const newAdmin = await prisma.user.create({
        data: {
          username: 'e2e_admin_to_delete',
          email: 'delete@example.com',
          contact: '010-0000-0000',
          name: 'To Be Deleted',
          password: await hashPassword('password123'),
          role: 'ADMIN',
          avatar: '',
          joinStatus: 'PENDING',
          isActive: true,
        },
      });

      const response = await request(app)
        .delete(`/api/v2/users/admins/${newAdmin.id}`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(204);

      // 삭제 확인
      const deletedAdmin = await prisma.user.findUnique({
        where: { id: newAdmin.id },
      });
      expect(deletedAdmin).toBeNull();
    });

    it('존재하지 않는 관리자 삭제 시 404 에러', async () => {
      const response = await request(app)
        .delete('/api/v2/users/admins/99999')
        .set('Cookie', authCookies);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v2/users/admins/rejected - 거절된 관리자 일괄 삭제', () => {
    it('거절된 관리자들 일괄 삭제 성공', async () => {
      // 거절된 관리자 생성
      await prisma.user.create({
        data: {
          username: 'e2e_rejected_admin',
          email: 'rejected@example.com',
          contact: '010-0000-0000',
          name: 'Rejected Admin',
          password: await hashPassword('password123'),
          role: 'ADMIN',
          avatar: '',
          joinStatus: 'REJECTED',
          isActive: true,
        },
      });

      const response = await request(app)
        .delete('/api/v2/users/admins/rejected')
        .set('Cookie', authCookies);

      expect(response.status).toBe(204);

      // 삭제 확인
      const rejectedAdmins = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          joinStatus: 'REJECTED',
        },
      });
      expect(rejectedAdmins.length).toBe(0);
    });
  });
});
