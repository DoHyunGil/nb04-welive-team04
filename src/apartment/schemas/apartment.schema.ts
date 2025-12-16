import type { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { z } from 'zod';

export const NumberIdSchema = z.number().int('ID는 정수여야 합니다.');

class ApartmentSchema {
  apartmentIdSchema(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return next(createError(400, 'Id는 숫자여야 합니다.'));
    }

    const result = NumberIdSchema.safeParse(id);

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(', ');
      return next(createError(400, `잘못된 아파트 ID입니다: ${message}`));
    }
    return next();
  }
}
export const apartmentSchema = new ApartmentSchema();
