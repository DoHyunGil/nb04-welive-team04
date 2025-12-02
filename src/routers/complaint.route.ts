import express from 'express';

import complaintController from '../complaints/controllers/complaint.controller.js';

const router = express.Router();

router
  .route('/')
  .post(complaintController.createComplaint)
  .get(complaintController.getComplaints);
router
  .route('/:id')
  .get(complaintController.getComplaintById)
  .patch(complaintController.updateComplaint)
  .delete(complaintController.deleteComplaint);
router.patch('/:id/status', complaintController.updateComplaintStatus);

export default router;
