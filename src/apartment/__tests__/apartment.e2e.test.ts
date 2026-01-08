import request from 'supertest';
import app from '../../../test/app.js';
import { prisma } from '../../lib/prisma.js';

describe('Apartment E2E Tests', () => {
  beforeAll(async () => {
    // 테스트 데이터 준비
    await prisma.apartment.create({
      data: {
        name: 'E2E 아파트',
        address: '서울시 강남구',
        description: '테스트용',
        officeNumber: '02-1111',
        buildingNumberFrom: 1,
        buildingNumberTo: 2,
        floorCountPerBuilding: 10,
        unitCountPerFloor: 4,
      },
    });
  });

  afterAll(async () => {
    await prisma.apartment.deleteMany();
    await prisma.$disconnect();
  });

  it('GET /apartments - 아파트 목록 조회', async () => {
    const res = await request(app).get('/apartments');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /apartments/:id - 아파트 단건 조회', async () => {
    const apartment = await prisma.apartment.findFirst();
    if (!apartment) throw new Error('No apartment');

    const res = await request(app).get(`/apartments/${apartment.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(String(apartment.id));
  });
});
