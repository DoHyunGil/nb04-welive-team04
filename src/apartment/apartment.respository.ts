import { prisma } from '../lib/prisma.js';

class ApartmentRepository {
  async findMany(skip: number, limit: number, searchKeyword?: string) {
    const where = searchKeyword
      ? {
          OR: [
            {
              name: {
                contains: searchKeyword,
                mode: 'insensitive' as const,
              },
            },
            {
              address: {
                contains: searchKeyword,
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: searchKeyword,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    return prisma.apartment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        address: true,
        description: true,
        officeNumber: true,
        buildings: true, // Int[]
        units: true, // Int[]
      },
    });
  }

  async findById(id: number) {
    return prisma.apartment.findUnique({
      where: { id },
    });
  }

  async count(searchKeyword?: string) {
    const where = searchKeyword
      ? {
          OR: [
            {
              name: {
                contains: searchKeyword,
                mode: 'insensitive' as const,
              },
            },
            {
              address: {
                contains: searchKeyword,
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: searchKeyword,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    return prisma.apartment.count({ where });
  }
}

export default new ApartmentRepository();
