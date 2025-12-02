import * as createHttpError from 'http-errors';
import bcrypt from 'bcrypt';

class AuthMiddleware {
  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      console.error('비밀번호 해시화 실패', error);

      throw new createHttpError.InternalServerError(
        '비밀번호 해시화 중 오류가 발생했습니다.',
      );
    }
  }

  async verifyPassword(
    password: string,
    isPasswordValid: string,
  ): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, isPasswordValid);

      if (!isValid) {
        throw new createHttpError.Unauthorized('비밀번호가 일치하지 않습니다.');
      }

      return isValid;
    } catch (error) {
      if (error instanceof createHttpError.HttpError) {
        throw error;
      }
      throw new createHttpError.InternalServerError(
        '비밀번호 검증 중 오류가 발생했습니다.',
      );
    }
  }
}

export default new AuthMiddleware();
