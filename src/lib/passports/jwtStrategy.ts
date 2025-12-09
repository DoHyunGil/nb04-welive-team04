import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import type { StrategyOptions, VerifiedCallback } from 'passport-jwt';
import type { Request } from 'express';
import { token } from '../../auth/config/token.constants.js';

interface JwtPayload {
  id: string;
  role?: string;
}

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req: Request) => {
      return req?.cookies?.access_token || null;
    },
  ]),
  secretOrKey: token.access_token.key || 'default-secret',
};

const jwtStrategy = new JwtStrategy(options, (payload: JwtPayload, done: VerifiedCallback) => {
  try {
    if (payload.id) {
      return done(null, payload);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
});

export default jwtStrategy;
