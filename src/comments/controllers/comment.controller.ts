import type { NextFunction, Request, Response } from 'express';
import commentService from '../services/comment.service.js';
import type {
  CreateCommentDto,
  GetCommentsDto,
  UpdateCommentDto,
  DeleteCommentDto,
} from '../types/comment.dto.js';
import { CommentResourceType } from '../../../generated/prisma/client.js';
import createHttpError from 'http-errors';

class CommentController {
  // 댓글 생성 API
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const dto: CreateCommentDto = req.body;

      const result = await commentService.createComment(userId, dto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 댓글 목록 조회 API
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: GetCommentsDto = {
        resourceType: req.query.resourceType as CommentResourceType,
        resourceId: req.query.resourceId as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const result = await commentService.findComments(dto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // 댓글 수정 API
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const dto: UpdateCommentDto = {
        commentId: Number(req.params.commentId),
        content: req.body.content,
      };

      await commentService.updateComment(userId, userRole, dto);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }

  // 댓글 삭제 API
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        throw createHttpError(401, '로그인이 필요합니다.');
      }
      const dto: DeleteCommentDto = {
        commentId: Number(req.params.commentId),
      };

      await commentService.deleteComment(userId, userRole, dto);
      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();
