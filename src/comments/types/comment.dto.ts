import { CommentResourceType } from '../../../generated/prisma/client.js';

// 댓글 생성 DTO
export interface CreateCommentDto {
  content: string;
  resourceType: CommentResourceType;
  resourceId: string;
}

// 댓글 조회 DTO
export interface GetCommentsDto {
  resourceType: CommentResourceType;
  resourceId: string;
  page: number;
  limit: number;
}

// 댓글 수정 DTO
export interface UpdateCommentDto {
  commentId: number;
  content: string;
}

// 댓글 삭제 DTO
export interface DeleteCommentDto {
  commentId: number;
}
