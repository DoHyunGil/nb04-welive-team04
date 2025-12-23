import express from 'express';
import commentController from '../comments/controllers/comment.controller.js';
import passports from '../lib/passports/index.js';
import { validateBody, validateQuery, validateParams } from '../middlewares/validateRequest.js';
import {
  createCommentBodySchema,
  getCommentsQuerySchema,
  updateCommentParamSchema,
  updateCommentBodySchema,
  deleteCommentParamSchema,
} from '../comments/schemas/comment.schema.js';

const commentRouter = express.Router();

// 댓글 목록 조회
commentRouter.get('/', validateQuery(getCommentsQuerySchema), commentController.findAll);

// 댓글 생성
commentRouter.post(
  '/',
  passports.jwtAuth,
  validateBody(createCommentBodySchema),
  commentController.create,
);

// 댓글 수정
commentRouter.patch(
  '/:commentId',
  passports.jwtAuth,
  validateParams(updateCommentParamSchema),
  validateBody(updateCommentBodySchema),
  commentController.update,
);

// 댓글 삭제
commentRouter.delete(
  '/:commentId',
  passports.jwtAuth,
  validateParams(deleteCommentParamSchema),
  commentController.remove,
);

export default commentRouter;
