import express from 'express';
import noticeController from '../notices/controllers/notice.controller.js';
import { noticeValidator } from '../notices/schemas/notice.schema.js';
import passports from '../lib/passports/index.js';

const router = express.Router();

router
  .route('/')
  .post(
    passports.jwtAuth,
    noticeValidator.createNoticeSchema,
    noticeController.createNotice,
  )
  .get(noticeValidator.getNoticesSchema, noticeController.getNotices);
router
  .route('/:noticeId')
  .get(noticeValidator.paramNoticeSchema, noticeController.getNoticeById)
  .patch(
    passports.jwtAuth,
    noticeValidator.paramNoticeSchema,
    noticeValidator.updateNoticeSchema,
    noticeController.updateNotice,
  )
  .delete(
    passports.jwtAuth,
    noticeValidator.paramNoticeSchema,
    noticeController.deleteNotice,
  );

export default router;
