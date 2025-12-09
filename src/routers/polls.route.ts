// src/routers/polls.route.ts
import express from 'express';
import pollsController from '../poll/controllers/polls.controller.js';

const router = express.Router();

router.post('/', (req, res, next) =>
  pollsController.createPoll(req, res, next),
);

router.get('/', (req, res, next) => pollsController.getPolls(req, res, next));

router.get('/:pollId', (req, res, next) =>
  pollsController.getPollById(req, res, next),
);

router.patch('/:pollId', (req, res, next) =>
  pollsController.updatePoll(req, res, next),
);

router.delete('/:pollId', (req, res, next) =>
  pollsController.deletePoll(req, res, next),
);

router.post('/:pollId/vote', (req, res, next) =>
  pollsController.vote(req, res, next),
);

router.delete('/:pollId/vote', (req, res, next) =>
  pollsController.unvote(req, res, next),
);

export default router;
