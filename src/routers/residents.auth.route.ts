import express from 'express';
import ResidentsAuthController from '../residents-auth/controllers/residents.auth.controller.js';
import residentsAuthSchema from '../residents-auth/residents.auth.schema.js';
import passports from '../lib/passports/index.js';

const router = express.Router();

router.get(
  '/',
  passports.jwtAuth,
  residentsAuthSchema.checkPaginationAuthSchema,
  ResidentsAuthController.getResidentsAuth,
);
router.post(
  '/',
  passports.jwtAuth,
  residentsAuthSchema.createResidentsAuthSchema,
  ResidentsAuthController.createResidents,
);
router.post(
  '/join-status',
  passports.jwtAuth,
  residentsAuthSchema.checkResidentIdAuthSchema,
  ResidentsAuthController.updateResidents,
);
router.post(
  '/:id/join-status',
  passports.jwtAuth,
  residentsAuthSchema.checkResidentIdAuthSchema,
  ResidentsAuthController.updateResidents,
);

export default router;
