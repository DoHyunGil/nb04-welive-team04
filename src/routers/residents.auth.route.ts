import express from 'express';
import ResidentsAuthController from '../residents-auth/controllers/residents.auth.controller.js';
import residentsAuthSchema from '../residents-auth/residents.auth.schema.js';

const router = express.Router();

router.get(
  '/',
  residentsAuthSchema.checkPaginationAuthSchema,
  ResidentsAuthController.getResidentsAuth,
);
router.post(
  '/',
  residentsAuthSchema.createResidentsAuthSchema,
  ResidentsAuthController.createResidents,
);
router.post(
  '/join-status',
  residentsAuthSchema.checkResidentIdAuthSchema,
  ResidentsAuthController.updateResidents,
);
router.post(
  '/:id/join-status',
  residentsAuthSchema.checkResidentIdAuthSchema,
  ResidentsAuthController.updateResidents,
);

export default router;
