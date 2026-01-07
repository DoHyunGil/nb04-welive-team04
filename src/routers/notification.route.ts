// src/routers/notification.route.ts
import { Router } from 'express';
import {
  NotificationController,
  getNotificationService,
} from '../notification/index.js';
import { notificationSchema } from '../notification/schemas/notification.schema.js';
import passports from '../lib/passports/index.js';

const notificationRouter = Router();

let isInitialized = false;

function initRouter() {
  if (isInitialized) return;

  const notificationService = getNotificationService();
  const notificationController = new NotificationController(
    notificationService,
  );

  notificationRouter.use(passports.jwtAuth);

  notificationRouter.get('/sse', (req, res, next) => {
    notificationController.router(req, res, next);
  });

  notificationRouter.get(
    '/',
    notificationSchema.paginationQuerySchema.bind(notificationSchema),
    (req, res, next) => {
      notificationController.router(req, res, next);
    },
  );

  notificationRouter.patch(
    '/:notificationid/read',
    notificationSchema.notificationIdSchema.bind(notificationSchema),
    (req, res, next) => {
      notificationController.router(req, res, next);
    },
  );

  isInitialized = true;
}

export function getNotificationRouter(): Router {
  initRouter();
  return notificationRouter;
}

export default notificationRouter;
