import { z } from 'zod';
import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
});
export const updateComplaintSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = updateSchema.safeParse(req.body);
  if (result.success) {
    req.updateBody = result.data;
    return next();
  } else {
    const errorMessage = result.error.message;
    return next(createHttpError(400, `잘못된 입력값: ${errorMessage}`));
  }
};

export type UpdateComplaintDto = z.infer<typeof updateSchema>;
