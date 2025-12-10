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
  .get(complaintController.getComplaintById)
  .patch(
    complaintSchema.updateComplaintSchema,
    complaintController.updateComplaint,
  )
  .delete(complaintController.deleteComplaint);
router.patch('/:id/status', complaintController.updateComplaintStatus);

export default router;
