import type {
  CreateResidentBody,
  CreateResidentAuthBody,
} from 'src/lib/type/express/resident.index.js';
import { prisma } from './../../lib/prisma.js';

class ResidentsAuthRepository {
  async getResidentsAuth(
    userId: number,
    limit: number,
    page: number,
    filters: Record<string, unknown>,
  ) {
    const admin = await prisma.adminOf.findUnique({
      where: { id: userId },
      select: { Apartment: true },
    });
    return prisma.resident.findMany({
      where: {
        apartmentId: admin?.Apartment?.id,
        ...filters,
      },
      include: {
        user: true,
      },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });
  }
  async findByResidentsEmail(email: string) {
    return prisma.resident.findFirst({
      where: { email },
    });
  }
  async findByUserEmail(email: string) {
    return prisma.user.findFirst({
      where: { email },
    });
  }
  async findByUserName(username: string) {
    return prisma.user.findFirst({
      where: { username: username },
    });
  }
  async findByApartmentId(name: string) {
    return prisma.apartment.findFirst({
      where: { name: name },
    });
  }
  async createUser(
    residentData: CreateResidentAuthBody,
    joinStatus: 'PENDING' | 'APPROVED' | 'REJECTED',
    residentsId: number,
    isActive: boolean,
  ) {
    return prisma.user.create({
      data: {
        ...residentData,
        joinStatus: joinStatus,
        isActive: isActive,
        resident: {
          connect: { id: residentsId },
        },
      },
    });
  }
  async updateResidentUserId(residentId: number, userId: number) {
    return prisma.resident.update({
      where: { id: residentId },
      data: {
        userId: userId,
      },
    });
  }
  //////////////////////////////////////////////////////////////////
  async getResidentsAuthById(userId: number, residentId: number) {
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

  async deleteResidentById(userId: number, residentId: number) {
    return prisma.resident.delete({
      where: { id: residentId },
    });
  }
}

export default new ResidentsAuthRepository();
