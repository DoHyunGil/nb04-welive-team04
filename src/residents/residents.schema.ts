import z, { type ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';

const createResidentsSchema = z.object({
  body: z.object({
    name: z.coerce.string().min(1, '[필수]이름은 비워 둘수 없습니다'),
    contact: z.coerce.string().min(11, '[필수]연락처는 11자리 숫자여야 합니다'),
    email: z.string().email('[필수]유효한 이메일 주소를 입력해주세요'),
    building: z.coerce.number().min(1, '[필수]동은 1 이상의 숫자여야 합니다'),
    unit: z.coerce.number().min(3, '[필수]호수는 1 이상의 숫자여야 합니다'),
    isHouseholder: z.coerce.boolean(),
    userId: z.number().optional(),
  }),
});

const updateResidentsSchema = z.object({
  body: z.object({
    name: z.coerce.string().min(1, '[필수]이름은 비워 둘수 없습니다'),
    contact: z.coerce.string().min(11, '[필수]연락처는 11자리 숫자여야 합니다'),
    building: z.coerce.number().min(1, '[필수]동은 1 이상의 숫자여야 합니다'),
    unit: z.coerce.number().min(3, '[필수]호수는 1 이상의 숫자여야 합니다'),
    isHouseholder: z.coerce.boolean(),
  }),
});

const checkPaginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    orderBy: z.enum(['asc', 'desc']).optional(),
    search: z.string().trim().optional(),
  }),
});

const checkResidentIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int(),
  }),
});

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    next();
  };

export default {
  createResidentsSchema: validate(createResidentsSchema),
  updateResidentsSchema: validate(updateResidentsSchema),
  checkPaginationSchema: validate(checkPaginationSchema),
  checkResidentIdSchema: validate(checkResidentIdSchema),
};
