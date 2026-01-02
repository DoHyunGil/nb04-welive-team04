// src/notification/repositories/notification.repository.ts
import { PrismaClient } from '../../../generated/prisma/client.js';

export class NotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: number, content: string) {
    return this.prisma.notification.create({
      data: { userId, content },
    });
  }

  async createMany(notifications: Array<{ userId: number; content: string }>) {
    return this.prisma.notification.createManyAndReturn({
      data: notifications,
    });
  }

  async findByUserIdWithPagination(
    userId: number,
    page: number,
    limit: number,
  ) {
    const pageNumber = Number(page) || 1;
    const take = Number(limit) || 10;
    const skip = (pageNumber - 1) * take;

    const where = { userId };

    const [totalCount, data] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        take: take,
        skip: skip,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      totalCount,
      page: pageNumber,
      limit: take,
      hasNext: skip + data.length < totalCount,
    };
  }

  async findUnreadByUserId(userId: number, since?: Date) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isChecked: false,
        ...(since && { createdAt: { gt: since } }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id: Number(id), userId },
      data: { isChecked: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isChecked: false },
      data: { isChecked: true },
    });
  }

  async deleteById(id: number, userId: number) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async findSimple(id: number) {
    return this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }
}
