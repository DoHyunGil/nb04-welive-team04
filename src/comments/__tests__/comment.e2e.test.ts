import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import commentRouter from '../../routers/comment.route.js';
import authRouter from '../../routers/auth.route.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { CommentResourceType } from '../../../generated/prisma/enums.js';
import { NoticeCategory, Role, joinStatus } from '../../../generated/prisma/client.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

let app: Express;
let testUserId: number = 0;
let testAdminId: number = 0;
let testNoticeId: number = 0;
let testApartmentId: number = 0;
let createdCommentId: number = 0;
let authCookies: string[] = [];
let adminAuthCookies: string[] = [];

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());

  testApp.use('/api/v2/auth', authRouter);
  testApp.use('/api/v2/comments', commentRouter);

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

describe('Comment API - E2E 통합 테스트', () => {
  beforeAll(async () => {
    // 일반 사용자 생성
    const hashedPassword = await hashPassword('testpassword123');

    const existingUser = await prisma.user.findFirst({
      where: { username: 'e2e_comment_test_user' },
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
          username: 'e2e_comment_test_user',
          email: 'e2e_comment_user@example.com',
          contact: '010-1111-1111',
          name: 'E2E Comment Test User',
          password: hashedPassword,
          role: 'USER',
          avatar: '',
          joinStatus: 'APPROVED',
          isActive: true,
        },
      });
      testUserId = user.id;
    }

    // 관리자 생성
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'e2e_comment_test_admin' },
    });

    if (existingAdmin) {
      testAdminId = existingAdmin.id;
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword },
      });
    } else {
      const admin = await prisma.user.create({
        data: {
          username: 'e2e_comment_test_admin',
          email: 'e2e_comment_admin@example.com',
          contact: '010-2222-2222',
          name: 'E2E Comment Test Admin',
          password: hashedPassword,
          role: Role.ADMIN,
          avatar: '',
          joinStatus: joinStatus.APPROVED,
          isActive: true,
        },
      });
      testAdminId = admin.id;
    }

    // Apartment 생성 (Notice 생성에 필요)
    const adminOf = await prisma.adminOf.create({
      data: {
        name: 'E2E Test Apartment for Comments',
        address: 'Seoul Test',
        description: 'Test Apartment',
        officeNumber: '02-9999-9999',
        buildingNumberFrom: 101,
        buildingNumberTo: 105,
        floorCountPerBuilding: 10,
        unitCountPerFloor: 4,
        userId: testAdminId,
      },
    });

    const apartment = await prisma.apartment.create({
      data: {
        name: 'E2E Test Apartment for Comments',
        address: 'Seoul Test',
        description: 'Test Apartment',
        officeNumber: '02-9999-9999',
        buildingNumberFrom: 101,
        buildingNumberTo: 105,
        floorCountPerBuilding: 10,
        unitCountPerFloor: 4,
        buildings: [],
        units: [],
        adminOfId: adminOf.id,
      },
    });
    testApartmentId = apartment.id;

    // 테스트 공지사항 생성
    const notice = await prisma.notice.create({
      data: {
        title: 'E2E Test Notice',
        content: 'Test Content for Comments',
        category: NoticeCategory.COMMUNITY,
        isPinned: false,
        authorId: testUserId,
        apartmentId: testApartmentId,
      },
    });
    testNoticeId = notice.id;

    app = setupTestApp();

    // 일반 사용자 로그인
    const loginResponse = await request(app).post('/api/v2/auth/login').send({
      username: 'e2e_comment_test_user',
      password: 'testpassword123',
    });
    authCookies = loginResponse.headers['set-cookie'] as unknown as string[];

    // 관리자 로그인
    const adminLoginResponse = await request(app)
      .post('/api/v2/auth/login')
      .send({
        username: 'e2e_comment_test_admin',
        password: 'testpassword123',
      });
    adminAuthCookies = adminLoginResponse.headers[
      'set-cookie'
    ] as unknown as string[];
  });

  afterAll(async () => {
    // 생성된 테스트 데이터 정리
    await prisma.comment.deleteMany({
      where: {
        OR: [{ authorId: testUserId }, { authorId: testAdminId }],
      },
    });
    await prisma.notice.deleteMany({
      where: { id: testNoticeId },
    });
    await prisma.apartment.deleteMany({
      where: { id: testApartmentId },
    });
    await prisma.adminOf.deleteMany({
      where: { name: 'E2E Test Apartment for Comments' },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [{ id: testUserId }, { id: testAdminId }],
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v2/comments - 댓글 생성', () => {
    it('댓글 생성 성공', async () => {
      const response = await request(app)
        .post('/api/v2/comments')
        .set('Cookie', authCookies)
        .send({
          resourceType: CommentResourceType.NOTICE,
          resourceId: testNoticeId.toString(),
          content: 'E2E 테스트 댓글입니다.',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', 'E2E 테스트 댓글입니다.');
      expect(response.body).toHaveProperty('author');
      expect(response.body.author).toHaveProperty('name', 'E2E Comment Test User');

      // 생성된 댓글 ID 저장
      createdCommentId = parseInt(response.body.id);

      // DB에서 직접 확인
      const createdComment = await prisma.comment.findUnique({
        where: { id: createdCommentId },
      });
      expect(createdComment).not.toBeNull();
      expect(createdComment?.content).toBe('E2E 테스트 댓글입니다.');
    });

    it('인증되지 않은 사용자는 댓글 생성 실패', async () => {
      const response = await request(app).post('/api/v2/comments').send({
        resourceType: CommentResourceType.NOTICE,
        resourceId: testNoticeId.toString(),
        content: '미인증 사용자 댓글',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('필수 필드 누락 시 실패 - resourceId 누락', async () => {
      const response = await request(app)
        .post('/api/v2/comments')
        .set('Cookie', authCookies)
        .send({
          resourceType: CommentResourceType.NOTICE,
          content: '내용만 있는 댓글',
        });

      expect(response.status).toBe(400);
    });

    it('필수 필드 누락 시 실패 - content 누락', async () => {
      const response = await request(app)
        .post('/api/v2/comments')
        .set('Cookie', authCookies)
        .send({
          resourceType: CommentResourceType.NOTICE,
          resourceId: testNoticeId.toString(),
        });

      expect(response.status).toBe(400);
    });

    it('필수 필드 누락 시 실패 - resourceType 누락', async () => {
      const response = await request(app)
        .post('/api/v2/comments')
        .set('Cookie', authCookies)
        .send({
          resourceId: testNoticeId.toString(),
          content: 'resourceType이 없는 댓글',
        });

      expect(response.status).toBe(400);
    });

    it('필수 필드 누락 시 실패 - content가 빈 문자열', async () => {
      const response = await request(app)
        .post('/api/v2/comments')
        .set('Cookie', authCookies)
        .send({
          resourceType: CommentResourceType.NOTICE,
          resourceId: testNoticeId.toString(),
          content: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v2/comments - 댓글 목록 조회', () => {
    beforeAll(async () => {
      // 추가 댓글 생성 (페이지네이션 테스트용)
      await prisma.comment.create({
        data: {
          content: '두 번째 댓글',
          resourceType: CommentResourceType.NOTICE,
          noticeId: testNoticeId,
          authorId: testUserId,
        },
      });

      await prisma.comment.create({
        data: {
          content: '세 번째 댓글',
          resourceType: CommentResourceType.NOTICE,
          noticeId: testNoticeId,
          authorId: testUserId,
        },
      });
    });

    it('댓글 목록 조회 성공', async () => {
      const response = await request(app)
        .get('/api/v2/comments')
        .query({
          resourceType: CommentResourceType.NOTICE,
          resourceId: testNoticeId.toString(),
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('페이지네이션 동작 확인', async () => {
      const response = await request(app)
        .get('/api/v2/comments')
        .query({
          resourceType: CommentResourceType.NOTICE,
          resourceId: testNoticeId.toString(),
          page: 1,
          limit: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('기본값 사용 확인', async () => {
      const response = await request(app)
        .get('/api/v2/comments')
        .query({
          resourceType: CommentResourceType.NOTICE,
          resourceId: testNoticeId.toString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });
  });

  describe('PATCH /api/v2/comments/:commentId - 댓글 수정', () => {
    it('본인 댓글 수정 성공', async () => {
      const response = await request(app)
        .patch(`/api/v2/comments/${createdCommentId}`)
        .set('Cookie', authCookies)
        .send({
          content: '수정된 댓글 내용',
        });

      expect(response.status).toBe(204);

      // DB에서 직접 확인
      const updatedComment = await prisma.comment.findUnique({
        where: { id: createdCommentId },
      });
      expect(updatedComment?.content).toBe('수정된 댓글 내용');
    });

    it('인증되지 않은 사용자는 댓글 수정 실패', async () => {
      const response = await request(app)
        .patch(`/api/v2/comments/${createdCommentId}`)
        .send({
          content: '미인증 사용자 수정',
        });

      expect(response.status).toBe(401);
    });

    it('다른 사용자의 댓글 수정 시 403 에러', async () => {
      // 일반 사용자가 작성한 댓글 생성
      const userComment = await prisma.comment.create({
        data: {
          content: '일반 사용자의 댓글',
          resourceType: CommentResourceType.NOTICE,
          noticeId: testNoticeId,
          authorId: testUserId,
        },
      });

      // 관리자가 다른 사용자의 댓글 수정 시도
      const response = await request(app)
        .patch(`/api/v2/comments/${userComment.id}`)
        .set('Cookie', adminAuthCookies)
        .send({
          content: '다른 사용자가 수정 시도',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');

      // 정리
      await prisma.comment.delete({ where: { id: userComment.id } });
    });

    it('존재하지 않는 댓글 수정 시 404 에러', async () => {
      const response = await request(app)
        .patch('/api/v2/comments/999999')
        .set('Cookie', authCookies)
        .send({
          content: '존재하지 않는 댓글 수정',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v2/comments/:commentId - 댓글 삭제', () => {
    let commentToDelete: number;

    beforeAll(async () => {
      // 삭제용 댓글 생성
      const comment = await prisma.comment.create({
        data: {
          content: '삭제될 댓글',
          resourceType: CommentResourceType.NOTICE,
          noticeId: testNoticeId,
          authorId: testUserId,
        },
      });
      commentToDelete = comment.id;
    });

    it('본인 댓글 삭제 성공', async () => {
      const response = await request(app)
        .delete(`/api/v2/comments/${commentToDelete}`)
        .set('Cookie', authCookies);

      expect(response.status).toBe(204);

      // DB에서 삭제 확인
      const deletedComment = await prisma.comment.findUnique({
        where: { id: commentToDelete },
      });
      expect(deletedComment).toBeNull();
    });

    it('관리자는 다른 사용자의 댓글 삭제 가능', async () => {
      // 일반 사용자의 댓글 생성
      const userComment = await prisma.comment.create({
        data: {
          content: '관리자가 삭제할 댓글',
          resourceType: CommentResourceType.NOTICE,
          noticeId: testNoticeId,
          authorId: testUserId,
        },
      });

      const response = await request(app)
        .delete(`/api/v2/comments/${userComment.id}`)
        .set('Cookie', adminAuthCookies);

      expect(response.status).toBe(204);

      // DB에서 삭제 확인
      const deletedComment = await prisma.comment.findUnique({
        where: { id: userComment.id },
      });
      expect(deletedComment).toBeNull();
    });

    it('인증되지 않은 사용자는 댓글 삭제 실패', async () => {
      const comment = await prisma.comment.create({
        data: {
          content: '미인증 삭제 테스트',
          resourceType: CommentResourceType.NOTICE,
          noticeId: testNoticeId,
          authorId: testUserId,
        },
      });

      const response = await request(app).delete(
        `/api/v2/comments/${comment.id}`,
      );

      expect(response.status).toBe(401);

      // 정리
      await prisma.comment.delete({ where: { id: comment.id } });
    });

    it('존재하지 않는 댓글 삭제 시 404 에러', async () => {
      const response = await request(app)
        .delete('/api/v2/comments/999999')
        .set('Cookie', authCookies);

      expect(response.status).toBe(404);
    });
  });
});
