import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { Role } from '../../../generated/prisma/enums.js';

export async function createTestUser(data: {
  username: string;
  email: string;
  password: string;
  role?: Role;
}) {
  const hashedPassword = await hashPassword(data.password);

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

export function generateToken(userId: number, expiresIn: number = 900) {
  const secret: Secret = process.env.JWT_ACCESS_SECRET || 'test-secret';
  const options: SignOptions = { expiresIn };
  return jwt.sign({ id: userId }, secret, options);
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
