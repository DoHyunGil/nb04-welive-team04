// src/routers/polls.route.ts
import express from 'express';
import pollsController from '../polls/controllers/polls.controller.js';
import { pollsSchema } from '../polls/schemas/polls.schema.js';
import passports from '../lib/passports/index.js';

const router = express.Router();

router.post(
  '/',
  passports.jwtAuth,
  pollsSchema.createPollSchema,
  (req, res, next) => pollsController.createPoll(req, res, next),
);

router.post(
  '/:pollId/options/:optionId/vote',
  passports.jwtAuth,
  pollsSchema.pollIdSchema,
  (req, res, next) => pollsController.vote(req, res, next),
);

router.delete(
  '/:pollId/vote',
  passports.jwtAuth,
  pollsSchema.pollIdSchema,
  (req, res, next) => pollsController.unvote(req, res, next),
);

router.get(
  '/',
  passports.jwtAuth,
  pollsSchema.getPollsQuerySchema,
  (req, res, next) => pollsController.getPolls(req, res, next),
);

router.get(
  '/:pollId',
  passports.jwtAuth,
  pollsSchema.pollIdSchema,
  (req, res, next) => pollsController.getPollById(req, res, next),
);

router.patch(
  '/:pollId',
  passports.jwtAuth,
  pollsSchema.pollIdSchema,
  pollsSchema.updatePollSchema,
  (req, res, next) => pollsController.updatePoll(req, res, next),
);

router.delete(
  '/:pollId',
  passports.jwtAuth,
  pollsSchema.pollIdSchema,
  (req, res, next) => pollsController.deletePoll(req, res, next),
);

export default router;