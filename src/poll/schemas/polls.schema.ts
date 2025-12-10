// src/poll/schemas/polls.schema.ts
import type { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { z } from 'zod';

const createPoll = z
  .object({
    title: z
      .string()
      .min(1, '제목은 필수입니다.')
      .max(100, '제목은 100자 이하여야 합니다.'),
    content: z.string().min(1, '내용은 필수입니다.'),
    startDate: z.string().datetime('시작 시간 형식이 올바르지 않습니다.'),
    endDate: z.string().datetime('종료 시간 형식이 올바르지 않습니다.'),
    building: z.number().int().positive().nullable().optional(),
    options: z
      .array(
        z.object({
          title: z
            .string()
            .min(1, '옵션 제목은 필수입니다.')
            .max(50, '옵션 제목은 50자 이하여야 합니다.'),
        }),
      )
      .min(2, '최소 2개의 옵션이 필요합니다.')
      .max(10, '최대 10개의 옵션까지 가능합니다.'),
  })
  .strict();

const updatePoll = z
  .object({
    title: z
      .string()
      .min(1, '제목은 필수입니다.')
      .max(100, '제목은 100자 이하여야 합니다.')
      .optional(),
    content: z.string().min(1, '내용은 필수입니다.').optional(),
    startDate: z
      .string()
      .datetime('시작 시간 형식이 올바르지 않습니다.')
      .optional(),
    endDate: z
      .string()
      .datetime('종료 시간 형식이 올바르지 않습니다.')
      .optional(),
    building: z.number().int().positive().nullable().optional(),
    options: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z
            .string()
            .min(1, '옵션 제목은 필수입니다.')
            .max(50, '옵션 제목은 50자 이하여야 합니다.'),
        }),
      )
      .min(2, '최소 2개의 옵션이 필요합니다.')
      .max(10, '최대 10개의 옵션까지 가능합니다.')
      .optional(),
  })
  .strict();

const vote = z
  .object({
    optionId: z.string().min(1, '옵션 ID는 필수입니다.'),
  })
  .strict();

const getPollsQuery = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).optional(),
  searchKeyword: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'CLOSED']).optional(),
  building: z.coerce.number().positive().optional(),
});

class PollsSchema {
  createPollSchema(req: Request, res: Response, next: NextFunction) {
    const result = createPoll.safeParse(req.body);
    if (result.success) {
      return next();
    } else {
      const errorMessage = result.error.issues
        .map((err) => err.message)
        .join(', ');
      return next(createError(400, `잘못된 입력값입니다: ${errorMessage}`));
    }
  }

  updatePollSchema(req: Request, res: Response, next: NextFunction) {
    const result = updatePoll.safeParse(req.body);
    if (result.success) {
      return next();
    } else {
      const errorMessage = result.error.issues
        .map((err) => err.message)
        .join(', ');
      return next(createError(400, `잘못된 입력값입니다: ${errorMessage}`));
    }
  }

  voteSchema(req: Request, res: Response, next: NextFunction) {
    const result = vote.safeParse(req.body);
    if (result.success) {
      return next();
    } else {
      const errorMessage = result.error.issues
        .map((err) => err.message)
        .join(', ');
      return next(createError(400, `잘못된 입력값입니다: ${errorMessage}`));
    }
  }

  getPollsQuerySchema(req: Request, res: Response, next: NextFunction) {
    const result = getPollsQuery.safeParse(req.query);

    if (result.success) {
      return next();
    } else {
      const errorMessage = result.error.issues
        .map((err) => err.message)
        .join(', ');
      return next(
        createError(400, `잘못된 쿼리 파라미터입니다: ${errorMessage}`),
      );
    }
  }

  pollIdSchema(req: Request, res: Response, next: NextFunction) {
    const { pollId } = req.params;
    if (!pollId || typeof pollId !== 'string' || pollId.trim() === '') {
      return next(createError(400, '유효하지 않은 투표 ID입니다.'));
    }
    return next();
  }
}

export const pollsSchema = new PollsSchema();
