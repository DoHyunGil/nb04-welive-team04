import express from 'express';
import residentsController from '../residents/controllers/residents.controller.js';
import residentSchema from '../residents/residents.schema.js';

const router = express.Router();

router.get(
  '/',
  residentSchema.checkPaginationSchema,
  residentsController.getResidents,
);
router.post(
  '/',
  residentSchema.createResidentsSchema,
  residentsController.createResidents,
);

router.get(
  '/:id',
  residentSchema.checkResidentIdSchema,
  residentsController.getResidentsById,
);
router.patch(
  '/:id',
  residentSchema.updateResidentsSchema,
  residentsController.updateResidents,
);
router.delete(
  '/:id',
  residentSchema.checkResidentIdSchema,
  residentsController.deleteResidentById,
);
export default router;
