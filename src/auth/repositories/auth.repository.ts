import { prisma } from '../../lib/prisma.js';

class AuthRepository {
  async findByUserName(username: string) {
    return prisma.user.findFirst({
      where: { username: username },
      include: {
        adminOf: true,
        resident: true,
      },
    });
  }
}

export default new AuthRepository();
