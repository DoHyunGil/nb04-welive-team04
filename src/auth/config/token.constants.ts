export const token = {
  access_token: {
    key: process.env.JWT_ACCESS_SECRET || 'access-secret',
    expireAt: 1000 * 60 * 15, // 15분
  },
  refresh_token: {
    key: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    expireAt: 7 * 24 * 60 * 60 * 1000, // 7일
  },
};
