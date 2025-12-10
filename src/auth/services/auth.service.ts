import authRepository from '../repositories/auth.repository.js';
import { verifyPassword } from '../../lib/password.js';
import type { Response } from 'express';
import Jwt from '../utils/jwt.js';
import createError from 'http-errors';

class AuthService {
  async login(username: string, password: string) {
    const user = await authRepository.findByUserName(username);
    if (!user) {
      throw createError(404, '사용자를 찾을 수 없습니다.');
    }

    await verifyPassword(password, user.password);

    const accessToken = Jwt.signAccessToken({ userId: user.id });
    const refreshToken = Jwt.signRefreshToken({ userId: user.id });

    return { user, accessToken, refreshToken };
  }

  async logout(res: Response) {
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
  }

  async refresh(discardToken: string) {
    const tokens = Jwt.refreshTokens(discardToken);

    const { accessToken, refreshToken } = tokens;

    return { accessToken, refreshToken };
  }
}

export default new AuthService();
