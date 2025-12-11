import express from 'express';
import complaintController from '../complaints/controllers/complaint.controller.js';
import { complaintValidator } from '../complaints/schemas/complaint.schema.js';

const router = express.Router();

router
  .route('/')
  .post(
    complaintValidator.validateUserId,
    complaintValidator.createComplaintSchema,
    complaintController.createComplaint,
  )
  .get(
    complaintValidator.getComplaintsSchema,
    complaintController.getComplaints,
  );
router
  .route('/:id')
  .get(
    complaintValidator.validateUserId,
    complaintValidator.paramSchema,
    complaintController.getComplaintById,
  )
  .patch(
    complaintValidator.validateUserId,
    complaintValidator.paramSchema,
    complaintValidator.updateComplaintSchema,
    complaintController.updateComplaint,
  )
  .delete(
    complaintValidator.validateUserId,
    complaintValidator.paramSchema,
    complaintController.deleteComplaint,
  );
router.patch(
  '/:id/status',
  complaintValidator.validateUserId,
  complaintValidator.updateStatusSchema,
  complaintController.updateComplaintStatus,
);

export default router;
