export const token = {
  access_token: {
    key: process.env.JWT_ACCESS_SECRET || 'access-secret',
    expireAt: '15m', // 15분
    maxAge: 1000 * 60 * 15, // 15분 (밀리초)
  },
  refresh_token: {
    key: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    expireAt: '7d', // 7일
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초)
  },
};
