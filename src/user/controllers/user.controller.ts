import type { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import userService from '../services/user.service.js';
import { uploadToS3, deleteFromS3 } from '../../lib/aws-s3.js';

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

      // 3. 현재 사용자 정보 조회 (기존 아바타 URL 확인)
      const currentUser = await userService.getUserById(user.id);
      const oldAvatarUrl = currentUser?.avatar;

      // 4. S3에 파일 업로드
      const avatarUrl = await uploadToS3(req.file, 'avatars');

      // 5. 데이터베이스에 새 아바타 URL 저장
      await userService.updateAvatar(user.id, avatarUrl);

      // 6. 기존 S3 이미지가 있으면 삭제
      if (oldAvatarUrl && oldAvatarUrl.includes('s3.amazonaws.com')) {
        await deleteFromS3(oldAvatarUrl);
      }

      // 7. 성공 응답 (204 No Content)
      res.status(204).send();
    } catch (error) {
      // 에러 발생 시 에러 핸들러로 전달
      next(error);
    }
  }

  // 프로필 이미지 삭제 API
  async deleteAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 인증된 사용자 정보 가져오기
      const user = req.user as AuthenticatedUser;
      if (!user) {
        throw createError(401, '인증이 필요합니다.');
      }

      // 2. 현재 사용자 정보 조회 (기존 아바타 URL 확인)
      const currentUser = await userService.getUserById(user.id);
      const avatarUrl = currentUser?.avatar;

      // 3. S3에서 이미지 삭제
      if (avatarUrl && avatarUrl.includes('s3.amazonaws.com')) {
        await deleteFromS3(avatarUrl);
      }

      // 4. 데이터베이스에서 아바타 URL을 null로 설정
      await userService.updateAvatar(user.id, null);

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
      const { password, currentPassword, newPassword } = req.body;
      const currentPwd = password || currentPassword; // 두 필드 모두 지원

      // 3. 필수 값 확인
      if (!currentPwd || !newPassword) {
        throw createError(
          400,
          '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
        );
      }

      // 4. userService의 updatePassword 함수 호출
      await userService.updatePassword(user.id, {
        currentPassword: currentPwd,
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
