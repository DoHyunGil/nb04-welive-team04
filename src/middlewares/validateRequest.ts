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
      // Express 5에서는 req.query가 읽기 전용이므로 Object.defineProperty 사용
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: false,
        configurable: true,
      });
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
      const parsed = schema.parse(req.params);
      // Express 5에서는 req.params가 읽기 전용이므로 Object.defineProperty 사용
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.defineProperty(req, 'params', {
        value: parsed,
        writable: true,
        configurable: true,
      });
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
