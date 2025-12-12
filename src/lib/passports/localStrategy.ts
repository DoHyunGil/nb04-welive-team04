import { Strategy as LocalStrategy } from 'passport-local';
import { prisma } from '../prisma.js';
import bcrypt from 'bcrypt';

type DoneCallback = (
  error: unknown,
  user?: Express.User | false,
  options?: { message: string },
) => void;

export const localStrategy = new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password',
  },
  async (username: string, password: string, done: DoneCallback) => {
    try {
      const user = await prisma.user.findFirst({ where: { username } });
      if (!user) {
        return done(null, false, { message: '유저를 찾을 수 없습니다.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
      }

      done(null, user);
    } catch (err) {
      return done(err);
    }
  },
);
