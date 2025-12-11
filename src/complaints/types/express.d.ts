import { z } from 'zod';
import * as ComplaintDto from '../schemas/index.ts';
import type { complainStatus } from 'generated/prisma/enums.js';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: ComplaintDto.GetComplaintsDto;
      createBody: ComplaintDto.CreateComplaintDto;
      updateBody: ComplaintDto.UpdateComplaintDto;
      statusParam: { id: number };
      statusBody: {
        status: complainStatus;
      };
    }
    interface User {
      id: number;
    }
  }
}

export {};
