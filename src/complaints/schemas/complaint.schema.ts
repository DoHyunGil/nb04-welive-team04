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

const getQuerySchema = z
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
  id: z.coerce.number().int().positive(),
});
const statusBodySchema = z.object({
  status: z.enum(StatusValues as [complainStatus, ...complainStatus[]], {
    message: '유효하지 않은 상태 값입니다.',
  }),
});
const userIdSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export type GetComplaintsDto = z.infer<typeof getQuerySchema>;
export type CreateComplaintDto = z.infer<typeof createBodySchema>;
export type UpdateComplaintDto = z.infer<typeof updateBodySchema>;

export interface LocalResponse extends Response {
  locals: {
    validatedQuery: GetComplaintsDto;
    createBody: CreateComplaintDto;
    updateBody: UpdateComplaintDto;
    complaint: { id: number };
    statusBody: {
      status: complainStatus;
    };
  };
}

class complaintSchema {
  getComplaintsSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = getQuerySchema.safeParse(req.query);
    if (result.success) {
      res.locals.validatedQuery = result.data;
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  createComplaintSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = createBodySchema.safeParse(req.body);
    if (result.success) {
      res.locals.createBody = result.data;
      return next();
    } else {
      const errorMessage = result.error.message;
      return next(createHttpError(400, `잘못된 입력값: ${errorMessage}`));
    }
  };
  updateComplaintSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = updateBodySchema.safeParse(req.body);
    if (result.success) {
      res.locals.updateBody = result.data;
      return next();
    } else {
      const errorMessage = result.error.message;
      return next(createHttpError(400, `잘못된 입력값: ${errorMessage}`));
    }
  };
  updateStatusSchema = (req: Request, res: Response, next: NextFunction) => {
    const paramResult = statusParamSchema.safeParse(req.params);
    const bodyResult = statusBodySchema.safeParse(req.body);
    if (paramResult.success && bodyResult.success) {
      res.locals.complaint = paramResult.data;
      res.locals.statusBody = bodyResult.data;
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  paramSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = statusParamSchema.safeParse(req.params);
    if (result.success) {
      res.locals.complaint = result.data;
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  validateUserId = (req: Request, res: Response, next: NextFunction) => {
    const result = userIdSchema.safeParse(req.body);
    if (result.success) {
      req.user = { id: result.data.userId };
      return next();
    } else {
      const errorMessage = result.error.message;
      return next(createHttpError(400, `잘못된 입력값: ${errorMessage}`));
    }
  };
}

export const complaintValidator = new complaintSchema();
