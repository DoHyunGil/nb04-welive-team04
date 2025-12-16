import type { CreateResidentAuthBody } from 'src/lib/type/express/resident.index.js';
import { prisma } from '../../lib/prisma.js';

class ResidentsAuthRepository {
  async getResidentsAuth(
    userId: number,
    page: number,
    limit: number,
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

  async findByapartmentId(apartmentId: number, residentId?: number) {
    return prisma.resident.findMany({
      where: {
        apartmentId,
        ...(residentId !== undefined && { id: residentId }),
      },
      select: { userId: true },
    });
  }
  async updateapproveResidentsAuth(resident: number[]) {
    return prisma.user.updateMany({
      where: { id: { in: resident } }, // 배열 사용
      data: { isActive: true, joinStatus: 'APPROVED' },
    });
  }
}
export default new ResidentsAuthRepository();
