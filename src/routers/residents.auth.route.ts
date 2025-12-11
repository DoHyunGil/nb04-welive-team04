import express from 'express';
import ResidentsAuthController from '../residents-auth/controllers/residents.auth.controller.js';
import residentsAuthSchema from '../residents-auth/residents.auth.schema.js';

const router = express.Router();

router.get(
  '/api/v2/users/residents',
  residentsAuthSchema.checkPaginationAuthSchema,
  ResidentsAuthController.getResidentsAuth,
);
router.post(
  '/api/v2/users/residents',
  residentsAuthSchema.createResidentsAuthSchema,
  ResidentsAuthController.createResidents,
);
router.post(
  '/api/v2/users/residents/join-status',
  residentsAuthSchema.checkResidentIdAuthSchema,
  ResidentsAuthController.updateResidents,
);
router.post(
  '/api/v2/users/residents/:id/join-status',
  residentsAuthSchema.checkResidentIdAuthSchema,
  ResidentsAuthController.updateResidents,
);

export default router;
