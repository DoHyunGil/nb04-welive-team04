import * as createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import passport from 'passport';
import type { Request, Response, NextFunction } from 'express';

interface AuthenticatedUser {
  id: string;
  role?: string;
}

class AuthMiddleware {
  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      console.error('비밀번호 해시화 실패', error);

      throw new createHttpError.InternalServerError(
        '비밀번호 해시화 중 오류가 발생했습니다.',
      );
    }
  }

  async verifyPassword(
    password: string,
    isPasswordValid: string,
  ): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, isPasswordValid);

      if (!isValid) {
        throw new createHttpError.Unauthorized('비밀번호가 일치하지 않습니다.');
      }

      return isValid;
    } catch (error) {
      if (error instanceof createHttpError.HttpError) {
        throw error;
      }
      throw new createHttpError.InternalServerError(
        '비밀번호 검증 중 오류가 발생했습니다.',
      );
    }
  }

  authenticate(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('jwt', { session: false }, (err: Error | null, user: AuthenticatedUser | false) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next(new createHttpError.Unauthorized('인증이 필요합니다.'));
      }
      req.user = user;
      next();
    })(req, res, next);
  }

  requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
    const user = req.user as AuthenticatedUser | undefined;
    if (!user || user.role !== 'SUPER_ADMIN') {
      return next(new createHttpError.Forbidden('슈퍼 관리자 권한이 필요합니다.'));
    }
    next();
  }
}

export default new AuthMiddleware();
