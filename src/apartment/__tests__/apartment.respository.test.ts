import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
} from '@jest/globals';
import type { Prisma } from 'generated/prisma/client.js';

import { prisma } from '../../lib/prisma.js';
import apartmentRepository from '../apartment.respository.js';

function apartmentFixture(
  override: Partial<Prisma.ApartmentCreateInput> = {},
): Prisma.ApartmentCreateInput {
  return {
    name: '래미안 퍼스티지',
    address: '서울 서초구',
    description: '테스트 아파트 설명',
    officeNumber: '02-1234-5678',
    buildingNumberFrom: 1,
    buildingNumberTo: 3,
    floorCountPerBuilding: 15,
    unitCountPerFloor: 4,
    buildings: [],
    units: [],
    ...override,
  };
}

describe('ApartmentRepository Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.apartment.deleteMany();
  });

  describe('create', () => {
    it('아파트를 실제 DB에 저장한다', async () => {
      const result = await apartmentRepository.create(apartmentFixture());

      expect(result.id).toBeDefined();
      expect(result.name).toBe('래미안 퍼스티지');
      expect(result.address).toBe('서울 서초구');
    });
  });

  describe('findById', () => {
    it('ID로 아파트를 조회한다', async () => {
      const created = await prisma.apartment.create({
        data: apartmentFixture({ name: '힐스테이트' }),
      });

      const result = await apartmentRepository.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('힐스테이트');
    });
  });

  describe('findMany', () => {
    it('조건에 맞는 아파트 목록을 조회한다', async () => {
      await prisma.apartment.createMany({
        data: [
          apartmentFixture({ name: '래미안', address: '서울' }),
          apartmentFixture({ name: '자이', address: '부산' }),
        ],
      });

      const result = await apartmentRepository.findMany(0, 10, {
        address: { contains: '서울' },
      });

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('래미안');
    });
  });

  describe('count', () => {
    it('조건에 맞는 아파트 개수를 반환한다', async () => {
      await prisma.apartment.createMany({
        data: [
          apartmentFixture({ address: '서울' }),
          apartmentFixture({ address: '서울' }),
          apartmentFixture({ address: '부산' }),
        ],
      });

      const count = await apartmentRepository.count({
        address: { contains: '서울' },
      });

      expect(count).toBe(2);
    });
  });

  describe('create with transaction', () => {
    it('트랜잭션 client를 사용해 아파트를 생성한다', async () => {
      const result = await prisma.$transaction((tx) => {
        return apartmentRepository.create(
          apartmentFixture({ name: '트랜잭션 아파트' }),
          tx,
        );
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('트랜잭션 아파트');
    });
  });
});
