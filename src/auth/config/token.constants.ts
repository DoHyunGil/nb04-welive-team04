import { ENV } from './env.js';

export const token = {
  access_token: {
    key: ENV.JWT_ACCESS_SECRET,
    expireAt: '15m' as const, // 15분
    maxAge: 1000 * 60 * 15, // 15분 (ms)
  },
  refresh_token: {
    key: ENV.JWT_REFRESH_SECRET,
    expireAt: '7d' as const, // 7일
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (ms)
  },
} as const;
