import express from 'express';
import residentsController from '../residents/controllers/residents.controller.js';
import residentSchema from '../residents/residents.schema.js';

const router = express.Router();

router.get(
  '/api/v2/residents',
  residentSchema.checkPaginationSchema,
  residentsController.getResidents,
);
router.post(
  '/api/v2/residents',
  residentSchema.createResidentsSchema,
  residentsController.createResidents,
);

router.get(
  '/api/v2/residents/:id',
  residentSchema.checkResidentIdSchema,
  residentsController.getResidentsById,
);
router.patch(
  '/api/v2/residents/:id',
  residentSchema.updateResidentsSchema,
  residentsController.updateResidents,
);
router.delete(
  '/api/v2/residents/:id',
  residentSchema.checkResidentIdSchema,
  residentsController.deleteResidentById,
);
export default router;
