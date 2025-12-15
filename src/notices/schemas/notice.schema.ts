import { z } from 'zod';
import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';
import type { NoticeCategory } from 'generated/prisma/enums.js';

const NOTICE_CATEGORY = {
  MAINTENANCE: 'MAINTENANCE',
  EMERGENCY: 'EMERGENCY',
  COMMUNITY: 'COMMUNITY',
  RESIDENT_VOTE: 'RESIDENT_VOTE',
  RESIDENT_COUNCIL: 'RESIDENT_COUNCIL',
  ETC: 'ETC',
} as const;
const StatusValues = Object.values(NOTICE_CATEGORY);

const getQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(20),
    searchKeyword: z.string().optional(),
    category: z
      .enum(StatusValues as [NoticeCategory, ...NoticeCategory[]], {
        message: '유효하지 않은 상태 값입니다.',
      })
      .optional(),
  })
  .strict();
const createBodySchema = z.object({
  title: z.string(),
  content: z.string(),
  category: z.enum(StatusValues as [NoticeCategory, ...NoticeCategory[]], {
    message: '유효하지 않은 상태 값입니다.',
  }),
  isPinned: z.boolean().default(false),
});
const updateBodySchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  category: z
    .enum(StatusValues as [NoticeCategory, ...NoticeCategory[]], {
      message: '유효하지 않은 상태 값입니다.',
    })
    .optional(),
  isPinned: z.boolean().optional(),
});
const noticeParamSchema = z.object({
  noticeId: z.coerce.number().int().positive(),
});

export type GetNoticesDto = z.infer<typeof getQuerySchema>;
export type CreateNoticeDto = z.infer<typeof createBodySchema>;
export type UpdateNoticeDto = z.infer<typeof updateBodySchema>;

export interface LocalResponse extends Response {
  locals: {
    validatedQuery: GetNoticesDto;
    createBody: CreateNoticeDto;
    updateBody: UpdateNoticeDto;
    noticeId: number;
  };
}

class noticeSchema {
  getNoticesSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = getQuerySchema.safeParse(req.query);
    if (result.success) {
      res.locals.validatedQuery = result.data;
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  createNoticeSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = createBodySchema.safeParse(req.body);
    if (result.success) {
      res.locals.createBody = result.data;
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  updateNoticeSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = updateBodySchema.safeParse(req.body);
    if (result.success) {
      res.locals.updateBody = result.data;
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  paramNoticeSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = noticeParamSchema.safeParse(req.params);
    if (result.success) {
      res.locals.noticeId = result.data.noticeId;
      return next();
    } else {
      return next(createHttpError(400, '잘못된 공지 ID입니다.'));
    }
  };
}

export const noticeValidator = new noticeSchema();
