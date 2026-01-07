import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';

export async function hashPassword(password: string): Promise<string> {
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

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);

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
