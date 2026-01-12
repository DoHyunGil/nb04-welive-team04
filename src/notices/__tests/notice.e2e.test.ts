import {
  beforeEach,
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from '@jest/globals';
import request from 'supertest';
import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import noticeRouter from '../../routers/notice.route.js';
import { NoticeCategory } from '../../../generated/prisma/client.js';
import authRouter from '../../routers/auth.route.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { start } from 'repl';
import { de, no } from 'zod/locales';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

let app: Express;
let admin;
let adminId: number;
let apartmentId: number;
let residentId: number;
let adminAuthCookies: string[] = [];
let residentAuthCookies: string[] = [];

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  testApp.use('/api/v2/auth', authRouter);
  testApp.use('/api/v2/notices', noticeRouter);

  testApp.use(
    (err: HttpError, req: Request, res: Response, next: NextFunction) => {
      void next;
      const status = err.status || err.statusCode || 500;
      if (status === 500) console.error(`[E2E Test Error Debug]: `, err);
      res.status(status).json({
        message: err.message || 'Internal Server Error',
      });
    },
  );
  return testApp;
};

describe('Notice E2E Test', () => {
  beforeAll(async () => {
    // 테스트용 관리자 생성
    const hashedPassword = await hashPassword('test!@1234');
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'e2e_notice_test_admin' },
    });
    if (existingAdmin) {
      adminId = existingAdmin.id;
      await prisma.user.update({
        where: { id: adminId },
        data: { password: hashedPassword },
      });
    } else {
      admin = await prisma.user.create({
        data: {
          avatar: '',
          contact: '010-0000-0000',
          email: '1@test.com',
          isActive: true,
          joinStatus: 'APPROVED',
          name: 'admin',
          username: 'e2e_notice_test_admin',
          role: 'ADMIN',
          password: hashedPassword,
          adminOf: {
            create: {
              address: '테스트 주소',
              buildingNumberFrom: 1,
              buildingNumberTo: 2,
              description: '테스트 설명',
              floorCountPerBuilding: 11,
              name: '테스트 아파트',
              officeNumber: '02-3001-0000',
              unitCountPerFloor: 2,
            },
          },
        },
        include: {
          adminOf: true,
        },
      });
      adminId = admin.id;
    }
    // 테스트용 아파트 생성
    const apartment = await prisma.apartment.create({
      data: {
        name: '테스트 아파트',
        address: '테스트 주소',
        description: '테스트 설명',
        officeNumber: '02-3001-0000',
        adminOfId: admin.adminOf?.id,
        buildingNumberFrom: 1,
        buildingNumberTo: 2,
        buildings: [1, 2],
        floorCountPerBuilding: 11,
        unitCountPerFloor: 2,
        units: [101, 102],
      },
    });
    apartmentId = apartment.id;
    // 테스트용 입주민 생성
    const existingUser = await prisma.user.findFirst({
      where: { username: 'e2e_notice_test_user' },
    });
    if (existingUser) {
      residentId = existingUser.id;
      await prisma.user.update({
        where: { id: residentId },
        data: { password: hashedPassword },
      });
    } else {
      const resident = await prisma.user.create({
        data: {
          avatar: '',
          contact: '010-1111-1111',
          email: '2@test.com',
          joinStatus: 'APPROVED',
          isActive: true,
          name: 'resident',
          username: 'e2e_notice_test_user',
          role: 'USER',
          password: hashedPassword,
          resident: {
            create: {
              contact: '010-1111-1111',
              email: '2@test.com',
              isHouseholder: true,
              building: 1,
              unit: 101,
              name: 'resident',
              apartmentId,
            },
          },
        },
      });
      residentId = resident.id;
    }
    app = setupTestApp();

    // 관리자 로그인
    const adminLoginResponse = await request(app)
      .post('/api/v2/auth/login')
      .send({
        username: 'e2e_notice_test_admin',
        password: 'test!@1234',
      });
    adminAuthCookies = adminLoginResponse.headers[
      'set-cookie'
    ] as unknown as string[];
    // 입주민 로그인
    const residentLoginResponse = await request(app)
      .post('/api/v2/auth/login')
      .send({
        username: 'e2e_notice_test_user',
        password: 'test!@1234',
      });
    residentAuthCookies = residentLoginResponse.headers[
      'set-cookie'
    ] as unknown as string[];
  });

  const createNotice = async (overrides = {}) => {
    return await prisma.notice.create({
      data: {
        title: '기본 제목',
        content: '기본 내용',
        isPinned: false,
        category: 'MAINTENANCE',
        author: {
          connect: {
            id: adminId,
          },
        },
        apartment: {
          connect: {
            id: apartmentId,
          },
        },
        ...overrides,
      },
    });
  };

  describe('POST /notices', () => {
    it('등록 성공', async () => {
      const response = await request(app)
        .post('/api/v2/notices')
        .set('Cookie', adminAuthCookies)
        .send({
          title: '테스트 제목',
          content: '테스트 내용',
          category: NoticeCategory.MAINTENANCE,
          isPinned: false,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('테스트 제목');
      expect(response.body.author).not.toBeNull();

      const noticeId = parseInt(response.body.id);

      const dbData = await prisma.notice.findUnique({
        where: { id: noticeId },
      });
      expect(dbData).not.toBeNull();
      expect(dbData?.content).toBe('테스트 내용');
    });
    it('날짜 정보와 함께 등록 시 이벤트 생성', async () => {
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(now.getDate() + 7);

      const response = await request(app)
        .post('/api/v2/notices')
        .set('Cookie', adminAuthCookies)
        .send({
          title: '테스트 제목',
          content: '테스트 내용',
          category: NoticeCategory.MAINTENANCE,
          isPinned: false,
          event: {
            startDate,
            endDate,
          },
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('테스트 제목');
      expect(response.body.author).not.toBeNull();

      const noticeId = parseInt(response.body.id);
      const dbData = await prisma.notice.findUnique({
        where: { id: noticeId },
        include: { event: true },
      });
      expect(dbData).not.toBeNull();
      expect(dbData?.content).toBe('테스트 내용');
      expect(dbData?.event).not.toBeNull();
      expect(dbData?.event?.startDate.toISOString()).toBe(
        startDate.toISOString(),
      );
      expect(dbData?.event?.endDate.toISOString()).toBe(endDate.toISOString());
    });
    it('인증되지 않은 사용자는 공지 생성 실패', async () => {
      const response = await request(app).post('/api/v2/notices').send({
        title: '테스트 제목',
        content: '테스트 내용',
        category: NoticeCategory.MAINTENANCE,
        isPinned: false,
      });
      expect(response.status).toBe(401);
    });
    it('필수 항목 누락 시 400 에러 반환', async () => {
      const response = await request(app)
        .post('/api/v2/notices')
        .set('Cookie', adminAuthCookies)
        .send({
          content: '테스트 내용',
          category: NoticeCategory.MAINTENANCE,
          isPinned: false,
        });
      expect(response.status).toBe(400);
    });
  });
  describe('GET /notices', () => {
    beforeAll(async () => {
      await createNotice({ title: '1' });
      await createNotice({ title: '2' });
      await createNotice({ title: '3' });
    });
    it('공지 목록 조회 성공', async () => {
      const response = await request(app).get('/api/v2/notices');
      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(20);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(typeof response.body.totalCount).toBe('number');
    });
    it('페이지네이션 동작 확인', async () => {
      const response = await request(app)
        .get('/api/v2/notices')
        .query({ page: 1, limit: 2 });
      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });
  describe('GET /notices/:noticeId', () => {
    let noticeId: number;
    beforeAll(async () => {
      const notice = await createNotice();
      noticeId = notice.id;
    });
    it('공지 상세 조회 성공', async () => {
      const response = await request(app).get(`/api/v2/notices/${noticeId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(noticeId);
    });
    it('존재하지 않는 공지 조회 실패', async () => {
      const response = await request(app).get('/api/v2/notices/9999');
      expect(response.status).toBe(404);
    });
  });
  describe('PATCH /notices/:noticeId', () => {
    let noticeId: number;
    let noticeWithDateId: number;
    beforeAll(async () => {
      const notice = await createNotice();
      noticeId = notice.id;
      const noticeWithDate = await createNotice();
      noticeWithDateId = noticeWithDate.id;
      const event = await prisma.event.create({
        data: {
          startDate: new Date(),
          endDate: new Date(),
          category: NoticeCategory.MAINTENANCE,
          title: '기본제목',
          apartmentId,
          resourceId: noticeWithDateId.toString(),
          resourceType: 'NOTICE',
        },
      });
      await prisma.notice.update({
        where: { id: noticeWithDateId },
        data: {
          event: {
            connect: {
              id: event.id,
            },
          },
        },
      });
    });
    it('관리자는 공지 수정 성공', async () => {
      const response = await request(app)
        .patch(`/api/v2/notices/${noticeId}`)
        .set('Cookie', adminAuthCookies)
        .send({
          title: '수정된 제목',
          content: '수정된 내용',
        });
      expect(response.status).toBe(204);

      const dbData = await prisma.notice.findUnique({
        where: { id: noticeId },
      });
      expect(dbData?.content).toBe('수정된 내용');
    });
    it('이벤트 있는 공지에 날짜 수정 성공', async () => {
      const now = new Date();
      const newStartDate = new Date();
      newStartDate.setDate(now.getDate() + 1);
      const newEndDate = new Date();
      newEndDate.setDate(now.getDate() + 7);
      const response = await request(app)
        .patch(`/api/v2/notices/${noticeWithDateId}`)
        .set('Cookie', adminAuthCookies)
        .send({
          event: {
            startDate: newStartDate,
            endDate: newEndDate,
          },
        });
      expect(response.status).toBe(204);

      const dbData = await prisma.notice.findUnique({
        where: { id: noticeWithDateId },
        include: { event: true },
      });
      expect(dbData?.content).toBe('기본 내용');
      expect(dbData?.event?.startDate.toISOString()).toBe(
        newStartDate.toISOString(),
      );
      expect(dbData?.event?.endDate.toISOString()).toBe(
        newEndDate.toISOString(),
      );
    });
    it('이벤트 없는 공지에 날짜 추가 성공', async () => {
      const now = new Date();
      const newStartDate = new Date();
      newStartDate.setDate(now.getDate() + 1);
      const newEndDate = new Date();
      newEndDate.setDate(now.getDate() + 7);
      const response = await request(app)
        .patch(`/api/v2/notices/${noticeId}`)
        .set('Cookie', adminAuthCookies)
        .send({
          event: {
            startDate: newStartDate,
            endDate: newEndDate,
          },
        });
      expect(response.status).toBe(204);

      const dbData = await prisma.notice.findUnique({
        where: { id: noticeId },
        include: { event: true },
      });
      expect(dbData?.content).toBe('수정된 내용');
      expect(dbData?.event).not.toBeNull();
      expect(dbData?.event?.startDate.toISOString()).toBe(
        newStartDate.toISOString(),
      );
      expect(dbData?.event?.endDate.toISOString()).toBe(
        newEndDate.toISOString(),
      );
    });
    it('인증되지 않은 사용자는 공지 수정 실패', async () => {
      const response = await request(app)
        .patch(`/api/v2/notices/${noticeId}`)
        .send({
          title: '수정된 제목',
          content: '수정된 내용',
        });
      expect(response.status).toBe(401);
    });
    it('존재하지 않는 공지 수정 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/notices/9999')
        .set('Cookie', adminAuthCookies)
        .send({
          title: '수정된 제목',
          content: '수정된 내용',
        });
      expect(response.status).toBe(404);
    });
    it('입주민은 공지 수정 실패', async () => {
      const response = await request(app)
        .patch(`/api/v2/notices/${noticeId}`)
        .set('Cookie', residentAuthCookies)
        .send({
          title: '수정된 제목',
          content: '수정된 내용',
        });
      expect(response.status).toBe(403);
    });
  });
  describe('DELETE /notices/:noticeId', () => {
    let noticeId: number;
    let noticeWithDateId: number;
    beforeAll(async () => {
      const notice = await createNotice();
      noticeId = notice.id;
      const noticeWithDate = await createNotice();
      noticeWithDateId = noticeWithDate.id;
      const event = await prisma.event.create({
        data: {
          startDate: new Date(),
          endDate: new Date(),
          category: NoticeCategory.MAINTENANCE,
          title: '기본제목',
          apartmentId,
          resourceId: noticeWithDateId.toString(),
          resourceType: 'NOTICE',
        },
      });
      await prisma.notice.update({
        where: { id: noticeWithDateId },
        data: {
          event: {
            connect: {
              id: event.id,
            },
          },
        },
      });
    });
    it('관리자는 공지 삭제 성공', async () => {
      const response = await request(app)
        .delete(`/api/v2/notices/${noticeId}`)
        .set('Cookie', adminAuthCookies);
      expect(response.status).toBe(204);

      const dbData = await prisma.notice.findUnique({
        where: { id: noticeId },
      });
      expect(dbData).toBeNull();
    });
    it('공지 삭제 시 연관된 이벤트도 삭제 성공', async () => {
      const response = await request(app)
        .delete(`/api/v2/notices/${noticeWithDateId}`)
        .set('Cookie', adminAuthCookies);
      expect(response.status).toBe(204);

      const dbNoticeData = await prisma.notice.findUnique({
        where: { id: noticeWithDateId },
      });
      expect(dbNoticeData).toBeNull();
      const dbEventData = await prisma.event.findFirst({
        where: {
          resourceId: noticeWithDateId.toString(),
          resourceType: 'NOTICE',
        },
      });
      expect(dbEventData).toBeNull();
    });
    it('인증되지 않은 사용자는 공지 삭제 실패', async () => {
      const response = await request(app).delete(`/api/v2/notices/${noticeId}`);
      expect(response.status).toBe(401);
    });
    it('존재하지 않는 공지 삭제 실패', async () => {
      const response = await request(app)
        .delete('/api/v2/notices/9999')
        .set('Cookie', adminAuthCookies);
      expect(response.status).toBe(404);
    });
  });

  afterAll(async () => {
    await prisma.event.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.adminOf.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });
});
