import { PollStatus } from '../../../generated/prisma/client.js';

export interface GetPollsQuery {
  page?: number;
  limit?: number;
  searchKeyword?: string;
  status?: PollStatus;
  building?: number;
}
