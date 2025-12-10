import { Router } from 'express';
import apartmentController, {
  getApartments,
} from '../apartment/apartment.controller.js';

const router = Router();

router.get('/', getApartments);
router.get('/:id', apartmentController.getApartmentById);

export default router;
