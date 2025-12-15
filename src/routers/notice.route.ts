import express from 'express';
import noticeController from '../notices/controllers/notice.controller.js';
import { noticeValidator } from '../notices/schemas/notice.schema.js';

const router = express.Router();

router
  .route('/')
  .post(noticeValidator.createNoticeSchema, noticeController.createNotice)
  .get(noticeValidator.getNoticesSchema, noticeController.getNotices);
router
  .route('/:id')
  .get(noticeValidator.paramNoticeSchema, noticeController.getNoticeById)
  .patch(
    noticeValidator.paramNoticeSchema,
    noticeValidator.updateNoticeSchema,
    noticeController.updateNotice,
  )
  .delete(noticeValidator.paramNoticeSchema, noticeController.deleteNotice);

export default router;
