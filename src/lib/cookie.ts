import type { Response, CookieOptions } from 'express';
import { token } from '../auth/config/token.constants.js';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};

export function setAccessTokenCookie(res: Response, accessToken: string): void {
  res.cookie('access_token', accessToken, {
    ...baseCookieOptions,
    maxAge: token.access_token.maxAge,
  });
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  res.cookie('refresh_token', refreshToken, {
    ...baseCookieOptions,
    maxAge: token.refresh_token.maxAge,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', baseCookieOptions);
  res.clearCookie('refresh_token', baseCookieOptions);
}
