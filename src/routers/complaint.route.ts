import express from 'express';
import complaintController from '../complaints/controllers/complaint.controller.js';
import { complaintValidator } from '../complaints/schemas/complaint.schema.js';
import passports from '../lib/passports/index.js';

const router = express.Router();

router
  .route('/')
  .post(
    passports.jwtAuth,
    complaintValidator.createComplaintSchema,
    complaintController.createComplaint,
  )
  .get(
    complaintValidator.getComplaintsSchema,
    complaintController.getComplaints,
  );
router
  .route('/:complaintId')
  .get(
    passports.jwtAuth,
    complaintValidator.paramSchema,
    complaintController.getComplaintById,
  )
  .patch(
    passports.jwtAuth,
    complaintValidator.paramSchema,
    complaintValidator.updateComplaintSchema,
    complaintController.updateComplaint,
  )
  .delete(
    passports.jwtAuth,
    complaintValidator.paramSchema,
    complaintController.deleteComplaint,
  );
router.patch(
  '/:complaintId/status',
  passports.jwtAuth,
  complaintValidator.updateStatusSchema,
  complaintController.updateComplaintStatus,
);

export default router;
