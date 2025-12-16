import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import createError from 'http-errors';

export function validateBody(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((err) => err.message).join(', ');
        next(createError(400, messages));
      } else {
        next(error);
      }
    }
  };
}

export function validateQuery(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.assign(req.query, parsed as any);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((err) => err.message).join(', ');
        next(createError(400, messages));
      } else {
        next(error);
      }
    }
  };
}

export function validateParams(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((err) => err.message).join(', ');
        next(createError(400, messages));
      } else {
        next(error);
      }
    }
  };
}
