// src/notification/schemas/notification.schema.ts
import type { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { z } from 'zod';

const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Number(val))
    .pipe(z.number().int().positive().min(1).max(10000)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Number(val))
    .pipe(z.number().int().positive().min(1).max(100)),
});

const notificationIdParamSchema = z.object({
  notificationid: z
    .string()
    .regex(/^\d+$/, '알림 ID는 숫자여야 합니다.')
    .transform((val) => Number(val))
    .pipe(z.number().int().positive().max(2147483647)),
});

class NotificationSchema {
  paginationQuerySchema(req: Request, res: Response, next: NextFunction) {
    const result = paginationQuerySchema.safeParse(req.query);

    if (result.success) {
      res.locals.pagination = result.data;
      return next();
    } else {
      const errorMessage = result.error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return next(createError(400, `잘못된 쿼리입니다: ${errorMessage}`));
    }
  }

  notificationIdSchema(req: Request, res: Response, next: NextFunction) {
    const result = notificationIdParamSchema.safeParse(req.params);

    if (result.success) {
      res.locals.notificationid = result.data.notificationid;
      return next();
    } else {
      const errorMessage = result.error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return next(createError(400, `잘못된 파라미터입니다: ${errorMessage}`));
    }
  }
}

export const notificationSchema = new NotificationSchema();
