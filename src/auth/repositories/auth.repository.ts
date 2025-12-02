import { prisma } from '../../lib/prisma.js';

class AuthRepository {
  async findByUserName(username: string, password: string) {
    return prisma.user.findFirst({
      where: { username: username, password: password },
    });
  }
}

export default new AuthRepository();
