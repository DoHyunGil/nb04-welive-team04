import { prisma } from '../../lib/prisma.js';
import type {
  UserAvatarUpdateData,
  UserPasswordUpdateData,
} from './types/user.types.js';

class UserRepository {
  // id로 사용자 찾기
  async findUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    return user;
  }

  // 아바타 업데이트
  async updateAvatar(id: number, data: UserAvatarUpdateData) {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: { avatar: data.avatar },
    });

    return updatedUser;
  }

  // 비밀번호 업데이트
  async updatePassword(id: number, data: UserPasswordUpdateData) {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: { password: data.password },
    });

    return updatedUser;
  }
}

export default new UserRepository();
