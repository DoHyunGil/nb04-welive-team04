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
import type { Request, Response, NextFunction } from 'express';

/**
 * Jest 모킹 패턴 설명 (https://inpa.tistory.com 참고)
 *
 * jest.fn() - 개별 함수 모킹
 * - mockResolvedValue(): 비동기 성공 반환값 설정
 * - mockRejectedValue(): 비동기 에러 설정
 * - toHaveBeenCalledWith(): 인자 검증
 * - toHaveBeenCalledTimes(): 호출 횟수 검증
 * - not.toHaveBeenCalled(): 호출되지 않음 검증
 */

// jest.fn()을 사용한 서비스 모킹
// 제네릭 타입에 (인자타입) => 반환타입 형태로 정의
const mockUserService = {
  updatePassword: jest.fn<(userId: number, data: any) => Promise<any>>(),
  updateAvatar: jest.fn<(userId: number, path: string) => Promise<any>>(),
};

// JWT 인증 미들웨어 모킹 - 인증 로직 시뮬레이션
const mockJwtAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }
  // 인증 성공 시 req.user 설정
  req.user = { id: 1 };
  next();
};

// 컨트롤러 모킹 - 실제 컨트롤러 로직을 모킹된 서비스로 대체
const mockUserController = {
  updatePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }
      // mockUserService.updatePassword 호출 - 테스트에서 반환값 제어
      await mockUserService.updatePassword(userId, req.body);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
  updateAvatar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }
      if (!req.file) {
        const error = new Error('파일이 없습니다.') as any;
        error.status = 400;
        throw error;
      }
      // mockUserService.updateAvatar 호출
      await mockUserService.updateAvatar(userId, req.file.path);
      res.status(204).json({});
    } catch (error: any) {
      next(error);
    }
  },
};

describe('Users Routes', () => {
  let app: express.Application;
  const testToken = 'test-valid-token';
  const testUserId = 1;

  beforeAll(() => {
    // Express 앱 설정
    app = express();
    app.use(express.json());

    const router = express.Router();

    // multer 모킹을 위한 미들웨어
    const mockUpload = (req: Request, _res: Response, next: NextFunction) => {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        (req as any).file = { path: 'uploads/test-avatar.png' };
      }
      next();
    };

    // 라우터 설정
    router.patch(
      '/me/avatar',
      mockJwtAuth,
      mockUpload,
      mockUserController.updateAvatar,
    );
    router.patch(
      '/me/password',
      mockJwtAuth,
      mockUserController.updatePassword,
    );

    app.use('/api/v2/users', router);

    // 에러 핸들러
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  // 각 테스트 전에 mock 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/v2/users/me/password', () => {
    it('비밀번호 변경 성공', async () => {
      // Given: 비밀번호 변경 성공 응답 설정
      mockUserService.updatePassword.mockResolvedValue({
        id: testUserId,
        username: 'testuser',
      });

      // When: 비밀번호 변경 요청
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newpassword456',
        });

      // Then: 응답 검증
      expect(response.status).toBe(204);

      // 서비스가 올바른 인자로 호출되었는지 검증
      expect(mockUserService.updatePassword).toHaveBeenCalledTimes(1);
      expect(mockUserService.updatePassword).toHaveBeenCalledWith(testUserId, {
        currentPassword: 'testpassword123',
        newPassword: 'newpassword456',
      });
    });

    it('현재 비밀번호가 틀리면 실패', async () => {
      // Given: 비밀번호 불일치 에러 설정
      const error = new Error('현재 비밀번호가 일치하지 않습니다.') as any;
      error.status = 400;
      mockUserService.updatePassword.mockRejectedValue(error);

      // When: 잘못된 현재 비밀번호로 요청
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        });

      // Then: 에러 응답 검증
      expect(response.status).toBe(400);
      expect(mockUserService.updatePassword).toHaveBeenCalledTimes(1);
    });

    it('새 비밀번호가 현재 비밀번호와 같으면 실패', async () => {
      // Given: 동일 비밀번호 에러 설정
      const error = new Error(
        '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
      ) as any;
      error.status = 400;
      mockUserService.updatePassword.mockRejectedValue(error);

      // When: 동일한 비밀번호로 변경 요청
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'testpassword123',
        });

      // Then: 에러 응답 검증
      expect(response.status).toBe(400);
    });

    it('인증 없이 비밀번호 변경 시도 시 실패', async () => {
      // When: 인증 헤더 없이 요청
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newpassword456',
        });

      // Then: 401 에러 응답 검증
      expect(response.status).toBe(401);
      // 인증 실패로 서비스가 호출되지 않아야 함
      expect(mockUserService.updatePassword).not.toHaveBeenCalled();
    });

    it('필수 필드 누락 시 실패', async () => {
      // Given: 필수 필드 누락 에러 설정
      const error = new Error('필수 필드가 누락되었습니다.') as any;
      error.status = 400;
      mockUserService.updatePassword.mockRejectedValue(error);

      // When: newPassword 필드 없이 요청
      const response = await request(app)
        .patch('/api/v2/users/me/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'testpassword123',
        });

      // Then: 에러 응답 검증
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v2/users/me/avatar', () => {
    it('프로필 이미지 업로드 성공', async () => {
      // Given: 아바타 업데이트 성공 응답 설정
      mockUserService.updateAvatar.mockResolvedValue({
        id: testUserId,
        avatar: 'uploads/test-avatar.png',
      });

      // When: 아바타 업로드 요청
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'multipart/form-data');

      // Then: 응답 검증
      expect(response.status).toBe(204);
      expect(mockUserService.updateAvatar).toHaveBeenCalledTimes(1);
      expect(mockUserService.updateAvatar).toHaveBeenCalledWith(
        testUserId,
        'uploads/test-avatar.png',
      );
    });

    it('인증 없이 아바타 업로드 시도 시 실패', async () => {
      // When: 인증 헤더 없이 요청
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Content-Type', 'multipart/form-data');

      // Then: 401 에러 응답 검증
      expect(response.status).toBe(401);
      expect(mockUserService.updateAvatar).not.toHaveBeenCalled();
    });

    it('파일 없이 아바타 업로드 시도 시 실패', async () => {
      // When: 파일 없이 요청 (Content-Type을 multipart로 설정하지 않음)
      const response = await request(app)
        .patch('/api/v2/users/me/avatar')
        .set('Authorization', `Bearer ${testToken}`);

      // Then: 400 에러 응답 검증
      expect(response.status).toBe(400);
    });
  });
});
