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

export const ComplaintQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
    searchKeyword: z.string().optional(),
    status: z
      .enum(StatusValues as [complainStatus, ...complainStatus[]], {
        message: '유효하지 않은 상태 값입니다.',
      })
      .optional(),
    isPublic: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    building: z.coerce.number().int().optional(),
    unit: z.coerce.number().int().optional(),
  })
  .strict();

export const getComplaintSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = ComplaintQuerySchema.safeParse(req.query);
  if (result.success) {
    req.validatedQuery = result.data;
    return next();
  } else {
    return next(createHttpError(400, '잘못된 입력값입니다.'));
  }
};

export type GetComplaintsDto = z.infer<typeof ComplaintQuerySchema>;
