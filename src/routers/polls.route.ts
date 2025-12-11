// src/routers/polls.route.ts
import express from 'express';
import pollsController from '../polls/controllers/polls.controller.js';
import { pollsSchema } from '../polls/schemas/polls.schema.js';

const router = express.Router();

router.post('/', pollsSchema.createPollSchema, (req, res, next) =>
  pollsController.createPoll(req, res, next),
);

router.get('/', pollsSchema.getPollsQuerySchema, (req, res, next) =>
  pollsController.getPolls(req, res, next),
);

router.get('/:pollId', pollsSchema.pollIdSchema, (req, res, next) =>
  pollsController.getPollById(req, res, next),
);

router.patch(
  '/:pollId',
  pollsSchema.pollIdSchema,
  pollsSchema.updatePollSchema,
  (req, res, next) => pollsController.updatePoll(req, res, next),
);

router.delete('/:pollId', pollsSchema.pollIdSchema, (req, res, next) =>
  pollsController.deletePoll(req, res, next),
);

router.post(
  '/:pollId/vote',
  pollsSchema.pollIdSchema,
  pollsSchema.voteSchema,
  (req, res, next) => pollsController.vote(req, res, next),
);

router.delete('/:pollId/vote', pollsSchema.pollIdSchema, (req, res, next) =>
  pollsController.unvote(req, res, next),
);

export default router;
