/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';

/**
 * Jest 모킹 패턴 설명 (https://inpa.tistory.com 참고)
 *
 * jest.fn() - 개별 함수 모킹
 * - 단일 함수를 mock 함수로 대체
 * - mockReturnValue(): 반환값 지정
 * - mockResolvedValue(): Promise 반환값 지정 (비동기)
 * - mockRejectedValue(): Promise 에러 지정
 * - toHaveBeenCalledWith(): 특정 인자로 호출되었는지 검증
 * - toHaveBeenCalledTimes(): 호출 횟수 검증
 */

// 토큰 설정 상수
const tokenConfig = {
  refresh_token: { expireAt: 7 * 24 * 60 * 60 * 1000 },
  access_token: { expireAt: 15 * 60 * 1000 },
};

// jest.fn()을 사용한 서비스 모킹
// 제네릭 타입에 (인자타입) => 반환타입 형태로 정의
const mockAuthService = {
  login: jest.fn<(username: string, password: string) => Promise<any>>(),
  logout: jest.fn<() => Promise<void>>(),
  refresh: jest.fn<(refreshToken: string) => Promise<any>>(),
};

// 실제 컨트롤러 로직을 모킹 - 모킹된 서비스 사용
const mockAuthController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      // mockAuthService.login 호출 - 테스트에서 반환값 제어 가능
      const data = await mockAuthService.login(username, password);
      res.cookie('refresh-token', data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: tokenConfig.refresh_token.expireAt,
      });
      res.cookie('access-token', data.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: tokenConfig.access_token.expireAt,
        path: '/',
      });
      res.send(data.user);
    } catch (error: any) {
      next(error);
    }
  },
  logout: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await mockAuthService.logout();
      res.clearCookie('access-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });
      res.clearCookie('refresh-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies['refresh-token'];
      if (!refreshToken) {
        const error = new Error(
          '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다.',
        ) as any;
        error.status = 400;
        throw error;
      }
      // mockAuthService.refresh 호출
      const tokens = await mockAuthService.refresh(refreshToken);
      res.cookie('refresh-token', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: tokenConfig.refresh_token.expireAt,
        path: '/',
      });
      res.cookie('access-token', tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: tokenConfig.access_token.expireAt,
        path: '/',
      });
      res.status(200).json({ message: '토큰이 갱신되었습니다.' });
    } catch (error: any) {
      next(error);
    }
  },
};

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    // Express 앱 설정
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // 라우터 설정
    const router = express.Router();
    router.post('/login', mockAuthController.login);
    router.post('/logout', mockAuthController.logout);
    router.post('/refresh', mockAuthController.refresh);

    app.use('/api/v2/auth', router);

    // 에러 핸들러
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  // 각 테스트 전에 모든 mock 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/auth/login', () => {
    it('올바른 credentials로 로그인 성공', async () => {
      // Given: 로그인 성공 시 반환될 mock 데이터 설정
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        contact: '010-1234-5678',
        name: '테스트유저',
        role: 'ADMIN',
        avatar: '',
        joinStatus: 'APPROVED',
        isActive: true,
      };

      // mockResolvedValue: 비동기 함수의 성공 반환값 설정
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      // When: 로그인 요청
      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'testuser',
        password: 'testpassword',
      });

      // Then: 응답 검증
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('testuser');
      expect(response.headers['set-cookie']).toBeDefined();

      // toHaveBeenCalledWith: 서비스가 올바른 인자로 호출되었는지 검증
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'testuser',
        'testpassword',
      );
      // toHaveBeenCalledTimes: 호출 횟수 검증
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      // Given: mockRejectedValue로 에러 상황 설정
      const error = new Error('비밀번호가 일치하지 않습니다.') as any;
      error.status = 404;
      mockAuthService.login.mockRejectedValue(error);

      // When: 잘못된 비밀번호로 로그인 요청
      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword',
      });

      // Then: 에러 응답 검증
      expect(response.status).toBe(404);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'testuser',
        'wrongpassword',
      );
    });

    it('존재하지 않는 사용자로 로그인 실패', async () => {
      // Given: 사용자 없음 에러 설정
      const error = new Error('사용자를 찾을 수 없습니다.') as any;
      error.status = 404;
      mockAuthService.login.mockRejectedValue(error);

      // When: 존재하지 않는 사용자로 로그인 요청
      const response = await request(app).post('/api/v2/auth/login').send({
        username: 'nonexistent',
        password: 'testpassword',
      });

      // Then: 에러 응답 검증
      expect(response.status).toBe(404);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v2/auth/logout', () => {
    it('로그아웃 성공', async () => {
      // Given: logout 성공 설정
      mockAuthService.logout.mockResolvedValue(undefined);

      // When: 로그아웃 요청
      const response = await request(app).post('/api/v2/auth/logout');

      // Then: 응답 검증
      expect(response.status).toBe(204);
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v2/auth/refresh', () => {
    it('유효한 refresh token으로 토큰 갱신 성공', async () => {
      // Given: 토큰 갱신 성공 데이터 설정
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // When: refresh token과 함께 갱신 요청
      const response = await request(app)
        .post('/api/v2/auth/refresh')
        .set('Cookie', ['refresh-token=mock-refresh-token']);

      // Then: 응답 검증
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('토큰이 갱신되었습니다.');
      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        'mock-refresh-token',
      );
    });

    it('refresh token 없이 요청 시 실패', async () => {
      // When: refresh token 없이 요청
      const response = await request(app).post('/api/v2/auth/refresh');

      // Then: 400 에러 응답 검증
      expect(response.status).toBe(400);
      // 서비스가 호출되지 않아야 함 (토큰 검증 전에 에러 발생)
      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });
  });
});
