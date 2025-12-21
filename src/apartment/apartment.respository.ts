import type { Prisma } from 'generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

const apartment_select = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  address: true,
  description: true,
  officeNumber: true,
  buildingNumberFrom: true,
  buildingNumberTo: true,
  floorCountPerBuilding: true,
  unitCountPerFloor: true,
  buildings: true,
  units: true,
};

class ApartmentRepository {
  //   buildSearchCondition(searchKeyword?: string) {
  //     if (!searchKeyword) return {};

  //     const contains = {
  //       contains: searchKeyword,
  //       mode: 'insensitive' as const,
  //     };

  //     return {
  //       OR: [
  //         { name: contains },
  //         { address: contains },
  //         { description: contains },
  //         { officeNumber: contains },
  //       ],
  //     };
  //   }

  async findMany(
    skip: number,
    limit: number,
    where?: Prisma.ApartmentWhereInput,
  ) {
    return prisma.apartment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: apartment_select,
    });
  }

  async findById(id: number) {
    return prisma.apartment.findUnique({
      where: { id },
      select: apartment_select,
    });
  }

  async count(where?: Prisma.ApartmentWhereInput) {
    return prisma.apartment.count({ where });
  }

  async create(data: Prisma.ApartmentCreateInput) {
    return prisma.apartment.create({
      data,
      select: apartment_select,
    });
  }
}

export default new ApartmentRepository();
