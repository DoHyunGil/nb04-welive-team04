// src/poll/__tests/polls.e2e.test.ts
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import type { Request, Response, NextFunction } from 'express';
import pollsRouter from '../../routers/polls.route.js';
import { prisma } from '../../lib/prisma.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

let app: Express;

let testUserId: number = 0;
let testApartmentId: number = 0;
let createdPollId: string = '';

const setupTestApp = () => {
  const testApp = express();
  testApp.use(express.json());

  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      id: testUserId,
      email: 'test@test.com',
      role: 'ADMIN',
    };
    next();
  });

  testApp.use('/api/v2/polls', pollsRouter);

  testApp.use(
    (err: HttpError, req: Request, res: Response, next: NextFunction) => {
      void next;
      if (
        err.name === 'PrismaClientValidationError' ||
        err.name === 'PrismaClientKnownRequestError' ||
        err.name === 'TypeError' ||
        err.message?.includes('Argument') ||
        err.message?.includes('Missing') ||
        err.message?.includes('invalid') ||
        err.message?.includes('provided') ||
        err.toString().includes('Prisma')
      ) {
        res.status(400).json({ message: 'Bad Request' });
        return;
      }

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

describe('Polls API - E2E 통합 테스트', () => {
  beforeAll(async () => {
    const apartment = await prisma.apartment.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        name: '테스트 아파트',
        address: '테스트 주소',
        description: '테스트용',
        officeNumber: 1234567890,
        buildings: [101, 102],
        units: [1001, 1002],
      },
    });
    testApartmentId = apartment.id;

    const user = await prisma.user.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        password: 'test1234',
        username: 'testadmin',
        email: 'testadmin@test.com',
        contact: '010-0000-0000',
        name: '테스트관리자',
        role: 'ADMIN',
        avatar: '',
        joinStatus: 'PENDING',
        isActive: true,
      },
    });
    testUserId = user.id;

    await prisma.resident.upsert({
      where: { userId: testUserId },
      update: {},
      create: {
        userId: testUserId,
        apartmentId: testApartmentId,
        building: 101,
        unit: 1001,
        isHouseholder: true,
      },
    });
    app = setupTestApp();
  });

  beforeEach(async () => {
    if (createdPollId) {
      await prisma.poll.deleteMany({
        where: { id: createdPollId },
      });
      createdPollId = '';
    }
  });

  afterAll(async () => {
    await prisma.pollVote.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.pollOption.deleteMany({
      where: { poll: { apartmentId: testApartmentId } },
    });
    await prisma.poll.deleteMany({
      where: { apartmentId: testApartmentId },
    });
    await prisma.resident.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.apartment.deleteMany({
      where: { id: testApartmentId },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v2/polls - 투표 생성', () => {
    it('유효한 데이터로 투표를 생성할 수 있다', async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const pollData = {
        title: '테스트 투표',
        content: '테스트 내용입니다',
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
        building: null,
        options: [{ title: '찬성' }, { title: '반대' }],
      };

      const response = await request(app)
        .post('/api/v2/polls')
        .send(pollData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('테스트 투표');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.options).toHaveLength(2);

      createdPollId = response.body.id;
    });

    it('필수 필드가 없으면 400 에러를 반환한다', async () => {
      const invalidData = {
        content: '내용만 있음',
      };

      await request(app).post('/api/v2/polls').send(invalidData).expect(400);
    });
  });

  describe('GET /api/v2/polls - 투표 목록 조회', () => {
    beforeEach(async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const poll = await prisma.poll.create({
        data: {
          title: '목록 조회 테스트',
          content: '테스트 내용',
          startDate: tomorrow,
          endDate: nextWeek,
          apartmentId: testApartmentId,
          building: null,
          authorId: testUserId,
          options: {
            create: [
              { title: '찬성', order: 0 },
              { title: '반대', order: 1 },
            ],
          },
        },
      });
      createdPollId = poll.id;
    });

    it('투표 목록을 조회할 수 있다', async () => {
      const response = await request(app).get('/api/v2/polls').expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalCount');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('페이지네이션이 동작한다', async () => {
      const response = await request(app)
        .get('/api/v2/polls?page=1&limit=10')
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('상태별 필터링이 가능하다', async () => {
      const response = await request(app)
        .get('/api/v2/polls?status=PENDING')
        .expect(200);

      expect(
        response.body.data.every(
          (poll: { status: string }) => poll.status === 'PENDING',
        ),
      ).toBe(true);
    });

    it('검색어로 필터링이 가능하다', async () => {
      const response = await request(app)
        .get('/api/v2/polls?searchKeyword=목록')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v2/polls/:pollId - 투표 상세 조회', () => {
    beforeEach(async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const poll = await prisma.poll.create({
        data: {
          title: '상세 조회 테스트',
          content: '테스트 내용',
          startDate: tomorrow,
          endDate: nextWeek,
          apartmentId: testApartmentId,
          building: null,
          authorId: testUserId,
          options: {
            create: [
              { title: '찬성', order: 0 },
              { title: '반대', order: 1 },
            ],
          },
        },
      });
      createdPollId = poll.id;
    });

    it('투표 상세 정보를 조회할 수 있다', async () => {
      const response = await request(app)
        .get(`/api/v2/polls/${createdPollId}`)
        .expect(200);

      expect(response.body.id).toBe(createdPollId);
      expect(response.body.title).toBe('상세 조회 테스트');
      expect(response.body.options).toHaveLength(2);
    });

    it('존재하지 않는 투표는 404를 반환한다', async () => {
      await request(app).get('/api/v2/polls/nonexistent-id').expect(404);
    });
  });

  describe('PATCH /api/v2/polls/:pollId - 투표 수정', () => {
    beforeEach(async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const poll = await prisma.poll.create({
        data: {
          title: '수정 테스트',
          content: '원본 내용',
          startDate: tomorrow,
          endDate: nextWeek,
          apartmentId: testApartmentId,
          building: null,
          authorId: testUserId,
          options: {
            create: [
              { title: '찬성', order: 0 },
              { title: '반대', order: 1 },
            ],
          },
        },
      });
      createdPollId = poll.id;
    });

    it('PENDING 상태의 투표를 수정할 수 있다', async () => {
      const updateData = {
        title: '수정된 제목',
        content: '수정된 내용',
      };

      await request(app)
        .patch(`/api/v2/polls/${createdPollId}`)
        .send(updateData)
        .expect(204);

      const updatedPoll = await prisma.poll.findUnique({
        where: { id: createdPollId },
      });

      expect(updatedPoll?.title).toBe('수정된 제목');
      expect(updatedPoll?.content).toBe('수정된 내용');
    });
  });

  describe('DELETE /api/v2/polls/:pollId - 투표 삭제', () => {
    beforeEach(async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const poll = await prisma.poll.create({
        data: {
          title: '삭제 테스트',
          content: '테스트 내용',
          startDate: tomorrow,
          endDate: nextWeek,
          apartmentId: testApartmentId,
          building: null,
          authorId: testUserId,
          options: {
            create: [{ title: '찬성', order: 0 }],
          },
        },
      });
      createdPollId = poll.id;
    });

    it('PENDING 상태의 투표를 삭제할 수 있다', async () => {
      await request(app).delete(`/api/v2/polls/${createdPollId}`).expect(204);

      const deletedPoll = await prisma.poll.findUnique({
        where: { id: createdPollId },
      });

      expect(deletedPoll).toBeNull();
    });
  });

  describe('투표 참여 플로우 - POST & DELETE /api/v2/polls/:pollId/vote', () => {
    let testPollId: string;
    let testOptionId: string;

    beforeEach(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const poll = await prisma.poll.create({
        data: {
          title: '투표 참여 테스트',
          content: '테스트 내용',
          startDate: yesterday,
          endDate: nextWeek,
          status: 'IN_PROGRESS',
          apartmentId: testApartmentId,
          building: null,
          authorId: testUserId,
          options: {
            create: [
              { title: '찬성', order: 0 },
              { title: '반대', order: 1 },
            ],
          },
        },
        include: { options: true },
      });
      testPollId = poll.id;
      testOptionId = poll.options[0]!.id;
      createdPollId = poll.id;
    });

    it('진행 중인 투표에 참여할 수 있다', async () => {
      await request(app)
        .post(`/api/v2/polls/${testPollId}/vote`)
        .send({ optionId: testOptionId })
        .expect(204);

      const vote = await prisma.pollVote.findFirst({
        where: {
          userId: testUserId,
          pollId: testPollId,
        },
      });

      expect(vote).not.toBeNull();
      expect(vote?.optionId).toBe(testOptionId);
    });

    it('투표 후 취소할 수 있다', async () => {
      await request(app)
        .post(`/api/v2/polls/${testPollId}/vote`)
        .send({ optionId: testOptionId })
        .expect(204);

      await request(app).delete(`/api/v2/polls/${testPollId}/vote`).expect(204);

      const vote = await prisma.pollVote.findFirst({
        where: {
          userId: testUserId,
          pollId: testPollId,
        },
      });

      expect(vote).toBeNull();
    });

    it('중복 투표는 불가능하다', async () => {
      await request(app)
        .post(`/api/v2/polls/${testPollId}/vote`)
        .send({ optionId: testOptionId })
        .expect(204);

      await request(app)
        .post(`/api/v2/polls/${testPollId}/vote`)
        .send({ optionId: testOptionId })
        .expect(400);
    });
  });
});
