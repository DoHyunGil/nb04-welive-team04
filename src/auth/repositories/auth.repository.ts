import { prisma } from '../../lib/prisma.js';

class AuthRepository {
  async findByUserName(username: string) {
    return prisma.user.findFirst({
      where: { username: username },
    });
  }
}

export default new AuthRepository();
