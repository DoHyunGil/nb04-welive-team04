import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Response } from 'express';

// Mock dependencies
const mockAuthRepository = {
  findByUserName: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

const mockVerifyPassword = jest.fn<(...args: unknown[]) => Promise<boolean>>();
const mockClearAuthCookies = jest.fn();

const mockJwt = {
  signAccessToken: jest.fn<(...args: unknown[]) => string>(),
  signRefreshToken: jest.fn<(...args: unknown[]) => string>(),
  refreshTokens: jest.fn<(...args: unknown[]) => Record<string, string>>(),
};

jest.unstable_mockModule('../repositories/auth.repository.js', () => ({
  __esModule: true,
  default: mockAuthRepository,
}));

jest.unstable_mockModule('../../lib/password.js', () => ({
  verifyPassword: mockVerifyPassword,
}));

jest.unstable_mockModule('../utils/jwt.js', () => ({
  __esModule: true,
  default: mockJwt,
}));

jest.unstable_mockModule('../../lib/cookie.js', () => ({
  clearAuthCookies: mockClearAuthCookies,
}));

const { default: authService } = await import('../services/auth.service.js');

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('로그인 성공 시 사용자 정보와 토큰을 반환한다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'USER' as const,
        name: 'Test User',
        contact: '010-1234-5678',
        avatar: null,
        joinStatus: 'APPROVED' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        adminOf: null,
      };

      mockAuthRepository.findByUserName.mockResolvedValue(mockUser);
      mockVerifyPassword.mockResolvedValue(true);
      mockJwt.signAccessToken.mockReturnValue('access-token');
      mockJwt.signRefreshToken.mockReturnValue('refresh-token');

      const result = await authService.login('testuser', 'password123');

      expect(mockAuthRepository.findByUserName).toHaveBeenCalledWith(
        'testuser',
      );
      expect(mockVerifyPassword).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(mockJwt.signAccessToken).toHaveBeenCalledWith({ userId: 1 });
      expect(mockJwt.signRefreshToken).toHaveBeenCalledWith({ userId: 1 });

      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
        }),
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('createdAt');
      expect(result.user).not.toHaveProperty('updatedAt');
    });

    it('사용자를 찾을 수 없으면 404 에러를 던진다', async () => {
      mockAuthRepository.findByUserName.mockResolvedValue(null);

      await expect(
        authService.login('nonexistent', 'password123'),
      ).rejects.toMatchObject({
        status: 404,
        message: '사용자를 찾을 수 없습니다.',
      });

      expect(mockVerifyPassword).not.toHaveBeenCalled();
    });

    it('비밀번호가 틀리면 에러를 던진다', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed-password',
      };

      mockAuthRepository.findByUserName.mockResolvedValue(mockUser);
      mockVerifyPassword.mockRejectedValue(
        new Error('비밀번호가 일치하지 않습니다.'),
      );

      await expect(
        authService.login('testuser', 'wrongpassword'),
      ).rejects.toThrow('비밀번호가 일치하지 않습니다.');
    });
  });

  describe('logout', () => {
    it('로그아웃 시 쿠키를 삭제한다', () => {
      const mockRes = {} as Response;

      authService.logout(mockRes);

      expect(mockClearAuthCookies).toHaveBeenCalledWith(mockRes);
    });
  });

  describe('refresh', () => {
    it('토큰 갱신 성공 시 새로운 토큰을 반환한다', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockJwt.refreshTokens.mockReturnValue(mockTokens);

      const result = await authService.refresh('old-refresh-token');

      expect(mockJwt.refreshTokens).toHaveBeenCalledWith('old-refresh-token');
      expect(result).toEqual(mockTokens);
    });

    it('유효하지 않은 토큰이면 에러를 던진다', async () => {
      mockJwt.refreshTokens.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refresh('invalid-token')).rejects.toThrow(
        'Invalid token',
      );
    });
  });
});
