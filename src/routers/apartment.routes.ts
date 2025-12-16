import { Router } from 'express';
import { apartmentSchema } from '../apartment/schemas/apartment.schema.js';
import apartmentController from '../apartment/apartment.controller.js';

const router = Router();

router.get('/', apartmentController.getApartments);
router.get(
  '/:id',
  apartmentSchema.apartmentIdSchema,
  apartmentController.getApartmentById,
);

export default router;
