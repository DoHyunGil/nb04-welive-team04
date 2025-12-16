// src/polls/controllers/polls.types.ts
import { PollStatus } from '../../../generated/prisma/client.js';

export interface GetPollsQuery {
  page?: number;
  limit?: number;
  searchKeyword?: string;
  status?: PollStatus;
  building?: number | null;
}

export interface CreatePollData {
  title: string;
  content: string;
  startDate: string | Date;
  endDate: string | Date;
  building?: number | null;
  options: Array<{ title: string }>;
}

export interface UpdatePollData {
  title?: string;
  content?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  building?: number | null;
  options?: Array<{ id?: string; title: string }>;
}
