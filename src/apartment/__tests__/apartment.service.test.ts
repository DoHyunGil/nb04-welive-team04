import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Prisma } from 'generated/prisma/client.js';

/* =========================
   Repository Mock
========================= */
const mockApartmentRepository = {
  findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  findById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.unstable_mockModule('../apartment.respository.js', () => ({
  __esModule: true,
  default: mockApartmentRepository,
}));

const { default: apartmentService } = await import('../apartment.service.js');

/* =========================
   Tests
========================= */
describe('ApartmentService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getApartments', () => {
    it('검색어가 없을 때 전체 목록을 조회한다', async () => {
      const mockApartments = [
        { id: 1, name: 'Apt1' },
        { id: 2, name: 'Apt2' },
      ];

      mockApartmentRepository.findMany.mockResolvedValue(mockApartments);

      const result = await apartmentService.getApartments({
        page: 1,
        limit: 2,
        searchKeyword: '',
      });

      expect(mockApartmentRepository.findMany).toHaveBeenCalledWith(
        0,
        2,
        undefined,
      );
      expect(result.data[0].id).toBe('1');
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.hasNext).toBe(true);
    });

    it('검색어가 있을 때 OR 조건으로 조회한다', async () => {
      mockApartmentRepository.findMany.mockResolvedValue([]);

      await apartmentService.getApartments({
        page: 2,
        limit: 10,
        searchKeyword: '래미안',
      });

      expect(mockApartmentRepository.findMany).toHaveBeenCalledWith(
        10,
        10,
        expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(Object),
            }),
            expect.objectContaining({
              address: expect.any(Object),
            }),
          ]),
        }),
      );
    });
  });

  describe('getApartmentById', () => {
    it('ID로 아파트를 조회한다', async () => {
      mockApartmentRepository.findById.mockResolvedValue({
        id: 1,
      });

      const result = await apartmentService.getApartmentById({
        id: 1,
      });

      expect(mockApartmentRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('createApartment', () => {
    it('트랜잭션 client를 사용하여 아파트를 생성한다', async () => {
      const tx = {
        apartment: {
          create: jest.fn(),
        },
      } as unknown as Prisma.TransactionClient;

      const dto = {
        name: '신규 아파트',
        address: '서울시',
        description: '설명',
        officeNumber: '02-1234',
        buildingNumberFrom: 1,
        buildingNumberTo: 5,
        floorCountPerBuilding: 10,
        unitCountPerFloor: 4,
        adminOfId: 3,
      };

      mockApartmentRepository.create.mockResolvedValue({
        id: 1,
      });

      const result = await apartmentService.createApartment(tx, dto as any);

      expect(mockApartmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          address: dto.address,
          adminOf: {
            connect: { id: dto.adminOfId },
          },
        }),
        tx,
      );

      expect(result).toEqual({ id: 1 });
    });
  });
});
