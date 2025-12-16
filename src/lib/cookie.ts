import type { Response, CookieOptions } from 'express';
import { token } from '../auth/config/token.constants.js';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
};

export function setAccessTokenCookie(res: Response, accessToken: string): void {
  res.cookie('access-token', accessToken, {
    ...baseCookieOptions,
    maxAge: token.access_token.expireAt,
  });
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  res.cookie('refresh-token', refreshToken, {
    ...baseCookieOptions,
    maxAge: token.refresh_token.expireAt,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access-token', baseCookieOptions);
  res.clearCookie('refresh-token', baseCookieOptions);
}
