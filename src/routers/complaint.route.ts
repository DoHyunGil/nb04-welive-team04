import express from 'express';
import complaintController from '../complaints/controllers/complaint.controller.js';
import * as complaintSchema from '../complaints/schemas/index.js';

const router = express.Router();

router
  .route('/')
  .post(
    complaintSchema.createComplaintSchema,
    complaintController.createComplaint,
  )
  .get(complaintSchema.getComplaintSchema, complaintController.getComplaints);
router
  .route('/:id')
  .get(complaintSchema.paramSchema, complaintController.getComplaintById)
  .patch(
    complaintSchema.updateComplaintSchema,
    complaintController.updateComplaint,
  )
  .delete(complaintSchema.paramSchema, complaintController.deleteComplaint);
router.patch(
  '/:id/status',
  complaintSchema.updateStatusSchema,
  complaintController.updateComplaintStatus,
);

export default router;
