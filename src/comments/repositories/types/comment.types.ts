import type { CommentResourceType } from '../../../../generated/prisma/client.js';

// Repository에서 사용하는 댓글 생성 입력 타입
export interface CreateCommentInput {
  content: string;
  resourceType: CommentResourceType;
  resourceId: string;
}

// Repository에서 사용하는 댓글 조회 파라미터 타입
export interface FindCommentsParams {
  resourceType: CommentResourceType;
  resourceId: string;
  skip: number;
  limit: number;
}

// Repository에서 사용하는 댓글 수정 입력 타입
export interface UpdateCommentInput {
  content: string;
}
