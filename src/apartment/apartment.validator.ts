import { z } from 'zod';

export const NumberIdSchema = z
  .string()
  .refine((v) => !isNaN(Number(v)), {
    message: 'ID는 숫자여야 합니다.'
  })
  .transform((v) => Number(v));