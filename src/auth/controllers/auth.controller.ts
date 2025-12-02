import type { NextFunction, Request, Response } from 'express';
import authService from '../services/auth.service.js';
import { token } from '../config/token.constants.js';
import createError from 'http-errors';

class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const data = await authService.login(username, password);
      res.cookie('refresh-token', data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: token.refresh_token.expireAt,
      });

      res.cookie('access-token', data.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: token.access_token.expireAt, // 15분
        path: '/',
      });

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
      const { refreshToken } = req.cookies['refresh-token'];
      if (!refreshToken) {
        return next(
          createError(
            400,
            '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다.',
          ),
        );
      }
      const tokens = await authService.refresh(refreshToken);

      res.cookie('refresh-token', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: token.refresh_token.expireAt,
        path: '/',
      });

      res.cookie('access-token', tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: token.access_token.expireAt,
        path: '/',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
