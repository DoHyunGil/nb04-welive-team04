import request from 'supertest';
import app from '../../../main.js';
import { prisma } from '../../../lib/prisma.js';

let complaintId: number;
let complainDeleteId: number;
let complainPrivateId: number;

beforeAll(async () => {
  // 테스트용 관리자 생성 (1번 유저)
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      avatar: 'picture',
      contact: '000-0000-0000',
      email: '1@naver.com',
      isActive: true,
      joinStatus: 'PENDING',
      name: 'test1',
      username: 'test1',
      role: 'ADMIN',
      password: 'test1',
    },
  });
  await prisma.adminOf.upsert({
    where: { userId: 1 },
    update: {},
    create: {
      userId: 1,
    },
  });
  // 테스트용 아파트 생성
  await prisma.apartment.upsert({
    where: {
      id: 1,
    },
    update: {},
    create: {
      id: 1,
      name: '테스트 아파트',
      address: '테스트 주소',
      description: '테스트 설명',
      officeNumber: 1111,
      adminOfId: 1,
      buildings: [1, 2],
      units: [101, 102],
    },
  });
  // 테스트용 입주민 생성 (2번 유저)
  await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      avatar: 'picture',
      contact: '111-1111-1111',
      email: '2@naver.com',
      isActive: true,
      joinStatus: 'PENDING',
      name: 'test2',
      username: 'test2',
      role: 'RESIDENT',
      password: 'test2',
    },
  });
  await prisma.resident.upsert({
    where: { userId: 2 },
    update: {},
    create: {
      userId: 2,
      isHouseholder: true,
      building: 1,
      unit: 101,
      apartmentId: 1,
    },
  });
  // 비공개 민원 조회 테스트용 입주민 생성 (3번 유저)
  await prisma.user.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      avatar: 'picture',
      contact: '222-2222-2222',
      email: '3@naver.com',
      isActive: true,
      joinStatus: 'PENDING',
      name: 'test3',
      username: 'test3',
      role: 'RESIDENT',
      password: 'test3',
    },
  });
});

describe('POST /complaints', () => {
  it('등록 성공', async () => {
    const response = await request(app).post('/complaints').send({
      title: '테스트 제목',
      content: '테스트 내용',
      isPublic: true,
      apartmentId: 1,
      userId: 2,
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('테스트 제목');
    complaintId = response.body.id;
  });
  it('삭제 테스트용 민원 등록', async () => {
    const response = await request(app).post('/complaints').send({
      title: '삭제 테스트 제목',
      content: '삭제 테스트 내용',
      isPublic: true,
      apartmentId: 1,
      userId: 2,
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('삭제 테스트 제목');
    complainDeleteId = response.body.id;
  });
  it('비공개 민원 조회 테스트용 민원 등록', async () => {
    const response = await request(app).post('/complaints').send({
      title: '비공개 테스트 제목',
      content: '비공개 테스트 내용',
      isPublic: false,
      apartmentId: 1,
      userId: 2,
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('비공개 테스트 제목');
    complainPrivateId = response.body.id;
  });
  it('실패 - userId 없음', async () => {
    const response = await request(app).post('/complaints').send({
      title: '제목 있음',
      content: '내용 있음',
      isPublic: true,
      apartmentId: 2,
    });
    expect(response.status).toBe(400);
  });
  it('실패 - title 없음', async () => {
    const response = await request(app).post('/complaints').send({
      content: '내용 있음',
      isPublic: true,
      apartmentId: 1,
      userId: 2,
    });
    expect(response.status).toBe(400);
  });
  it('실패 - content 없음', async () => {
    const response = await request(app).post('/complaints').send({
      title: '제목 있음',
      isPublic: true,
      apartmentId: 1,
      userId: 2,
    });
    expect(response.status).toBe(400);
  });
  it('실패 - apartmentId 없음', async () => {
    const response = await request(app).post('/complaints').send({
      title: '제목 있음',
      content: '내용 있음',
      isPublic: true,
      userId: 2,
    });
    expect(response.status).toBe(400);
  });
  it('실패 - 모든 필드 없음', async () => {
    const response = await request(app).post('/complaints').send({});
    expect(response.status).toBe(400);
  });
});

describe('GET /complaints', () => {
  it('목록 조회 성공', async () => {
    const response = await request(app).get('/complaints');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('GET /complaints/:id', () => {
  it('상세 조회 성공', async () => {
    const response = await request(app)
      .get(`/complaints/${complaintId}`)
      .send({ userId: 2 });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(complaintId);
  });
  it('성공 - 다른 유저의 공개 글 조회', async () => {
    const response = await request(app)
      .get(`/complaints/${complaintId}`)
      .send({ userId: 3 });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(complaintId);
  });
  it('실패 - 없는 id', async () => {
    const response = await request(app)
      .get(`/complaints/9999`)
      .send({ userId: 2 });
    expect(response.status).toBe(404);
  });
  it('실패 - 비공개 글 조회 권한 없음', async () => {
    const response = await request(app)
      .get(`/complaints/${complainPrivateId}`)
      .send({ userId: 3 });
    expect(response.status).toBe(403);
  });
});

describe('PATCH /complaints/:id', () => {
  it('수정 성공', async () => {
    const response = await request(app)
      .patch(`/complaints/${complaintId}`)
      .send({ userId: 2, title: '제목 수정 성공' });
    expect(response.status).toBe(204);
  });
  it('실패 - 없는 id', async () => {
    const response = await request(app).patch(`/complaints/9999`).send({
      userId: 2,
      title: '제목 수정 실패',
    });
    expect(response.status).toBe(404);
  });
  it('실패 - 작성자 아님', async () => {
    const response = await request(app)
      .patch(`/complaints/${complaintId}`)
      .send({ userId: 3, title: '제목 수정 실패' });
    expect(response.status).toBe(403);
  });
});

describe('PATCH /complaints/:id/status', () => {
  it('성공', async () => {
    const response = await request(app)
      .patch(`/complaints/${complaintId}/status`)
      .send({ userId: 1, status: 'RESOLVED' });
    expect(response.status).toBe(204);
  });
  it('실패 - 관리자 아님', async () => {
    const response = await request(app)
      .patch(`/complaints/${complaintId}/status`)
      .send({ userId: 2, status: 'RESOLVED' });
    expect(response.status).toBe(403);
  });
  it('실패 - PENDING 아닌 민원 수정', async () => {
    const response = await request(app)
      .patch(`/complaints/${complaintId}`)
      .send({ userId: 2, title: '제목 수정 실패' });
    expect(response.status).toBe(400);
  });
  it('실패 - PENDING 아닌 민원 삭제', async () => {
    const response = await request(app)
      .delete(`/complaints/${complaintId}`)
      .send({ userId: 2 });
    expect(response.status).toBe(400);
  });
  it('실패 - 없는 민원 id', async () => {
    const response = await request(app)
      .patch('/complaints/9999/status')
      .send({ userId: 1, status: 'RESOLVED' });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /complaints/:id', () => {
  it('실패 - 작성자 아님', async () => {
    const response = await request(app)
      .delete(`/complaints/${complainDeleteId}`)
      .send({ userId: 3 });
    expect(response.status).toBe(403);
  });
  it('삭제 성공', async () => {
    const response = await request(app)
      .delete(`/complaints/${complainDeleteId}`)
      .send({ userId: 2 });
    expect(response.status).toBe(204);
  });
  it('삭제 후 조회 404 확인', async () => {
    const response = await request(app)
      .get(`/complaints/${complainDeleteId}`)
      .send({ userId: 2 });
    expect(response.status).toBe(404);
  });
});
