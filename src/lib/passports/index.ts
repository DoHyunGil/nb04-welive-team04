import passport from 'passport';
import { localStrategy } from './localStrategy.js';
import { accessTokenStrategy, refreshTokenStrategy } from './jwtStrategy.js';
import TOKEN from '../constants/jwt.tokens.js';

declare global {
  namespace Express {
    interface User {
      id: number;
      role?: string;
    }
  }
}

passport.use('local', localStrategy);
passport.use(TOKEN.ACCESS_TOKEN_COOKIE_NAME, accessTokenStrategy);
passport.use(TOKEN.REFRESH_TOKEN_COOKIE_NAME, refreshTokenStrategy);

const passports = {
  localAuth: passport.authenticate('local', { session: false }),
  jwtAuth: passport.authenticate(TOKEN.ACCESS_TOKEN_COOKIE_NAME, { session: false }),
  jwtRefresh: passport.authenticate(TOKEN.REFRESH_TOKEN_COOKIE_NAME, { session: false }),
};

export default passports;
