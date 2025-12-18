import TOKEN from '../constants/jwt.tokens.js';
import { Strategy as JwtStrategy, type VerifiedCallback, ExtractJwt } from 'passport-jwt';
import { prisma } from '../prisma.js';
import type { Request } from 'express';

// 쿠키와 Authorization 헤더 둘 다 지원하는 extractor
const cookieAndHeaderExtractor = (cookieName: string) => {
  return (req: Request) => {
    let token = null;
    // 1. 쿠키에서 토큰 확인
    if (req && req.cookies) {
      token = req.cookies[cookieName];
    }
    // 2. 쿠키에 없으면 Authorization 헤더에서 확인
    if (!token && req.headers.authorization) {
      const bearerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      if (bearerToken) {
        token = bearerToken;
      }
    }
    return token;
  };
};

const accessTokenOptions = {
  jwtFromRequest: cookieAndHeaderExtractor(TOKEN.ACCESS_TOKEN_COOKIE_NAME),
  secretOrKey: TOKEN.JWT_ACCESS_TOKEN_SECRET,
};

const refreshTokenOptions = {
  jwtFromRequest: cookieAndHeaderExtractor(TOKEN.REFRESH_TOKEN_COOKIE_NAME),
  secretOrKey: TOKEN.JWT_REFRESH_TOKEN_SECRET,
};

async function jwtVerify(payload: { userId: number }, done: VerifiedCallback) {
  try {
    if (!payload.userId) {
      return done(null, false);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (err) {
    done(err, false);
  }
}

export const accessTokenStrategy = new JwtStrategy(
  accessTokenOptions,
  jwtVerify,
);
export const refreshTokenStrategy = new JwtStrategy(
  refreshTokenOptions,
  jwtVerify,
);
