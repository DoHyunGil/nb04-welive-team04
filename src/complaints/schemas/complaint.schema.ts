import { z } from 'zod';
import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';
import type { complainStatus } from '../../../generated/prisma/enums.js';

const COMPLAINT_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;
const StatusValues = Object.values(COMPLAINT_STATUS);

const getQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(20),
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
const createBodySchema = z.object({
  title: z.string(),
  content: z.string(),
  isPublic: z.boolean().default(false),
  apartmentId: z.coerce.number(),
});
const updateBodySchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
});
const statusParamSchema = z.object({
  complaintId: z.coerce.number().int().positive(),
});
const statusBodySchema = z.object({
  status: z.enum(StatusValues as [complainStatus, ...complainStatus[]], {
    message: '유효하지 않은 상태 값입니다.',
  }),
});

export type GetComplaintsDto = z.infer<typeof getQuerySchema>;
export type CreateComplaintDto = z.infer<typeof createBodySchema>;
export type UpdateComplaintDto = z.infer<typeof updateBodySchema>;

class complaintSchema {
  getComplaintsSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = getQuerySchema.safeParse(req.query);
    if (result.success) {
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  createComplaintSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = createBodySchema.safeParse(req.body);
    if (result.success) {
      return next();
    } else {
      return next(createHttpError(400, `잘못된 입력값입니다.`));
    }
  };
  updateComplaintSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = updateBodySchema.safeParse(req.body);
    if (result.success) {
      return next();
    } else {
      return next(createHttpError(400, `잘못된 입력값입니다.`));
    }
  };
  updateStatusSchema = (req: Request, res: Response, next: NextFunction) => {
    const paramResult = statusParamSchema.safeParse(req.params);
    const bodyResult = statusBodySchema.safeParse(req.body);
    if (paramResult.success && bodyResult.success) {
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  paramSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = statusParamSchema.safeParse(req.params);
    if (result.success) {
      return next();
    } else {
      return next(createHttpError(400, '잘못된 민원 ID입니다.'));
    }
  };
}

export const complaintValidator = new complaintSchema();
