export const token = {
  access_token: {
    key: process.env.ACCESS_TOKEN_EXPIRES_IN,
    expireAt: 1000 * 60 * 15, // 15분
  },
  refresh_token: {
    key: process.env.REFRESH_TOKEN_EXPIRES_DAYS,
    expireAt: 7 * 24 * 60 * 60 * 1000, // 7일
  },
};
