import express from 'express';
import residentsController from '../residents/controllers/residents.controller.js';
import residentSchema from '../residents/residents.schema.js';
import passports from '../lib/passports/index.js';

const router = express.Router();

router.get(
  '/',
  passports.jwtAuth,
  residentSchema.checkPaginationSchema,
  residentsController.getResidents,
);
router.post(
  '/',
  passports.jwtAuth,
  residentSchema.createResidentsSchema,
  residentsController.createResidents,
);

router.get(
  '/:id',
  passports.jwtAuth,
  residentSchema.checkResidentIdSchema,
  residentsController.getResidentsById,
);
router.patch(
  '/:id',
  passports.jwtAuth,
  residentSchema.updateResidentsSchema,
  residentsController.updateResidents,
);
router.delete(
  '/:id',
  passports.jwtAuth,
  residentSchema.checkResidentIdSchema,
  residentsController.deleteResidentById,
);
export default router;
