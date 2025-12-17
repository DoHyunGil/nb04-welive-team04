import { z } from 'zod';
import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';

const getQuerySchema = z.object({
  year: z.coerce.number().int().positive(),
  month: z.coerce.number().int().min(1).max(12),
});
export const startEndDateSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate는 startDate보다 이후여야 합니다.',
    path: ['endDate'],
  });

export type GetEventsDto = z.infer<typeof getQuerySchema>;
export type EventDateDto = z.infer<typeof startEndDateSchema>;

class eventSchema {
  getEventsSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = getQuerySchema.safeParse(req.query);
    if (result.success) {
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
  eventDateSchema = (req: Request, res: Response, next: NextFunction) => {
    const result = startEndDateSchema.safeParse(req.body);
    if (result.success) {
      return next();
    } else {
      return next(createHttpError(400, '잘못된 입력값입니다.'));
    }
  };
}

export const eventValidator = new eventSchema();
