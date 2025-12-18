import jwt from 'jsonwebtoken'; // 런타임용 값
import type { Secret, SignOptions, JwtPayload } from 'jsonwebtoken'; // 타입 전용 import
import { token } from '../config/token.constants.js';
import createError from 'http-errors';

class Jwt {
  // Access Token 생성
  signAccessToken(payload: object): string {
    const secret: Secret | undefined = token.access_token.key;
    const expiresIn = token.access_token.expireAt;

    if (!secret) {
      throw createError(400, 'ACCESS_TOKEN_SECRET이 없습니다.');
    }

    const options: SignOptions = { expiresIn };

    return jwt.sign(payload, secret, options);
  }

  // Refresh Token 생성
  signRefreshToken(payload: object): string {
    const secret: Secret | undefined = token.refresh_token.key;
    const expiresIn = token.refresh_token.expireAt;

    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET이 없습니다.');
    }

    const options: SignOptions = { expiresIn };

    return jwt.sign(payload, secret, options);
  }

  // 토큰 검증
  verifyRefreshToken(refreshToken: string): JwtPayload {
    if (!token.refresh_token.key) {
      throw createError(400, 'REFRESH_TOKEN_SECRET이 없습니다.');
    }

    try {
      return jwt.verify(refreshToken, token.refresh_token.key) as JwtPayload;
    } catch {
      throw createError(401, '유효하지 않은 REFRESH_TOKEN 입니다.');
    }
  }

  // 토큰 갱신
  refreshTokens(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);

    const newAccessToken = this.signAccessToken({
      userId: payload.userId,
    });

    const newRefreshToken = this.signRefreshToken({
      userId: payload.userId,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}

export default new Jwt();
