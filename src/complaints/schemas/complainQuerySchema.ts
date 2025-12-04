import { z } from 'zod';
import { complainStatus } from '../../../generated/prisma/client.js';

const ComplainStatusEnum = z.enum(
  Object.values(complainStatus) as [string, ...string[]],
);
export const ComplainQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  searchKeyword: z.string().optional(),
  status: ComplainStatusEnum.optional(),
  isPublic: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  building: z.coerce.number().int().optional(),
  unit: z.coerce.number().int().optional(),
});

export type ComplainQueryType = {
  page: number;
  limit: number;
  searchKeyword?: string;
  status?: complainStatus;
  isPublic?: boolean;
  building?: number;
  unit?: number;
};
