import createError from 'http-errors';
import commentRepository from '../repositories/comment.repository.js';
import { Role } from '../../../generated/prisma/client.js';
import type {
  CreateCommentDto,
  GetCommentsDto,
  UpdateCommentDto,
  DeleteCommentDto,
} from '../types/comment.dto.js';

class CommentService {
  // 댓글 생성
  async createComment(userId: number, dto: CreateCommentDto) {
    const comment = await commentRepository.createComment(userId, dto);

    // 응답 형식 변환 (id를 string으로)
    return {
      id: comment.id.toString(),
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: {
        id: comment.author.id.toString(),
        name: comment.author.name,
      },
    };
  }

  // 댓글 목록 조회 (페이지네이션)
  async findComments(dto: GetCommentsDto) {
    const { page, limit, resourceType, resourceId } = dto;

    // 페이지 계산 (서비스에서 처리)
    const skip = (page - 1) * limit;

    const commentsPromise = commentRepository.getComments({
      resourceType,
      resourceId,
      skip,
      limit,
    });
    const totalCountPromise = commentRepository.countComments({
      resourceType,
      resourceId,
    });

    const comments = await commentsPromise;
    const totalCount = await totalCountPromise;

    const hasNextPage = skip + limit < totalCount;

    return {
      data: comments.map((comment) => ({
        id: comment.id.toString(),
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        author: {
          id: comment.author.id.toString(),
          name: comment.author.name,
        },
      })),
      totalCount,
      page,
      limit,
      hasNext: hasNextPage,
    };
  }

  // 댓글 수정 (권한 체크 포함)
  async updateComment(userId: number, userRole: string, dto: UpdateCommentDto) {
    // 댓글 존재 확인
    const comment = await commentRepository.getCommentById(dto.commentId);
    if (!comment) {
      throw createError(404, '댓글을 찾을 수 없습니다.');
    }

    // 권한 체크: 본인이 작성한 댓글만 수정 가능
    if (comment.authorId !== userId) {
      throw createError(403, '댓글을 수정할 권한이 없습니다.');
    }

    await commentRepository.updateComment(dto.commentId, {
      content: dto.content,
    });
  }

  // 댓글 삭제 (권한 체크 포함)
  async deleteComment(userId: number, userRole: string, dto: DeleteCommentDto) {
    // 댓글 존재 확인
    const comment = await commentRepository.getCommentById(dto.commentId);
    if (!comment) {
      throw createError(404, '댓글을 찾을 수 없습니다.');
    }

    // 권한 체크
    // 1. 본인이 작성한 댓글
    // 2. 또는 관리자 (ADMIN, SUPER_ADMIN)
    const isOwner = comment.authorId === userId;
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw createError(403, '댓글을 삭제할 권한이 없습니다.');
    }

    await commentRepository.deleteComment(dto.commentId);
  }
}

export default new CommentService();
