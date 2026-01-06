import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Prisma } from 'generated/prisma/client.js';

// Prisma Mock

const mockPrisma = {
  apartment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
};

jest.unstable_mockModule('../../lib/prisma.js', () => ({
  prisma: mockPrisma,
}));

const { default: apartmentRepository } =
  await import('../apartment.respository.js');

// test

describe('ApartmentRepository Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findMany', () => {
    it('아파트 목록을 조건에 맞게 조회한다', async () => {
      const mockResult = [{ id: 1 }, { id: 2 }];

      mockPrisma.apartment.findMany.mockResolvedValue(mockResult);

      const where: Prisma.ApartmentWhereInput = {
        name: { contains: '래미안' },
      };

      const result = await apartmentRepository.findMany(0, 20, where);

      expect(mockPrisma.apartment.findMany).toHaveBeenCalledWith({
        where,
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: expect.objectContaining({
          id: true,
          name: true,
        }),
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('findById', () => {
    it('ID로 아파트 단건을 조회한다', async () => {
      const mockApartment = { id: 1, name: '래미안 퍼스티지' };

      mockPrisma.apartment.findUnique.mockResolvedValue(mockApartment);

      const result = await apartmentRepository.findById(1);

      expect(mockPrisma.apartment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({
          id: true,
          name: true,
        }),
      });
      expect(result).toBe(mockApartment);
    });
  });

  describe('count', () => {
    it('조건에 맞는 아파트 개수를 반환한다', async () => {
      mockPrisma.apartment.count.mockResolvedValue(5);

      const where: Prisma.ApartmentWhereInput = {
        address: { contains: '서울' },
      };

      const result = await apartmentRepository.count(where);

      expect(mockPrisma.apartment.count).toHaveBeenCalledWith({
        where,
      });
      expect(result).toBe(5);
    });
  });

  describe('create', () => {
    it('트랜잭션 없이 아파트를 생성한다', async () => {
      const data = {
        name: '신규 아파트',
        address: '서울시 강남구',
      } as Prisma.ApartmentCreateInput;

      const mockCreated = { id: 1, ...data };

      mockPrisma.apartment.create.mockResolvedValue(mockCreated);

      const result = await apartmentRepository.create(data);

      expect(mockPrisma.apartment.create).toHaveBeenCalledWith({
        data,
        select: expect.objectContaining({
          id: true,
          name: true,
        }),
      });
      expect(result).toBe(mockCreated);
    });

    it('트랜잭션 client가 주어지면 해당 client를 사용한다', async () => {
      const tx = {
        apartment: {
          create: jest.fn().mockResolvedValue({ id: 2 }),
        },
      } as unknown as Prisma.TransactionClient;

      const data = {
        name: '트랜잭션 아파트',
      } as Prisma.ApartmentCreateInput;

      const result = await apartmentRepository.create(data, tx);

      expect(tx.apartment.create).toHaveBeenCalledWith({
        data,
        select: expect.objectContaining({
          id: true,
        }),
      });
      expect(result).toEqual({ id: 2 });
    });
  });
});
