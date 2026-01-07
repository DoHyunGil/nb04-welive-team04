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
  '/', // 입주민 회원 가입, 인증 불필요
  residentsAuthSchema.createResidentsAuthSchema,
  ResidentsAuthController.createResidents,
);
router.patch(
  '/join-status',
  passports.jwtAuth,
  ResidentsAuthController.updateResidents,
);
router.patch(
  '/:id/join-status',
  passports.jwtAuth,
  residentsAuthSchema.checkResidentIdAuthSchema,
  ResidentsAuthController.updateResidents,
);
router.delete(
  '/rejected',
  passports.jwtAuth,
  ResidentsAuthController.deleteRejectedResidents,
);

export default router;
