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
import complaintRouter from '../../routers/complaint.route.js';
import authRouter from '../../routers/auth.route.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

let app: Express;
let admin;
let adminId: number;
let resident1Id: number;
let resident2Id: number;
let apartmentId: number;
let complaintId: number;
let user1AuthCookies: string[] = [];
let user2AuthCookies: string[] = [];
let adminAuthCookies: string[] = [];

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  testApp.use('/api/v2/auth', authRouter);
  testApp.use('/api/v2/complaints', complaintRouter);

  testApp.use(
    (err: HttpError, req: Request, res: Response, next: NextFunction) => {
      void next;
      const status = err.status || err.statusCode || 500;
      if (status === 500) console.error('[E2E Test Error Debug]:', err);
      res.status(status).json({
        message: err.message || 'Internal Server Error',
      });
    },
  );
  return testApp;
};
describe('Complaint E2E Test', () => {
  beforeAll(async () => {
    // 테스트용 관리자 생성
    const hashedPassword = await hashPassword('test!@1234');
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'e2e_complaint_test_admin' },
    });
    if (existingAdmin) {
      adminId = existingAdmin.id;
      await prisma.user.update({
        where: { id: existingAdmin.id },
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
          username: 'e2e_complaint_test_admin',
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
    // 테스트용 입주민1 생성
    let existingUser = await prisma.user.findFirst({
      where: { username: 'e2e_complaint_test_user1' },
    });
    if (existingUser) {
      resident1Id = existingUser.id;
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
      });
    } else {
      const resident = await prisma.user.create({
        data: {
          avatar: '',
          contact: '010-1111-1111',
          email: '2@test.com',
          isActive: true,
          joinStatus: 'APPROVED',
          name: 'user1',
          username: 'e2e_complaint_test_user1',
          role: 'USER',
          password: hashedPassword,
          resident: {
            create: {
              contact: '010-1111-1111',
              email: '2@test.com',
              isHouseholder: true,
              building: 1,
              unit: 101,
              name: 'test2',
              apartmentId: apartmentId,
            },
          },
        },
      });
      resident1Id = resident.id;
    }
    // 비공개 민원 조회 테스트용 입주민2 생성
    existingUser = await prisma.user.findFirst({
      where: { username: 'e2e_complaint_test_user2' },
    });
    if (existingUser) {
      resident2Id = existingUser.id;
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
      });
    } else {
      const resident = await prisma.user.create({
        data: {
          avatar: '',
          contact: '010-2222-2222',
          email: '3@test.com',
          isActive: true,
          joinStatus: 'APPROVED',
          name: 'user2',
          username: 'e2e_complaint_test_user2',
          role: 'USER',
          password: hashedPassword,
          resident: {
            create: {
              contact: '010-2222-2222',
              email: '3@test.com',
              isHouseholder: true,
              building: 1,
              unit: 102,
              name: 'user2',
              apartmentId: apartmentId,
            },
          },
        },
      });
      resident2Id = resident.id;
    }

    app = setupTestApp();

    // 관리자 로그인
    const adminLoginResponse = await request(app)
      .post('/api/v2/auth/login')
      .send({
        username: 'e2e_complaint_test_admin',
        password: 'test!@1234',
      });
    adminAuthCookies = adminLoginResponse.headers[
      'set-cookie'
    ] as unknown as string[];

    // 입주민 1 로그인
    const user1LoginResponse = await request(app)
      .post('/api/v2/auth/login')
      .send({
        username: 'e2e_complaint_test_user1',
        password: 'test!@1234',
      });
    user1AuthCookies = user1LoginResponse.headers[
      'set-cookie'
    ] as unknown as string[];

    // 입주민 2 로그인
    const user2LoginResponse = await request(app)
      .post('/api/v2/auth/login')
      .send({
        username: 'e2e_complaint_test_user2',
        password: 'test!@1234',
      });
    user2AuthCookies = user2LoginResponse.headers[
      'set-cookie'
    ] as unknown as string[];
  });
  const createComplaint = async (overrides = {}) => {
    return await prisma.complain.create({
      data: {
        title: '기본 제목',
        content: '기본 내용',
        isPublic: true,
        apartmentId,
        complainantId: resident1Id,
        ...overrides,
      },
    });
  };
  describe('POST /complaints', () => {
    it('등록 성공', async () => {
      const response = await request(app)
        .post('/api/v2/complaints')
        .set('Cookie', user1AuthCookies)
        .send({
          title: '공개 민원 제목',
          content: '공개 민원 내용',
          isPublic: true,
          apartmentId: 1,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('공개 민원 제목');
      expect(response.body.complainant).not.toBeNull();

      // 생성된 민원 ID
      const complaintId = parseInt(response.body.id);

      // DB에서 직접 확인
      const dbData = await prisma.complain.findUnique({
        where: { id: complaintId },
      });
      expect(dbData).not.toBeNull();
      expect(dbData?.content).toBe('공개 민원 내용');
    });
    it('인증되지 않은 사용자는 민원 생성 실패', async () => {
      const response = await request(app).post('/api/v2/complaints').send({
        title: '제목 있음',
        content: '내용 있음',
        isPublic: true,
        apartmentId: 1,
      });
      expect(response.status).toBe(401);
    });
    it('실패 - title 없음', async () => {
      const response = await request(app)
        .post('/api/v2/complaints')
        .set('Cookie', user1AuthCookies)
        .send({
          content: '내용 있음',
          isPublic: true,
          apartmentId: 1,
        });
      expect(response.status).toBe(400);
    });
    it('실패 - content 없음', async () => {
      const response = await request(app)
        .post('/api/v2/complaints')
        .set('Cookie', user1AuthCookies)
        .send({
          title: '제목 있음',
          isPublic: true,
          apartmentId: 1,
        });
      expect(response.status).toBe(400);
    });
    it('실패 - apartmentId 없음', async () => {
      const response = await request(app)
        .post('/api/v2/complaints')
        .set('Cookie', user1AuthCookies)
        .send({
          title: '제목 있음',
          content: '내용 있음',
          isPublic: true,
        });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /complaints', () => {
    beforeAll(async () => {
      await createComplaint({ title: '1' });
      await createComplaint({ title: '2' });
      await createComplaint({ title: '3' });
    });
    it('목록 조회 성공', async () => {
      const response = await request(app).get('/api/v2/complaints');
      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(20);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
    it('페이지네이션 동작 확인', async () => {
      const response = await request(app).get('/api/v2/complaints').query({
        page: 1,
        limit: 2,
      });
      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /complaints/:complaintId', () => {
    let privateComplaintId;
    beforeAll(async () => {
      let complaint = await createComplaint();
      complaintId = complaint.id;
      complaint = await createComplaint({ isPublic: false });
      privateComplaintId = complaint.id;
    });
    it('본인 공개 글 상세 조회 성공', async () => {
      const response = await request(app)
        .get(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', user1AuthCookies);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(complaintId);
    });
    it('본인 비공개 글 상세 조회 성공', async () => {
      const response = await request(app)
        .get(`/api/v2/complaints/${privateComplaintId}`)
        .set('Cookie', user1AuthCookies);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(privateComplaintId);
    });
    it('다른 유저의 공개 글 조회 성공', async () => {
      const response = await request(app)
        .get(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', user2AuthCookies);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(complaintId);
    });
    it('관리자는 공개 글 조회 가능', async () => {
      const response = await request(app)
        .get(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', adminAuthCookies);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(complaintId);
    });
    it('관리자는 비공개 글 조회 가능', async () => {
      const response = await request(app)
        .get(`/api/v2/complaints/${privateComplaintId}`)
        .set('Cookie', adminAuthCookies);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(privateComplaintId);
    });
    it('존재하지 않은 민원 조회 실패', async () => {
      const response = await request(app)
        .get(`/api/v2/complaints/9999`)
        .set('Cookie', user1AuthCookies);
      expect(response.status).toBe(404);
    });
    it('다른 유저의 비공개 글 조회 권한 없음', async () => {
      const response = await request(app)
        .get(`/api/v2/complaints/${privateComplaintId}`)
        .set('Cookie', user2AuthCookies);
      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /complaints/:complaintId', () => {
    beforeAll(async () => {
      const complaint = await createComplaint({ title: '수정용' });
      complaintId = complaint.id;
    });
    it('본인 글 수정 성공', async () => {
      const response = await request(app)
        .patch(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', user1AuthCookies)
        .send({ title: '제목 수정 성공' });
      expect(response.status).toBe(204);

      // DB에서 수정 확인
      const dbData = await prisma.complain.findUnique({
        where: { id: complaintId },
      });
      expect(dbData).not.toBeNull();
      expect(dbData?.title).toBe('제목 수정 성공');
    });
    it('존재하지 않은 유저는 수정 실패', async () => {
      const response = await request(app)
        .patch(`/api/v2/complaints/${complaintId}`)
        .send({ title: '제목 수정 실패' });
      expect(response.status).toBe(401);
    });
    it('존재하지 않는 민원 수정 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/complaints/9999')
        .set('Cookie', user1AuthCookies)
        .send({
          title: '제목 수정 실패',
        });
      expect(response.status).toBe(404);
    });
    it('다른 유저의 민원 수정 실패', async () => {
      const response = await request(app)
        .patch(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', user2AuthCookies)
        .send({ title: '제목 수정 실패' });
      expect(response.status).toBe(403);
    });
    it('관리자는 민원 수정 실패', async () => {
      const response = await request(app)
        .patch(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', adminAuthCookies)
        .send({ title: '제목 수정 실패' });
      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /complaints/:complaintId/status', () => {
    let notPendingComplaintId;
    beforeAll(async () => {
      let complaint = await createComplaint({ title: '상태 수정용' });
      complaintId = complaint.id;
      complaint = await createComplaint({ status: 'IN_PROGRESS' });
      notPendingComplaintId = complaint.id;
    });
    it('관리자는 상태 수정 성공', async () => {
      const response = await request(app)
        .patch(`/api/v2/complaints/${complaintId}/status`)
        .set('Cookie', adminAuthCookies)
        .send({ status: 'RESOLVED' });
      expect(response.status).toBe(204);

      // DB에서 확인
      const dbData = await prisma.complain.findUnique({
        where: { id: complaintId },
      });
      expect(dbData).not.toBeNull();
      expect(dbData?.status).toBe('RESOLVED');
    });
    it('입주민은 상태 수정 실패', async () => {
      const response = await request(app)
        .patch(`/api/v2/complaints/${complaintId}/status`)
        .set('Cookie', user1AuthCookies)
        .send({ status: 'RESOLVED' });
      expect(response.status).toBe(403);
    });
    it('존재하지 않은 민원 상태 수정 실패', async () => {
      const response = await request(app)
        .patch('/api/v2/complaints/999/status')
        .set('Cookie', adminAuthCookies)
        .send({ status: 'RESOLVED' });
      expect(response.status).toBe(404);
    });
    it('잘못된 enum 값으로 수정 시 실패', async () => {
      const response = await request(app)
        .patch(`/api/v2/complaints/${complaintId}/status`)
        .set('Cookie', adminAuthCookies)
        .send({ status: 'NOT_EXIST_ENUM' });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /complaints/:complaintId', () => {
    beforeEach(async () => {
      const complaint = await createComplaint({ title: '삭제용' });
      complaintId = complaint.id;
    });
    it('본인 민원 삭제 성공', async () => {
      const response = await request(app)
        .delete(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', user1AuthCookies);
      expect(response.status).toBe(204);

      // DB에서 확인
      const dbData = await prisma.complain.findUnique({
        where: { id: complaintId },
      });
      expect(dbData).toBeNull();
    });
    it('관리자는 다른 유저의 민원 삭제 가능', async () => {
      const response = await request(app)
        .delete(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', adminAuthCookies);
      expect(response.status).toBe(204);

      // DB에서 확인
      const dbData = await prisma.complain.findUnique({
        where: { id: complaintId },
      });
      expect(dbData).toBeNull();
    });
    it('다른 유저의 민원 삭제 실패', async () => {
      const response = await request(app)
        .delete(`/api/v2/complaints/${complaintId}`)
        .set('Cookie', user2AuthCookies);
      expect(response.status).toBe(403);
    });
  });
  afterAll(async () => {
    await prisma.complain.deleteMany();
    await prisma.resident.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.adminOf.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });
});
