import authRepository from '../repositories/auth.repository.js';
import { verifyPassword } from '../../lib/password.js';
import type { Response } from 'express';
import Jwt from '../utils/jwt.js';
import createError from 'http-errors';
import { clearAuthCookies } from '../../lib/cookie.js';

class AuthService {
  async login(username: string, password: string) {
    const user = await authRepository.findByUserName(username);
    if (!user) {
      throw createError(404, '사용자를 찾을 수 없습니다.');
    }

    await verifyPassword(password, user.password);

    const accessToken = Jwt.signAccessToken({ userId: user.id });
    const refreshToken = Jwt.signRefreshToken({ userId: user.id });

    // 비밀번호, createdAt, updatedAt 제외하고 id를 string으로 변환
    const { password: _, createdAt, updatedAt, id, ...rest } = user;
    const userResponse = {
      id: id.toString(),
      ...rest,
      adminOf: rest.adminOf
        ? {
            ...rest.adminOf,
            id: rest.adminOf.id.toString(), // 숫자 → 문자열 변환
          }
        : null,
    };

    return { user: userResponse, accessToken, refreshToken };
  }

  async logout(res: Response) {
    clearAuthCookies(res);
  }

  async refresh(discardToken: string) {
    const tokens = Jwt.refreshTokens(discardToken);

    const { accessToken, refreshToken } = tokens;

    return { accessToken, refreshToken };
  }
}

export default new AuthService();
