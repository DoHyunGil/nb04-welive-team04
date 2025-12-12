import { Router } from 'express';
import apartmentController from '../apartment/apartment.controller.js';

const router = Router();

router.get('/', apartmentController.getApartments);
router.get('/:id', apartmentController.getApartmentById);

export default router;
