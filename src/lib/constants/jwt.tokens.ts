const TOKEN = {
  JWT_ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access-secret',
  JWT_REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret',
  ACCESS_TOKEN_COOKIE_NAME: 'access_token',
  REFRESH_TOKEN_COOKIE_NAME: 'refresh_token',
  ACCESS_TOKEN_EXPIRES_IN: 1000 * 60 * 15, // 15분
  REFRESH_TOKEN_EXPIRES_IN: 7 * 24 * 60 * 60 * 1000, // 7일
};

export default TOKEN;
