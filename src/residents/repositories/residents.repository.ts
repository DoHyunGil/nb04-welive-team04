import type { CreateResidentBody } from 'src/lib/type/express/resident.index.js';
import { prisma } from './../../lib/prisma.js';

class ResidentsRepository {
  async getResidents(
    userId: number,
    page: number = 1,
    filters: Record<string, unknown>,
    limit?: number,
  ) {
    const admin = await prisma.adminOf.findUnique({
      where: { userId: userId },
      include: { apartment: true },
    });
    const query: any = {
      where: {
        apartmentId: Number(admin?.apartment?.id),
        ...filters,
      },
    };
    if (limit && limit > 0) {
      query.take = Number(limit);
      query.skip = (Number(page) - 1) * Number(limit);
    }
    return prisma.resident.findMany(query);
  }
  async getResidentsById(userId: number, residentId: number) {
    return prisma.resident.findUnique({
      where: { id: residentId },
    });
  }
  async createResidents(residentData: CreateResidentBody, apartmentId: number) {
    const data: CreateResidentBody = {
      name: residentData.name,
      contact: residentData.contact,
      email: residentData.email,
      building: Number(residentData.building),
      unit: Number(residentData.unit),
      isHouseholder: residentData.isHouseholder ?? false,
      apartmentId,
      userId: residentData.userId ?? undefined,
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
      building: Number(residentData.building),
      unit: Number(residentData.unit),
      isHouseholder: residentData.isHouseholder,
    };
    return prisma.resident.update({
      where: { id: Number(residentId) },
      data: {
        name: data.name,
        contact: data.contact,
        building: data.building,
        unit: data.unit,
        isHouseholder: data.isHouseholder,
      },
    });
  }
  async findById(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        resident: true,
        adminOf: {
          include: {
            apartment: true,
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
