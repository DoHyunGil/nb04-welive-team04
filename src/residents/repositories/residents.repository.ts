import type { CreateResidentBody } from 'src/lib/type/express/resident.index.js';
import { prisma } from './../../lib/prisma.js';

class ResidentsRepository {
  async getResidents(
    userId: number,
    limit: number,
    page: number,
    filters: Record<string, unknown>,
  ) {
    const admin = await prisma.adminOf.findUnique({
      where: { id: userId },
      select: { Apartment: true },
    });
    console.log(admin);
    return prisma.resident.findMany({
      where: {
        apartmentId: admin?.Apartment?.id,
        ...filters,
      },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });
  }
  async getResidentsById(userId: number, residentId: number) {
    return prisma.resident.findUnique({
      where: { id: residentId },
    });
  }
  async createResidents(
    residentData: CreateResidentBody,
    apartmentId: number,
    userId?: number,
  ) {
    const data: CreateResidentBody = {
      name: residentData.name,
      contact: residentData.contact,
      email: residentData.email,
      building: residentData.building,
      unit: residentData.unit,
      isHouseholder: residentData.isHouseholder,
      apartmentId,
      userId: userId ?? null,
    };

    return prisma.resident.create({ data });
  }
  async updateResidents(
    residentId: number,
    residentData: Partial<CreateResidentBody>,
  ) {
    const data: Partial<CreateResidentBody> = {
      name: residentData.name,
      contact: residentData.contact,
      building: residentData.building,
      unit: residentData.unit,
      isHouseholder: residentData.isHouseholder,
    };

    return prisma.resident.update({
      where: { id: residentId },
      data,
    });
  }
  async findById(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        resident: true,
        adminOf: {
          include: {
            Apartment: true,
          },
        },
      },
    });
  }
  async findByEmail(email: string) {
    return prisma.resident.findFirst({
      where: { email },
    });
  }
  async deleteResidentById(userId: number, residentId: number) {
    return prisma.resident.delete({
      where: { id: residentId },
    });
  }
}

export default new ResidentsRepository();
