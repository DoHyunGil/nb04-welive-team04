import { beforeAll, afterAll, describe, expect, it, jest } from '@jest/globals';

const MOCK_ACCESS_SECRET = 'apartment-e2e-secret';

jest.unstable_mockModule('../../lib/constants/jwt.tokens.js', () => ({
  default: {
    ACCESS_TOKEN_COOKIE_NAME: 'accessToken',
    REFRESH_TOKEN_COOKIE_NAME: 'refreshToken',
    JWT_ACCESS_TOKEN_SECRET: MOCK_ACCESS_SECRET,
    JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
  },
}));

const { default: request } = await import('supertest');
const { default: apartmentRouter } =
  await import('../../routers/apartment.routes.js');

import express, { type Express } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';

let app: Express;
let apartmentId: number;
let adminUserId: number;
let authToken: string;

const setupTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v2/apartments', apartmentRouter);
  return app;
};

describe('Apartment API - E2E Test', () => {
  beforeAll(async () => {
    app = setupTestApp();

    const apartment = await prisma.apartment.create({
      data: {
        name: 'E2E 테스트 아파트',
        address: '서울시 테스트구',
        description: 'E2E 테스트용 아파트',
        officeNumber: '02-0000-0000',
        buildingNumberFrom: 1,
        buildingNumberTo: 2,
        floorCountPerBuilding: 10,
        unitCountPerFloor: 4,
        buildings: [1, 2],
        units: [101, 102],
        adminOf: {
          create: {
            name: 'E2E 관리사무소',
            address: '서울시 테스트구',
            description: '관리사무소',
            officeNumber: '02-0000-0000',
            buildingNumberFrom: 1,
            buildingNumberTo: 2,
            floorCountPerBuilding: 10,
            unitCountPerFloor: 4,
            user: {
              create: {
                username: 'e2e_admin_apartment',
                password: 'password',
                email: 'admin@e2e.test',
                contact: '010-0000-0000',
                name: 'E2E 관리자',
                role: 'ADMIN',
                avatar: '',
                joinStatus: 'APPROVED',
                isActive: true,
              },
            },
          },
        },
      },
      include: {
        adminOf: { include: { user: true } },
      },
    });

    apartmentId = apartment.id;
    adminUserId = apartment.adminOf!.user.id;

    authToken = jwt.sign({ userId: adminUserId }, MOCK_ACCESS_SECRET, {
      expiresIn: '1h',
    });
  });

  describe('GET /api/v2/apartments', () => {
    it('아파트 목록 조회 성공', async () => {
      const res = await request(app).get('/api/v2/apartments').expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const apartment = res.body.data[0];
      expect(apartment).toHaveProperty('id');
      expect(apartment).toHaveProperty('name');
      expect(apartment).toHaveProperty('address');
    });
  });

  describe('GET /api/v2/apartments/:id', () => {
    it('인증된 사용자는 아파트 상세 조회 가능', async () => {
      const res = await request(app)
        .get(`/api/v2/apartments/${apartmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(apartmentId);
      expect(res.body.data.name).toBe('E2E 테스트 아파트');
    });

    it('토큰 없이 요청하면 401', async () => {
      await request(app).get(`/api/v2/apartments/${apartmentId}`).expect(401);
    });

    it('존재하지 않는 아파트는 404', async () => {
      await request(app)
        .get('/api/v2/apartments/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  afterAll(async () => {
    await prisma.adminOf.deleteMany({
      where: { userId: adminUserId },
    });

    await prisma.apartment.deleteMany({
      where: { id: apartmentId },
    });

    await prisma.user.deleteMany({
      where: { id: adminUserId },
    });

    await prisma.$disconnect();
  });
});
