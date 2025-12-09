import createError from 'http-errors';
import authMiddleware from '../../middlewares/auth.middleware.js';
import userRepository from '../repositories/user.repository.js';
import type { UserPasswordUpdateRequest } from '../repositories/types/user.types.js';

class UserService {
  // 아바타 업데이트
  async updateAvatar(userId: number, avatarPath: string) {
    // 1. 사용자 존재 확인
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw createError(401, '사용자를 찾을 수 없습니다.');
    }

    // 2. 아바타 업데이트
    const updatedUser = await userRepository.updateAvatar(userId, {
      avatar: avatarPath,
    });

    return updatedUser;
  }

  // 비밀번호 변경
  async updatePassword(userId: number, data: UserPasswordUpdateRequest) {
    // 1. 사용자 존재 확인
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw createError(401, '사용자를 찾을 수 없습니다.');
    }

    // 2. 현재 비밀번호 확인
    const isPasswordValid = await authMiddleware.verifyPassword(
      data.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw createError(400, '현재 비밀번호가 일치하지 않습니다.');
    }

    // 3. 새 비밀번호가 현재 비밀번호와 다른지 확인
    if (data.currentPassword === data.newPassword) {
      throw createError(400, '새 비밀번호는 현재 비밀번호와 달라야 합니다.');
    }

    // 4. 새 비밀번호 해시화
    const hashedPassword = await authMiddleware.hashPassword(data.newPassword);

    // 5. 비밀번호 업데이트
    const updatedUser = await userRepository.updatePassword(userId, {
      password: hashedPassword,
    });

    return updatedUser;
  }
}

export default new UserService();
