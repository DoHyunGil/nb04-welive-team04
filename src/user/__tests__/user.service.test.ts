import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock dependencies
const mockUserRepository = {
  findUserById: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updateAvatar: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  updatePassword: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

const mockHashPassword = jest.fn<(...args: unknown[]) => Promise<string>>();
const mockVerifyPassword = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.unstable_mockModule('../repositories/user.repository.js', () => ({
  __esModule: true,
  default: mockUserRepository,
}));

jest.unstable_mockModule('../../lib/password.js', () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}));

const { default: userService } = await import('../services/user.service.js');

describe('UserService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('사용자 조회 성공 시 사용자 정보를 반환한다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('사용자를 찾을 수 없으면 404 에러를 던진다', async () => {
      mockUserRepository.findUserById.mockResolvedValue(null);

      await expect(userService.getUserById(999)).rejects.toMatchObject({
        status: 404,
        message: '사용자를 찾을 수 없습니다.',
      });
    });
  });

  describe('updateAvatar', () => {
    it('아바타 업데이트 성공 시 업데이트된 사용자를 반환한다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        avatar: null,
      };

      const mockUpdatedUser = {
        ...mockUser,
        avatar: 'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockUserRepository.updateAvatar.mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateAvatar(
        1,
        'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      );

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.updateAvatar).toHaveBeenCalledWith(1, {
        avatar: 'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('아바타를 null로 설정하여 삭제할 수 있다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        avatar: 'https://s3.amazonaws.com/bucket/avatars/test.jpg',
      };

      const mockUpdatedUser = {
        ...mockUser,
        avatar: null,
      };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockUserRepository.updateAvatar.mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateAvatar(1, null);

      expect(mockUserRepository.updateAvatar).toHaveBeenCalledWith(1, {
        avatar: null,
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('사용자를 찾을 수 없으면 401 에러를 던진다', async () => {
      mockUserRepository.findUserById.mockResolvedValue(null);

      await expect(
        userService.updateAvatar(999, 'https://example.com/avatar.jpg'),
      ).rejects.toMatchObject({
        status: 401,
        message: '사용자를 찾을 수 없습니다.',
      });

      expect(mockUserRepository.updateAvatar).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    it('비밀번호 변경 성공 시 업데이트된 사용자를 반환한다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed-old-password',
      };

      const mockUpdatedUser = {
        ...mockUser,
        password: 'hashed-new-password',
      };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockVerifyPassword.mockResolvedValue();
      mockHashPassword.mockResolvedValue('hashed-new-password');
      mockUserRepository.updatePassword.mockResolvedValue(mockUpdatedUser);

      const result = await userService.updatePassword(1, {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      });

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
      expect(mockVerifyPassword).toHaveBeenCalledWith(
        'oldpassword',
        'hashed-old-password',
      );
      expect(mockHashPassword).toHaveBeenCalledWith('newpassword123');
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(1, {
        password: 'hashed-new-password',
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('사용자를 찾을 수 없으면 401 에러를 던진다', async () => {
      mockUserRepository.findUserById.mockResolvedValue(null);

      await expect(
        userService.updatePassword(999, {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toMatchObject({
        status: 401,
        message: '사용자를 찾을 수 없습니다.',
      });

      expect(mockVerifyPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('현재 비밀번호가 틀리면 에러를 던진다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed-old-password',
      };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockVerifyPassword.mockRejectedValue(
        new Error('비밀번호가 일치하지 않습니다.'),
      );

      await expect(
        userService.updatePassword(1, {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow('비밀번호가 일치하지 않습니다.');

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('새 비밀번호가 현재 비밀번호와 같으면 400 에러를 던진다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed-password',
      };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockVerifyPassword.mockResolvedValue();

      await expect(
        userService.updatePassword(1, {
          currentPassword: 'samepassword',
          newPassword: 'samepassword',
        }),
      ).rejects.toMatchObject({
        status: 400,
        message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
      });

      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });
});
