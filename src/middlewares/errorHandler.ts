import type { NextFunction, Request, Response } from 'express';
import { isHttpError } from 'http-errors';

export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (isHttpError(err)) {
    const status = err.status ?? err.statusCode ?? 500;
    console.error(`[${status}] ${err.name}: ${err.message}`);
    console.error(`에러 발생 요청 : [${req.method}] ${req.originalUrl}`);
    console.error(`에러 경로 추적 : ${err.stack}`);

    return res
      .status(status)
      .json({ message: err.message, code: status, name: err.name });
  } else {
    console.error(err);
    return res.status(500).send('서버 내부 오류입니다.');
  }
}
