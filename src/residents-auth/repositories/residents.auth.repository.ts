import type { CreateResidentAuthBody } from 'src/lib/type/express/resident.index.js';
import { prisma } from '../../lib/prisma.js';

class ResidentsAuthRepository {
  async getResidentsAuth(
    userId: number,
    page: number,
    limit: number,
    filters: Record<string, unknown>,
    joinStatus?: 'PENDING' | 'APPROVED' | 'REJECTED',
  ) {
    const admin = await prisma.adminOf.findUnique({
      where: { userId: userId },
      select: { apartment: true },
    });
    return prisma.resident.findMany({
      where: {
        apartmentId: admin?.apartment?.id,
        ...filters,
        user: { joinStatus: joinStatus },
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
        username: residentData.username,
        password: residentData.password,
        email: residentData.email,
        contact: residentData.contact,
        name: residentData.name,
        role: 'USER',
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

  async findByapartmentId(
    apartmentId: number,
    joinStatus: 'PENDING' | 'APPROVED' | 'REJECTED',
    residentId?: number,
  ) {
    return prisma.resident.findMany({
      where: {
        apartmentId,
        ...(residentId !== undefined && { id: residentId }),
        user: { joinStatus: joinStatus },
      },
      select: { userId: true },
    });
  }
  async updateapproveResidentsAuth(
    resident: number[],
    residentData: Partial<CreateResidentAuthBody>,
  ) {
    return prisma.user.updateMany({
      where: { id: { in: resident } }, // 배열 사용
      data: { isActive: true, joinStatus: residentData.joinStatus },
    });
  }
  async deleteRejectedResidentsAuth(resident: number[]) {
    return prisma.user.deleteMany({
      where: { id: { in: resident } }, // 배열 사용
    });
  }
  async deleteRejectedResidents(resident: number[]) {
    return prisma.resident.deleteMany({
      where: { userId: { in: resident } }, // 배열 사용
    });
  }
}
export default new ResidentsAuthRepository();
