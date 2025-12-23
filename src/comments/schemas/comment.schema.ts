import { z } from 'zod';
import { CommentResourceType } from '../../../generated/prisma/enums.js';

// 댓글 생성 스키마
export const createCommentBodySchema = z.object({
  content: z.string().min(1, '댓글 내용은 필수입니다.'),
  resourceType: z.enum(
    [CommentResourceType.NOTICE, CommentResourceType.COMPLAINT],
    {
      message: '유효하지 않은 리소스 타입입니다.',
    },
  ),
  resourceId: z.string(), // 프론트엔드에서 string으로 전달
});

// 댓글 조회 스키마
export const getCommentsQuerySchema = z.object({
  resourceType: z.enum(
    [CommentResourceType.NOTICE, CommentResourceType.COMPLAINT],
    {
      message: '유효하지 않은 리소스 타입입니다.',
    },
  ),
  resourceId: z.string(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

// 댓글 수정 스키마
export const updateCommentParamSchema = z.object({
  commentId: z.coerce.number().int().positive(),
});

export const updateCommentBodySchema = z.object({
  content: z.string().min(1, '댓글 내용은 필수입니다.'),
});

// 댓글 삭제 스키마
export const deleteCommentParamSchema = z.object({
  commentId: z.coerce.number().int().positive(),
});
