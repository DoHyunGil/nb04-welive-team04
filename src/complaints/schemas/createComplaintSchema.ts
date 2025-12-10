import { z } from 'zod';
import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';

const ComplaintBodySchema = z
  .object({
    title: z.string(),
    content: z.string(),
    isPublic: z.boolean().default(false),
    apartmentId: z.coerce.number(),
  })
  .strict();

export const createComplaintSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = ComplaintBodySchema.safeParse(req.body);
  if (result.success) {
    req.createBody = result.data;
    return next();
  } else {
    const errorMessage = result.error.message;
    return next(createHttpError(400, `잘못된 입력값: ${errorMessage}`));
  }
};

export type CreateComplaintDto = z.infer<typeof ComplaintBodySchema>;
