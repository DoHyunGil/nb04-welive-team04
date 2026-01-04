import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Mock auth service
const mockAuthService = {
  login: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  logout: jest.fn<(...args: unknown[]) => void>(),
  refresh: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

// Mock cookie functions
const mockSetAccessTokenCookie = jest.fn();
const mockSetRefreshTokenCookie = jest.fn();

jest.unstable_mockModule('../services/auth.service.js', () => ({
  __esModule: true,
  default: mockAuthService,
}));

jest.unstable_mockModule('../../lib/cookie.js', () => ({
  setAccessTokenCookie: mockSetAccessTokenCookie,
  setRefreshTokenCookie: mockSetRefreshTokenCookie,
  clearAuthCookies: jest.fn(),
}));

const { default: authController } = await import(
  '../controllers/auth.controller.js'
);

const createMockRequest = (
  overrides: Partial<Request> = {},
): Partial<Request> => ({
  body: {},
  cookies: {},
  ...overrides,
});

const createMockResponse = () => {
  const statusMock = jest.fn();
  const jsonMock = jest.fn();
  const sendMock = jest.fn();
  statusMock.mockReturnValue({
    json: jsonMock,
    send: sendMock,
  });
  return {
    status: statusMock,
    json: jsonMock,
    send: sendMock,
    statusMock,
    jsonMock,
    sendMock,
  };
};

const mockNext = jest.fn() as NextFunction;

describe('AuthController Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('로그인 성공 시 200 응답과 사용자 정보를 반환한다', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      };
      const mockData = {
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(mockData);

      const req = createMockRequest({
        body: { username: 'testuser', password: 'password123' },
      });
      const { send, sendMock } = createMockResponse();
      const res = { send } as unknown as Response;

      await authController.login(req as Request, res, mockNext);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'testuser',
        'password123',
      );
      expect(mockSetAccessTokenCookie).toHaveBeenCalledWith(
        res,
        'access-token',
      );
      expect(mockSetRefreshTokenCookie).toHaveBeenCalledWith(
        res,
        'refresh-token',
      );
      expect(sendMock).toHaveBeenCalledWith(mockUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('로그인 실패 시 에러를 next로 전달한다', async () => {
      const error = new Error('Login failed');
      mockAuthService.login.mockRejectedValue(error);

      const req = createMockRequest({
        body: { username: 'testuser', password: 'wrongpassword' },
      });
      const { send } = createMockResponse();
      const res = { send } as unknown as Response;

      await authController.login(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('로그아웃 시 204 응답을 반환한다', async () => {
      const req = createMockRequest();
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await authController.logout(req as Request, res, mockNext);

      expect(mockAuthService.logout).toHaveBeenCalledWith(res);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('로그아웃 중 에러 발생 시 next로 전달한다', async () => {
      const error = new Error('Logout failed');
      mockAuthService.logout.mockImplementation(() => {
        throw error;
      });

      const req = createMockRequest();
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await authController.logout(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('refresh', () => {
    it('토큰 갱신 성공 시 200 응답을 반환한다', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refresh.mockResolvedValue(mockTokens);

      const req = createMockRequest({
        cookies: { refresh_token: 'old-refresh-token' },
      });
      const { status, json, statusMock, jsonMock } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await authController.refresh(req as Request, res, mockNext);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        'old-refresh-token',
      );
      expect(mockSetAccessTokenCookie).toHaveBeenCalledWith(
        res,
        'new-access-token',
      );
      expect(mockSetRefreshTokenCookie).toHaveBeenCalledWith(
        res,
        'new-refresh-token',
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: '토큰이 갱신되었습니다.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('refresh token이 없으면 400 에러를 반환한다', async () => {
      const req = createMockRequest({
        cookies: {},
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await authController.refresh(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 400,
          message: '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다.',
        }),
      );
    });

    it('토큰 갱신 중 에러 발생 시 next로 전달한다', async () => {
      const error = new Error('Refresh failed');
      mockAuthService.refresh.mockRejectedValue(error);

      const req = createMockRequest({
        cookies: { refresh_token: 'invalid-token' },
      });
      const { status, json } = createMockResponse();
      const res = { status, json } as unknown as Response;

      await authController.refresh(req as Request, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
