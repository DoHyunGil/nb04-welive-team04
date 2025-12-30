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

  async create(
    data: Prisma.ApartmentCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.apartment.create({
      data,
      select: apartment_select,
    });
  }
}
export default new ApartmentRepository();
