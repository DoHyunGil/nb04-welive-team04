import express from 'express';
import eventController from '../events/controllers/event.controller.js';
import { eventValidator } from '../events/schemas/event.schema.js';
import passports from '../lib/passports/index.js';

const router = express.Router();
router.get(
  '/',
  passports.jwtAuth,
  eventValidator.getEventsSchema,
  eventController.getEvents,
);

export default router;
