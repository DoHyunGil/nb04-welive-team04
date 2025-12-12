import express from 'express';
import complaintController from '../complaints/controllers/complaint.controller.js';
import { complaintValidator } from '../complaints/schemas/complaint.schema.js';

const router = express.Router();

router
  .route('/')
  .post(
    complaintValidator.createComplaintSchema,
    complaintController.createComplaint,
  )
  .get(
    complaintValidator.getComplaintsSchema,
    complaintController.getComplaints,
  );
router
  .route('/:id')
  .get(complaintValidator.paramSchema, complaintController.getComplaintById)
  .patch(
    complaintValidator.paramSchema,
    complaintValidator.updateComplaintSchema,
    complaintController.updateComplaint,
  )
  .delete(complaintValidator.paramSchema, complaintController.deleteComplaint);
router.patch(
  '/:id/status',
  complaintValidator.updateStatusSchema,
  complaintController.updateComplaintStatus,
);

export default router;
