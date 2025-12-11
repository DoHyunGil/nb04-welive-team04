import { z } from 'zod';
import * as ComplaintDto from '../schemas/index.ts';
import type { complainStatus } from 'generated/prisma/enums.js';

declare global {
  namespace Express {
    interface User {
      id: number;
    }
  }
}

export {};
