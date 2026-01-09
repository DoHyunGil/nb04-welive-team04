import type { Response, CookieOptions } from 'express';
import { token } from '../auth/config/token.constants.js';

// TEMPORARY: Using HTTP instead of HTTPS, so secure must be false
// TODO: Enable HTTPS and set secure: true, sameSite: 'none' for production
const useHttps = process.env.USE_HTTPS === 'true';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: useHttps,
  sameSite: useHttps ? 'none' : 'lax',
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
