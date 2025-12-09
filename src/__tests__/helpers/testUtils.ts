import { prisma } from '../../lib/prisma.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';
import { Role } from '../../../generated/prisma/enums.js';

export async function createTestUser(data: {
  username: string;
  email: string;
  password: string;
  role?: Role;
}) {
  const hashedPassword = await authMiddleware.hashPassword(data.password);

  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      contact: '010-0000-0000',
      name: '테스트유저',
      password: hashedPassword,
      role: data.role || Role.RESIDENT,
      avatar: '',
      joinStatus: 'APPROVED',
      isActive: true,
    },
  });
}

export function generateToken(userId: number, expiresIn = '15m') {
  return jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET || '',
    { expiresIn },
  );
}

export async function cleanupTestData(usernames: string[]) {
  await prisma.adminOf.deleteMany({
    where: {
      user: {
        username: {
          in: usernames,
        },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      username: {
        in: usernames,
      },
    },
  });
}
