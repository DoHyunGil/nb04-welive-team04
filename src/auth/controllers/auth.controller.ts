import type { NextFunction, Request, Response } from 'express';
import authService from '../services/auth.service.js';
import createError from 'http-errors';
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from '../../lib/cookie.js';

class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const data = await authService.login(username, password);

      setRefreshTokenCookie(res, data.refreshToken);
      setAccessTokenCookie(res, data.accessToken);

      res.send(data.user);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      authService.logout(res);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies['refresh-token'];
      if (!refreshToken) {
        return next(
          createError(
            400,
            '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다.',
          ),
        );
      }
      const tokens = await authService.refresh(refreshToken);

      setRefreshTokenCookie(res, tokens.refreshToken);
      setAccessTokenCookie(res, tokens.accessToken);

      res.status(200).json({ message: '토큰이 갱신되었습니다.' });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
