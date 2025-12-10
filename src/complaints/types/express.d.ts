import { z } from 'zod';
import * as ComplaintDto from '../types/complaint.types.js';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: ComplaintDto.GetComplaintsDto;
      createBody?: ComplaintDto.CreateComplaintDto;
      updateBody?: ComplaintDto.UpdateComplaintDto;
    }
    interface User {
      id: number;
    }
  }
}

export {};
