import type { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import userService from '../services/user.service.js';

// 인증된 사용자의 정보 타입
interface AuthenticatedUser {
  id: number;
}

class UserController {
  // 프로필 이미지 수정 API
  async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 인증된 사용자 정보 가져오기
      const user = req.user as AuthenticatedUser;
      if (!user) {
        throw createError(401, '인증이 필요합니다.');
      }

      // 2. 업로드된 파일 확인
      if (!req.file) {
        throw createError(400, '이미지 파일이 필요합니다.');
      }

      // 3. 파일 경로 생성 (uploads 폴더에 저장된 파일 경로)
      const avatarPath = `/uploads/${req.file.filename}`;

      // 4. userService의 updateAvatar 함수 호출
      await userService.updateAvatar(user.id, avatarPath);

      // 5. 성공 응답 (204 No Content)
      res.status(204).send();
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 비밀번호 변경 API
  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 인증된 사용자 정보 가져오기
      const user = req.user as AuthenticatedUser;
      if (!user) {
        throw createError(401, '인증이 필요합니다.');
      }

      // 2. 요청 body에서 비밀번호 정보 가져오기
      const { currentPassword, newPassword } = req.body;

      // 3. 필수 값 확인
      if (!currentPassword || !newPassword) {
        throw createError(
          400,
          '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
        );
      }

      // 4. userService의 updatePassword 함수 호출
      await userService.updatePassword(user.id, {
        currentPassword,
        newPassword,
      });

      // 5. 성공 응답 (204 No Content)
      res.status(204).send();
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }
}

export default new UserController();
