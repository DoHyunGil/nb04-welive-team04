// src/polls/controllers/polls.controller.ts
import type { NextFunction, Request, Response } from 'express';
import pollsService from '../services/polls.service.js';

class PollsController {
  async createPoll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const userId = req.user.id;
      const poll = await pollsService.createPoll(userId, req.body);
      res.status(201).json(poll);
    } catch (error) {
      next(error);
    }
  }

  async getPolls(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const userId = req.user.id;
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        searchKeyword: req.query.searchKeyword as string | undefined,
        status: req.query.status as
          | 'PENDING'
          | 'IN_PROGRESS'
          | 'CLOSED'
          | undefined,
        building: req.query.building ? Number(req.query.building) : undefined,
      };
      const polls = await pollsService.getPolls(userId, query);
      res.status(200).json(polls);
    } catch (error) {
      next(error);
    }
  }

  async getPollById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const userId = req.user.id;
      const { pollId } = req.params;

      if (!pollId) {
        return res.status(400).json({ message: 'pollId가 필요합니다.' });
      }

      const poll = await pollsService.getPollById(pollId, userId);
      res.status(200).json(poll);
    } catch (error) {
      next(error);
    }
  }

  async updatePoll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const userId = req.user.id;
      const { pollId } = req.params;

      if (!pollId) {
        return res.status(400).json({ message: 'pollId가 필요합니다.' });
      }

      await pollsService.updatePoll(pollId, userId, req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async deletePoll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const userId = req.user.id;
      const { pollId } = req.params;

      if (!pollId) {
        return res.status(400).json({ message: 'pollId가 필요합니다.' });
      }

      await pollsService.deletePoll(pollId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async vote(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const userId = req.user.id;
      const { pollId } = req.params;
      const { optionId } = req.body;

      if (!pollId) {
        return res.status(400).json({ message: 'pollId가 필요합니다.' });
      }

      if (!optionId) {
        return res.status(400).json({ message: 'optionId가 필요합니다.' });
      }

      await pollsService.vote(pollId, optionId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async unvote(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const userId = req.user.id;
      const { pollId } = req.params;

      if (!pollId) {
        return res.status(400).json({ message: 'pollId가 필요합니다.' });
      }

      await pollsService.unvote(pollId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new PollsController();
