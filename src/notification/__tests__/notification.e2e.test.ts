import dotenv from 'dotenv';
// Load .env.test before anything else
dotenv.config({ path: '.env.test' });

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import adminRouter from '../../routers/admin.route.js';
import authRouter from '../../routers/auth.route.js';
import residentsAuthRouter from '../../routers/residents.auth.route.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { initNotificationService } from '../index.js';
import { getNotificationRouter } from '../../routers/notification.route.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

let app: Express;
let superAdminUserId: number = 0;
let authCookies: string[] = [];

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  // Initialize notification service before setting up routes
  initNotificationService(prisma);

  testApp.use('/api/v2/auth', authRouter);
  testApp.use('/api/v2/users/admins', adminRouter);
  testApp.use('/api/v2/users/residents', residentsAuthRouter);
  testApp.use('/api/v2/notifications', getNotificationRouter());

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

describe('Notification API - E2E 통합 테스트', () => {
  beforeAll(async () => {
    const hashedPassword = await hashPassword('superadmin123');

    const existingSuperAdmin = await prisma.user.findFirst({
      where: { username: 'e2e_notification_super_admin' },
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
          username: 'e2e_notification_super_admin',
          email: 'e2e_notification_super@example.com',
          contact: '010-1234-5678',
          name: 'E2E 알림 테스트 슈퍼 관리자',
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
      username: 'e2e_notification_super_admin',
      password: 'superadmin123',
    });

    authCookies = loginResponse.headers['set-cookie'] as unknown as string[];
  });

  afterAll(async () => {
    // 생성된 테스트 데이터 정리
    await prisma.notification.deleteMany({
      where: { userId: superAdminUserId },
    });

    await prisma.user.deleteMany({
      where: { username: { startsWith: 'e2e_notification_test_admin_' } },
    });
  });

  describe('GET /api/v2/notifications', () => {
    it('인증된 사용자의 알림 목록을 조회할 수 있다', async () => {
      const response = await request(app)
        .get('/api/v2/notifications')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('hasNext');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('페이지네이션 파라미터를 사용할 수 있다', async () => {
      const response = await request(app)
        .get('/api/v2/notifications?page=1&limit=10')
        .set('Cookie', authCookies)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('인증되지 않은 사용자는 알림을 조회할 수 없다', async () => {
      await request(app).get('/api/v2/notifications').expect(401);
    });
  });

  describe('관리자 회원가입 시 슈퍼 관리자에게 알림 전송', () => {
    let createdAdminId: number;

    afterAll(async () => {
      if (createdAdminId) {
        await prisma.adminOf.deleteMany({
          where: { userId: createdAdminId },
        });
        await prisma.user.deleteMany({
          where: { id: createdAdminId },
        });
      }
    });

    it('관리자가 회원가입하면 슈퍼 관리자에게 알림이 생성된다', async () => {
      // 기존 알림 개수 확인
      const beforeResponse = await request(app)
        .get('/api/v2/notifications')
        .set('Cookie', authCookies)
        .expect(200);

      const beforeCount = beforeResponse.body.totalCount;

      // 새로운 관리자 회원가입
      const uniqueUsername = `e2eadm${Date.now()}`;
      const signupResponse = await request(app)
        .post('/api/v2/users/admins')
        .send({
          username: uniqueUsername,
          email: `${uniqueUsername}@example.com`,
          contact: '01099998888',
          name: '테스트 관리자',
          password: 'test123!@#',
          adminOf: {
            name: 'E2E 알림 테스트 아파트',
            address: '서울시 강남구',
            description: 'E2E 알림 테스트용',
            officeNumber: '02-9999-8888',
            buildingNumberFrom: 1,
            buildingNumberTo: 3,
            floorCountPerBuilding: 10,
            unitCountPerFloor: 4,
          },
        })
        .expect(204);

      // 생성된 관리자 ID 조회
      const createdAdmin = await prisma.user.findFirst({
        where: { username: uniqueUsername },
      });
      createdAdminId = createdAdmin?.id || 0;

      // 잠시 대기 (알림 생성 시간)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 알림 목록 다시 조회
      const afterResponse = await request(app)
        .get('/api/v2/notifications')
        .set('Cookie', authCookies)
        .expect(200);

      const afterCount = afterResponse.body.totalCount;

      // 알림이 1개 증가했는지 확인
      expect(afterCount).toBe(beforeCount + 1);

      // 가장 최근 알림 확인
      const latestNotification = afterResponse.body.data[0];
      expect(latestNotification).toHaveProperty('id');
      expect(latestNotification).toHaveProperty('content');
      expect(latestNotification.content).toContain('새로운 관리자 회원가입 신청');
      expect(latestNotification.content).toContain('테스트 관리자');
      expect(latestNotification.isChecked).toBe(false);
    });
  });

  describe('PATCH /api/v2/notifications/:notificationid/read', () => {
    let notificationId: number;

    beforeAll(async () => {
      // 테스트용 알림 생성
      const notification = await prisma.notification.create({
        data: {
          userId: superAdminUserId,
          content: '읽음 처리 테스트 알림',
          isChecked: false,
        },
      });
      notificationId = notification.id;
    });

    afterAll(async () => {
      if (notificationId) {
        await prisma.notification.deleteMany({
          where: { id: notificationId },
        });
      }
    });

    it('알림을 읽음 처리할 수 있다', async () => {
      await request(app)
        .patch(`/api/v2/notifications/${notificationId}/read`)
        .set('Cookie', authCookies)
        .expect(204);

      // 읽음 처리 확인
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      expect(notification?.isChecked).toBe(true);
    });

    it('인증되지 않은 사용자는 알림을 읽음 처리할 수 없다', async () => {
      await request(app)
        .patch(`/api/v2/notifications/${notificationId}/read`)
        .expect(401);
    });

    it('존재하지 않는 알림을 읽음 처리하면 404 에러가 발생한다', async () => {
      await request(app)
        .patch('/api/v2/notifications/999999/read')
        .set('Cookie', authCookies)
        .expect(404);
    });
  });

  describe('입주민 회원가입 시 관리자에게 알림 전송', () => {
    let testApartmentId: number;
    let testAdminUserId: number;
    let adminAuthCookies: string[] = [];
    let createdResidentId: number;

    beforeAll(async () => {
      // 테스트용 아파트와 관리자 생성
      const hashedPassword = await hashPassword('testadmin123');
      const uniqueUsername = `e2e_notif_test_admin_${Date.now()}`;

      const adminUser = await prisma.user.create({
        data: {
          username: uniqueUsername,
          email: `${uniqueUsername}@example.com`,
          contact: '010-1111-2222',
          name: '테스트 아파트 관리자',
          password: hashedPassword,
          role: 'ADMIN',
          avatar: '',
          joinStatus: 'APPROVED',
          isActive: true,
        },
      });
      testAdminUserId = adminUser.id;

      const adminOf = await prisma.adminOf.create({
        data: {
          userId: adminUser.id,
          name: 'E2E 입주민 알림 테스트 아파트',
          address: '서울시 서초구',
          description: '테스트용 아파트',
          officeNumber: '02-1111-2222',
          buildingNumberFrom: 1,
          buildingNumberTo: 2,
          floorCountPerBuilding: 5,
          unitCountPerFloor: 3,
        },
      });

      const apartment = await prisma.apartment.create({
        data: {
          name: 'E2E 입주민 알림 테스트 아파트',
          address: '서울시 서초구',
          description: '테스트용 아파트',
          officeNumber: '02-1111-2222',
          buildingNumberFrom: 1,
          buildingNumberTo: 2,
          floorCountPerBuilding: 5,
          unitCountPerFloor: 3,
          buildings: [1, 2],
          units: [1, 2, 3],
          adminOfId: adminOf.id,
        },
      });
      testApartmentId = apartment.id;

      // 관리자 로그인하여 쿠키 획득
      const loginResponse = await request(app).post('/api/v2/auth/login').send({
        username: uniqueUsername,
        password: 'testadmin123',
      });

      adminAuthCookies = loginResponse.headers['set-cookie'] as unknown as string[];
    });

    afterAll(async () => {
      // 생성된 테스트 데이터 정리
      if (createdResidentId) {
        await prisma.resident.deleteMany({
          where: { id: createdResidentId },
        });
      }

      if (testApartmentId) {
        await prisma.apartment.deleteMany({
          where: { id: testApartmentId },
        });
      }

      if (testAdminUserId) {
        await prisma.notification.deleteMany({
          where: { userId: testAdminUserId },
        });

        await prisma.adminOf.deleteMany({
          where: { userId: testAdminUserId },
        });

        await prisma.user.deleteMany({
          where: { id: testAdminUserId },
        });
      }
    });

    it('입주민이 회원가입하면 관리자에게 알림이 생성된다', async () => {
      // 기존 알림 개수 확인
      const beforeResponse = await request(app)
        .get('/api/v2/notifications')
        .set('Cookie', adminAuthCookies)
        .expect(200);

      const beforeCount = beforeResponse.body.totalCount;

      // 새로운 입주민 회원가입
      const uniqueUsername = `e2eres${Date.now()}`;
      const signupResponse = await request(app)
        .post('/api/v2/users/residents')
        .send({
          username: uniqueUsername,
          email: `${uniqueUsername}@example.com`,
          contact: '010-3333-4444',
          name: '테스트 입주민',
          password: 'test123!@#',
          apartmentName: 'E2E 입주민 알림 테스트 아파트',
          building: 1,
          unit: 101,
        })
        .expect(204);

      // 생성된 입주민 ID 조회
      const createdResident = await prisma.resident.findFirst({
        where: { email: `${uniqueUsername}@example.com` },
      });
      createdResidentId = createdResident?.id || 0;

      // 잠시 대기 (알림 생성 시간)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 알림 목록 다시 조회
      const afterResponse = await request(app)
        .get('/api/v2/notifications')
        .set('Cookie', adminAuthCookies)
        .expect(200);

      const afterCount = afterResponse.body.totalCount;

      // 알림이 1개 증가했는지 확인
      expect(afterCount).toBe(beforeCount + 1);

      // 가장 최근 알림 확인
      const latestNotification = afterResponse.body.data[0];
      expect(latestNotification).toHaveProperty('id');
      expect(latestNotification).toHaveProperty('content');
      expect(latestNotification.content).toContain('새로운 입주민 회원가입 신청');
      expect(latestNotification.content).toContain('1동 101호');
      expect(latestNotification.content).toContain('테스트 입주민');
      expect(latestNotification.isChecked).toBe(false);
    });
  });

  describe('SSE 연결 테스트', () => {
    // SSE는 스트리밍 연결이므로 supertest로 테스트하기 어려움
    // 실제 환경에서는 제대로 동작하지만, 테스트 환경에서는 타임아웃 발생
    it.skip('SSE 연결 시 Content-Type이 text/event-stream이어야 한다', async () => {
      const response = await request(app)
        .get('/api/v2/notifications/sse')
        .set('Cookie', authCookies)
        .set('Accept', 'text/event-stream');

      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('인증되지 않은 사용자는 SSE 연결을 할 수 없다', async () => {
      await request(app)
        .get('/api/v2/notifications/sse')
        .set('Accept', 'text/event-stream')
        .expect(401);
    });
  });
});
