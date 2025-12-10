// src/poll/controllers/polls.controller.ts
import type { NextFunction, Request, Response } from 'express';
import { PollStatus } from '../../../generated/prisma/client.js';
import pollsService from '../services/polls.service.js';
import type { GetPollsQuery } from '../services/polls.service.js';

class PollsController {
  async createPoll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const poll = await pollsService.createPoll(userId, req.body);
      res.status(201).json(poll);
    } catch (error) {
      next(error);
    }
  }

  async getPolls(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { page, limit, searchKeyword, status, building } = req.query;

      const query: GetPollsQuery = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        searchKeyword:
          typeof searchKeyword === 'string' ? searchKeyword : undefined,
        status: typeof status === 'string' ? (status as PollStatus) : undefined,
        building: building ? Number(building) : undefined,
      };

      const polls = await pollsService.getPolls(userId, query);
      res.status(200).json(polls);
    } catch (error) {
      next(error);
    }
  }

  async getPollById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { pollId } = req.params as { pollId: string };
      const poll = await pollsService.getPollById(pollId, userId);
      res.status(200).json(poll);
    } catch (error) {
      next(error);
    }
  }

  async updatePoll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { pollId } = req.params as { pollId: string };

      await pollsService.updatePoll(pollId, userId, req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async deletePoll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { pollId } = req.params as { pollId: string };

      await pollsService.deletePoll(pollId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async vote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { pollId } = req.params as { pollId: string };
      const { optionId } = req.body as { optionId: string };

      await pollsService.vote(pollId, optionId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async unvote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { pollId } = req.params as { pollId: string };

      await pollsService.unvote(pollId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new PollsController();
