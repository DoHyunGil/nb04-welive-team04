import { Router } from 'express';
import apartmentController from '../apartment/apartment.controller.js';

const router = Router();

router.get('/:id', apartmentController.getApartmentById.bind(apartmentController));
router.get('/', apartmentController.getApartments.bind(apartmentController));

export default router;