import type { NextFunction, Request, Response } from 'express';
import { isHttpError } from 'http-errors';
import { AppError } from './errorClass.js';

export default function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (isHttpError(err)) {
    const status = err.status ?? err.statusCode ?? 500;
    console.error(`[${status}] ${err.name}: ${err.message}`);
    return res
      .status(status)
      .json({ message: err.message, code: status, name: err.name });
    //  } else if () {
  } else if (err instanceof AppError) {
    console.error(`[${err.status}] ${err.name}: ${err.message}`);
    return res.status(err.status).json({
      message: err.message,
      code: err.status,
      name: err.name,
    });
    next();
  } else {
    console.error(err);
    return res.status(500).send('서버 내부 오류입니다.');
  }
}
