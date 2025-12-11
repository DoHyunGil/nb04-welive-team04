import { z } from 'zod';
import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';
import type { complainStatus } from 'generated/prisma/enums.js';

const COMPLAINT_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;

const StatusValues = Object.values(COMPLAINT_STATUS);

const statusParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
const statusBodySchema = z.object({
  status: z.enum(StatusValues as [complainStatus, ...complainStatus[]], {
    message: '유효하지 않은 상태 값입니다.',
  }),
});
export const updateStatusSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const paramResult = statusParamSchema.safeParse(req.params);
  const bodyResult = statusBodySchema.safeParse(req.body);
  if (paramResult.success && bodyResult.success) {
    req.statusParam = paramResult.data;
    req.statusBody = bodyResult.data;
    return next();
  } else {
    return next(createHttpError(400, '잘못된 입력값입니다.'));
  }
};

export const paramSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = statusParamSchema.safeParse(req.params);
  if (result.success) {
    req.statusParam = result.data;
    return next();
  } else {
    return next(createHttpError(400, '잘못된 입력값입니다.'));
  }
};
