import { beforeEach, afterEach, describe, expect, it } from '@jest/globals';
import { prisma } from '../../lib/prisma.js';
import userRepository from '../repositories/user.repository.js';
import { Role, joinStatus } from '../../../generated/prisma/client.js';

describe('UserRepository DB Tests', () => {
  let testUserId: number;

  beforeEach(async () => {
    // 테스트 사용자 생성
    const testUser = await prisma.user.create({
      data: {
        username: 'usertest',
        email: 'usertest@example.com',
        password: 'hashed-password',
        name: 'User Test',
        contact: '010-1234-5678',
        role: Role.USER,
        joinStatus: joinStatus.APPROVED,
        isActive: true,
        avatar: '',
      },
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await prisma.user.deleteMany({
      where: {
        OR: [{ username: 'usertest' }, { email: 'usertest@example.com' }],
      },
    });
  });

  describe('findUserById', () => {
    it('사용자 ID로 사용자를 찾는다', async () => {
      const user = await userRepository.findUserById(testUserId);

      expect(user).not.toBeNull();
      expect(user?.id).toBe(testUserId);
      expect(user?.username).toBe('usertest');
      expect(user?.email).toBe('usertest@example.com');
      expect(user?.name).toBe('User Test');
    });

    it('존재하지 않는 사용자 ID로 조회 시 null을 반환한다', async () => {
      const user = await userRepository.findUserById(999999);

      expect(user).toBeNull();
    });
  });

  describe('updateAvatar', () => {
    it('사용자의 아바타를 업데이트한다', async () => {
      const avatarUrl = 'https://s3.amazonaws.com/bucket/avatars/test.jpg';

      const updatedUser = await userRepository.updateAvatar(testUserId, {
        avatar: avatarUrl,
      });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser.id).toBe(testUserId);
      expect(updatedUser.avatar).toBe(avatarUrl);

      // DB에서 직접 확인
      const userFromDb = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(userFromDb?.avatar).toBe(avatarUrl);
    });

    it('아바타를 null로 설정하여 삭제할 수 있다', async () => {
      // 먼저 아바타 설정
      await userRepository.updateAvatar(testUserId, {
        avatar: 'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      });

      // null로 업데이트
      const updatedUser = await userRepository.updateAvatar(testUserId, {
        avatar: null,
      });

      expect(updatedUser.avatar).toBeNull();

      // DB에서 직접 확인
      const userFromDb = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(userFromDb?.avatar).toBeNull();
    });

    it('존재하지 않는 사용자 ID로 업데이트 시 에러를 던진다', async () => {
      await expect(
        userRepository.updateAvatar(999999, {
          avatar: 'https://example.com/avatar.jpg',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updatePassword', () => {
    it('사용자의 비밀번호를 업데이트한다', async () => {
      const newHashedPassword = 'new-hashed-password';

      const updatedUser = await userRepository.updatePassword(testUserId, {
        password: newHashedPassword,
      });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser.id).toBe(testUserId);
      expect(updatedUser.password).toBe(newHashedPassword);

      // DB에서 직접 확인
      const userFromDb = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(userFromDb?.password).toBe(newHashedPassword);
    });

    it('존재하지 않는 사용자 ID로 업데이트 시 에러를 던진다', async () => {
      await expect(
        userRepository.updatePassword(999999, {
          password: 'new-hashed-password',
        }),
      ).rejects.toThrow();
    });
  });
});
