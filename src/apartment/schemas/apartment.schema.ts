import type { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { z } from 'zod';

export const NumberIdSchema = z
  .string()
  .min(1, 'ID는 필수 값입니다.')
  .refine((v) => !isNaN(Number(v)), 'ID는 숫자여야 합니다.')
  .transform((v) => Number(v));

class ApartmentSchema {
  apartmentIdSchema(req: Request, res: Response, next: NextFunction) {
    const result = NumberIdSchema.safeParse(req.params.id);

    if (result.success) {
      req.params.id = String(result.data);
      return next();
    }

    const message = result.error.issues.map((i) => i.message).join(', ');
    return next(createError(400, `잘못된 아파트 ID입니다: ${message}`));
  }
}
export const apartmentSchema = new ApartmentSchema();
