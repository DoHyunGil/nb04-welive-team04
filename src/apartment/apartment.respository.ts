import { prisma } from '../lib/prisma.js';

const apartment_select = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  address: true,
  description: true,
  officeNumber: true,
  buildings: true,
  units: true,
};

class ApartmentRepository {
  buildSearchCondition(searchKeyword?: string) {
    if (!searchKeyword) return {};

    const contains = {
      contains: searchKeyword,
      mode: 'insensitive' as const,
    };

    return {
      OR: [
        { name: contains },
        { address: contains },
        { description: contains },
        { officeNumber: contains },
      ],
    };
  }

  async findMany(skip: number, limit: number, searchKeyword?: string) {
    const where = this.buildSearchCondition(searchKeyword);

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

  async count(searchKeyword?: string) {
    const where = this.buildSearchCondition(searchKeyword);
    return prisma.apartment.count({ where });
  }
}

export default new ApartmentRepository();
